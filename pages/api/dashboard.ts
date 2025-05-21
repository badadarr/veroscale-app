import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../lib/db-adapter";
import { getUserFromToken } from "../../lib/auth";

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
  const samplesCount = await executeQuery<any[]>({
    table: "samples_item",
    action: "select",
    columns: "count(*)",
  });

  // Get total weight records count
  const recordsCount = await executeQuery<any[]>({
    table: "weight_records",
    action: "select",
    columns: "count(*)",
  });

  // Get total weight recorded
  const totalWeight = await executeQuery<any[]>({
    table: "weight_records",
    action: "select",
    columns: "sum(total_weight) as total",
  });

  // Get pending weight records count
  const pendingCount = await executeQuery<any[]>({
    table: "weight_records",
    action: "select",
    columns: "count(*)",
    filters: { status: "pending" },
  });

  return {
    totalSamples: samplesCount[0]?.count || 0,
    totalRecords: recordsCount[0]?.count || 0,
    totalWeight: totalWeight[0]?.total || 0,
    pendingRecords: pendingCount[0]?.count || 0,
  };
}

async function getRecentWeightRecords() {
  return executeQuery<any[]>({
    table: "weight_records",
    action: "select",
    columns: `
      *,
      ref_items!item_id ( name as item_name ),
      users!user_id ( name as user_name )
    `,
    // Note: OrderBy and limit need to be added to the db-adapter or passed through
    // For now, we'll need to handle sorting after getting the data
    // This is a limitation when moving from SQL to Supabase API
  }).then((records) => {
    if (Array.isArray(records)) {
      // Sort and limit the records since we can't do it in the query
      return records
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 5);
    }
    return [];
  });
}

async function getWeightByCategory() {
  // Unfortunately, Supabase's JavaScript API doesn't directly support GROUP BY operations,
  // So we need to use a different approach - Fetch all items and process them in memory
  const items = await executeQuery<any[]>({
    table: "samples_item",
    action: "select",
    columns: "category, sample_weight",
  });

  // Process the data to group by category
  const categoryTotals: Record<string, number> = {};

  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (item.category && item.sample_weight) {
        categoryTotals[item.category] =
          (categoryTotals[item.category] || 0) + parseFloat(item.sample_weight);
      }
    });
  }

  // Convert to the expected format and sort
  return Object.entries(categoryTotals)
    .map(([category, total_weight]) => ({ category, total_weight }))
    .sort((a, b) => b.total_weight - a.total_weight);
}

async function getTopUsers() {
  // Fetch all users
  const users = await executeQuery<any[]>({
    table: "users",
    action: "select",
    columns: "id, name",
  });

  // Fetch all weight records
  const weightRecords = await executeQuery<any[]>({
    table: "weight_records",
    action: "select",
    columns: "user_id, record_id, total_weight",
  });

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
}
