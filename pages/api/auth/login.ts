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

    // Check which database we're using
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log("Finding user by email:", email);
    console.log("Using Supabase:", useSupabase);

    let users;
    try {
      users = useSupabase
        ? // Supabase implementation
          await executeQuery<any[]>({
            table: "weightmanagementdb.users",
            action: "select",
            columns: `
              id,
              email,
              name,
              password,
              role_id,
              roles (
                name
              )
            `,
            filters: { email },
          })
        : // MySQL implementation
          await executeQuery<any[]>({
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

    // Process the user object based on the database used
    const user = users[0];

    // For Supabase, get role from the joined data
    if (useSupabase) {
      if (user.roles && user.roles.name) {
        user.role = user.roles.name;
        console.log("User role:", user.role);
      } else {
        console.warn("Role not found in user data");
        user.role = "unknown";
      }
    }

    // Verify password
    console.log("Verifying password...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Record user session
    await executeQuery({
      // Use table-based API for Supabase compatibility
      table: "weightmanagementdb.sessions",
      action: "insert",
      data: {
        user_id: user.id,
        status: "active",
      },
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
