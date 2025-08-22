import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase.js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const columns = [
      { table: "weight_records", column: "total_weight" },
      { table: "weight_records", column: "iot_weight" },
      { table: "weight_records", column: "manager_weight" },
      { table: "weight_records", column: "weight_variance" },
      { table: "supplier_deliveries", column: "expected_weight" },
      { table: "samples_item", column: "expected_weight" },
    ];

    // Query information_schema to verify numeric scales
    const { data: schemaInfo, error: schemaError } = await supabaseAdmin
      .from("information_schema.columns")
      .select(
        "table_name,column_name,data_type,numeric_precision,numeric_scale"
      )
      .eq("table_schema", "public")
      .in("table_name", Array.from(new Set(columns.map((c) => c.table))))
      .in("column_name", Array.from(new Set(columns.map((c) => c.column))))
      .order("table_name")
      .order("column_name");

    if (schemaError) throw schemaError;

    // Get a few latest weights to inspect stored precision
    const { data: latestWeights, error: weightsError } = await supabaseAdmin
      .from("weight_records")
      .select("record_id,total_weight,iot_weight,timestamp")
      .order("timestamp", { ascending: false })
      .limit(5);

    if (weightsError) throw weightsError;

    return res.status(200).json({
      envSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      columns: schemaInfo,
      latest: latestWeights?.map((r: any) => ({
        record_id: r.record_id,
        total_weight_raw: r.total_weight,
        iot_weight_raw: r.iot_weight,
        total_weight_3dp:
          typeof r.total_weight === "number"
            ? r.total_weight.toFixed(3)
            : r.total_weight,
        iot_weight_3dp:
          typeof r.iot_weight === "number"
            ? r.iot_weight.toFixed(3)
            : r.iot_weight,
        timestamp: r.timestamp,
      })),
    });
  } catch (err) {
    console.error("/api/debug/weight-precision error:", err);
    return res.status(500).json({ message: "Debug query failed" });
  }
}
