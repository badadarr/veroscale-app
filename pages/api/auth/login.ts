import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { executeQuery } from "../../../lib/db-adapter";
import { generateToken } from "../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    console.log("Finding user by email:", email);

    let user;
    try {
      // First get the user
      const foundUser = await executeQuery<any>({
        query: "SELECT * FROM users WHERE email = ?",
        values: [email],
        single: true,
      });

      if (!foundUser) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Then get the role
      const role = await executeQuery<any>({
        query: "SELECT * FROM roles WHERE id = ?",
        values: [foundUser.role_id],
        single: true,
      });

      user = {
        ...foundUser,
        role: role ? role.name : "user",
      };

      console.log("User found with role:", user.role);
    } catch (err) {
      console.error("Error finding user:", err);
      throw err;
    }

    // Verify password
    console.log("Verifying password...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Record user session
    await executeQuery({
      query: "INSERT INTO sessions (user_id, status) VALUES (?, ?)",
      values: [user.id, "active"],
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
