import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db-adapter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res);
      case "POST":
        return await handlePost(req, res);
      case "PUT":
        return await handlePut(req, res);
      case "DELETE":
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { status, priority, type, search } = req.query;

  // Build WHERE conditions for issues table
  const conditions: string[] = [];
  const values: any[] = [];

  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }

  if (priority) {
    conditions.push("priority = ?");
    values.push(priority);
  }

  if (type) {
    conditions.push("issue_type = ?");
    values.push(type);
  }

  if (search && typeof search === "string") {
    conditions.push("(title ILIKE ? OR description ILIKE ?)");
    const searchPattern = `%${search}%`;
    values.push(searchPattern, searchPattern);
  }

  // Build the issues query
  let issuesQuery = "SELECT * FROM issues";
  
  if (conditions.length > 0) {
    issuesQuery += ` WHERE ${conditions.join(" AND ")}`;
  }

  issuesQuery += " ORDER BY created_at DESC";

  // Get issues
  const issues = await executeQuery({
    query: issuesQuery,
    values,
  });

  // Get all users to map reporter names
  const users = await executeQuery({
    query: "SELECT id, name FROM users",
  });

  // Create user lookup map
  const userMap = Array.isArray(users) ? users.reduce((map, user) => {
    map[user.id] = user.name;
    return map;
  }, {} as Record<number, string>) : {};

  // Add reporter names to issues
  const issuesWithReporters = Array.isArray(issues) ? issues.map(issue => ({
    ...issue,
    reporter_name: userMap[issue.reporter_id] || 'Unknown User'
  })) : [];

  res.status(200).json({
    issues: issuesWithReporters,
    total: issuesWithReporters.length,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { title, description, issue_type, priority, reporter_id } = req.body;

  if (!title || !description || !issue_type || !reporter_id) {
    return res.status(400).json({
      error: "Title, description, issue type, and reporter ID are required",
    });
  }

  const result = await executeQuery({
    query: `
      INSERT INTO issues (title, description, issue_type, priority, status, reporter_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())
      RETURNING id
    `,
    values: [title, description, issue_type, priority || "medium", reporter_id],
    single: true,
  });

  res.status(201).json({
    message: "Issue created successfully",
    issue_id: result?.id,
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { title, description, issue_type, priority, status, resolution } =
    req.body;

  if (!id) {
    return res.status(400).json({ error: "Issue ID is required" });
  }

  // Build SET clauses
  const setClauses: string[] = [];
  const values: any[] = [];

  if (title) {
    setClauses.push("title = ?");
    values.push(title);
  }
  if (description) {
    setClauses.push("description = ?");
    values.push(description);
  }
  if (issue_type) {
    setClauses.push("issue_type = ?");
    values.push(issue_type);
  }
  if (priority) {
    setClauses.push("priority = ?");
    values.push(priority);
  }
  if (status) {
    setClauses.push("status = ?");
    values.push(status);
  }
  if (resolution) {
    setClauses.push("resolution = ?");
    values.push(resolution);
  }

  setClauses.push("updated_at = NOW()");
  values.push(id); // for WHERE clause

  await executeQuery({
    query: `UPDATE issues SET ${setClauses.join(", ")} WHERE id = ?`,
    values,
  });

  res.status(200).json({
    message: "Issue updated successfully",
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Issue ID is required" });
  }

  await executeQuery({
    query: "DELETE FROM issues WHERE id = ?",
    values: [id],
  });

  res.status(200).json({
    message: "Issue deleted successfully",
  });
}
