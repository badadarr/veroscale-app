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

    const users = useSupabase
      ? // Supabase-friendly query
        await executeQuery<any[]>({
          table: "public.users",
          action: "select",
          columns: "id, name, email, created_at, role_id, roles:role_id(name)",
        })
      : // Original MySQL query
        await executeQuery<any[]>({
          query: `
            SELECT u.id, u.name, u.email, r.name as role, u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
          `,
        });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
