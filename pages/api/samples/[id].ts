import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken, isManagerOrAdmin } from "../../../lib/auth";

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
    return res.status(400).json({ message: "Invalid sample ID" });
  }

  switch (req.method) {
    case "GET":
      return getSampleById(res, id);
    case "PUT":
      return updateSample(req, res, id, user);
    case "DELETE":
      return deleteSample(res, id, user);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get sample by ID
async function getSampleById(res: NextApiResponse, id: string) {
  try {
    const sample = await executeQuery<any>({
      query: "SELECT * FROM samples_item WHERE id = ?",
      values: [id],
      single: true
    });

    if (!sample) {
      return res.status(404).json({ message: "Sample not found" });
    }

    return res.status(200).json(sample);
  } catch (error) {
    console.error("Error fetching sample:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update sample
async function updateSample(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  user: any
) {
  try {
    // Only managers and admins can update samples
    if (!isManagerOrAdmin(user)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { category, item, sample_weight } = req.body;

    if (!category || !item || sample_weight === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if sample exists
    const existingSample = await executeQuery<any>({
      query: "SELECT * FROM samples_item WHERE id = ?",
      values: [id],
      single: true
    });

    if (!existingSample) {
      return res.status(404).json({ message: "Sample not found" });
    }

    // Update the sample
    await executeQuery({
      query: `
        UPDATE samples_item
        SET category = ?, item = ?, sample_weight = ?
        WHERE id = ?
      `,
      values: [category, item, sample_weight, id],
    });

    return res.status(200).json({
      message: "Sample updated successfully",
      sample: {
        id: parseInt(id),
        category,
        item,
        sample_weight,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating sample:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Delete sample
async function deleteSample(res: NextApiResponse, id: string, user: any) {
  try {
    // Only managers and admins can delete samples
    if (!isManagerOrAdmin(user)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if sample exists
    const existingSample = await executeQuery<any>({
      query: "SELECT * FROM samples_item WHERE id = ?",
      values: [id],
      single: true
    });

    if (!existingSample) {
      return res.status(404).json({ message: "Sample not found" });
    }

    // Delete the sample
    await executeQuery({
      query: "DELETE FROM samples_item WHERE id = ?",
      values: [id],
    });

    return res.status(200).json({ message: "Sample deleted successfully" });
  } catch (error) {
    console.error("Error deleting sample:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
