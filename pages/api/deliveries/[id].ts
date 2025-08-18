import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);
  const { id } = req.query;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "PUT":
      return updateDelivery(req, res, user, id as string);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

async function updateDelivery(req: NextApiRequest, res: NextApiResponse, user: any, id: string) {
  try {
    const { delivery_status, actual_delivery_date, notes } = req.body;

    if (!delivery_status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const updateData: any = {
      delivery_status,
      notes
    };

    if (actual_delivery_date) {
      updateData.actual_delivery_date = actual_delivery_date;
    }

    const delivery = await executeQuery<any[]>({
      table: "public.supplier_deliveries",
      action: "update",
      data: updateData,
      filters: { id: parseInt(id) },
    });

    return res.status(200).json({ delivery: delivery[0] });
  } catch (error) {
    console.error("Error updating delivery:", error);
    return res.status(500).json({ message: "Server error" });
  }
}