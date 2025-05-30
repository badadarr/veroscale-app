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
    const { weight_records, unit, batch_number, source, destination } =
      req.body;

    if (
      !weight_records ||
      !Array.isArray(weight_records) ||
      weight_records.length === 0
    ) {
      return res.status(400).json({
        message: "At least one weight record is required",
      });
    }

    let insertedRecords = [];

    // Insert each weight record as a separate record
    for (const weightRecord of weight_records) {
      const { sample_id, weight, notes } = weightRecord;

      if (!sample_id || weight === undefined || weight === null) {
        return res.status(400).json({
          message: "Sample ID and weight are required for each record",
        });
      }

      // First, check if the sample exists
      const samples = await executeQuery<any[]>({
        query: "SELECT * FROM samples_item WHERE id = ?",
        values: [sample_id],
      });

      if (!samples || samples.length === 0) {
        return res.status(404).json({
          message: `Sample with ID ${sample_id} not found`,
        });
      }      const sample = samples[0];
      const result = await executeQuery<any>({
        query: `
          INSERT INTO weight_records 
          (user_id, sample_id, total_weight, status, batch_number, source, destination, notes, unit)
          VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
          RETURNING *
        `,
        values: [
          user.id,
          sample_id,
          weight,
          batch_number || null,
          source || null,
          destination || null,
          notes || null,
          unit || "kg",
        ],
        single: true,
      });
      insertedRecords.push({
        id: result.record_id, // Gunakan record_id sebagai id untuk kompatibilitas
        user_id: user.id,
        user_name: user.name,
        sample_id,
        sample_name: `${sample.category} - ${sample.item}`,
        total_weight: weight,
        timestamp: result.created_at || new Date(),
        status: "pending",
        batch_number,
        source,
        destination,
        notes,
        unit: unit || "kg",
      });
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
