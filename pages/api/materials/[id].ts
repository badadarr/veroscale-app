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

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid material ID' });
  }

  switch (req.method) {
    case 'GET':
      return getMaterialById(res, id);
    case 'PUT':
      return updateMaterial(req, res, id);
    case 'DELETE':
      return deleteMaterial(res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get material by ID
async function getMaterialById(res: NextApiResponse, id: string) {
  try {
    // Check if we're using Supabase
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let material;

    if (useSupabase) {
      // Supabase implementation
      const materials = await executeQuery<any[]>({
        table: 'ref_items',
        action: 'select',
        filters: { id },
        single: true,
      });

      material = materials;
    } else {
      // MySQL implementation
      const materials = await executeQuery<any[]>({
        query: 'SELECT * FROM ref_items WHERE id = ?',
        values: [id],
      });

      if (!materials || materials.length === 0) {
        return res.status(404).json({ message: 'Material not found' });
      }

      material = materials[0];
    }

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    return res.status(200).json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Update material
async function updateMaterial(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
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

    // Check if material exists
    let existingMaterial;

    if (useSupabase) {
      // Supabase implementation
      existingMaterial = await executeQuery<any>({
        table: 'ref_items',
        action: 'select',
        filters: { id },
        single: true,
      });
    } else {
      // MySQL implementation
      const materials = await executeQuery<any[]>({
        query: 'SELECT * FROM ref_items WHERE id = ?',
        values: [id],
      });

      if (!materials || materials.length === 0) {
        return res.status(404).json({ message: 'Material not found' });
      }

      existingMaterial = materials[0];
    }

    if (!existingMaterial) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if the new name already exists (but ignore the current material)
    if (name !== existingMaterial.name) {
      let duplicateMaterial;

      if (useSupabase) {
        // Supabase implementation
        const materials = await executeQuery<any[]>({
          table: 'ref_items',
          action: 'select',
          filters: { name },
        });

        duplicateMaterial = materials.find(m => m.id != id);
      } else {
        // MySQL implementation
        const materials = await executeQuery<any[]>({
          query: 'SELECT * FROM ref_items WHERE name = ? AND id != ?',
          values: [name, id],
        });

        duplicateMaterial = materials && materials.length > 0 ? materials[0] : null;
      }

      if (duplicateMaterial) {
        return res.status(409).json({ message: 'Material with this name already exists' });
      }
    }

    // Update the material
    let result;

    if (useSupabase) {
      // Supabase implementation
      result = await executeQuery<any[]>({
        table: 'ref_items',
        action: 'update',
        data: {
          name,
          weight: parseFloat(weight),
        },
        filters: { id },
        returning: '*',
      });

      // Supabase returns an array with the updated object
      result = result[0];
    } else {
      // MySQL implementation
      result = await executeQuery({
        query: 'UPDATE ref_items SET name = ?, weight = ? WHERE id = ?',
        values: [name, parseFloat(weight), id],
      });
    }

    return res.status(200).json({
      message: 'Material updated successfully',
      material: useSupabase
        ? result
        : {
            id: parseInt(id),
            name,
            weight: parseFloat(weight),
          },
    });
  } catch (error) {
    console.error('Error updating material:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Delete material
async function deleteMaterial(res: NextApiResponse, id: string) {
  try {
    // Check if we're using Supabase
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Check if material exists
    let existingMaterial;

    if (useSupabase) {
      // Supabase implementation
      existingMaterial = await executeQuery<any>({
        table: 'ref_items',
        action: 'select',
        filters: { id },
        single: true,
      });
    } else {
      // MySQL implementation
      const materials = await executeQuery<any[]>({
        query: 'SELECT * FROM ref_items WHERE id = ?',
        values: [id],
      });

      existingMaterial = materials && materials.length > 0 ? materials[0] : null;
    }

    if (!existingMaterial) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if material is used in any weight records
    let usedInRecords;

    if (useSupabase) {
      // Supabase implementation
      const records = await executeQuery<any[]>({
        table: 'weight_records',
        action: 'select',
        filters: { item_id: id },
      });

      usedInRecords = records && records.length > 0;
    } else {
      // MySQL implementation
      const records = await executeQuery<any[]>({
        query: 'SELECT COUNT(*) as count FROM weight_records WHERE item_id = ?',
        values: [id],
      });

      usedInRecords = records[0].count > 0;
    }

    if (usedInRecords) {
      return res.status(409).json({ 
        message: 'Cannot delete material as it is used in weight records. Consider deactivating it instead.' 
      });
    }

    // Delete the material
    if (useSupabase) {
      // Supabase implementation
      await executeQuery({
        table: 'ref_items',
        action: 'delete',
        filters: { id },
      });
    } else {
      // MySQL implementation
      await executeQuery({
        query: 'DELETE FROM ref_items WHERE id = ?',
        values: [id],
      });
    }

    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
