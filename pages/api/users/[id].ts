import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken, isAdmin } from "../../../lib/auth";

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
    const users = await executeQuery<any[]>({
      table: "users",
      action: "select",
      columns: `
        id, 
        name, 
        email, 
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
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, and role are required" });
    }

    // Check if user exists
    const users = await executeQuery<any[]>({
      table: "users",
      action: "select",
      filters: { id },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get role ID
    const roles = await executeQuery<any[]>({
      table: "roles",
      action: "select",
      columns: "id",
      filters: { name: role },
    });

    if (!roles || roles.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const roleId = roles[0].id;

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
        },
        filters: { id },
      });
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
    const users = await executeQuery<any[]>({
      table: "users",
      action: "select",
      filters: { id },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
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
