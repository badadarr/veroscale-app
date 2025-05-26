import { NextApiRequest, NextApiResponse } from "next";
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

  switch (req.method) {
    case "GET":
      return getUsers(res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all users
async function getUsers(res: NextApiResponse) {
  try {
    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let users;

    if (useSupabase) {
      // Supabase-friendly query
      const supabaseUsers = await executeQuery<any[]>({
        table: "public.users",
        action: "select",
        columns: "id, name, email, created_at, role_id, roles:role_id(name)",
      });

      // Transform data structure to match what frontend expects
      users = supabaseUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || "unknown", // Extract role name from roles object
        created_at: user.created_at
      }));
    } else {
      // Original MySQL query
      users = await executeQuery<any[]>({
        query: `
          SELECT u.id, u.name, u.email, r.name as role, u.created_at
          FROM users u
          JOIN roles r ON u.role_id = r.id
          ORDER BY u.created_at DESC
        `,
      });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
