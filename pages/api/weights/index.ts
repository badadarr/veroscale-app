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
    case "DELETE":
      return deleteWeightRecords(req, res, user);
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
      const filters: Record<string, any> = {};

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

      // Get weight records with basic info first
      const weightRecords = await executeQuery<any[]>({
        table: "public.weight_records",
        action: "select",
        columns: `
          record_id, 
          user_id, 
          item_id, 
          total_weight,
          timestamp, 
          status,
          approved_by,
          approved_at
        `,
        filters: filters,
        orderBy: "timestamp",
        orderDirection: "desc",
        limit: itemsPerPage,
        offset: offset,
      });

      // Get all items and users (simpler approach)
      const items = await executeQuery<any[]>({
        table: "public.samples_item",
        action: "select",
        columns: "id, category, item"
      });

      const users = await executeQuery<any[]>({
        table: "public.users",
        action: "select",
        columns: "id, name"
      });

      // Process the records to match the expected format
      records = weightRecords.map((record) => {
        const item = items.find(i => i.id === record.item_id);
        const user = users.find(u => u.id === record.user_id);
        
        return {
          ...record,
          item_name: item ? `${item.category} - ${item.item}` : `Sample Item ${record.item_id}`,
          user_name: user?.name || 'Unknown User',
          approved_by_name: null,
        };
      });

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

      // Records already ordered and paginated by query
    } else {
      // MySQL implementation - original code
      let query = `
        SELECT wr.record_id, wr.user_id, wr.item_id, wr.total_weight, wr.quantity, 
               wr.unit, wr.batch_number, wr.source, wr.destination, wr.notes,
               wr.variance_amount, wr.variance_percentage, wr.variance_status,
               wr.timestamp, wr.status, wr.approved_by, wr.approved_at,
               CONCAT(ri.category, ' - ', ri.item) as item_name, u.name as user_name, 
               approver.name as approved_by_name
        FROM weight_records wr
        LEFT JOIN samples_item ri ON wr.item_id = ri.id
        JOIN users u ON wr.user_id = u.id
        LEFT JOIN users approver ON wr.approved_by = approver.id
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
        "SELECT wr.*, ri.name as item_name, u.name as user_name, \n               approver.name as approved_by_name",
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
    const {
      item_id,
      delivery_id,
      item_name,
      total_weight,
      quantity,
      unit,
      batch_number,
      source,
      destination,
      notes,
      variance_amount,
      variance_percentage,
      variance_status,
      rfid_device_id,
      scan_time,
      operator_id,
    } = req.body;

    // For delivery-based entries, we need either item_id or delivery_id
    if (total_weight === undefined) {
      return res
        .status(400)
        .json({ message: "Total weight is required" });
    }

    // Handle delivery-based weight entry
    if (delivery_id && !item_id) {
      const useSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Get a sample item to use as reference (since we need item_id for the table)
      let sampleItem;
      if (useSupabase) {
        const samples = await executeQuery<any[]>({
          table: "public.samples_item",
          action: "select",
          columns: "id, category, item",
          limit: 1,
        });
        sampleItem = samples[0];
      } else {
        const samples = await executeQuery<any[]>({
          query: "SELECT id, category, item FROM samples_item LIMIT 1",
        });
        sampleItem = samples[0];
      }

      if (!sampleItem) {
        return res.status(500).json({ message: "No sample items found" });
      }

      let result;
      if (useSupabase) {
        result = await executeQuery<any>({
          table: "public.weight_records",
          action: "insert",
          data: {
            user_id: user.id,
            item_id: sampleItem.id,
            total_weight,
            status: "pending",
          },
          returning: "*",
        });
      } else {
        result = await executeQuery<any>({
          query: `
            INSERT INTO weight_records (user_id, item_id, total_weight, status, notes)
            VALUES (?, ?, ?, 'pending', ?)
          `,
          values: [user.id, sampleItem.id, total_weight, notes || ''],
        });
      }

      const newRecord = {
        record_id: useSupabase ? result[0].record_id : result.insertId,
        user_id: user.id,
        user_name: user.name,
        item_id: sampleItem.id,
        item_name: item_name || `${sampleItem.category} - ${sampleItem.item}`,
        total_weight,
        timestamp: new Date(),
        status: "pending",
        delivery_id,
        notes,
      };

      return res.status(201).json({
        message: "Delivery weight record added successfully",
        record: newRecord,
      });
    }

    // If RFID data is provided, handle it differently
    if (rfid_device_id && !item_id) {
      // Create a generic entry for RFID scan
      const rfidRecord = {
        user_id: operator_id || user.id,
        rfid_device_id,
        total_weight,
        unit: unit || "kg",
        source,
        destination,
        scan_time,
        status: "pending",
        timestamp: new Date(),
      };

      // For now, we'll store RFID entries as weight records with a special marker
      const useSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      let result;
      if (useSupabase) {
        // For RFID entries, we need a dummy item_id since it's required
        // Get the first available item as a placeholder
        const dummyItem = await executeQuery<any[]>({
          table: "public.samples_item",
          action: "select",
          columns: "id",
          limit: 1,
        });
        
        result = await executeQuery<any>({
          table: "public.weight_records",
          action: "insert",
          data: {
            user_id: rfidRecord.user_id,
            item_id: dummyItem[0]?.id || 1, // Use dummy item or fallback to 1
            total_weight: rfidRecord.total_weight,
            status: rfidRecord.status,
          },
          returning: "*",
        });
      } else {
        result = await executeQuery<any>({
          query: `
            INSERT INTO weight_records (user_id, item_id, total_weight, status)
            VALUES (?, 1, ?, 'pending')
          `,
          values: [
            rfidRecord.user_id,
            rfidRecord.total_weight,
          ],
        });
      }

      return res.status(201).json({
        message: "RFID weight record added successfully",
        record: {
          record_id: useSupabase ? result[0].record_id : result.insertId,
          user_id: rfidRecord.user_id,
          total_weight: rfidRecord.total_weight,
          unit: rfidRecord.unit,
          source: rfidRecord.source,
          destination: rfidRecord.destination,
          status: rfidRecord.status,
          timestamp: new Date(),
          item_name: "RFID Entry",
          rfid_device_id,
          scan_time,
        },
      });
    }

    if (!item_id && !delivery_id) {
      return res
        .status(400)
        .json({ message: "Item ID or Delivery ID is required" });
    }

    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let items;
    let result;

    if (useSupabase) {
      if (item_id) {
        // Check if item exists in samples_item table
        items = await executeQuery<any[]>({
          table: "public.samples_item",
          action: "select",
          columns: "*",
          filters: { id: item_id },
        });

        if (!items || items.length === 0) {
          return res.status(404).json({ message: "Item not found" });
        }
      } else {
        // Use first available sample item as fallback
        items = await executeQuery<any[]>({
          table: "public.samples_item",
          action: "select",
          columns: "*",
          limit: 1,
        });
      }

      // Insert weight record (only use columns that exist in the table)
      result = await executeQuery<any>({
        table: "public.weight_records",
        action: "insert",
        data: {
          user_id: user.id,
          item_id: item_id || items[0]?.id,
          total_weight,
          status: "pending",
        },
        returning: "*",
      });
    } else {
      // Original MySQL implementation
      if (item_id) {
        // Check if item exists
        items = await executeQuery<any[]>({
          query: "SELECT * FROM samples_item WHERE id = ?",
          values: [item_id],
        });

        if (!items || items.length === 0) {
          return res.status(404).json({ message: "Item not found" });
        }
      } else {
        // Use first available sample item as fallback
        items = await executeQuery<any[]>({
          query: "SELECT * FROM samples_item LIMIT 1",
        });
      }

      result = await executeQuery<any>({
        query: `
          INSERT INTO weight_records (user_id, item_id, total_weight, quantity, status, unit, batch_number, source, destination, notes, variance_amount, variance_percentage, variance_status)
          VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          user.id,
          item_id || items[0]?.id,
          total_weight,
          quantity || 1,
          unit || "kg",
          batch_number,
          source,
          destination,
          notes,
          variance_amount,
          variance_percentage,
          variance_status,
        ],
      });
    }

    const newRecord = {
      record_id: useSupabase ? result[0].record_id : result.insertId,
      user_id: user.id,
      user_name: user.name,
      item_id,
      item_name: `${items[0].category} - ${items[0].item}` || "Sample Item",
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

// Delete multiple weight records
async function deleteWeightRecords(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const { record_ids } = req.body;

    if (!record_ids || !Array.isArray(record_ids) || record_ids.length === 0) {
      return res.status(400).json({ message: "Record IDs array is required" });
    }

    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let deletedCount = 0;

    if (useSupabase) {
      // Delete records using Supabase with direct query
      const { supabaseAdmin } = await import("../../../lib/supabase.js");
      const { data, error } = await supabaseAdmin
        .from("weight_records")
        .delete()
        .in("record_id", record_ids)
        .select("record_id");
      
      if (error) throw error;
      deletedCount = data?.length || 0;
    } else {
      // Delete records using MySQL
      const placeholders = record_ids.map(() => '?').join(',');
      const result = await executeQuery<any>({
        query: `DELETE FROM weight_records WHERE record_id IN (${placeholders})`,
        values: record_ids,
      });
      deletedCount = result.affectedRows || 0;
    }

    return res.status(200).json({
      message: `Successfully deleted ${deletedCount} weight record(s)`,
      deleted_count: deletedCount,
    });
  } catch (error) {
    console.error("Error deleting weight records:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
