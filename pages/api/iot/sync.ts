import { NextApiRequest, NextApiResponse } from 'next';
import { database, ref, onValue } from '@/lib/firebase';
import apiClient from '@/lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { deviceId, rfidId, weight } = req.body;

    // Sync weight data from IoT to local database
    if (weight && deviceId) {
      // Create a weight record in local database
      const weightRecord = {
        device_id: deviceId,
        weight: parseFloat(weight),
        unit: 'kg',
        source: 'IoT_Scale',
        timestamp: new Date().toISOString(),
        sync_status: 'synced'
      };

      // Here you would typically save to your local database
      // For now, we'll just log it
      console.log('Weight record to sync:', weightRecord);
    }

    // Handle RFID user sync
    if (rfidId && deviceId) {
      const userRecord = {
        rfid_id: rfidId,
        device_id: deviceId,
        scan_time: new Date().toISOString(),
        sync_status: 'synced'
      };

      console.log('RFID record to sync:', userRecord);
    }

    res.status(200).json({ 
      message: 'Data synced successfully',
      synced_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Failed to sync IoT data' });
  }
}