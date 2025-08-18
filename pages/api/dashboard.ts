// New dashboard API implementation for material-focused system
import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromToken } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase.js";
import { getCount, getSum } from "../../lib/supabase-aggregation";
import { withArcjetProtection } from "../../lib/arcjet-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Apply Arcjet protection for dashboard API
  const arcjetResult = await withArcjetProtection(req, res, "api");
  if (arcjetResult) return arcjetResult;

  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get summary statistics with role-based filtering
    const summaryStats = await getDashboardSummary(user);

    // Get weight by day for the chart with role-based filtering
    const weightByDay = await getWeightByDay(user);

    // Get real issues data (replacing the removed issues functionality)
    const reportIssues = await getRecentIssues(user);

    // Get materials overview
    const materialsOverview = await getMaterialsOverview();

    // Get system status based on real data
    const systemStatus = await getSystemStatus();

    return res.status(200).json({
      summaryStats,
      weightByDay,
      reportIssues,
      materialsOverview,
      systemStatus,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getDashboardSummary(user: any) {
  // Get total samples count (changed from materials to samples)
  console.log("Fetching samples count...");
  const samplesCount = await getCount("samples_item");
  console.log("Samples count result:", samplesCount);

  // Get total requests/month (weight records for current month) with role-based filtering
  console.log(`Fetching monthly requests for user role: ${user.role}`);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  let monthlyRequestsQuery = supabaseAdmin
    .from("weight_records")
    .select("record_id")
    .gte("timestamp", `${currentMonth}-01`)
    .lt("timestamp", `${getNextMonth(currentMonth)}-01`);

  // For operators, only count their own records
  if (user.role === "operator") {
    monthlyRequestsQuery = monthlyRequestsQuery.eq("user_id", user.id);
  }

  const { data: monthlyRequests, error: requestsError } =
    await monthlyRequestsQuery;

  if (requestsError) {
    console.error("Error fetching monthly requests:", requestsError);
  }

  // Get total weight/month with role-based filtering
  console.log(`Fetching monthly weight for user role: ${user.role}`);
  let monthlyWeightQuery = supabaseAdmin
    .from("weight_records")
    .select("total_weight")
    .gte("timestamp", `${currentMonth}-01`)
    .lt("timestamp", `${getNextMonth(currentMonth)}-01`);

  // For operators, only count their own records
  if (user.role === "operator") {
    monthlyWeightQuery = monthlyWeightQuery.eq("user_id", user.id);
  }

  const { data: monthlyWeight, error: weightError } = await monthlyWeightQuery;

  if (weightError) {
    console.error("Error fetching monthly weight:", weightError);
  }

  const totalMonthlyWeight =
    monthlyWeight?.reduce(
      (sum, record) => sum + (parseFloat(record.total_weight) || 0),
      0
    ) || 0;

  // Skip issues functionality since table doesn't exist
  const pendingIssues: any[] = [];
  return {
    totalMaterials: samplesCount[0]?.count || 0,
    totalRequests: monthlyRequests?.length || 0,
    totalWeight: Math.round(totalMonthlyWeight * 100) / 100,
    pendingIssues: pendingIssues?.length || 0,
  };
}

async function getWeightByDay(user: any) {
  try {
    console.log(
      `Fetching weight by day for last 7 days for user role: ${user.role}`
    );

    // Get data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Build query with role-based filtering
    let queryBuilder = supabaseAdmin
      .from("weight_records")
      .select("timestamp, total_weight, user_id")
      .gte("timestamp", sevenDaysAgo.toISOString())
      .order("timestamp", { ascending: true });

    // For operators, only show their own records
    if (user.role === "operator") {
      queryBuilder = queryBuilder.eq("user_id", user.id);
      console.log(`Filtering weight data for operator ID: ${user.id}`);
    } else {
      console.log(`Showing all weight data for ${user.role} role`);
    }
    // For admin/manager, show all records (no additional filter needed)

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching weight by day:", error);
      return [];
    }

    console.log(`Found ${data?.length || 0} weight records for chart`);

    // Group by day
    const dailyTotals: Record<string, number> = {};

    if (Array.isArray(data)) {
      data.forEach((record) => {
        const day = record.timestamp.split("T")[0]; // Get YYYY-MM-DD
        const weight = parseFloat(record.total_weight) || 0;
        dailyTotals[day] = (dailyTotals[day] || 0) + weight;
      });
    }

    // Convert to array format for chart
    return Object.entries(dailyTotals)
      .map(([day, weight]) => ({
        day: formatDayForChart(day),
        total_weight: Math.round(weight * 100) / 100,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  } catch (error) {
    console.error("Error in getWeightByDay:", error);
    return [];
  }
}

// Issues functionality removed
async function getRecentIssues(user: any) {
  try {
    console.log("Fetching recent issues for user role:", user.role);

    // Return empty array since issues table doesn't exist
    console.log("Issues table not available, returning empty array");
    return [];
  } catch (error) {
    console.error("Error in getRecentIssues:", error);
    return [];
  }
}

async function getSystemStatus() {
  try {
    console.log("Fetching system status...");

    // Since issues table doesn't exist, just check for weight anomalies
    const { data: anomalies, error: anomaliesError } = await supabaseAdmin
      .from("weight_records")
      .select("record_id")
      .gt("total_weight", 1000)
      .gte(
        "timestamp",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ); // Last 24 hours

    if (anomaliesError) {
      console.error("Error fetching weight anomalies:", anomaliesError);
    }

    const anomalyCount = anomalies?.length || 0;

    let status = "operational";
    let message = "All Systems Operational";
    let details = "No issues detected";

    if (anomalyCount > 0) {
      status = "warning";
      message = "Data Anomalies Detected";
      details = `${anomalyCount} unusual weight reading${
        anomalyCount > 1 ? "s" : ""
      } in last 24 hours`;
    }

    return {
      status,
      message,
      details,
      metrics: {
        criticalIssues: 0,
        pendingIssues: 0,
        dataAnomalies: anomalyCount,
      },
    };
  } catch (error) {
    console.error("Error in getSystemStatus:", error);
    return {
      status: "unknown",
      message: "System Status Unknown",
      details: "Unable to fetch system status",
      metrics: {
        criticalIssues: 0,
        pendingIssues: 0,
        dataAnomalies: 0,
      },
    };
  }
}

// Helper functions
function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

function formatDayForChart(day: string): string {
  const date = new Date(day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function getMaterialsOverview() {
  try {
    console.log("Fetching materials overview...");

    // Get all samples with usage count from weight records
    const { data: samples, error: samplesError } = await supabaseAdmin
      .from("samples_item")
      .select("id, category, item, sample_weight");

    if (samplesError) {
      console.error("Error fetching samples:", samplesError);
      return [];
    }

    // Get weight records count per item_id (using existing column)
    const { data: weightRecords, error: recordsError } = await supabaseAdmin
      .from("weight_records")
      .select("item_id");

    if (recordsError) {
      console.error("Error fetching weight records:", recordsError);
      return [];
    }

    // Count usage per item (using item_id which maps to samples)
    const usageCount: Record<number, number> = {};
    if (Array.isArray(weightRecords)) {
      weightRecords.forEach((record) => {
        if (record.item_id) {
          usageCount[record.item_id] = (usageCount[record.item_id] || 0) + 1;
        }
      });
    }

    // Combine samples with usage count
    return (samples || [])
      .map((sample: any) => ({
        id: sample.id,
        name: `${sample.category} - ${sample.item}`,
        category: sample.category,
        item: sample.item,
        standard_weight: sample.sample_weight,
        usage_count: usageCount[sample.id] || 0,
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
  } catch (error) {
    console.error("Error in getMaterialsOverview:", error);
    return [];
  }
}
