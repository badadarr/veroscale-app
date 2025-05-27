import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      return getUserProfile(req, res, user);
    case "PUT":
      return updateUserProfile(req, res, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get user profile
async function getUserProfile(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let userData;

    if (useSupabase) {
      // Supabase implementation
      const users = await executeQuery<any[]>({
        table: "public.users",
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
        filters: { id: user.id },
        single: true,
      });

      if (!users || users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      userData = users[0];
      userData.role = userData.roles?.name || "unknown";
    } else {
      // MySQL implementation
      const users = await executeQuery<any[]>({
        query: `
          SELECT u.id, u.name, u.email, r.name as role, u.created_at
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.id = ?
        `,
        values: [user.id],
      });

      if (!users || users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      userData = users[0];
    }

    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update user profile
async function updateUserProfile(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if user exists and get current data
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let currentUser;

    if (useSupabase) {
      const users = await executeQuery<any[]>({
        table: "public.users",
        action: "select",
        columns: "*",
        filters: { id: user.id },
      });

      if (!users || users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      currentUser = users[0];
    } else {
      const users = await executeQuery<any[]>({
        query: "SELECT * FROM users WHERE id = ?",
        values: [user.id],
      });

      if (!users || users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      currentUser = users[0];
    }

    // Check if email already exists (but ignore the current user)
    if (email !== user.email) {
      let existingUsers;
      
      if (useSupabase) {
        existingUsers = await executeQuery<any[]>({
          table: "public.users",
          action: "select",
          filters: { email },
        });
      } else {
        existingUsers = await executeQuery<any[]>({
          query: "SELECT * FROM users WHERE email = ? AND id != ?",
          values: [email, user.id],
        });
      }

      if (existingUsers && existingUsers.length > 0) {
        return res.status(409).json({ message: "Email already in use by another account" });
      }
    }

    // Update user data
    const updateData: any = {
      name,
      email,
    };

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password" });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Execute the update
    if (useSupabase) {
      await executeQuery({
        table: "public.users",
        action: "update",
        data: updateData,
        filters: { id: user.id },
      });
    } else {
      // Build the MySQL query dynamically based on whether we're updating the password
      let query = "UPDATE users SET name = ?, email = ?";
      const values = [name, email];

      if (updateData.password) {
        query += ", password = ?";
        values.push(updateData.password);
      }

      query += " WHERE id = ?";
      values.push(user.id);

      await executeQuery({
        query,
        values,
      });
    }

    return res.status(200).json({ 
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name,
        email,
        role: user.role, // Keep the existing role
      }
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
