import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../lib/db';
import { getUserFromToken } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
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
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getDashboardSummary() {
  // Get total samples count
  const samplesCount = await executeQuery<any[]>({
    query: 'SELECT COUNT(*) as count FROM samples_item',
  });
  
  // Get total weight records count
  const recordsCount = await executeQuery<any[]>({
    query: 'SELECT COUNT(*) as count FROM weight_records',
  });
  
  // Get total weight recorded
  const totalWeight = await executeQuery<any[]>({
    query: 'SELECT SUM(total_weight) as total FROM weight_records',
  });
  
  // Get pending weight records count
  const pendingCount = await executeQuery<any[]>({
    query: 'SELECT COUNT(*) as count FROM weight_records WHERE status = "pending"',
  });
  
  return {
    totalSamples: samplesCount[0].count || 0,
    totalRecords: recordsCount[0].count || 0,
    totalWeight: totalWeight[0].total || 0,
    pendingRecords: pendingCount[0].count || 0,
  };
}

async function getRecentWeightRecords() {
  return executeQuery<any[]>({
    query: `
      SELECT wr.*, ri.name as item_name, u.name as user_name
      FROM weight_records wr
      JOIN ref_items ri ON wr.item_id = ri.id
      JOIN users u ON wr.user_id = u.id
      ORDER BY wr.timestamp DESC
      LIMIT 5
    `,
  });
}

async function getWeightByCategory() {
  return executeQuery<any[]>({
    query: `
      SELECT category, SUM(sample_weight) as total_weight
      FROM samples_item
      GROUP BY category
      ORDER BY total_weight DESC
    `,
  });
}

async function getTopUsers() {
  return executeQuery<any[]>({
    query: `
      SELECT u.id, u.name, COUNT(wr.record_id) as record_count, SUM(wr.total_weight) as total_weight
      FROM users u
      JOIN weight_records wr ON u.id = wr.user_id
      GROUP BY u.id, u.name
      ORDER BY total_weight DESC
      LIMIT 5
    `,
  });
}