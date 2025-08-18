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
    const { page = "1", limit = "10", search = "" } = req.query;
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    // Use table-based operations instead of raw SQL
    let users, totalItems;

    // Get users with pagination and search
    const query = {
      table: "users",
      action: "select" as const,
      columns: "id, name, email, role_id, department, status, created_at",
      order: { created_at: "desc" as const },
    };

    // Add search filter if provided
    if (search) {
      // For simplicity, we'll use a direct query approach for search
      const whereClause = "WHERE name LIKE ? OR email LIKE ?";
      const queryParams = [`%${search}%`, `%${search}%`];

      const countResult = await executeQuery<any[]>({
        query: `SELECT COUNT(*) as count FROM users ${whereClause}`,
        values: queryParams,
      });

      totalItems = countResult[0]?.count || 0;

      users = await executeQuery<any[]>({
        query: `
          SELECT id, name, email, role_id, department, status, created_at 
          FROM users 
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        values: [...queryParams, itemsPerPage, offset],
      });
    } else {
      // Without search, use table-based operations
      const countResult = await executeQuery<any[]>({
        table: "users",
        action: "select",
        columns: "count",
      });

      totalItems = countResult[0]?.count || 0;

      users = await executeQuery<any[]>({
        query: `
          SELECT id, name, email, role_id, department, status, created_at 
          FROM users 
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        values: [itemsPerPage, offset],
      });
    }

    // Get roles for mapping
    const roles = await executeQuery<any[]>({
      table: "roles",
      action: "select",
      columns: "id, name",
    });

    // Create a role lookup map
    const roleMap = roles.reduce((map: Record<number, string>, role) => {
      map[role.id] = role.name;
      return map;
    }, {});

    // Add role names to users
    const usersWithRoles = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleMap[user.role_id] || "user",
      department: user.department || "",
      status: user.status || "active",
      created_at: user.created_at,
    }));

    return res.status(200).json({
      users: usersWithRoles,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
