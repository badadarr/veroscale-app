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
    // Query using Supabase format with record_id
    const record = await executeQuery<any>({
      table: "weight_records",
      action: "select",
      columns: `
        *,
        samples_item!weight_records_sample_id_fkey(id, category, item),
        users!weight_records_user_id_fkey(name),
        approved_by:users(name)
      `,
      filters: { record_id: id },
      single: true,
    });

    if (!record) {
      return res.status(404).json({ message: "Weight record not found" });
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

    // First check if record exists - use record_id instead of id
    const existingRecord = await executeQuery<any>({
      table: "weight_records",
      action: "select",
      columns: "*",
      filters: { record_id: id },
      single: true,
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Weight record not found" });
    }

    // Update record using Supabase table API
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

    await executeQuery({
      table: "weight_records",
      action: "update",
      data: updateData,
      filters: { record_id: id },
    });

    // Fetch the updated record with related data
    const record = await executeQuery<any>({
      table: "weight_records",
      action: "select",
      columns: `
        *,
        samples_item!weight_records_sample_id_fkey(id, category, item),
        users!weight_records_user_id_fkey(name),
        approved_by:users(name)
      `,
      filters: { record_id: id },
      single: true,
    });

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

    // First check if record exists - use record_id
    const existingRecord = await executeQuery<any>({
      table: "weight_records",
      action: "select",
      columns: "*",
      filters: { record_id: id },
      single: true,
    });

    if (!existingRecord) {
      return res.status(404).json({ message: "Weight record not found" });
    }

    // Delete record using Supabase table API
    await executeQuery({
      table: "weight_records",
      action: "delete",
      filters: { record_id: id },
    });

    return res.status(200).json({
      message: "Weight record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting weight record:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
