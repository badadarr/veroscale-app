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
      return getSuppliers(req, res);
    case "POST":
      return createSupplier(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

async function getSuppliers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10' } = req.query;
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let suppliers, totalItems;

    if (useSupabase) {
      const { supabaseAdmin } = await import("../../../lib/supabase.js");
      
      const { count } = await supabaseAdmin
        .from('suppliers')
        .select('*', { count: 'exact', head: true });
      
      const { data } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
      suppliers = data;
      totalItems = count || 0;
    } else {
      const countResult = await executeQuery<any[]>({
        query: "SELECT COUNT(*) as count FROM suppliers",
      });
      totalItems = countResult[0].count;

      suppliers = await executeQuery<any[]>({
        query: "SELECT * FROM suppliers ORDER BY created_at DESC LIMIT ? OFFSET ?",
        values: [itemsPerPage, offset],
      });
    }

    return res.status(200).json({ 
      suppliers,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      }
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createSupplier(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, contact_person, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const supplier = await executeQuery<any[]>({
      table: "public.suppliers",
      action: "insert",
      data: {
        name,
        contact_person,
        email,
        phone,
        address,
        status: 'active'
      },
    });

    return res.status(201).json({ supplier: supplier[0] });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return res.status(500).json({ message: "Server error" });
  }
}