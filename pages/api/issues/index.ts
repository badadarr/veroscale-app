import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db-adapter-adapter";

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

  // Build conditions for Supabase query
  const conditions: Record<string, any> = {};

  if (status) {
    conditions.status = status;
  }

  if (priority) {
    conditions.priority = priority;
  }

  if (type) {
    conditions.issue_type = type;
  }

  // Using Supabase to get issues
  // Note: search functionality needs to be implemented differently with Supabase
  // This is a simplified approach without the search term for now
  const issuesResult = await executeQuery({
    table: "issues",
    action: "select",
    columns: ["issues.*, users.name as reporter_name"],
    conditions: conditions,
    orderBy: { column: "created_at", ascending: false },
  });

  // If search is provided, filter results manually (as a simple approach)
  let filteredResults = issuesResult;
  if (search && typeof search === "string" && Array.isArray(issuesResult)) {
    const searchLower = search.toLowerCase();
    filteredResults = issuesResult.filter(
      (issue: any) =>
        issue.title?.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower)
    );
  }

  res.status(200).json({
    issues: filteredResults,
    total: Array.isArray(filteredResults) ? filteredResults.length : 0,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { title, description, issue_type, priority, reporter_id } = req.body;

  if (!title || !description || !issue_type || !reporter_id) {
    return res.status(400).json({
      error: "Title, description, issue type, and reporter ID are required",
    });
  }

  // Using Supabase to create a new issue
  const result = await executeQuery({
    table: "issues",
    action: "insert",
    data: {
      title,
      description,
      issue_type,
      priority: priority || "medium",
      status: "pending",
      reporter_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });

  res.status(201).json({
    message: "Issue created successfully",
    issue_id: (result as any[])[0]?.id,
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { title, description, issue_type, priority, status, resolution } =
    req.body;

  if (!id) {
    return res.status(400).json({ error: "Issue ID is required" });
  }

  // Create update data object for Supabase
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (issue_type) updateData.issue_type = issue_type;
  if (priority) updateData.priority = priority;
  if (status) updateData.status = status;
  if (resolution) updateData.resolution = resolution;

  // Using Supabase to update an issue
  await executeQuery({
    table: "issues",
    action: "update",
    data: updateData,
    conditions: { id },
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

  // Using Supabase to delete an issue
  await executeQuery({
    table: "issues",
    action: "delete",
    conditions: { id },
  });

  res.status(200).json({
    message: "Issue deleted successfully",
  });
}
