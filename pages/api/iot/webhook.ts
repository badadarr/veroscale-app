import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { device_id, weight, rfid_id, timestamp } = req.body;

    // Validate required fields
    if (!device_id || !weight) {
      return res.status(400).json({ message: 'device_id and weight are required' });
    }

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      return res.status(400).json({ message: 'Invalid weight value' });
    }

    // Insert weight record directly to database
    const { data: weightRecord, error: weightError } = await supabase
      .from('weightrecords')
      .insert({
        item_id: 1, // Default material ID, bisa disesuaikan
        total_weight: weightValue,
        unit: 'kg',
        source: `IoT_${device_id}`,
        destination: 'Warehouse',
        batch_number: `IOT_${Date.now()}`,
        notes: `Auto-recorded from ${device_id}`,
        recorded_by: 'IoT_System',
        created_at: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (weightError) {
      console.error('Weight insert error:', weightError);
      return res.status(500).json({ message: 'Failed to save weight data' });
    }

    // If RFID data is provided, save it too
    if (rfid_id) {
      const { error: rfidError } = await supabase
        .from('rfid_logs')
        .insert({
          rfid_id,
          device_id,
          weight_record_id: weightRecord.id,
          scan_time: timestamp || new Date().toISOString()
        });

      if (rfidError) {
        console.error('RFID insert error:', rfidError);
      }
    }

    res.status(200).json({ 
      message: 'Data saved successfully',
      weight_record_id: weightRecord.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}