import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { getUserFromToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getWeightRecords(req, res);
    case 'POST':
      return addWeightRecord(req, res, user);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all weight records with filtering and pagination
async function getWeightRecords(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      item_id, 
      user_id, 
      status, 
      startDate, 
      endDate, 
      page = '1', 
      limit = '10' 
    } = req.query;
    
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;
    
    let query = `
      SELECT wr.*, ri.name as item_name, u.name as user_name
      FROM weight_records wr
      JOIN ref_items ri ON wr.item_id = ri.id
      JOIN users u ON wr.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    if (item_id) {
      query += ` AND wr.item_id = ?`;
      queryParams.push(item_id);
    }
    
    if (user_id) {
      query += ` AND wr.user_id = ?`;
      queryParams.push(user_id);
    }
    
    if (status) {
      query += ` AND wr.status = ?`;
      queryParams.push(status);
    }
    
    if (startDate) {
      query += ` AND wr.timestamp >= ?`;
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += ` AND wr.timestamp <= ?`;
      queryParams.push(endDate);
    }

    // Get total count for pagination
    const countQuery = query.replace('SELECT wr.*, ri.name as item_name, u.name as user_name', 'SELECT COUNT(*) as count');
    const countResult = await executeQuery<any[]>({
      query: countQuery,
      values: queryParams,
    });
    
    const totalItems = countResult[0].count;
    
    // Add pagination to main query
    query += ` ORDER BY wr.timestamp DESC LIMIT ? OFFSET ?`;
    queryParams.push(itemsPerPage, offset);
    
    const records = await executeQuery<any[]>({
      query,
      values: queryParams,
    });
    
    return res.status(200).json({
      records,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      },
    });
  } catch (error) {
    console.error('Error fetching weight records:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Add a new weight record
async function addWeightRecord(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { item_id, total_weight } = req.body;
    
    if (!item_id || total_weight === undefined) {
      return res.status(400).json({ message: 'Item ID and total weight are required' });
    }
    
    // Check if item exists
    const items = await executeQuery<any[]>({
      query: 'SELECT * FROM ref_items WHERE id = ?',
      values: [item_id],
    });
    
    if (!items || items.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const result = await executeQuery<any>({
      query: `
        INSERT INTO weight_records (user_id, item_id, total_weight, status)
        VALUES (?, ?, ?, 'pending')
      `,
      values: [user.id, item_id, total_weight],
    });
    
    const newRecord = {
      record_id: result.insertId,
      user_id: user.id,
      user_name: user.name,
      item_id,
      item_name: items[0].name,
      total_weight,
      timestamp: new Date(),
      status: 'pending',
    };
    
    return res.status(201).json({ 
      message: 'Weight record added successfully', 
      record: newRecord 
    });
  } catch (error) {
    console.error('Error adding weight record:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}