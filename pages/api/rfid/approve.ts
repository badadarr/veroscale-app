import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromToken, isAdmin } from "../../../lib/auth";
import { executeQuery } from "../../../lib/db-adapter";
import { database, ref, set, update } from "../../../lib/firebase";
import bcrypt from "bcryptjs";

type Data = { message: string } | { message: string; supabase_user_id: number };

type RoleRow = { id: number; name: string };
type UserRow = {
  id: number;
  name: string;
  email: string;
  role_id: number;
  rfid_uid?: string | null;
};

/**
 * Approve an RFID UID and create an operator account.
 * Body: { uid: string, name: string, email: string, deletePending?: boolean, requestKey?: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const admin = await getUserFromToken(req);
  if (!admin || !isAdmin(admin)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { uid, name, email, deletePending, requestKey } = req.body || {};
  if (!uid || !name || !email) {
    return res
      .status(400)
      .json({ message: "uid, name, and email are required" });
  }

  // Normalize UID to uppercase hex as the source of truth
  const normUID = String(uid).trim().toUpperCase();

  try {
    // 0) Ensure UID is not already assigned to a different user
    const existingUidOwner = await executeQuery<UserRow[]>({
      table: "users",
      action: "select",
      filters: { rfid_uid: normUID },
    });

    // 1) Ensure role_id for operator
    const roles = await executeQuery<RoleRow[]>({
      table: "roles",
      action: "select",
      filters: { name: "operator" },
    });
    if (!roles || roles.length === 0) {
      return res.status(500).json({ message: "Operator role not found" });
    }
    const roleId = roles[0].id;

    // 2) Find existing user by email or create new
    const existing = await executeQuery<UserRow[]>({
      table: "users",
      action: "select",
      filters: { email },
    });

    let userId: number;
    if (existing && existing.length > 0) {
      // Update name if different; keep role as is if already set
      userId = existing[0].id;
      // If UID already belongs to a different user, block
      if (
        existingUidOwner &&
        existingUidOwner.length > 0 &&
        existingUidOwner[0].id !== userId
      ) {
        return res
          .status(409)
          .json({ message: "RFID UID already assigned to another user" });
      }
      await executeQuery({
        table: "users",
        action: "update",
        data: { name, role_id: roleId, rfid_uid: normUID },
        filters: { id: userId },
      });
    } else {
      // If UID already belongs to someone, block new account creation
      if (existingUidOwner && existingUidOwner.length > 0) {
        return res
          .status(409)
          .json({ message: "RFID UID already assigned to another user" });
      }
      // Create with a random password (operator will reset via admin flow)
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashed = await bcrypt.hash(randomPassword, 10);
      const inserted = await executeQuery<UserRow[] | UserRow>({
        table: "users",
        action: "insert",
        data: {
          name,
          email,
          password: hashed,
          role_id: roleId,
          rfid_uid: normUID,
        },
        returning: "*",
      });
      userId = Array.isArray(inserted)
        ? inserted[0]?.id
        : (inserted as UserRow)?.id;
    }

    if (!userId) {
      return res.status(500).json({ message: "Failed to upsert user" });
    }

    // 3) Write to Firebase RTDB: /rfid_users/{UID}
    const now = new Date().toISOString();
    await set(ref(database, `rfid_users/${normUID}`), {
      uid: normUID,
      name,
      email,
      active: true,
      device_id: "",
      created_at: now,
    });

    // 4) Optionally update or delete the pending request under /rfid_requests/{requestKey}
    if (requestKey) {
      const pendingRef = ref(database, `rfid_requests/${requestKey}`);
      if (deletePending) {
        await set(pendingRef, null);
      } else {
        await update(pendingRef, {
          status: "approved",
          approved_at: now,
          uid: normUID,
        });
      }
    }

    return res.status(200).json({
      message: "RFID approved and operator created",
      supabase_user_id: userId,
    });
  } catch (e: unknown) {
    console.error("RFID approve error:", e);
    const msg = e instanceof Error ? e.message : "Server error";
    return res.status(500).json({ message: msg });
  }
}
