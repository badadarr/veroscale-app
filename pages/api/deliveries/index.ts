import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (!user || !['admin', 'marketing', 'manager', 'operator'].includes(user.role)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      return getDeliveries(req, res);
    case "POST":
      return createDelivery(req, res, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

async function getDeliveries(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10' } = req.query;
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let deliveries, totalItems;

    if (useSupabase) {
      const { supabaseAdmin } = await import("../../../lib/supabase.js");
      
      const { count } = await supabaseAdmin
        .from('supplier_deliveries')
        .select('*', { count: 'exact', head: true });
      
      const { data } = await supabaseAdmin
        .from('supplier_deliveries')
        .select(`
          *,
          suppliers (name, contact_person),
          users!supplier_deliveries_marketing_user_id_fkey (name)
        `)
        .order('scheduled_date', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
      deliveries = data;
      totalItems = count || 0;
    } else {
      const countResult = await executeQuery<any[]>({
        query: "SELECT COUNT(*) as count FROM supplier_deliveries",
      });
      totalItems = countResult[0].count;

      deliveries = await executeQuery<any[]>({
        query: `
          SELECT sd.*, s.name as supplier_name, s.contact_person, u.name as marketing_user_name
          FROM supplier_deliveries sd
          JOIN suppliers s ON sd.supplier_id = s.id
          JOIN users u ON sd.marketing_user_id = u.id
          ORDER BY sd.scheduled_date DESC
          LIMIT ? OFFSET ?
        `,
        values: [itemsPerPage, offset],
      });
    }

    return res.status(200).json({ 
      deliveries,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      }
    });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createDelivery(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { supplier_id, item_name, expected_quantity, expected_weight, scheduled_date, notes } = req.body;

    if (!supplier_id || !item_name || !expected_quantity || !scheduled_date) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const delivery = await executeQuery<any[]>({
      table: "public.supplier_deliveries",
      action: "insert",
      data: {
        supplier_id,
        marketing_user_id: user.id,
        item_name,
        expected_quantity,
        expected_weight,
        scheduled_date,
        delivery_status: 'scheduled',
        notes
      },
    });

    return res.status(201).json({ delivery: delivery[0] });
  } catch (error) {
    console.error("Error creating delivery:", error);
    return res.status(500).json({ message: "Server error" });
  }
}