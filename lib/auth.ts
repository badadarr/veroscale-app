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

export async function getUserFromToken(
  req: NextApiRequest
): Promise<UserPayload | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("No Authorization header or invalid format");
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    console.warn("Token verification failed");
    return null;
  }

  try {
    // Komentar dipindahkan ke luar string query
    // String query ini akan mengambil id, email, name, dan nama peran terkait
    const selectQuery = `
      id,
      email,
      name,
      roles:role_id (name)
    `;

    const { data: userFromDb, error } = await supabase
      .from("users")
      .select(selectQuery) // Gunakan string query yang sudah bersih
      .eq("id", decoded.userId)
      .single();

    // Periksa 'error' dari Supabase terlebih dahulu
    if (error) {
      console.error("Error fetching user from Supabase:", error);
      return null;
    }

    // Periksa jika userFromDb null (misalnya, pengguna tidak ditemukan setelah query berhasil)
    if (!userFromDb) {
      console.warn("User not found in DB for id:", decoded.userId);
      return null;
    }

    // userFromDb.roles akan berupa objek seperti { name: 'admin' } jika peran ditemukan,
    // atau null/undefined jika tidak ada relasi atau kolom 'name' tidak ada.
    const roleName =
      userFromDb.roles &&
      typeof userFromDb.roles === "object" &&
      (userFromDb.roles as any).name // Akses properti 'name' dari objek roles
        ? (userFromDb.roles as any).name
        : "";

    console.log("User retrieved successfully:", {
      id: userFromDb.id,
      email: userFromDb.email,
      role: roleName,
    });

    return {
      id: userFromDb.id,
      email: userFromDb.email,
      name: userFromDb.name,
      role: roleName,
    };
  } catch (e) {
    // Menangkap semua jenis exception selama proses try
    console.error("Exception while fetching/processing user:", e);
    return null;
  }
}

// Pastikan `isAdmin` dan fungsi lainnya tidak berubah
export function isAdmin(user: UserPayload | null): boolean {
  // Pertimbangkan untuk membuat pengecekan case-insensitive jika perlu
  // return user?.role.toLowerCase() === "admin";
  return user?.role === "admin";
}

// Check if user has manager role
export function isManager(user: UserPayload | null): boolean {
  return user?.role === "manager";
}

// Check if user has operator role
export function isOperator(user: UserPayload | null): boolean {
  return user?.role === "operator";
}

// Check if user has manager role or higher
export function isManagerOrAdmin(user: UserPayload | null): boolean {
  return user?.role === "admin" || user?.role === "manager";
}
