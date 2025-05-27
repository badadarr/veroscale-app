import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db-adapter';
import { getUserFromToken, isManagerOrAdmin } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only managers and admins can manage materials
  if (!isManagerOrAdmin(user)) {
    return res.status(403).json({ message: 'Forbidden. Manager or Admin access required.' });
  }

  switch (req.method) {
    case 'GET':
      return getMaterials(req, res);
    case 'POST':
      return addMaterial(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all materials with optional filtering
async function getMaterials(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, page = '1', limit = '10' } = req.query;
    
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    // Check if we're using Supabase
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    let materials: any[] = [];
    let totalItems = 0;

    if (useSupabase) {
      // Supabase implementation
      materials = await executeQuery<any[]>({
        table: 'ref_items',
        action: 'select',
        columns: '*'
      });
      
      // Apply search filter in memory if needed
      if (search) {
        const searchLower = (search as string).toLowerCase();
        materials = materials.filter(material => 
          material.name.toLowerCase().includes(searchLower)
        );
      }
      
      // Get total count for pagination
      totalItems = materials.length;
      
      // Apply pagination
      materials = materials.slice(offset, offset + itemsPerPage);
      
    } else {
      // MySQL implementation
      let query = 'SELECT * FROM ref_items';
      const queryParams: any[] = [];
      
      if (search) {
        query += ' WHERE name LIKE ?';
        queryParams.push(`%${search}%`);
      }
      
      // Get total count for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
      const countResult = await executeQuery<any[]>({
        query: countQuery,
        values: queryParams,
      });
      
      totalItems = countResult[0].count;
      
      // Add pagination to main query
      query += ` ORDER BY id DESC LIMIT ${itemsPerPage} OFFSET ${offset}`;
      
      materials = await executeQuery<any[]>({
        query,
        values: queryParams,
      });
    }
    
    return res.status(200).json({
      materials,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      },
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Add a new material
async function addMaterial(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, weight } = req.body;
    
    if (!name || weight === undefined) {
      return res.status(400).json({ message: 'Name and weight are required' });
    }
    
    // Check if we're using Supabase
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    let result;
    
    if (useSupabase) {
      // Check if material with same name already exists
      const existingMaterial = await executeQuery<any[]>({
        table: 'ref_items',
        action: 'select',
        filters: { name },
      });
      
      if (existingMaterial && existingMaterial.length > 0) {
        return res.status(409).json({ message: 'Material with this name already exists' });
      }
      
      // Supabase implementation
      result = await executeQuery<any[]>({
        table: 'ref_items',
        action: 'insert',
        data: {
          name,
          weight: parseFloat(weight)
        },
        returning: '*'
      });
      
      // Supabase returns an array with the inserted object
      result = result[0];
    } else {
      // Check if material with same name already exists
      const existingMaterial = await executeQuery<any[]>({
        query: 'SELECT * FROM ref_items WHERE name = ?',
        values: [name],
      });
      
      if (existingMaterial && existingMaterial.length > 0) {
        return res.status(409).json({ message: 'Material with this name already exists' });
      }
      
      // MySQL implementation
      result = await executeQuery<any>({
        query: 'INSERT INTO ref_items (name, weight) VALUES (?, ?)',
        values: [name, parseFloat(weight)],
      });
    }
    
    const newMaterial = {
      id: useSupabase ? result.id : result.insertId,
      name,
      weight: parseFloat(weight)
    };
    
    return res.status(201).json({ message: 'Material added successfully', material: newMaterial });
  } catch (error) {
    console.error('Error adding material:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
