import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery, safeQuery } from "@/lib/db-adapter";
import { getUserFromToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getIssues(req, res);
    case 'POST':
      return createIssue(req, res, user);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all issues with optional filtering
async function getIssues(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Fetching issues...");
    const issues = await safeQuery({
      table: "issues",
      action: "select",
      columns: "*",
      order: { created_at: "desc" },
    });

    // Get all users to map reporter names
    const users = await safeQuery({
      table: "users",
      action: "select",
      columns: "id, name",
    });

    // Create user lookup map safely
    const userMap = Array.isArray(users)
      ? users.reduce((map, user) => {
          map[user.id] = user.name;
          return map;
        }, {} as Record<number, string>)
      : {};

    // Add reporter names to issues safely
    const issuesWithReporters = Array.isArray(issues)
      ? issues.map((issue) => ({
          ...issue,
          user_name: userMap[issue.reporter_id || issue.user_id] || "Unknown User",
        }))
      : [];

    return res.status(200).json({ issues: issuesWithReporters });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return res.status(500).json({ message: "Failed to fetch issues" });
  }
}

// Create a new issue
async function createIssue(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { title, description, type, priority, record_id } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const result = await executeQuery({
      table: "issues",
      action: "insert",
      data: {
        title,
        description,
        type: type || 'data_correction',
        priority: priority || 'medium',
        status: 'pending',
        reporter_id: user.id,
        user_id: user.id,
        record_id: record_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      returning: "*"
    });

    const issue = Array.isArray(result) ? result[0] : result;

    // Add user_name to the issue
    const issueWithUser = {
      ...issue,
      user_name: user.name || "Unknown User"
    };

    return res.status(201).json({ 
      message: 'Issue created successfully',
      issue: issueWithUser
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    return res.status(500).json({ message: "Failed to create issue" });
  }
}
