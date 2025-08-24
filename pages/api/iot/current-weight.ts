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

    // Freshness config: default 5 seconds; allow override via ?maxAgeMs=...
    const maxAgeMs = Math.max(
      0,
      Number.parseInt(String(req.query.maxAgeMs ?? 5000), 10) || 5000
    );
    const allowHistoryFallback =
      String(req.query.fallback || "").toLowerCase() === "history";

    const now = Date.now();
    const isFresh = (ts?: number | null) =>
      typeof ts === "number" && ts > 0 && now - ts <= maxAgeMs;

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

    // If no current data or it's stale, optionally fall back to latest in history
    if (
      !currentData ||
      currentData.weight == null ||
      !isFresh(currentData.timestamp ?? null)
    ) {
      if (allowHistoryFallback) {
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
        const latest = latestObj ? Object.values(latestObj)[0] : null;
        if (latest && isFresh(latest.timestamp)) {
          currentData = {
            weight: latest.weight,
            timestamp: latest.timestamp,
            device_id: latest.device_id,
          };
        }
      }
    }

    // If we have a fresh reading, return it
    if (
      currentData &&
      currentData.weight != null &&
      isFresh(currentData.timestamp ?? null)
    ) {
      const weightValue = parseFloat(
        typeof currentData.weight === "number"
          ? String(currentData.weight)
          : currentData.weight
      );

      // Validate weight data
      if (isNaN(weightValue) || weightValue < 0) {
        return res.status(400).json({ message: "Invalid weight data" });
      }

      return res.status(200).json({
        weight: weightValue,
        device_id: currentData.device_id || deviceId,
        timestamp:
          typeof currentData.timestamp === "number"
            ? currentData.timestamp
            : now,
        is_valid: weightValue >= 0.01 && weightValue <= 1000,
      });
    }

    // No fresh data available
    return res.status(404).json({ message: "No fresh weight data" });
  } catch (error) {
    console.error("Error fetching current weight:", error);
    return res.status(500).json({ message: "Failed to fetch weight data" });
  }
}
