import jwt from "jsonwebtoken";
import { NextApiRequest } from "next";
import supabase from "./supabase";

export const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface UserPayload {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthToken {
  userId: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// Generate JWT token
export function generateToken(user: UserPayload): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch (error) {
    return null;
  }
}

// Get user from request - Updated for Supabase
export async function getUserFromToken(
  req: NextApiRequest
): Promise<UserPayload | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  try {
    // Using Supabase query
    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id, 
        email, 
        name, 
        roles:role_id (name)
      `
      )
      .eq("id", decoded.userId)
      .single();

    if (error || !users) {
      console.error("Error fetching user:", error);
      return null;
    }

    return {
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.roles && users.roles.length > 0 ? users.roles[0].name : "",
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// Check if user has admin role
export function isAdmin(user: UserPayload | null): boolean {
  return user?.role === "admin";
}

// Check if user has manager role or higher
export function isManagerOrAdmin(user: UserPayload | null): boolean {
  return user?.role === "admin" || user?.role === "manager";
}
