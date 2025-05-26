// Fixed dashboard.ts implementation for Supabase
import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../lib/db-adapter";
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
    // Get summary statistics
    const summaryStats = await getDashboardSummary();

    // Get recent weight records
    const recentRecords = await getRecentWeightRecords();

    // Get weight by category
    const weightByCategory = await getWeightByCategory();

    // Get top users by weight recorded
    const topUsers = await getTopUsers();

    return res.status(200).json({
      summaryStats,
      recentRecords,
      weightByCategory,
      topUsers,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getDashboardSummary() {
  // Get total samples count
  console.log("Fetching samples count...");
  const samplesCount = await getCount("samples_item");
  console.log("Samples count result:", samplesCount);

  // Get total weight records count
  console.log("Fetching records count...");
  const recordsCount = await getCount("weight_records");
  console.log("Records count result:", recordsCount);

  // Get total weight recorded
  console.log("Fetching total weight with aggregation...");
  const totalWeight = await getSum("weight_records", "total_weight", "total");
  console.log("Total weight result:", totalWeight);

  // Get pending weight records count
  console.log("Fetching pending count...");
  const pendingCount = await getCount("weight_records", { status: "pending" });
  console.log("Pending count result:", pendingCount);

  return {
    totalSamples: samplesCount[0]?.count || 0,
    totalRecords: recordsCount[0]?.count || 0,
    totalWeight: totalWeight[0]?.total || 0,
    pendingRecords: pendingCount[0]?.count || 0,
  };
}

async function getRecentWeightRecords() {
  try {
    console.log("Fetching recent weight records with relations...");

    // Use direct Supabase query with proper relation syntax
    const { data, error } = await supabaseAdmin
      .from("weight_records")
      .select(
        `
        *,
        ref_items (name),
        users (name)
      `
      )
      .order("timestamp", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching recent records:", error);
      return [];
    }

    // Transform the data to match the expected format
    return (data || []).map((record: any) => ({
      ...record,
      item_name: record.ref_items?.name,
      user_name: record.users?.name,
    }));
  } catch (error) {
    console.error("Error in getRecentWeightRecords:", error);
    return [];
  }
}

async function getWeightByCategory() {
  try {
    console.log("Fetching weight by category...");

    // Use direct query for simplicity
    const { data, error } = await supabaseAdmin
      .from("samples_item")
      .select("category, sample_weight");

    if (error) {
      console.error("Error fetching samples for category:", error);
      return [];
    }

    // Process the data to group by category
    const categoryTotals: Record<string, number> = {};

    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item.category && item.sample_weight) {
          categoryTotals[item.category] =
            (categoryTotals[item.category] || 0) +
            parseFloat(item.sample_weight);
        }
      });
    }

    // Convert to the expected format and sort
    return Object.entries(categoryTotals)
      .map(([category, total_weight]) => ({ category, total_weight }))
      .sort((a, b) => b.total_weight - a.total_weight);
  } catch (error) {
    console.error("Error in getWeightByCategory:", error);
    return [];
  }
}

async function getTopUsers() {
  try {
    console.log("Fetching top users...");

    // Fetch all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, name");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return [];
    }

    // Fetch all weight records
    const { data: weightRecords, error: recordsError } = await supabaseAdmin
      .from("weight_records")
      .select("user_id, record_id, total_weight");

    if (recordsError) {
      console.error("Error fetching weight records for users:", recordsError);
      return [];
    }

    // Process the data to group by user
    const userStats: Record<
      string,
      { id: number; name: string; record_count: number; total_weight: number }
    > = {};

    if (Array.isArray(users) && Array.isArray(weightRecords)) {
      // Initialize user stats
      users.forEach((user) => {
        userStats[user.id] = {
          id: user.id,
          name: user.name,
          record_count: 0,
          total_weight: 0,
        };
      });

      // Calculate records and weight per user
      weightRecords.forEach((record) => {
        if (record.user_id && userStats[record.user_id]) {
          userStats[record.user_id].record_count += 1;
          userStats[record.user_id].total_weight += parseFloat(
            record.total_weight || 0
          );
        }
      });
    }

    // Convert to array and sort by total weight
    return Object.values(userStats)
      .sort((a, b) => b.total_weight - a.total_weight)
      .slice(0, 5);
  } catch (error) {
    console.error("Error in getTopUsers:", error);
    return [];
  }
}
