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
    // Get all users first
    const users = await executeQuery<any[]>({
      query: "SELECT * FROM users ORDER BY created_at DESC",
    });

    // Get all roles
    const roles = await executeQuery<any[]>({
      query: "SELECT * FROM roles",
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
