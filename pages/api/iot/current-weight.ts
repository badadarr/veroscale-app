import { NextApiRequest, NextApiResponse } from 'next';
import { database, ref, onValue } from '@/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const deviceId = req.query.device || 'esp32_timbangan_001';
    const weightRef = ref(database, `devices/${deviceId}/berat_terakhir`);
    
    const snapshot = await new Promise((resolve) => {
      onValue(weightRef, resolve, { onlyOnce: true });
    });
    const weight = snapshot.val();
    
    if (weight) {
      const weightValue = parseFloat(weight);
      
      // Validate weight data
      if (isNaN(weightValue) || weightValue < 0) {
        return res.status(400).json({ message: 'Invalid weight data' });
      }
      
      res.status(200).json({
        weight: weightValue,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
        is_valid: weightValue >= 0.01 && weightValue <= 1000
      });
    } else {
      res.status(404).json({ message: 'No weight data found' });
    }
  } catch (error) {
    console.error('Error fetching current weight:', error);
    res.status(500).json({ message: 'Failed to fetch weight data' });
  }
}