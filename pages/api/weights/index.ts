import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      return getWeightRecords(req, res);
    case "POST":
      return addWeightRecord(req, res, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all weight records with filtering and pagination
async function getWeightRecords(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      item_id,
      user_id,
      status,
      startDate,
      endDate,
      page = "1",
      limit = "10",
    } = req.query;

    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let totalItems = 0;
    let records: any[] = [];

    if (useSupabase) {
      // Supabase implementation
      let filters: Record<string, any> = {};

      if (item_id) filters.item_id = item_id;
      if (user_id) filters.user_id = user_id;
      if (status) filters.status = status;

      // Date filters handled differently in RPC call or custom query
      // Using direct query would be more efficient but for now we'll go with a simple approach

      // Get total count for pagination - this is a simple count of filtered records
      const countResult = await executeQuery<any[]>({
        table: "public.weight_records",
        action: "select",
        columns: "count(*)",
        filters: filters,
      });

      totalItems = countResult[0]?.count || 0;

      // Get the actual records with relation data
      records = await executeQuery<any[]>({
        table: "public.weight_records",
        action: "select",
        columns: `
          record_id, 
          user_id, 
          item_id, 
          total_weight, 
          timestamp, 
          status, 
          ref_items(name), 
          users(name)
        `,
        filters: filters,
      });

      // Process the records to match the expected format
      records = records.map((record) => ({
        ...record,
        item_name: record.ref_items?.name,
        user_name: record.users?.name,
      }));

      // Manual filtering for dates since we can't do it easily in the query
      if (startDate) {
        records = records.filter(
          (r) => new Date(r.timestamp) >= new Date(startDate as string)
        );
      }

      if (endDate) {
        records = records.filter(
          (r) => new Date(r.timestamp) <= new Date(endDate as string)
        );
      }

      // Manual sorting and pagination
      records.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      records = records.slice(offset, offset + itemsPerPage);
    } else {
      // MySQL implementation - original code
      let query = `
        SELECT wr.*, ri.name as item_name, u.name as user_name
        FROM weight_records wr
        JOIN ref_items ri ON wr.item_id = ri.id
        JOIN users u ON wr.user_id = u.id
        WHERE 1=1
      `;

      const queryParams: any[] = [];

      if (item_id) {
        query += ` AND wr.item_id = ?`;
        queryParams.push(item_id);
      }

      if (user_id) {
        query += ` AND wr.user_id = ?`;
        queryParams.push(user_id);
      }

      if (status) {
        query += ` AND wr.status = ?`;
        queryParams.push(status);
      }

      if (startDate) {
        query += ` AND wr.timestamp >= ?`;
        queryParams.push(startDate);
      }

      if (endDate) {
        query += ` AND wr.timestamp <= ?`;
        queryParams.push(endDate);
      }

      // Get total count for pagination
      const countQuery = query.replace(
        "SELECT wr.*, ri.name as item_name, u.name as user_name",
        "SELECT COUNT(*) as count"
      );
      const countResult = await executeQuery<any[]>({
        query: countQuery,
        values: queryParams,
      });

      totalItems = countResult[0].count;

      // Add pagination to main query
      query += ` ORDER BY wr.timestamp DESC LIMIT ? OFFSET ?`;
      queryParams.push(itemsPerPage, offset);

      records = await executeQuery<any[]>({
        query,
        values: queryParams,
      });
    }

    return res.status(200).json({
      records,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      },
    });
  } catch (error) {
    console.error("Error fetching weight records:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Add a new weight record
async function addWeightRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const { item_id, total_weight } = req.body;

    if (!item_id || total_weight === undefined) {
      return res
        .status(400)
        .json({ message: "Item ID and total weight are required" });
    }

    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let items;
    let result;

    if (useSupabase) {
      // Check if item exists using Supabase table API
      items = await executeQuery<any[]>({
        table: "public.ref_items",
        action: "select",
        columns: "*",
        filters: { id: item_id },
      });

      if (!items || items.length === 0) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Insert record using Supabase table API
      result = await executeQuery<any>({
        table: "public.weight_records",
        action: "insert",
        data: {
          user_id: user.id,
          item_id,
          total_weight,
          status: "pending",
        },
        returning: "*",
      });
    } else {
      // Original MySQL implementation
      // Check if item exists
      items = await executeQuery<any[]>({
        query: "SELECT * FROM ref_items WHERE id = ?",
        values: [item_id],
      });

      if (!items || items.length === 0) {
        return res.status(404).json({ message: "Item not found" });
      }

      result = await executeQuery<any>({
        query: `
          INSERT INTO weight_records (user_id, item_id, total_weight, status)
          VALUES (?, ?, ?, 'pending')
        `,
        values: [user.id, item_id, total_weight],
      });
    }

    const newRecord = {
      record_id: useSupabase ? result[0].record_id : result.insertId,
      user_id: user.id,
      user_name: user.name,
      item_id,
      item_name: items[0].name,
      total_weight,
      timestamp: new Date(),
      status: "pending",
    };

    return res.status(201).json({
      message: "Weight record added successfully",
      record: newRecord,
    });
  } catch (error) {
    console.error("Error adding weight record:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
