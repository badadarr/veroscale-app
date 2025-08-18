import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
async function getUserProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    // Get user data
    const userData = await executeQuery<any>({
      query: "SELECT * FROM users WHERE id = ?",
      values: [user.id],
      single: true,
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get role data
    const roleData = await executeQuery<any>({
      query: "SELECT * FROM roles WHERE id = ?",
      values: [userData.role_id],
      single: true,
    });

    const userProfile = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: roleData ? roleData.name : "user",
      created_at: userData.created_at,
    };

    return res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update user profile
async function updateUserProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if user exists and get current data
    const currentUser = await executeQuery<any>({
      query: "SELECT * FROM users WHERE id = ?",
      values: [user.id],
      single: true,
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email already exists (but ignore the current user)
    if (email !== user.email) {
      const existingUser = await executeQuery<any>({
        query: "SELECT * FROM users WHERE email = ? AND id != ?",
        values: [email, user.id],
        single: true,
      });

      if (existingUser) {
        return res
          .status(409)
          .json({ message: "Email already in use by another account" });
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
        return res
          .status(400)
          .json({
            message: "Current password is required to set a new password",
          });
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password
      );
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Build the query dynamically based on whether we're updating the password
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

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name,
        email,
        role: user.role, // Keep the existing role
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
