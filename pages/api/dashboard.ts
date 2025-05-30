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
    // Get summary statistics with role-based filtering
    const summaryStats = await getDashboardSummary(user);

    // Get weight by day for the chart with role-based filtering
    const weightByDay = await getWeightByDay(user);

    // Get pending issues for report table
    const reportIssues = await getReportIssues();

    // Get recent weight records based on user role
    const recentRecords = await getRecentRecords(user);

    return res.status(200).json({
      summaryStats,
      recentRecords,
      weightByDay,
      reportIssues,
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

async function getRecentRecords(user: any) {
  try {
    console.log("Fetching recent weight records for user role:", user.role);
    console.log("User ID:", user.id);

    // Build the query using Supabase query builder
    let queryBuilder = supabaseAdmin.from("weight_records").select(`
        record_id,
        user_id,
        sample_id,
        total_weight,
        timestamp,
        status,
        source,
        destination,
        notes,
        unit,
        approved_by,
        approved_at
      `);

    // For operators, only show their own records
    if (user.role === "operator") {
      queryBuilder = queryBuilder.eq("user_id", user.id);
      console.log(`Filtering for operator ID: ${user.id}`);
    } else {
      console.log(`Admin/Manager - showing all records`);
    }
    // For admin/manager, show all records (no additional filter needed)

    console.log("Executing query...");
    // Order by timestamp descending and limit to 10 most recent records
    const { data: weightRecords, error } = await queryBuilder
      .order("timestamp", { ascending: false })
      .limit(10);

    console.log("Query completed. Error:", error);
    console.log("Data length:", weightRecords?.length);
    console.log("Raw data sample:", weightRecords?.slice(0, 2));

    if (error) {
      console.error("Error fetching recent records:", error);
      return [];
    }

    if (!Array.isArray(weightRecords) || weightRecords.length === 0) {
      console.log("No weight records found in getRecentRecords");
      return [];
    }

    console.log(
      `Found ${weightRecords.length} recent weight records for user role: ${user.role}`
    );
    console.log("Sample weight record:", weightRecords[0]);

    // Get sample and user information for the records
    const sampleIds = Array.from(
      new Set(weightRecords.map((r) => r.sample_id).filter(Boolean))
    );
    const userIds = Array.from(
      new Set(weightRecords.map((r) => r.user_id).filter(Boolean))
    );

    // Fetch samples
    const samples =
      sampleIds.length > 0
        ? await supabaseAdmin
            .from("samples_item")
            .select("id, category, item")
            .in("id", sampleIds)
        : { data: [] };

    // Fetch users
    const users =
      userIds.length > 0
        ? await supabaseAdmin.from("users").select("id, name").in("id", userIds)
        : { data: [] };

    // Create lookup maps
    const sampleMap: Record<number, string> = {};
    if (samples.data) {
      samples.data.forEach((sample: any) => {
        sampleMap[sample.id] = `${sample.category} - ${sample.item}`;
      });
    }
    console.log(
      "Sample map created:",
      Object.keys(sampleMap).length,
      "entries"
    );

    const userMap: Record<number, string> = {};
    if (users.data) {
      users.data.forEach((user: any) => {
        userMap[user.id] = user.name;
      });
    }
    console.log("User map created:", Object.keys(userMap).length, "entries");

    // Map records with related data
    console.log("Starting to map records...");
    const mappedRecords = weightRecords.map((record: any) => ({
      record_id: record.record_id,
      user_id: record.user_id,
      sample_id: record.sample_id,
      item_name: sampleMap[record.sample_id] || "Unknown Sample",
      user_name: userMap[record.user_id] || "Unknown User",
      total_weight: record.total_weight,
      timestamp: record.timestamp,
      status: record.status,
      source: record.source,
      destination: record.destination,
      notes: record.notes,
      unit: record.unit || "kg",
      approved_by: record.approved_by,
      approved_at: record.approved_at,
    }));

    console.log("Mapped records length:", mappedRecords.length);
    console.log("Sample mapped record:", mappedRecords[0]);

    return mappedRecords;
  } catch (error) {
    console.error("Error in getRecentRecords:", error);
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
