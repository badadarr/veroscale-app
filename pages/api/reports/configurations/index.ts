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
  switch (req.method) {
    case "GET":
      // All roles can view report configurations
      return getReportConfigurations(req, res);
    case "POST":
      // Only admin and manager can create report configurations
      if (!isAdminUser && !isManagerUser) {
        return res
          .status(403)
          .json({ message: "Forbidden. Admin or Manager access required." });
      }
      return createReportConfiguration(req, res, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all report configurations
async function getReportConfigurations(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { page = "1", limit = "10" } = req.query;

    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    // Check if we're using Supabase
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let reportConfigs: any[] = [];
    let totalItems = 0;

    if (useSupabase) {
      // Supabase implementation
      reportConfigs = await executeQuery<any[]>({
        table: "report_configurations",
        action: "select",
        columns: "*",
        range: [offset, offset + itemsPerPage - 1],
      });

      // Get total count for pagination
      const countResult = await executeQuery<any[]>({
        table: "report_configurations",
        action: "select",
        columns: "COUNT(*) as count",
      });

      totalItems =
        countResult.length > 0 ? parseInt(countResult[0].count, 10) : 0;
    } else {
      // MySQL implementation
      reportConfigs = await executeQuery<any[]>({
        query: `
          SELECT * FROM report_configurations
          ORDER BY created_at DESC
          LIMIT ${itemsPerPage} OFFSET ${offset}
        `,
      });

      // Get total count for pagination
      const countResult = await executeQuery<any[]>({
        query: "SELECT COUNT(*) as count FROM report_configurations",
      });

      totalItems = countResult[0].count;
    }

    return res.status(200).json({
      reportConfigurations: reportConfigs,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      },
    });
  } catch (error) {
    console.error("Error fetching report configurations:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Create a new report configuration
async function createReportConfiguration(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
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
    }

    // Check if we're using Supabase
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let newReportConfig;

    if (useSupabase) {
      // Check for duplicate name
      const existingConfig = await executeQuery<any[]>({
        table: "report_configurations",
        action: "select",
        filters: { name },
      });

      if (existingConfig && existingConfig.length > 0) {
        return res.status(400).json({
          message: "A report configuration with this name already exists",
        });
      }

      // Create new report configuration
      newReportConfig = await executeQuery<any[]>({
        table: "report_configurations",
        action: "insert",
        data: {
          name,
          description: description || "",
          type,
          fields: JSON.stringify(fields),
          schedule: schedule ? JSON.stringify(schedule) : null,
          recipients: recipients ? JSON.stringify(recipients) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user.id,
        },
        returning: "*",
      });
    } else {
      // MySQL implementation
      // Check for duplicate name
      const existingConfig = await executeQuery<any[]>({
        query: "SELECT id FROM report_configurations WHERE name = ?",
        values: [name],
      });

      if (existingConfig && existingConfig.length > 0) {
        return res.status(400).json({
          message: "A report configuration with this name already exists",
        });
      }

      // Create new report configuration
      const result = await executeQuery<any>({
        query: `
          INSERT INTO report_configurations 
          (name, description, type, fields, schedule, recipients, created_at, updated_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
        `,
        values: [
          name,
          description || "",
          type,
          JSON.stringify(fields),
          schedule ? JSON.stringify(schedule) : null,
          recipients ? JSON.stringify(recipients) : null,
          user.id,
        ],
      });

      // Get the newly created report configuration
      newReportConfig = await executeQuery<any[]>({
        query: "SELECT * FROM report_configurations WHERE id = ?",
        values: [result.insertId],
      });
    }

    return res.status(201).json({
      message: "Report configuration created successfully",
      reportConfiguration: newReportConfig[0],
    });
  } catch (error) {
    console.error("Error creating report configuration:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
