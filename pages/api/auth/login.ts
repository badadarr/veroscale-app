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
    }    console.log("Finding user by email:", email);

    let users;
    try {
      users = await executeQuery<any[]>({
        query: `
          SELECT u.id, u.email, u.name, u.password, r.name as role
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.email = ?
        `,
        values: [email],
      });

      console.log("Users found:", users ? users.length : 0);
    } catch (err) {
      console.error("Error finding user:", err);
      throw err;
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

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
