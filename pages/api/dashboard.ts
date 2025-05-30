// New dashboard API implementation for material-focused system
import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromToken } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase.js";
import { getCount, getSum } from "../../lib/supabase-aggregation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get summary statistics with new structure
    const summaryStats = await getDashboardSummary();

    // Get weight by day for the chart
    const weightByDay = await getWeightByDay();

    // Get pending issues for report table
    const reportIssues = await getReportIssues();

    return res.status(200).json({
      summaryStats,
      weightByDay,
      reportIssues,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getDashboardSummary() {
  // Get total samples count (changed from materials to samples)
  console.log("Fetching samples count...");
  const samplesCount = await getCount("samples_item");
  console.log("Samples count result:", samplesCount);

  // Get total requests/month (weight records for current month)
  console.log("Fetching monthly requests...");
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const { data: monthlyRequests, error: requestsError } = await supabaseAdmin
    .from("weight_records")
    .select("record_id")
    .gte("timestamp", `${currentMonth}-01`)
    .lt("timestamp", `${getNextMonth(currentMonth)}-01`);

  if (requestsError) {
    console.error("Error fetching monthly requests:", requestsError);
  }

  // Get total weight/month
  console.log("Fetching monthly weight...");
  const { data: monthlyWeight, error: weightError } = await supabaseAdmin
    .from("weight_records")
    .select("total_weight")
    .gte("timestamp", `${currentMonth}-01`)
    .lt("timestamp", `${getNextMonth(currentMonth)}-01`);

  if (weightError) {
    console.error("Error fetching monthly weight:", weightError);
  }

  const totalMonthlyWeight =
    monthlyWeight?.reduce(
      (sum, record) => sum + (parseFloat(record.total_weight) || 0),
      0
    ) || 0;

  // Get pending issues count
  console.log("Fetching pending issues...");
  const { data: pendingIssues, error: issuesError } = await supabaseAdmin
    .from("issues")
    .select("id")
    .eq("status", "pending");

  if (issuesError) {
    console.error("Error fetching pending issues:", issuesError);
  }

  return {
    totalMaterials: samplesCount[0]?.count || 0,
    totalRequests: monthlyRequests?.length || 0,
    totalWeight: Math.round(totalMonthlyWeight * 100) / 100,
    pendingIssues: pendingIssues?.length || 0,
  };
}

async function getWeightByDay() {
  try {
    console.log("Fetching weight by day for last 7 days...");

    // Get data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabaseAdmin
      .from("weight_records")
      .select("timestamp, total_weight")
      .gte("timestamp", sevenDaysAgo.toISOString())
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error fetching weight by day:", error);
      return [];
    }

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
        weight: Math.round(weight * 100) / 100,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  } catch (error) {
    console.error("Error in getWeightByDay:", error);
    return [];
  }
}

async function getReportIssues() {
  try {
    console.log("Fetching recent issues...");

    const { data, error } = await supabaseAdmin
      .from("issues")
      .select(
        `
        *,
        users!issues_reporter_id_fkey (name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching issues:", error);
      return [];
    }

    return (data || []).map((issue: any) => ({
      ...issue,
      reporter_name: issue.users?.name || "Unknown",
    }));
  } catch (error) {
    console.error("Error in getReportIssues:", error);
    return [];
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
