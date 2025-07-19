import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db-adapter';
import { getUserFromToken, canManageSamples } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getSamples(req, res);
    case 'POST':
      return addSample(req, res, user);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all samples with filtering and pagination
async function getSamples(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, item, page = '1', limit = '10' } = req.query;
    
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;
    
    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    let totalItems = 0;
    let samples: any[] = [];
    
    if (useSupabase) {
      // Supabase implementation
      // For Supabase, we need to handle this differently since LIKE operations are special
      
      // First, get all samples (we'll filter in memory)
      samples = await executeQuery<any[]>({
        table: 'public.samples_item',
        action: 'select',
        columns: '*'
      });
      
      // Apply filters in memory
      if (category) {
        const categoryLower = (category as string).toLowerCase();
        samples = samples.filter(sample => 
          sample.category.toLowerCase().includes(categoryLower)
        );
      }
      
      if (item) {
        const itemLower = (item as string).toLowerCase();
        samples = samples.filter(sample => 
          sample.item.toLowerCase().includes(itemLower)
        );
      }
      
      // Get total count for pagination
      totalItems = samples.length;
      
      // Sort by created_at
      samples.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Apply pagination
      samples = samples.slice(offset, offset + itemsPerPage);
      
    } else {
      // MySQL implementation (original code)
      let query = `SELECT * FROM samples_item WHERE 1=1`;
      const queryParams: any[] = [];
      
      if (category) {
        query += ` AND category LIKE ?`;
        queryParams.push(`%${category}%`);
      }
      
      if (item) {
        query += ` AND item LIKE ?`;
        queryParams.push(`%${item}%`);
      }

      // Get total count for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
      const countResult = await executeQuery<any[]>({
        query: countQuery,
        values: queryParams,
      });
      
      totalItems = countResult[0].count;
      
      // Add pagination to main query
      query += ` ORDER BY created_at DESC LIMIT ${itemsPerPage} OFFSET ${offset}`;
      
      // Using direct string interpolation for pagination
      // This avoids the issue with prepared statements incorrectly handling numeric parameters
      samples = await executeQuery<any[]>({
        query,
        values: queryParams,
      });
    }
    
    return res.status(200).json({
      samples,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      },
    });
  } catch (error) {
    console.error('Error fetching samples:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Add a new sample
async function addSample(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Allow admins, managers, marketing, and operators to add samples
    if (!['admin', 'manager', 'marketing', 'operator'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { category, item, sample_weight } = req.body;
    
    if (!category || !item || sample_weight === undefined) {
      return res.status(400).json({ message: 'Category, item, and sample weight are required' });
    }
    
    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    let result;
    
    if (useSupabase) {
      // Supabase implementation
      result = await executeQuery<any[]>({
        table: 'public.samples_item',
        action: 'insert',
        data: {
          category,
          item,
          sample_weight,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        returning: '*'
      });
      
      // Supabase returns an array with the inserted object
      result = result[0];
    } else {
      // MySQL implementation
      result = await executeQuery<any>({
        query: `
          INSERT INTO samples_item (category, item, sample_weight)
          VALUES (?, ?, ?)
        `,
        values: [category, item, sample_weight],
      });
    }
    
    const newSample = {
      id: useSupabase ? result.id : result.insertId,
      category,
      item,
      sample_weight,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    return res.status(201).json({ message: 'Sample added successfully', sample: newSample });
  } catch (error) {
    console.error('Error adding sample:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}