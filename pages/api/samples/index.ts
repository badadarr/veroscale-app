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
      return getSamples(req, res);
    case "POST":
      return addSample(req, res, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all samples with filtering and pagination
async function getSamples(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, item, page = "1", limit = "10" } = req.query;
    const currentPage = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `SELECT *, sample_weight as expected_weight FROM samples_item WHERE 1=1`;
    const queryParams: any[] = [];

    if (category) {
      query += ` AND category LIKE ?`;
      queryParams.push(`%${category}%`);
    }

    if (item) {
      query += ` AND item LIKE ?`;
      queryParams.push(`%${item}%`);
    }

    // Status filter removed since the column doesn't exist in Supabase
    // if (status) {
    //   query += ` AND status = ?`;
    //   queryParams.push(status);
    // }

    // Get total count for pagination
    const countQuery = query.replace(
      "SELECT *, sample_weight as expected_weight",
      "SELECT COUNT(*)"
    );
    console.log("🔍 Count Query:", countQuery);
    console.log("🔍 Count Params:", queryParams);
    const countResult = await executeQuery<any[]>({
      query: countQuery,
      values: queryParams,
    });

    console.log("🔍 Count Result:", countResult);
    const totalItems = countResult[0]?.count || 0;
    console.log("🔍 Total Items:", totalItems);

    // Add pagination to main query
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(itemsPerPage, offset);

    console.log("🔍 Main Query:", query);
    console.log("🔍 Main Params:", queryParams);
    const samples = await executeQuery<any[]>({
      query,
      values: queryParams,
    });

    console.log("🔍 Samples Result:", samples.length, "items");
    console.log("🔍 First Sample:", samples[0]);

    // Ensure expected_weight is present in each sample
    const samplesWithExpectedWeight = samples.map((sample) => ({
      ...sample,
      expected_weight: sample.expected_weight || sample.sample_weight || 0,
    }));

    return res.status(200).json({
      samples: samplesWithExpectedWeight,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
      },
    });
  } catch (error) {
    console.error("Error fetching samples:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Add a new sample
async function addSample(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Only admin can add samples (manager is read-only)
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { category, item, sample_weight } = req.body;

    if (!category || !item || sample_weight === undefined) {
      return res
        .status(400)
        .json({ message: "Category, item, and sample weight are required" });
    }

    // Insert new sample without status field
    const result = await executeQuery<any>({
      query: `
        INSERT INTO samples_item (category, item, sample_weight)
        VALUES (?, ?, ?)
      `,
      values: [category, item, sample_weight],
    });

    const newSample = {
      id: result.insertId,
      category,
      item,
      sample_weight,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return res
      .status(201)
      .json({ message: "Sample added successfully", sample: newSample });
  } catch (error) {
    console.error("Error adding sample:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
