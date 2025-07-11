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
      return getUsers(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all users
async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let users, totalItems;

    if (useSupabase) {
      const { supabaseAdmin } = await import("../../../lib/supabase.js");
      
      let query = supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, role_id, department, status, roles:role_id(name)', { count: 'exact' });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { data, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
      users = data?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || "unknown",
        department: user.department || "",
        status: user.status || "active",
        created_at: user.created_at
      })) || [];
      
      totalItems = count || 0;
    } else {
      let whereClause = "WHERE 1=1";
      const queryParams: any[] = [];
      
      if (search) {
        whereClause += " AND (u.name LIKE ? OR u.email LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`);
      }
      
      const countResult = await executeQuery<any[]>({
        query: `SELECT COUNT(*) as count FROM users u ${whereClause}`,
        values: queryParams,
      });
      totalItems = countResult[0].count;

      users = await executeQuery<any[]>({
        query: `
          SELECT u.id, u.name, u.email, r.name as role, u.department, u.status, u.created_at
          FROM users u
          JOIN roles r ON u.role_id = r.id
          ${whereClause}
          ORDER BY u.created_at DESC
          LIMIT ? OFFSET ?
        `,
        values: [...queryParams, itemsPerPage, offset],
      });
    }

    return res.status(200).json({ 
      users,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
