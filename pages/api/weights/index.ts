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
      return getWeightRecords(req, res, user);
    case "POST":
      return addWeightRecord(req, res, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all weight records with filtering and pagination
async function getWeightRecords(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const {
      sample_id,
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

    let totalItems = 0;
    let records: any[] = [];

    // Build filters for weight_records query using sample_id instead of item_id
    let query = "SELECT * FROM weight_records WHERE 1=1";
    const queryParams: any[] = [];

    // Role-based filtering: operators can only see their own records
    if (user.role === "operator") {
      query += ` AND user_id = ?`;
      queryParams.push(user.id);
    } else if (user_id) {
      // For admin/manager, allow filtering by user_id if specified
      query += ` AND user_id = ?`;
      queryParams.push(user_id);
    }

    if (sample_id) {
      query += ` AND sample_id = ?`;
      queryParams.push(sample_id);
    }

    if (status) {
      query += ` AND status = ?`;
      queryParams.push(status);
    }

    if (startDate) {
      query += ` AND timestamp >= ?`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= ?`;
      queryParams.push(endDate);
    }

    // Get total count for pagination
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as count");
    const countResult = await executeQuery<any[]>({
      query: countQuery,
      values: queryParams,
    });

    // Handle different possible count result structures
    if (
      Array.isArray(countResult) &&
      countResult.length > 0 &&
      countResult[0]
    ) {
      totalItems = countResult[0].count || 0;
    } else if (
      countResult &&
      typeof countResult === "object" &&
      "count" in countResult
    ) {
      totalItems = (countResult as any).count || 0;
    } else {
      console.warn("Unexpected count result structure:", countResult);
      totalItems = 0;
    }

    // Add pagination to main query
    query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    queryParams.push(itemsPerPage, offset);

    // Get weight records
    const weightRecords = await executeQuery<any[]>({
      query,
      values: queryParams,
    });

    // Get all samples for sample name lookup
    const samples = await executeQuery<any[]>({
      query: "SELECT id, category, item FROM samples_item",
    });

    // Get all users for user name and approver lookup
    const users = await executeQuery<any[]>({
      query: "SELECT id, name FROM users",
    });

    // Create lookup maps
    const sampleMap = Array.isArray(samples)
      ? samples.reduce((map, sample) => {
          map[sample.id] = `${sample.category} - ${sample.item}`;
          return map;
        }, {} as Record<number, string>)
      : {};

    const userMap = Array.isArray(users)
      ? users.reduce((map, user) => {
          map[user.id] = user.name;
          return map;
        }, {} as Record<number, string>)
      : {};

    // Add related data to weight records
    records = Array.isArray(weightRecords)
      ? weightRecords.map((record) => ({
          id: record.record_id, // Use record_id as id for consistency
          record_id: record.record_id,
          user_id: record.user_id,
          sample_id: record.sample_id,
          total_weight: record.total_weight,
          timestamp: record.timestamp,
          status: record.status,
          source: record.source,
          destination: record.destination,
          notes: record.notes,
          unit: record.unit,
          approved_by: record.approved_by,
          approved_at: record.approved_at,
          created_at: record.created_at,
          item_name: sampleMap[record.sample_id] || "Unknown Sample",
          user_name: userMap[record.user_id] || "Unknown User",
          approved_by_name: record.approved_by
            ? userMap[record.approved_by] || "Unknown Approver"
            : null,
        }))
      : [];

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

// Add a new weight record (single entry with sample)
async function addWeightRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const { sample_id, total_weight, notes, source, destination, unit } =
      req.body;

    if (!sample_id || total_weight === undefined) {
      return res
        .status(400)
        .json({ message: "Sample ID and total weight are required" });
    }

    // Check if sample exists
    const samples = await executeQuery<any[]>({
      query: "SELECT * FROM samples_item WHERE id = ?",
      values: [sample_id],
    });

    if (!samples || samples.length === 0) {
      return res.status(404).json({ message: "Sample not found" });
    }

    const sample = samples[0];

    // Insert new weight record using samples
    const result = await executeQuery<any>({
      query: `
        INSERT INTO weight_records 
        (user_id, sample_id, total_weight, source, destination, notes, unit, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `,
      values: [
        user.id,
        sample_id,
        total_weight,
        source || null,
        destination || null,
        notes || null,
        unit || "kg",
        "pending",
      ],
      single: true,
    });

    const newRecord = {
      id: result.record_id,
      user_id: user.id,
      user_name: user.name,
      sample_id,
      sample_name: `${sample.category} - ${sample.item}`,
      total_weight,
      timestamp: result.created_at || new Date(),
      status: "pending",
      source: source || null,
      destination: destination || null,
      notes: notes || null,
      unit: unit || "kg",
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
