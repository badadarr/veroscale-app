import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../../lib/db-adapter";
import {
  getUserFromToken,
  isAdmin,
  isManager,
  isOperator,
} from "../../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Role-based access control
  const isAdminUser = isAdmin(user);
  const isManagerUser = isManager(user);
  const isOperatorUser = isOperator(user);

  // Check if user has any valid role
  if (!isAdminUser && !isManagerUser && !isOperatorUser) {
    return res
      .status(403)
      .json({ message: "Forbidden. Insufficient permissions." });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid report configuration ID" });
  }
  switch (req.method) {
    case "GET":
      // All roles can view report configurations
      return getReportConfigurationById(res, id);
    case "PUT":
      // Only admin and manager can update report configurations
      if (!isAdminUser && !isManagerUser) {
        return res
          .status(403)
          .json({ message: "Forbidden. Admin or Manager access required." });
      }
      return updateReportConfiguration(req, res, id);
    case "DELETE":
      // Only admin can delete report configurations
      if (!isAdminUser) {
        return res
          .status(403)
          .json({ message: "Forbidden. Admin access required." });
      }
      return deleteReportConfiguration(res, id);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get report configuration by ID
async function getReportConfigurationById(res: NextApiResponse, id: string) {
  try {
    const configs = await executeQuery<any[]>({
      query: "SELECT * FROM report_configurations WHERE id = ?",
      values: [id],
    });

    if (!configs || configs.length === 0) {
      return res
        .status(404)
        .json({ message: "Report configuration not found" });
    }

    const reportConfig = configs[0];

    // Parse JSON fields
    if (reportConfig.fields && typeof reportConfig.fields === "string") {
      reportConfig.fields = JSON.parse(reportConfig.fields);
    }

    if (reportConfig.schedule && typeof reportConfig.schedule === "string") {
      reportConfig.schedule = JSON.parse(reportConfig.schedule);
    }

    if (
      reportConfig.recipients &&
      typeof reportConfig.recipients === "string"
    ) {
      reportConfig.recipients = JSON.parse(reportConfig.recipients);
    }

    return res.status(200).json(reportConfig);
  } catch (error) {
    console.error("Error fetching report configuration:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update report configuration
async function updateReportConfiguration(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const { name, description, type, fields, schedule, recipients } = req.body;

    if (!name || !type || !fields) {
      return res.status(400).json({
        message:
          "Name, type, and fields are required for a report configuration",
      });
    }

    // Validate report type
    const validTypes = ["daily", "weekly", "monthly", "quarterly", "custom"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: `Report type must be one of: ${validTypes.join(", ")}`,
      });
    }    // Check if config exists
    const existingConfig = await executeQuery<any[]>({
      query: "SELECT id FROM report_configurations WHERE id = ?",
      values: [id],
    });

    if (!existingConfig || existingConfig.length === 0) {
      return res
        .status(404)
        .json({ message: "Report configuration not found" });
    }

    // Check for duplicate name (excluding this record)
    const duplicateCheck = await executeQuery<any[]>({
      query:
        "SELECT id FROM report_configurations WHERE name = ? AND id != ?",
      values: [name, id],
    });

    if (duplicateCheck && duplicateCheck.length > 0) {
      return res.status(400).json({
        message: "A report configuration with this name already exists",
      });
    }

    // Update report configuration
    await executeQuery({
      query: `
        UPDATE report_configurations 
        SET name = ?, 
            description = ?, 
            type = ?, 
            fields = ?, 
            schedule = ?, 
            recipients = ?, 
            updated_at = NOW()
        WHERE id = ?
      `,
      values: [
        name,
        description || "",
        type,
        JSON.stringify(fields),
        schedule ? JSON.stringify(schedule) : null,
        recipients ? JSON.stringify(recipients) : null,
        id,
      ],
    });

    return res
      .status(200)
      .json({ message: "Report configuration updated successfully" });
  } catch (error) {
    console.error("Error updating report configuration:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete report configuration
async function deleteReportConfiguration(res: NextApiResponse, id: string) {
  try {
    // Check if config exists
    const existingConfig = await executeQuery<any[]>({
      query: "SELECT id FROM report_configurations WHERE id = ?",
      values: [id],
    });

    if (!existingConfig || existingConfig.length === 0) {
      return res
        .status(404)
        .json({ message: "Report configuration not found" });
    }

    // Delete report configuration
    await executeQuery({
      query: "DELETE FROM report_configurations WHERE id = ?",
      values: [id],
    });

    return res
      .status(200)
      .json({ message: "Report configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting report configuration:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
