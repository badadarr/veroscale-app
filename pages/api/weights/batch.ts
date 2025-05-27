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

  // Only allow POST method for batch operations
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return addBatchWeightRecords(req, res, user);
}

// Add a batch of weight records
async function addBatchWeightRecords(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const { item_id, batch_items, unit, batch_number, source, destination } =
      req.body;

    if (
      !item_id ||
      !batch_items ||
      !Array.isArray(batch_items) ||
      batch_items.length === 0
    ) {
      return res.status(400).json({
        message: "Item ID and at least one batch item are required",
      });
    }

    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let items;
    let insertedRecords = [];

    // First, check if the item exists
    if (useSupabase) {
      items = await executeQuery<any[]>({
        table: "public.ref_items",
        action: "select",
        columns: "*",
        filters: { id: item_id },
      });

      if (!items || items.length === 0) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Insert each batch item as a separate record
      for (const batchItem of batch_items) {
        const result = await executeQuery<any>({
          table: "public.weight_records",
          action: "insert",
          data: {
            user_id: user.id,
            item_id,
            total_weight: batchItem.weight,
            status: "pending",
            batch_number,
            source,
            destination,
            notes: batchItem.note,
          },
          returning: "*",
        });

        insertedRecords.push({
          record_id: result[0].record_id,
          user_id: user.id,
          user_name: user.name,
          item_id,
          item_name: items[0].name,
          total_weight: batchItem.weight,
          timestamp: new Date(),
          status: "pending",
          batch_number,
          source,
          destination,
          notes: batchItem.note,
        });
      }
    } else {
      // MySQL implementation
      items = await executeQuery<any[]>({
        query: "SELECT * FROM ref_items WHERE id = ?",
        values: [item_id],
      });

      if (!items || items.length === 0) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Insert each batch item as a separate record
      for (const batchItem of batch_items) {
        const result = await executeQuery<any>({
          query: `
            INSERT INTO weight_records 
            (user_id, item_id, total_weight, status, batch_number, source, destination, notes)
            VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
          `,
          values: [
            user.id,
            item_id,
            batchItem.weight,
            batch_number || null,
            source || null,
            destination || null,
            batchItem.note || null,
          ],
        });

        insertedRecords.push({
          id: result.insertId,
          user_id: user.id,
          user_name: user.name,
          item_id,
          item_name: items[0].name,
          total_weight: batchItem.weight,
          timestamp: new Date(),
          status: "pending",
          batch_number,
          source,
          destination,
          notes: batchItem.note,
        });
      }
    }

    return res.status(201).json({
      message: `${insertedRecords.length} weight records added successfully`,
      records: insertedRecords,
    });
  } catch (error) {
    console.error("Error adding batch weight records:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
