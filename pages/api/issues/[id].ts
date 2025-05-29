import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db-adapter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Issue ID is required" });
  }

  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res, id as string);
      case "PUT":
        return await handlePut(req, res, id as string);
      case "DELETE":
        return await handleDelete(req, res, id as string);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  // Menggunakan executeQuery dengan Supabase query style
  const issue = await executeQuery({
    table: "issues",
    action: "select",
    columns: "*, users(name) as reporter_name",
    filters: { id },
    single: true
  });

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  res.status(200).json({ issue });
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const {
    title,
    description,
    issue_type,
    priority,
    status,
    resolution,
    resolver_id,
  } = req.body;

  // Check if issue exists
  const existingIssue = await executeQuery({
    table: "issues",
    action: "select",
    columns: "id, status",
    filters: { id },
    single: true
  });

  if (!existingIssue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const currentStatus = existingIssue.status;

  // Prepare update data
  const updateData: Record<string, any> = {
    updated_at: new Date()
  };

  if (title) {
    updateData.title = title;
  }

  if (description) {
    updateData.description = description;
  }

  if (issue_type) {
    updateData.issue_type = issue_type;
  }

  if (priority) {
    updateData.priority = priority;
  }

  if (status) {
    updateData.status = status;

    // If status is changed to 'resolved', record who resolved it and when
    if (status === "resolved" && currentStatus !== "resolved") {
      updateData.resolved_at = new Date();

      // If resolver_id is provided in the request, use it
      if (resolver_id) {
        updateData.resolved_by = resolver_id;
      }
    }
  }

  if (resolution) {
    updateData.resolution = resolution;
  }

  // Execute update
  await executeQuery({
    table: "issues",
    action: "update",
    data: updateData,
    filters: { id }
  });

  res.status(200).json({
    message: "Issue updated successfully",
  });
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  // Check if issue exists
  const existingIssue = await executeQuery({
    table: "issues",
    action: "select",
    columns: "id",
    filters: { id },
    single: true
  });

  if (!existingIssue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  // Execute delete
  await executeQuery({
    table: "issues",
    action: "delete",
    filters: { id }
  });

  res.status(200).json({
    message: "Issue deleted successfully",
  });
}
