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

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Invalid weight record ID" });
  }

  switch (req.method) {
    case "GET":
      return getWeightRecord(req, res, id);
    case "PUT":
      return updateWeightRecord(req, res, id, user);
    case "DELETE":
      return deleteWeightRecord(req, res, id, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get a single weight record by ID
async function getWeightRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let record;
    if (useSupabase) {
      // Supabase implementation
      const records = await executeQuery<any[]>({
        table: "public.weight_records",
        action: "select",        columns: `
          record_id, 
          user_id, 
          item_id, 
          total_weight, 
          timestamp, 
          status,
          approved_by,
          approved_at,
          ref_items(name), 
          users!weight_records_user_id_fkey(name),
          approver:users!fk_weight_records_approved_by(name)
        `,
        filters: { record_id: id },
      });

      if (records.length === 0) {
        return res.status(404).json({ message: "Weight record not found" });
      }      record = {
        ...records[0],
        item_name: records[0].ref_items?.name,
        user_name: records[0].users?.name,
        approved_by_name: records[0].approver?.name,
      };
    } else {      // MySQL implementation
      const records = await executeQuery<any[]>({
        query: `
          SELECT wr.*, ri.name as item_name, u.name as user_name,
                 approver.name as approved_by_name
          FROM weight_records wr
          JOIN ref_items ri ON wr.item_id = ri.id
          JOIN users u ON wr.user_id = u.id
          LEFT JOIN users approver ON wr.approved_by = approver.id
          WHERE wr.id = ?
        `,
        values: [id],
      });

      if (records.length === 0) {
        return res.status(404).json({ message: "Weight record not found" });
      }

      record = records[0];
    }

    return res.status(200).json({ record });
  } catch (error) {
    console.error("Error fetching weight record:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update a weight record
async function updateWeightRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  user: any
) {
  try {
    const { status } = req.body;

    // Validate status value
    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Only admin and manager can update status
    if (status && !["admin", "manager"].includes(user.role)) {
      return res.status(403).json({
        message: "Only administrators and managers can change approval status",
      });
    }

    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let record;

    if (useSupabase) {
      // First check if record exists
      const existingRecords = await executeQuery<any[]>({
        table: "public.weight_records",
        action: "select",
        columns: "*",
        filters: { record_id: id },
      });

      if (existingRecords.length === 0) {
        return res.status(404).json({ message: "Weight record not found" });
      }      // Update record using Supabase table API
      const updateData: Record<string, any> = {};

      if (status) {
        updateData.status = status;
        // Track approval information
        if (status === "approved") {
          updateData.approved_by = user.id; // User ID yang melakukan approval
          updateData.approved_at = new Date().toISOString();
        } else if (status === "pending" || status === "rejected") {
          // Set to null if status is changed back from approved
          updateData.approved_by = null;
          updateData.approved_at = null;
        }
      }

      const result = await executeQuery<any>({
        table: "public.weight_records",
        action: "update",
        data: updateData,
        filters: { record_id: id },
        returning: "*",
      });

      record = result[0];
    } else {
      // MySQL implementation
      // First check if record exists
      const existingRecords = await executeQuery<any[]>({
        query: "SELECT * FROM weight_records WHERE id = ?",
        values: [id],
      });

      if (existingRecords.length === 0) {
        return res.status(404).json({ message: "Weight record not found" });
      }      // Update the record
      let query = "UPDATE weight_records SET ";
      const queryParams: any[] = [];

      if (status) {
        query += "status = ?";
        queryParams.push(status);
        // Track approval information
        if (status === "approved") {
          query += ", approved_by = ?, approved_at = NOW()";
          queryParams.push(user.id); // User ID yang melakukan approval
        } else if (status === "pending" || status === "rejected") {
          // Set to null if status is changed back from approved
          query += ", approved_by = NULL, approved_at = NULL";
        }
      }

      query += " WHERE id = ?";
      queryParams.push(id);

      await executeQuery({
        query,
        values: queryParams,
      });      // Fetch the updated record
      const records = await executeQuery<any[]>({
        query: `
          SELECT wr.*, ri.name as item_name, u.name as user_name,
                 approver.name as approved_by_name
          FROM weight_records wr
          JOIN ref_items ri ON wr.item_id = ri.id
          JOIN users u ON wr.user_id = u.id
          LEFT JOIN users approver ON wr.approved_by = approver.id
          WHERE wr.id = ?
        `,
        values: [id],
      });

      record = records[0];
    }

    return res.status(200).json({
      message: "Weight record updated successfully",
      record,
    });
  } catch (error) {
    console.error("Error updating weight record:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete a weight record
async function deleteWeightRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  user: any
) {
  try {
    // Only admin can delete records
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Only administrators can delete weight records",
      });
    }

    // Check if we're using Supabase or MySQL implementation
    const useSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (useSupabase) {
      // First check if record exists
      const existingRecords = await executeQuery<any[]>({
        table: "public.weight_records",
        action: "select",
        columns: "*",
        filters: { record_id: id },
      });

      if (existingRecords.length === 0) {
        return res.status(404).json({ message: "Weight record not found" });
      }

      // Delete record using Supabase table API
      await executeQuery({
        table: "public.weight_records",
        action: "delete",
        filters: { record_id: id },
      });
    } else {
      // MySQL implementation
      // First check if record exists
      const existingRecords = await executeQuery<any[]>({
        query: "SELECT * FROM weight_records WHERE id = ?",
        values: [id],
      });

      if (existingRecords.length === 0) {
        return res.status(404).json({ message: "Weight record not found" });
      }

      // Delete the record
      await executeQuery({
        query: "DELETE FROM weight_records WHERE id = ?",
        values: [id],
      });
    }

    return res.status(200).json({
      message: "Weight record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting weight record:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
