import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db-adapter-adapter";

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
        return res
          .status(400)
          .json({
            error: "Material ID and weight are required for each entry",
          });
      }

      // Get material information using Supabase
      const materialResult = await executeQuery<any[]>({
        table: "materials",
        action: "select",
        conditions: { id: materialId },
      });

      if (!materialResult || materialResult.length === 0) {
        return res
          .status(404)
          .json({ error: `Material with ID ${materialId} not found` });
      }

      const material = materialResult[0];

      // Insert weight record using Supabase
      const result = await executeQuery<any[]>({
        table: "weight_records",
        action: "insert",
        data: {
          item_id: materialId,
          item_name: material.name,
          total_weight: weight,
          unit,
          batch_number: batch_number || null,
          source: source || null,
          destination: destination || null,
          notes: notes || null,
          status: "pending",
          timestamp: new Date().toISOString(),
        },
      });

      if (result) {
        insertedRecords.push({
          id: result[0]?.id,
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
