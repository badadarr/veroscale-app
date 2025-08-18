import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../../lib/db-adapter";
import { getUserFromToken } from "../../../../lib/auth";
import { withArcjetProtection } from "../../../../lib/arcjet-middleware";

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

  // Only admin and manager roles can access report configurations
  if (!['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ message: "You do not have permission to access report configurations" });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case "GET":
      return getReportConfiguration(req, res);
    case "POST":
    case "PUT":
      return saveReportConfiguration(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get report configuration
async function getReportConfiguration(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Mock data for now - in a real implementation, this would come from the database
    const configuration = {
      companyName: "Weight Management System Ltd.",
      companyLogo: "/logo.png",
      reportFooter: "Confidential - For Internal Use Only",
      defaultReportFormat: "PDF",
      emailNotifications: {
        notifyAdmins: true,
        notifyOnFailure: true
      }
    };

    return res.status(200).json({ configuration });
  } catch (error) {
    console.error("Error fetching report configuration:", error);
    return res.status(500).json({ message: "Failed to fetch report configuration" });
  }
}

// Save report configuration
async function saveReportConfiguration(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      companyName, 
      companyLogo, 
      reportFooter, 
      defaultReportFormat,
      emailNotifications 
    } = req.body;

    // Validate required fields
    if (!companyName) {
      return res.status(400).json({ message: "Company name is required" });
    }

    // In a real implementation, this would update the database
    // For now, we'll just return success
    return res.status(200).json({ 
      message: "Report configuration saved successfully",
      configuration: {
        companyName,
        companyLogo,
        reportFooter,
        defaultReportFormat,
        emailNotifications,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error saving report configuration:", error);
    return res.status(500).json({ message: "Failed to save report configuration" });
  }
}