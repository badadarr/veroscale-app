import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { executeQuery } from "../../../lib/db-adapter";
import { database, ref, set, update } from "../../../lib/firebase";
import { get } from "firebase/database";
import { getUserFromToken, isAdmin } from "../../../lib/auth";
import { withArcjetProtection } from "../../../lib/arcjet-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Apply Arcjet protection with email validation
  const arcjetResult = await withArcjetProtection(req, res, "email");
  if (arcjetResult) return arcjetResult;

  try {
    // Only admin can register new users
    const user = await getUserFromToken(req);
    if (!user || !isAdmin(user)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { name, email, password, role, rfid_uid } = req.body as {
      name: string;
      email: string;
      password: string;
      role: string;
      rfid_uid?: string | null;
      deletePending?: boolean;
      requestKey?: string;
    };

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    type DbUser = { id: number; email: string };
    const existingUsers = await executeQuery<DbUser[]>({
      table: "users",
      action: "select",
      filters: { email },
    });

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Get role ID
    type DbRole = { id: number; name: string };
    const roles = await executeQuery<DbRole[]>({
      table: "roles",
      action: "select",
      filters: { name: role },
    });

    if (!roles || roles.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const roleId = roles[0].id;

    // If RFID UID is provided for operator, normalize and enforce uniqueness
    let normUID: string | null = null;
    if (rfid_uid && role === "operator") {
      normUID = String(rfid_uid).trim().toUpperCase();
      if (normUID) {
        const existingUidOwner = await executeQuery<DbUser[]>({
          table: "users",
          action: "select",
          filters: { rfid_uid: normUID },
        });
        if (existingUidOwner && existingUidOwner.length > 0) {
          return res
            .status(409)
            .json({ message: "RFID UID already assigned to another user" });
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await executeQuery<DbUser[] | DbUser>({
      table: "users",
      action: "insert",
      data: {
        name,
        email,
        password: hashedPassword,
        role_id: roleId,
        ...(normUID ? { rfid_uid: normUID } : {}),
      },
      returning: "*",
    });

    const createdUserId = Array.isArray(result) ? result[0].id : result.id;

    // If RFID provided, write to Firebase RTDB and clear matching pending request
    if (normUID) {
      const now = new Date().toISOString();
      try {
        await set(ref(database, `rfid_users/${normUID}`), {
          uid: normUID,
          name,
          email,
          active: true,
          device_id: "",
          created_at: now,
        });

        // Try to find and remove any matching pending request, or mark as approved
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
            // Prefer marking approved if structure is object; otherwise delete simple string entry
            const currentVal = requests[matchKey];
            if (currentVal && typeof currentVal === "object") {
              await update(ref(database, `rfid_requests/${matchKey}`), {
                status: "approved",
                approved_at: now,
              });
            } else {
              await set(ref(database, `rfid_requests/${matchKey}`), null);
            }
          }
        }
      } catch (firebaseErr) {
        console.warn("Warning: failed to sync RFID to RTDB:", firebaseErr);
      }
    }

    return res.status(201).json({
      message: "User registered successfully",
      userId: createdUserId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
