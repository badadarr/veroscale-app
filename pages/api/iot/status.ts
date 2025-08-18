import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Return IoT system status
    const status = {
      firebase_connected: true,
      devices: {
        esp32_timbangan_001: {
          status: 'online',
          last_update: new Date().toISOString(),
          current_weight: '0.100'
        }
      },
      rfid_system: {
        status: 'active',
        last_scan: new Date().toISOString()
      }
    };

    res.status(200).json(status);

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ message: 'Failed to get IoT status' });
  }
}