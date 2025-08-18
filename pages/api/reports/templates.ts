import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";
import { withArcjetProtection } from "../../../lib/arcjet-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apply Arcjet protection for API endpoints
  const arcjetResult = await withArcjetProtection(req, res, "api");
  if (arcjetResult) return arcjetResult;

  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Only admin and manager roles can access report templates
  if (!['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ message: "You do not have permission to access report templates" });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case "GET":
      return getReportTemplates(req, res);
    case "POST":
      return createReportTemplate(req, res);
    case "PUT":
      return updateReportTemplate(req, res);
    case "DELETE":
      return deleteReportTemplate(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all report templates
async function getReportTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Mock data for now - in a real implementation, this would come from the database
    const templates = [
      {
        id: 1,
        name: 'Weekly Department Summary',
        description: 'Summarizes weight data by department',
        type: 'PDF',
        schedule: 'Weekly (Monday 8:00 AM)',
        recipients: ['managers@example.com', 'admin@example.com'],
        createdAt: '2023-09-15'
      },
      {
        id: 2,
        name: 'Monthly Performance Report',
        description: 'Analyzes operator performance and throughput',
        type: 'Excel',
        schedule: 'Monthly (1st day, 9:00 AM)',
        recipients: ['admin@example.com'],
        createdAt: '2023-10-02'
      }
    ];

    return res.status(200).json({ templates });
  } catch (error) {
    console.error("Error fetching report templates:", error);
    return res.status(500).json({ message: "Failed to fetch report templates" });
  }
}

// Create a new report template
async function createReportTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, type, schedule, recipients, includeCharts, includeRawData } = req.body;

    // Validate required fields
    if (!name || !description || !type) {
      return res.status(400).json({ message: "Name, description, and type are required" });
    }

    // In a real implementation, this would insert into the database
    // For now, we'll just return success
    return res.status(201).json({ 
      message: "Report template created successfully",
      template: {
        id: Math.floor(Math.random() * 1000) + 3, // Generate a random ID
        name,
        description,
        type,
        schedule,
        recipients: recipients ? recipients.split(',').map((email: string) => email.trim()) : [],
        includeCharts,
        includeRawData,
        createdAt: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error("Error creating report template:", error);
    return res.status(500).json({ message: "Failed to create report template" });
  }
}

// Update an existing report template
async function updateReportTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, name, description, type, schedule, recipients, includeCharts, includeRawData } = req.body;

    // Validate required fields
    if (!id || !name || !description || !type) {
      return res.status(400).json({ message: "ID, name, description, and type are required" });
    }

    // In a real implementation, this would update the database
    // For now, we'll just return success
    return res.status(200).json({ 
      message: "Report template updated successfully",
      template: {
        id,
        name,
        description,
        type,
        schedule,
        recipients: recipients ? recipients.split(',').map((email: string) => email.trim()) : [],
        includeCharts,
        includeRawData,
        updatedAt: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error("Error updating report template:", error);
    return res.status(500).json({ message: "Failed to update report template" });
  }
}

// Delete a report template
async function deleteReportTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Template ID is required" });
    }

    // In a real implementation, this would delete from the database
    // For now, we'll just return success
    return res.status(200).json({ 
      message: "Report template deleted successfully",
      id
    });
  } catch (error) {
    console.error("Error deleting report template:", error);
    return res.status(500).json({ message: "Failed to delete report template" });
  }
}