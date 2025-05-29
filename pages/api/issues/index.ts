import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery, safeQuery } from "@/lib/db-adapter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("Fetching materials count...");
    const materialsCount = await safeQuery({
      table: "materials",
      columns: "count",
      single: true,
    });

    console.log("Fetching monthly requests...");
    // Use safe queries for all dashboard data

    console.log("Fetching monthly weight...");
    // More safe queries

    console.log("Fetching pending issues...");
    const pendingIssues = await safeQuery({
      table: "issues",
      action: "select",
      filters: { status: "pending" },
    });

    console.log("Fetching weight by day for last 7 days...");
    // Weight by day

    console.log("Fetching recent issues...");
    const recentIssues = await safeQuery({
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
    const issuesWithReporters = Array.isArray(recentIssues)
      ? recentIssues.map((issue) => ({
          ...issue,
          reporter_name: userMap[issue.reporter_id] || "Unknown User",
        }))
      : [];

    res.status(200).json({
      materialsCount: materialsCount?.count || 0,
      pendingIssues: Array.isArray(pendingIssues) ? pendingIssues.length : 0,
      recentIssues: issuesWithReporters || [],
      // Add other dashboard data with safe defaults
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    // Return safe default structure
    res.status(200).json({
      materialsCount: 0,
      pendingIssues: 0,
      recentIssues: [],
      // Default values for all other dashboard data
    });
  }
}
