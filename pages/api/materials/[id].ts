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
    const material = await executeQuery<any>({
      query: 'SELECT * FROM materials WHERE id = ?',
      values: [id],
      single: true
    });

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
    const { name, weight } = req.body;    if (!name || weight === undefined) {
      return res.status(400).json({ message: 'Name and weight are required' });
    }

    // Check if material exists
    const existingMaterial = await executeQuery<any>({
      query: 'SELECT * FROM materials WHERE id = ?',
      values: [id],
      single: true
    });

    if (!existingMaterial) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if the new name already exists (but ignore the current material)
    if (name !== existingMaterial.name) {
      const duplicateMaterial = await executeQuery<any>({
        query: 'SELECT * FROM materials WHERE name = ? AND id != ?',
        values: [name, id],
        single: true
      });

      if (duplicateMaterial) {
        return res.status(409).json({ message: 'Material with this name already exists' });
      }
    }

    // Update the material
    await executeQuery({
      query: 'UPDATE materials SET name = ?, weight = ? WHERE id = ?',
      values: [name, parseFloat(weight), id],
    });

    return res.status(200).json({
      message: 'Material updated successfully',
      material: {
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
    // Check if material exists
    const existingMaterial = await executeQuery<any>({
      query: 'SELECT * FROM materials WHERE id = ?',
      values: [id],
      single: true
    });

    if (!existingMaterial) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if material is used in any weight records
    const usageCount = await executeQuery<any>({
      query: 'SELECT COUNT(*) as count FROM weight_records WHERE item_id = ?',
      values: [id],
      single: true
    });

    if (usageCount.count > 0) {
      return res.status(409).json({ 
        message: 'Cannot delete material as it is used in weight records. Consider deactivating it instead.' 
      });
    }

    // Delete the material
    await executeQuery({
      query: 'DELETE FROM materials WHERE id = ?',
      values: [id],
    });

    return res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
