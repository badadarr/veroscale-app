import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { executeQuery } from "../../../lib/db-adapter";
import { database, ref, set, update } from "../../../lib/firebase";
import { get } from "firebase/database";
import { getUserFromToken, isAdmin } from "../../../lib/auth";

type DbUser = {
  id: number;
  name: string;
  email: string;
  role_id: number;
  department?: string | null;
  status?: string | null;
  rfid_uid?: string | null;
};

type DbRole = { id: number; name: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (!user || !isAdmin(user)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  switch (req.method) {
    case "GET":
      return getUserById(res, id);
    case "PUT":
      return updateUser(req, res, id);
    case "DELETE":
      return deleteUser(res, id);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get user by ID
async function getUserById(res: NextApiResponse, id: string) {
  try {
    const users = await executeQuery<DbUser[]>({
      table: "users",
      action: "select",
      columns: `
        id, 
        name, 
        email,
        department,
        status,
        created_at,
        roles (
          name
        )
      `,
      filters: { id },
      single: true,
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update user
async function updateUser(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const { name, email, password, role, department, status, rfid_uid } =
      req.body;

    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, and role are required" });
    }

    // Validate status if provided
    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be 'active' or 'inactive'" });
    }

    // Check if user exists
    const users = await executeQuery<DbUser[]>({
      table: "users",
      action: "select",
      filters: { id },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get role ID
    const roles = await executeQuery<DbRole[]>({
      table: "roles",
      action: "select",
      columns: "id",
      filters: { name: role },
    });

    if (!roles || roles.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const roleId = roles[0].id;

    // If rfid_uid provided, enforce uniqueness
    let normUID: string | null = null;
    if (rfid_uid && typeof rfid_uid === "string" && rfid_uid.trim()) {
      normUID = rfid_uid.trim().toUpperCase();
      const uidOwner = await executeQuery<DbUser[]>({
        table: "users",
        action: "select",
        filters: { rfid_uid: normUID },
      });
      if (uidOwner && uidOwner.length > 0 && String(uidOwner[0].id) !== id) {
        return res
          .status(409)
          .json({ message: "RFID UID already assigned to another user" });
      }
    }

    // Update user with or without password
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await executeQuery({
        table: "users",
        action: "update",
        data: {
          name,
          email,
          password: hashedPassword,
          role_id: roleId,
          department: department || null,
          status: status || "active",
          ...(normUID ? { rfid_uid: normUID } : {}),
        },
        filters: { id },
      });
    } else {
      await executeQuery({
        table: "users",
        action: "update",
        data: {
          name,
          email,
          role_id: roleId,
          department: department || null,
          status: status || "active",
          ...(normUID ? { rfid_uid: normUID } : {}),
        },
        filters: { id },
      });
    }

    // Sync Firebase RTDB for RFID UID updates
    const previousUid = users[0].rfid_uid || null;
    if (normUID) {
      try {
        const now = new Date().toISOString();
        await set(ref(database, `rfid_users/${normUID}`), {
          uid: normUID,
          name,
          email,
          active: true,
          device_id: "",
          created_at: now,
        });
        if (previousUid && previousUid !== normUID) {
          await set(ref(database, `rfid_users/${previousUid}`), null);
        }

        // Find matching pending request in rfid_requests and mark approved or remove
        const snap = await get(ref(database, "rfid_requests"));
        if (snap.exists()) {
          const requests = snap.val() as Record<string, unknown>;
          const matchKey = Object.keys(requests).find((k) => {
            const v = requests[k];
            if (typeof v === "string") return v.toUpperCase() === normUID;
            if (v && typeof v === "object") {
              const obj = v as Record<string, unknown>;
              const cand = String(
                (obj.uid as string) ||
                  (obj.user_id as string) ||
                  (obj.rfid as string) ||
                  ""
              ).toUpperCase();
              return cand === normUID;
            }
            return false;
          });
          if (matchKey) {
            const currentVal = requests[matchKey];
            if (currentVal && typeof currentVal === "object") {
              await update(ref(database, `rfid_requests/${matchKey}`), {
                status: "approved",
                approved_at: now,
                uid: normUID,
              });
            } else {
              await set(ref(database, `rfid_requests/${matchKey}`), null);
            }
          }
        }
      } catch (e) {
        console.warn("Warning: failed to sync RFID UID to RTDB:", e);
      }
    }

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete user
async function deleteUser(res: NextApiResponse, id: string) {
  try {
    // Check if user exists
    const users = await executeQuery<DbUser[]>({
      table: "users",
      action: "select",
      filters: { id },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has an RFID UID, remove it from Firebase RTDB so deleted users cannot be recognized by devices
    const uidToClear = users[0].rfid_uid;
    if (uidToClear) {
      try {
        await set(ref(database, `rfid_users/${uidToClear}`), null);
      } catch (e) {
        console.warn("Warning: failed to clear RFID UID from RTDB:", e);
        // Proceed with deletion even if RTDB cleanup fails
      }
    }

    // Delete user's sessions
    await executeQuery({
      table: "sessions",
      action: "delete",
      filters: { user_id: id },
    });

    // Delete user's weight records
    await executeQuery({
      table: "weight_records",
      action: "delete",
      filters: { user_id: id },
    });

    // Delete user
    await executeQuery({
      table: "users",
      action: "delete",
      filters: { id },
    });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
