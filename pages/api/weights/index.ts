/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";
import { withArcjetProtection } from "../../../lib/arcjet-middleware";
import {
  analyzeWeightVariance,
  VarianceAnalysis,
} from "../../../lib/weight-variance-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apply Arcjet protection for API endpoints
  const arcjetResult = await withArcjetProtection(req, res, "api");
  if (arcjetResult) return arcjetResult;

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
      return deleteWeightRecords(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all weight records with filtering and pagination
async function getWeightRecords(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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

      // Filter by user role - operators only see their own records
      if (user.role === "operator") {
        filters.user_id = user.id;
      }

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

      // Get weight records with columns that exist in the current Supabase schema
      const selectColumns = [
        "record_id",
        "user_id",
        "item_id",
        "total_weight",
        "timestamp",
        "status",
        "approved_by",
        "approved_at",
        "iot_weight",
        "manager_weight",
        "weight_variance",
        "weight_variance_percentage",
        "variance_status",
        "iot_device_id",
        "verification_required",
        "notes",
        "unit",
      ].join(", ");
      console.log("Selecting weight_records columns:", selectColumns);
      console.log("Applying filters:", filters);
      const weightRecords = await executeQuery<any[]>({
        table: "public.weight_records",
        action: "select",
        columns: selectColumns,
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
        // Avoid alias with adapter; map expected_weight in JS
        columns: "id, category, item, sample_weight",
      });

      const users = await executeQuery<any[]>({
        table: "public.users",
        action: "select",
        columns: "id, name",
      });

      // Helper: map new auto-approval statuses to legacy UI categories
      const mapVarianceStatusForUI = (status: string | null | undefined) => {
        if (!status) return null;
        switch (status) {
          case "auto_approved":
            return "normal"; // within threshold
          case "auto_rejected":
            return "critical"; // exceeded threshold
          case "pending_verification":
            return "warning"; // requires manual check
          default:
            return status; // keep legacy values
        }
      };

      // Process the records to match the expected format
      records = weightRecords.map((record) => {
        const item = items.find((i) => i.id === record.item_id);
        const user = users.find((u) => u.id === record.user_id);

        // Prefer precise IoT weight for display when present (DB total_weight may be 2dp)
        const displayTotalWeight =
          typeof record.iot_weight === "number" && record.iot_weight != null
            ? Math.round(record.iot_weight * 1000) / 1000
            : record.total_weight;

        return {
          ...record,
          // Override total_weight for UI to ensure 3dp precision when IoT data exists
          total_weight: displayTotalWeight,
          // Normalize variance status for UI compatibility
          variance_status: mapVarianceStatusForUI(record.variance_status),
          // Surface reason (stored in notes) for UI when needed
          variance_reason: record.notes || null,
          // Back-compat aliases used by some UI components
          variance_amount: record.weight_variance ?? null,
          variance_percentage: record.weight_variance_percentage ?? null,
          item_name: item
            ? `${item.category} - ${item.item}`
            : `Sample Item ${record.item_id}`,
          expected_weight: item?.sample_weight ?? null,
          user_name: user?.name || "Unknown User",
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
               wr.unit, wr.source, wr.destination, wr.notes,
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

      // Filter by user role - operators only see their own records
      if (user.role === "operator") {
        query += ` AND wr.user_id = ?`;
        queryParams.push(user.id);
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

      const rawRecords = await executeQuery<any[]>({
        query,
        values: queryParams,
      });

      const mapVarianceStatusForUI = (status: string | null | undefined) => {
        if (!status) return null;
        switch (status) {
          case "auto_approved":
            return "normal";
          case "auto_rejected":
            return "critical";
          case "pending_verification":
            return "warning";
          default:
            return status;
        }
      };

      records = rawRecords.map((r) => ({
        ...r,
        variance_status: mapVarianceStatusForUI(r.variance_status),
      }));
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

async function addWeightRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    // Keep numeric precision at 3 decimals consistently
    const to3dp = (n: unknown): number | null => {
      if (n === null || n === undefined) return null;
      if (typeof n === "string") {
        const normalized = n.replace(",", ".");
        const v = parseFloat(normalized);
        if (Number.isNaN(v)) return null;
        return Math.round(v * 1000) / 1000;
      }
      const v = Number(n);
      if (Number.isNaN(v)) return null;
      return Math.round(v * 1000) / 1000;
    };

    const {
      item_id,
      sample_id,
      delivery_id,
      item_name,
      total_weight,
      iot_weight,
      expected_weight,
      iot_device_id,
      quantity,
      unit,
      source,
      destination,
      notes,
      // client-provided variance inputs are ignored; server determines decisions
      rfid_device_id,
      scan_time,
      operator_id,
    } = req.body;

    // For weight entries, we need total_weight and either item_id, sample_id, or delivery_id
    if (total_weight === undefined) {
      return res.status(400).json({ message: "Total weight is required" });
    }

    // Determine IoT and expected weight values (rounded to 3dp)
    const totalWeight3dp = to3dp(total_weight);
    const iotWeightValue: number | null = to3dp(
      (iot_weight as any) ?? (total_weight as any) ?? null
    );
    const expectedWeightValue: number | null = to3dp(expected_weight as any);
    const totalForInsert: number | null = iotWeightValue ?? totalWeight3dp;

    console.log("[weights.add] incoming vs normalized", {
      total_weight,
      totalWeight3dp,
      iot_weight,
      iotWeightValue,
      expected_weight,
      expectedWeightValue,
    });

    // Compute server-side variance analysis
    let analysis: VarianceAnalysis | null = null;
    if (iotWeightValue !== null && expectedWeightValue !== null) {
      analysis = analyzeWeightVariance(iotWeightValue, expectedWeightValue);
    } else if (
      iotWeightValue !== null &&
      (expectedWeightValue === null || expectedWeightValue <= 0.1)
    ) {
      // If no expected weight or below min threshold, consider auto_approved
      analysis = {
        varianceKg: 0,
        variancePercentage: 0,
        status: "auto_approved",
        reason: "No expected weight or below minimum threshold",
        withinThreshold: true,
      };
    }

    // Calculate final status based on analysis: auto-reject for warning or critical
    let finalStatus = "pending";
    if (analysis) {
      finalStatus =
        analysis.status === "auto_approved" ? "approved" : "rejected";
    } else if (iotWeightValue === null) {
      finalStatus = "pending";
    }

    // Persist a clear reason for warning/critical into notes
    const reasonNote =
      analysis && analysis.status !== "auto_approved" ? analysis.reason : null;
    const combinedNotes =
      [reasonNote, notes].filter(Boolean).join(" | ") || null;

    // Handle sample-based weight entry with automatic variance checking
    if (sample_id) {
      const useSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      let result: any;
      if (useSupabase) {
        // Insert fields aligned with schema (include IoT + variance info)
        const varianceKg = analysis?.varianceKg ?? null;
        const variancePct = analysis?.variancePercentage ?? null;
        const vStatus = (() => {
          const s = analysis?.status;
          if (!s) return null;
          // Map auto_* to DB enum ('normal','warning','critical')
          if (s === "auto_approved") return "normal";
          if (s === "auto_rejected") return "critical";
          if (s === "pending") return "warning";
          return null;
        })();

        const inserted = await executeQuery<any>({
          table: "public.weight_records",
          action: "insert",
          data: {
            user_id: user.id,
            item_id: sample_id, // Using sample_id as item_id
            total_weight: totalForInsert,
            iot_weight: iotWeightValue ?? null,
            manager_weight: null,
            weight_variance: varianceKg,
            weight_variance_percentage: variancePct,
            variance_status: vStatus,
            iot_device_id: iot_device_id ?? null,
            verification_required: finalStatus === "pending",
            status: finalStatus,
            notes: combinedNotes,
            unit: unit || "kg",
          },
          returning: "*",
        });
        result = Array.isArray(inserted) ? inserted[0] : inserted;
        console.log("[weights.add] stored(sample)", {
          stored_total_weight: result?.total_weight,
          stored_iot_weight: result?.iot_weight,
        });
      } else {
        // Use original SQL for MySQL
        result = await executeQuery<any>({
          query: `
          INSERT INTO weight_records 
      (user_id, item_id, total_weight, status, notes, unit)
      VALUES (?, ?, ?, ?, ?, ?)
          `,
          values: [
            user.id,
            sample_id, // Using sample_id as item_id
            totalForInsert,
            finalStatus,
            combinedNotes,
            unit || "kg",
          ],
          single: true,
        });
      }

      // Get sample information for response
      // Get sample information for response (Supabase-compatible)
      const sampleRows = await executeQuery<any[]>({
        table: "public.samples_item",
        action: "select",
        columns: "category, item",
        filters: { id: sample_id },
        limit: 1,
      });
      const sample = sampleRows?.[0];

      // Update delivery status if delivery_id is provided
      if (delivery_id) {
        const useSupabase = Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        if (useSupabase) {
          const { supabaseAdmin } = await import("../../../lib/supabase.js");
          await supabaseAdmin
            .from("supplier_deliveries")
            .update({
              delivery_status: "delivered",
              actual_delivery_date: new Date().toISOString(),
            })
            .eq("id", delivery_id);
        } else {
          await executeQuery({
            query:
              "UPDATE supplier_deliveries SET delivery_status = 'delivered', actual_delivery_date = NOW() WHERE id = ?",
            values: [delivery_id],
          });
        }
      }

      // Prepare variance info for response
      const varianceInfo = analysis
        ? {
            variance: analysis.varianceKg,
            variancePercentage: analysis.variancePercentage,
            status: analysis.status,
            autoApproved: analysis.status === "auto_approved",
            reason: analysis.reason,
          }
        : null;

      const record = {
        id: result.record_id,
        user_id: user.id,
        user_name: user.name,
        sample_id,
        sample_name: sample
          ? `${sample.category} - ${sample.item}`
          : "Unknown Sample",
        total_weight: totalForInsert,
        iot_weight: iotWeightValue ?? null,
        expected_weight,
        iot_device_id,
        timestamp: result.timestamp || new Date(),
        status: finalStatus,
        variance: varianceInfo,
        variance_reason: analysis?.reason || null,
      };

      return res.status(201).json({
        message:
          finalStatus === "approved"
            ? "Weight record automatically approved"
            : finalStatus === "rejected"
            ? "Weight record automatically rejected"
            : "Weight record submitted for verification",
        record,
      });
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
            total_weight: totalForInsert,
            iot_weight: iotWeightValue ?? null,
            status: "pending",
            notes: combinedNotes,
          },
          returning: "*",
        });
      } else {
        result = await executeQuery<any>({
          query: `
            INSERT INTO weight_records (user_id, item_id, total_weight, status, notes)
            VALUES (?, ?, ?, 'pending', ?)
          `,
          values: [user.id, sampleItem.id, totalForInsert, combinedNotes || ""],
        });
      }

      const newRecord = {
        record_id: useSupabase ? result[0].record_id : result.insertId,
        user_id: user.id,
        user_name: user.name,
        item_id: sampleItem.id,
        item_name: item_name || `${sampleItem.category} - ${sampleItem.item}`,
        total_weight: totalForInsert,
        timestamp: new Date(),
        status: "pending",
        delivery_id,
        notes: combinedNotes,
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
            total_weight: totalForInsert,
            iot_weight: totalForInsert,
            iot_device_id: rfid_device_id,
            verification_required: true,
            status: rfidRecord.status,
            unit: rfidRecord.unit,
            notes: combinedNotes,
          },
          returning: "*",
        });
      } else {
        result = await executeQuery<any>({
          query: `
            INSERT INTO weight_records (user_id, item_id, total_weight, status)
            VALUES (?, 1, ?, 'pending')
          `,
          values: [rfidRecord.user_id, totalForInsert],
        });
      }

      return res.status(201).json({
        message: "RFID weight record added successfully",
        record: {
          record_id: useSupabase ? result[0].record_id : result.insertId,
          user_id: rfidRecord.user_id,
          total_weight: totalForInsert,
          unit: rfidRecord.unit,
          source: rfidRecord.source,
          destination: rfidRecord.destination,
          status: rfidRecord.status,
          timestamp: new Date(),
          item_name: "RFID Entry",
          rfid_device_id,
          scan_time,
          variance_reason: analysis?.reason || null,
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

      const varianceKg = analysis?.varianceKg ?? null;
      const variancePct = analysis?.variancePercentage ?? null;
      const vStatus = (() => {
        const s = analysis?.status;
        if (!s) return null;
        if (s === "auto_approved") return "normal";
        if (s === "auto_rejected") return "critical";
        if (s === "pending") return "warning";
        return null;
      })();

      result = await executeQuery<any>({
        table: "public.weight_records",
        action: "insert",
        data: {
          user_id: user.id,
          item_id: item_id || items[0]?.id,
          total_weight: totalForInsert,
          iot_weight: iotWeightValue ?? null,
          manager_weight: null,
          weight_variance: varianceKg,
          weight_variance_percentage: variancePct,
          variance_status: vStatus,
          iot_device_id: iot_device_id ?? null,
          verification_required: finalStatus === "pending",
          status: finalStatus,
          notes: combinedNotes,
          unit: unit || "kg",
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

      // Insert minimal fields for MySQL schema
      result = await executeQuery<any>({
        query: `
          INSERT INTO weight_records (
            user_id, item_id, total_weight, quantity, unit, source, destination, notes, status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          user.id,
          item_id || items[0]?.id,
          totalForInsert,
          quantity || 1,
          unit || "kg",
          source,
          destination,
          combinedNotes,
          finalStatus,
        ],
      });
    }

    const newRecord = {
      record_id: useSupabase ? result[0].record_id : result.insertId,
      user_id: user.id,
      user_name: user.name,
      item_id,
      item_name: `${items[0].category} - ${items[0].item}` || "Sample Item",
      total_weight: totalForInsert,
      timestamp: new Date(),
      status: finalStatus,
      variance_reason: analysis?.reason || null,
    };

    return res.status(201).json({
      message:
        finalStatus === "approved"
          ? "Weight record automatically approved"
          : finalStatus === "rejected"
          ? "Weight record automatically rejected"
          : "Weight record submitted for verification",
      record: newRecord,
    });
  } catch (error) {
    console.error("Error adding weight record:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete multiple weight records
async function deleteWeightRecords(req: NextApiRequest, res: NextApiResponse) {
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
      const placeholders = record_ids.map(() => "?").join(",");
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
