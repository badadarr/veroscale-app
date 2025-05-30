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
  try {
    console.log("Fetching issue with ID:", id);

    // Menggunakan executeQuery dengan Supabase query style
    const issue = await executeQuery({
      table: "issues",
      action: "select",
      columns: "*",
      filters: { id },
      single: true,
    });

    console.log("Issue fetched:", issue);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Get user name for reporter
    const user = await executeQuery({
      table: "users",
      action: "select",
      columns: "name",
      filters: { id: issue.reporter_id || issue.user_id },
      single: true,
    });

    const enrichedIssue = {
      ...issue,
      user_name: user?.name || "Unknown User",
      type: issue.issue_type || issue.type || "other",
    };

    res.status(200).json({ issue: enrichedIssue });
  } catch (error) {
    console.error("Error fetching issue:", error);
    res.status(500).json({
      error: "Failed to fetch issue",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const {
      title,
      description,
      issue_type,
      type,
      priority,
      status,
      resolution,
      resolver_id,
    } = req.body;

    console.log("Updating issue with data:", req.body);

    // Check if issue exists
    const existingIssue = await executeQuery({
      table: "issues",
      action: "select",
      columns: "id, status",
      filters: { id },
      single: true,
    });

    if (!existingIssue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const currentStatus = existingIssue.status;

    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (title) {
      updateData.title = title;
    }

    if (description) {
      updateData.description = description;
    }

    if (issue_type || type) {
      updateData.issue_type = issue_type || type;
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

    console.log("Update data:", updateData);

    // Execute update
    const result = await executeQuery({
      table: "issues",
      action: "update",
      data: updateData,
      filters: { id },
      returning: "*",
    });

    console.log("Update result:", result);

    res.status(200).json({
      message: "Issue updated successfully",
      issue: result,
    });
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({
      error: "Failed to update issue",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
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
    single: true,
  });

  if (!existingIssue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  // Execute delete
  await executeQuery({
    table: "issues",
    action: "delete",
    filters: { id },
  });

  res.status(200).json({
    message: "Issue deleted successfully",
  });
}
