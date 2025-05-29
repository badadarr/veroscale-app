import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db-adapter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { material_entries, batch_number, source, destination } = req.body;
    const unit = "kg"; // Always use kg

    if (
      !material_entries ||
      !Array.isArray(material_entries) ||
      material_entries.length === 0
    ) {
      return res.status(400).json({ error: "Material entries are required" });
    }

    const insertedRecords = [];

    // Process and insert multiple records into weight_records
    for (const entry of material_entries) {
      const { materialId, weight, notes } = entry;

      if (!materialId || !weight) {
        return res.status(400).json({
          error: "Material ID and weight are required for each entry",
        });
      }

      // Fetch material information for each entry
      const material = await executeQuery<any>({
        table: "materials",
        action: "select",
        filters: { id: materialId },
        single: true,
      });

      if (!material) {
        return res
          .status(404)
          .json({ error: `Material with ID ${materialId} not found` });
      }

      // Insert record into weight_records
      const insertData = {
        item_id: materialId,
        total_weight: weight,
        unit,
        batch_number: batch_number || null,
        source: source || null,
        destination: destination || null,
        notes: notes || null,
        status: "pending",
        user_id: req.body.user_id,
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      const result = await executeQuery<any>({
        table: "weight_records",
        action: "insert",
        data: insertData,
        returning: "record_id, item_id",
      });

      if (result) {
        const recordId =
          result.record_id || (result[0] ? result[0].record_id : null);
        insertedRecords.push({
          id: recordId,
          materialId,
          materialName: material.name,
          weight,
          unit,
          notes,
        });
      }
    }

    res.status(201).json({
      message: "Multi-material records created successfully",
      records: insertedRecords,
      total_records: insertedRecords.length,
      total_weight: material_entries.reduce(
        (sum: number, entry: any) => sum + entry.weight,
        0
      ),
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to create multi-material records" });
  }
}
