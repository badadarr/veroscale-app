import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db-adapter';
import { getUserFromToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let samples;

    if (useSupabase) {
      const { supabaseAdmin } = await import("../../../lib/supabase.js");
      
      // First get all samples
      const { data: allSamples } = await supabaseAdmin
        .from('samples_item')
        .select('*');
      
      // Then get all deliveries with 'shipped' status
      const { data: shippedDeliveries } = await supabaseAdmin
        .from('supplier_deliveries')
        .select('item_name, source, destination, supplier_id, suppliers(name)')
        .eq('delivery_status', 'in_transit');
      
      // Filter samples that match item names in shipped deliveries
      if (allSamples && shippedDeliveries) {
        samples = [];
        
        for (const sample of allSamples) {
          const sampleFullName = `${sample.category} - ${sample.item}`;
          const matchingDelivery = shippedDeliveries.find(d => d.item_name === sampleFullName);
          
          if (matchingDelivery) {
            // Add source and destination info to the sample
            samples.push({
              ...sample,
              source: matchingDelivery.source || '',
              destination: matchingDelivery.destination || '',
              supplier_name: matchingDelivery.suppliers?.name || '',
              delivery_id: matchingDelivery.id
            });
          }
        }
      } else {
        samples = [];
      }
    } else {
      // For MySQL
      samples = await executeQuery<any[]>({
        query: `
          SELECT s.*, d.source, d.destination, d.id as delivery_id, sup.name as supplier_name
          FROM samples_item s
          JOIN supplier_deliveries d ON CONCAT(s.category, ' - ', s.item) = d.item_name
          LEFT JOIN suppliers sup ON d.supplier_id = sup.id
          WHERE d.delivery_status = 'in_transit'
        `,
      });
    }
    
    return res.status(200).json({
      samples,
    });
  } catch (error) {
    console.error('Error fetching shipped samples:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}