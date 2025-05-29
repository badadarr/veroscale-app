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
    // Use table-based operations instead of raw SQL
    const users = await executeQuery<any[]>({
      table: "users",
      action: "select",
      columns: "id, name, email, role_id, department, status, created_at",
    });

    const roles = await executeQuery<any[]>({
      table: "roles",
      action: "select",
      columns: "id, name",
    });

    // Create a role lookup map
    const roleMap = roles.reduce((map, role) => {
      map[role.id] = role.name;
      return map;
    }, {});

    // Add role names to users
    const usersWithRoles = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleMap[user.role_id] || "user",
      department: user.department,
      status: user.status,
      created_at: user.created_at,
    }));

    return res.status(200).json({ users: usersWithRoles });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
