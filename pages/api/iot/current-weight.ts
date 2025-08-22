import { NextApiRequest, NextApiResponse } from "next";
import {
  database,
  ref,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "@/lib/firebase";
import { DataSnapshot } from "firebase/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const deviceId = (req.query.device as string) || "esp32_timbangan_001";
    // Try current reading first
    const currentRef = ref(database, `devices/${deviceId}/current`);
    const currentSnap = await new Promise<DataSnapshot>((resolve) => {
      onValue(currentRef, resolve, { onlyOnce: true });
    });
    let currentData = currentSnap.val() as {
      weight?: string | number;
      timestamp?: number;
      device_id?: string;
    } | null;

    // If no current data, fall back to latest in history
    if (!currentData || currentData.weight == null) {
      const historyRef = ref(database, `devices/${deviceId}/history`);
      const latestQuery = query(
        historyRef,
        orderByChild("timestamp"),
        limitToLast(1)
      );
      const snapshot = await new Promise<DataSnapshot>((resolve) => {
        onValue(latestQuery, resolve, { onlyOnce: true });
      });
      const latestObj = snapshot.val() as Record<
        string,
        { weight: string | number; timestamp: number; device_id?: string }
      > | null;
      currentData = latestObj
        ? (Object.values(latestObj)[0] as {
            weight?: string | number;
            timestamp?: number;
            device_id?: string;
          })
        : null;
    }

    if (currentData && currentData.weight != null) {
      const weightValue = parseFloat(
        typeof currentData.weight === "number"
          ? String(currentData.weight)
          : currentData.weight
      );

      // Validate weight data
      if (isNaN(weightValue) || weightValue < 0) {
        return res.status(400).json({ message: "Invalid weight data" });
      }

      res.status(200).json({
        weight: weightValue,
        device_id: currentData.device_id || deviceId,
        timestamp:
          typeof currentData.timestamp === "number"
            ? currentData.timestamp
            : Date.now(),
        is_valid: weightValue >= 0.01 && weightValue <= 1000,
      });
    } else {
      // Legacy fallback: berat_terakhir
      const legacyRef = ref(database, `devices/${deviceId}/berat_terakhir`);
      const legacySnap = await new Promise<DataSnapshot>((resolve) => {
        onValue(legacyRef, resolve, { onlyOnce: true });
      });
      const legacyVal = legacySnap.val() as string | number | null;
      if (legacyVal != null) {
        const weightValue = parseFloat(
          typeof legacyVal === "number" ? String(legacyVal) : legacyVal
        );
        if (!isNaN(weightValue) && weightValue >= 0) {
          return res.status(200).json({
            weight: weightValue,
            device_id: deviceId,
            timestamp: Date.now(),
            is_valid: weightValue >= 0.01 && weightValue <= 1000,
          });
        }
      }
      res.status(404).json({ message: "No weight data found" });
    }
  } catch (error) {
    console.error("Error fetching current weight:", error);
    res.status(500).json({ message: "Failed to fetch weight data" });
  }
}
