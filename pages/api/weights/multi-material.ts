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

    // Process each material entry
    for (const entry of material_entries) {
      const { materialId, weight, notes } = entry;

      if (!materialId || !weight) {
        return res.status(400).json({
          error: "Material ID and weight are required for each entry",
        });
      }      // Get material information
      const materialResult = await executeQuery<any[]>({
        query: "SELECT * FROM ref_items WHERE id = ?",
        values: [materialId],
      });

      if (!materialResult || materialResult.length === 0) {
        return res
          .status(404)
          .json({ error: `Material with ID ${materialId} not found` });
      }

      const material = materialResult[0];

      // Insert weight record
      const result = await executeQuery<any>({
        query: `
          INSERT INTO weight_records (item_id, total_weight, unit, batch_number, source, destination, notes, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
          RETURNING id
        `,
        values: [
          materialId,
          weight,
          unit,
          batch_number || null,
          source || null,
          destination || null,
          notes || null,
        ],
        single: true,
      });      if (result) {
        insertedRecords.push({
          id: result.id,
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
