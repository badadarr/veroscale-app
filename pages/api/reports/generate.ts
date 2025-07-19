import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";
import { withArcjetProtection } from "../../../lib/arcjet-middleware";
import {
  generatePDFReport,
  generateExcelReport,
  generateCSVReport,
} from "../../../lib/report-generator";

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

  // Check if user has permission to access reports
  // Only admin, manager, and operator roles can access reports
  if (!["admin", "manager", "operator"].includes(user.role)) {
    return res
      .status(403)
      .json({ message: "You do not have permission to access reports" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { reportId, format = "pdf" } = req.query;

    if (!reportId) {
      return res.status(400).json({ message: "Report ID is required" });
    }

    // Get report data based on report ID
    const reportData = await getReportData(parseInt(reportId as string));

    // Handle JSON format for preview
    if (format === "json") {
      return res.status(200).json({
        success: true,
        reportData: reportData,
      });
    }

    // Set appropriate headers for file download
    const fileName = `report-${reportId}-${
      new Date().toISOString().split("T")[0]
    }`;

    if (format === "csv") {
      const csvContent = generateCSVReport(reportData);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}.csv`
      );
      return res.status(200).send(csvContent);
    } else if (format === "excel") {
      const excelData = await generateExcelReport(reportData);
      // In a real implementation, you would return the actual Excel file
      // For now, we'll just return JSON with the data
      return res.status(200).json({
        success: true,
        message: "Excel report generated successfully",
        fileName: `${fileName}.xlsx`,
        reportData: excelData,
      });
    } else {
      // Generate actual PDF
      const pdfBuffer = await generatePDFReport(reportData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}.pdf`
      );
      return res.status(200).send(pdfBuffer);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ message: "Failed to generate report" });
  }
}

// Function to get report data based on report ID
async function getReportData(reportId: number) {
  let reportData: any = {};

  // Different report types
  switch (reportId) {
    case 1: // Daily Weight Summary
      reportData = await getDailyWeightSummary();
      break;
    case 2: // Weekly Activity Report
      reportData = await getWeeklyActivityReport();
      break;
    case 3: // Monthly Statistics
      reportData = await getMonthlyStatistics();
      break;
    default:
      throw new Error("Invalid report ID");
  }

  return reportData;
}

// Get daily weight summary
async function getDailyWeightSummary() {
  const today = new Date().toISOString().split("T")[0];

  // Check if we're using Supabase
  const useSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let records: any[] = [];

  if (useSupabase) {
    // For Supabase, we need to use a different approach to filter by date
    records = await executeQuery<any[]>({
      table: "public.weight_records",
      action: "select",
      columns: `
        record_id, 
        user_id,
        item_id,
        total_weight,
        timestamp, 
        status
      `,
      filters: {
        // Use string comparison for timestamp to avoid object serialization issues
        timestamp_gte: today + "T00:00:00",
        timestamp_lte: today + "T23:59:59",
      },
      orderBy: "timestamp",
      orderDirection: "desc",
    });

    // Fetch user names and item names separately since we can't do JOINs directly
    const userIds = [...new Set(records.map((record) => record.user_id))];
    const itemIds = [...new Set(records.map((record) => record.item_id))];

    // Get user names
    if (userIds.length > 0) {
      const users = await executeQuery<any[]>({
        table: "public.users",
        action: "select",
        columns: "id, name",
        filters: {
          id_in: userIds,
        },
      });

      // Create a map of user IDs to names
      const userMap = users.reduce((map, user) => {
        map[user.id] = user.name;
        return map;
      }, {});

      // Add user names to records
      records = records.map((record) => ({
        ...record,
        user_name: userMap[record.user_id] || `User ${record.user_id}`,
      }));
    }

    // Get item names
    if (itemIds.length > 0) {
      const items = await executeQuery<any[]>({
        table: "public.samples_item",
        action: "select",
        columns: "id, category, item",
        filters: {
          id_in: itemIds,
        },
      });

      // Create a map of item IDs to names
      const itemMap = items.reduce((map, item) => {
        map[item.id] = `${item.category} - ${item.item}`;
        return map;
      }, {});

      // Add item names to records
      records = records.map((record) => ({
        ...record,
        item_name: itemMap[record.item_id] || `Item ${record.item_id}`,
      }));
    }
  } else {
    records = await executeQuery<any[]>({
      query: `
        SELECT wr.record_id, wr.total_weight, wr.timestamp, wr.status,
               CONCAT(ri.category, ' - ', ri.item) as item_name, u.name as user_name
        FROM weight_records wr
        LEFT JOIN samples_item ri ON wr.item_id = ri.id
        JOIN users u ON wr.user_id = u.id
        WHERE DATE(wr.timestamp) = ?
        ORDER BY wr.timestamp DESC
      `,
      values: [today],
    });
  }

  // Calculate summary statistics
  const totalWeight = records.reduce(
    (sum, record) => sum + record.total_weight,
    0
  );
  const avgWeight = records.length > 0 ? totalWeight / records.length : 0;
  const statusCounts = records.reduce((counts: any, record) => {
    counts[record.status] = (counts[record.status] || 0) + 1;
    return counts;
  }, {});

  return {
    title: "Daily Weight Summary",
    date: today,
    summary: {
      totalRecords: records.length,
      totalWeight,
      avgWeight,
      statusCounts,
    },
    records,
  };
}

// Get weekly activity report
async function getWeeklyActivityReport() {
  // Ensure we have valid dates
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  // Format dates as YYYY-MM-DD for database queries
  const todayStr = today.toISOString().split("T")[0];
  const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

  // Check if we're using Supabase
  const useSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let records: any[] = [];

  if (useSupabase) {
    // For Supabase, we need to use a different approach to filter by date range
    records = await executeQuery<any[]>({
      table: "public.weight_records",
      action: "select",
      columns: `
        record_id, 
        user_id,
        item_id,
        total_weight,
        timestamp, 
        status
      `,
      filters: {
        // Use string comparison for timestamp to avoid object serialization issues
        timestamp_gte: oneWeekAgoStr + "T00:00:00",
        timestamp_lte: todayStr + "T23:59:59",
      },
      orderBy: "timestamp",
      orderDirection: "desc",
    });

    // Fetch user names and item names separately since we can't do JOINs directly
    const userIds = [...new Set(records.map((record) => record.user_id))];
    const itemIds = [...new Set(records.map((record) => record.item_id))];

    // Get user names
    if (userIds.length > 0) {
      const users = await executeQuery<any[]>({
        table: "public.users",
        action: "select",
        columns: "id, name",
        filters: {
          id_in: userIds,
        },
      });

      // Create a map of user IDs to names
      const userMap = users.reduce((map, user) => {
        map[user.id] = user.name;
        return map;
      }, {});

      // Add user names to records
      records = records.map((record) => ({
        ...record,
        user_name: userMap[record.user_id] || `User ${record.user_id}`,
      }));
    }

    // Get item names
    if (itemIds.length > 0) {
      const items = await executeQuery<any[]>({
        table: "public.samples_item",
        action: "select",
        columns: "id, category, item",
        filters: {
          id_in: itemIds,
        },
      });

      // Create a map of item IDs to names
      const itemMap = items.reduce((map, item) => {
        map[item.id] = `${item.category} - ${item.item}`;
        return map;
      }, {});

      // Add item names to records
      records = records.map((record) => ({
        ...record,
        item_name: itemMap[record.item_id] || `Item ${record.item_id}`,
      }));
    }
  } else {
    records = await executeQuery<any[]>({
      query: `
        SELECT wr.record_id, wr.user_id, wr.total_weight, wr.timestamp, wr.status,
               CONCAT(ri.category, ' - ', ri.item) as item_name, u.name as user_name
        FROM weight_records wr
        LEFT JOIN samples_item ri ON wr.item_id = ri.id
        JOIN users u ON wr.user_id = u.id
        WHERE wr.timestamp BETWEEN ? AND ?
        ORDER BY wr.timestamp DESC
      `,
      values: [oneWeekAgoStr, todayStr],
    });
  }

  // Group by user
  const userActivity: Record<string, any> = {};
  records.forEach((record) => {
    const userId = record.user_id;
    const userName = record.user_name || `User ${userId}`;

    if (!userActivity[userId]) {
      userActivity[userId] = {
        userId,
        userName,
        recordCount: 0,
        totalWeight: 0,
        statuses: {},
      };
    }

    userActivity[userId].recordCount++;
    userActivity[userId].totalWeight += record.total_weight;
    userActivity[userId].statuses[record.status] =
      (userActivity[userId].statuses[record.status] || 0) + 1;
  });

  // Format dates for display
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return {
    title: "Weekly Activity Report",
    dateRange: {
      from: oneWeekAgoStr,
      to: todayStr,
    },
    summary: {
      totalRecords: records.length,
      totalUsers: Object.keys(userActivity).length,
    },
    userActivity: Object.values(userActivity),
    records,
  };
}

// Get monthly statistics
async function getMonthlyStatistics() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayStr = today.toISOString().split("T")[0];
  const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

  // Check if we're using Supabase
  const useSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let records: any[] = [];

  if (useSupabase) {
    // For Supabase, we need to use a different approach to filter by month
    records = await executeQuery<any[]>({
      table: "public.weight_records",
      action: "select",
      columns: `
        record_id, 
        user_id,
        item_id,
        total_weight,
        timestamp, 
        status
      `,
      filters: {
        // Use string comparison for timestamp to avoid object serialization issues
        timestamp_gte: firstDayStr + "T00:00:00",
        timestamp_lte: todayStr + "T23:59:59",
      },
      orderBy: "timestamp",
      orderDirection: "desc",
    });

    // Fetch item names separately since we can't do JOINs directly
    const itemIds = [...new Set(records.map((record) => record.item_id))];

    // Get item names
    if (itemIds.length > 0) {
      const items = await executeQuery<any[]>({
        table: "public.samples_item",
        action: "select",
        columns: "id, category, item",
        filters: {
          id_in: itemIds,
        },
      });

      // Create a map of item IDs to names
      const itemMap = items.reduce((map, item) => {
        map[item.id] = `${item.category} - ${item.item}`;
        return map;
      }, {});

      // Add item names to records
      records = records.map((record) => ({
        ...record,
        item_name: itemMap[record.item_id] || `Item ${record.item_id}`,
      }));
    }
  } else {
    records = await executeQuery<any[]>({
      query: `
        SELECT wr.record_id, wr.item_id, wr.total_weight, wr.timestamp, wr.status,
               CONCAT(ri.category, ' - ', ri.item) as item_name
        FROM weight_records wr
        LEFT JOIN samples_item ri ON wr.item_id = ri.id
        WHERE wr.timestamp BETWEEN ? AND ?
        ORDER BY wr.timestamp DESC
      `,
      values: [firstDayStr, todayStr],
    });
  }

  // Group by item
  const itemStats: Record<string, any> = {};
  records.forEach((record) => {
    const itemId = record.item_id;
    const itemName = record.item_name || `Item ${itemId}`;

    if (!itemStats[itemId]) {
      itemStats[itemId] = {
        itemId,
        itemName,
        recordCount: 0,
        totalWeight: 0,
        avgWeight: 0,
      };
    }

    itemStats[itemId].recordCount++;
    itemStats[itemId].totalWeight += record.total_weight;
  });

  // Calculate averages
  Object.values(itemStats).forEach((item: any) => {
    item.avgWeight = item.totalWeight / item.recordCount;
  });

  return {
    title: "Monthly Statistics",
    month: `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`,
    summary: {
      totalRecords: records.length,
      totalItems: Object.keys(itemStats).length,
      totalWeight: records.reduce(
        (sum, record) => sum + record.total_weight,
        0
      ),
    },
    itemStats: Object.values(itemStats),
    records: records.slice(0, 100), // Limit to 100 records for performance
  };
}
