import { useState, useEffect, useCallback } from 'react';
import IoTService, { IoTWeightData, RFIDUser } from '@/lib/iot-service';

export interface IoTStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  currentWeight: number | null;
  deviceId: string;
}

export function useIoTWeight(deviceId: string = 'esp32_timbangan_001') {
  const [status, setStatus] = useState<IoTStatus>({
    isConnected: false,
    lastUpdate: null,
    currentWeight: null,
    deviceId
  });

  const [weightData, setWeightData] = useState<IoTWeightData | null>(null);

  useEffect(() => {
    const unsubscribe = IoTService.subscribeToWeightData(deviceId, (data) => {
      setWeightData(data);
      setStatus(prev => ({
        ...prev,
        isConnected: true,
        lastUpdate: new Date(),
        currentWeight: parseFloat(data.berat_terakhir)
      }));
    });

    // Connection timeout check
    const connectionTimer = setInterval(() => {
      setStatus(prev => {
        if (prev.lastUpdate && Date.now() - prev.lastUpdate.getTime() > 10000) {
          return { ...prev, isConnected: false };
        }
        return prev;
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionTimer);
    };
  }, [deviceId]);

  const getCurrentWeight = useCallback(async () => {
    const data = await IoTService.getCurrentWeight(deviceId);
    return data ? parseFloat(data.berat_terakhir) : null;
  }, [deviceId]);

  return {
    status,
    weightData,
    getCurrentWeight
  };
}

export function useRFIDUsers() {
  const [users, setUsers] = useState<Record<string, RFIDUser>>({});
  const [lastScan, setLastScan] = useState<RFIDUser | null>(null);

  useEffect(() => {
    const unsubscribe = IoTService.subscribeToRFIDUsers((userData) => {
      setUsers(userData);
      
      // Find most recent scan
      const userEntries = Object.entries(userData);
      if (userEntries.length > 0) {
        const mostRecent = userEntries.reduce((latest, [id, user]) => {
          const userTime = new Date(user.waktu).getTime();
          const latestTime = new Date(latest[1].waktu).getTime();
          return userTime > latestTime ? [id, user] : latest;
        });
        setLastScan(mostRecent[1]);
      }
    });

    return unsubscribe;
  }, []);

  const getRecentUsers = useCallback((limit: number = 5) => {
    const entries = Object.entries(users);
    return entries
      .sort(([,a], [,b]) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())
      .slice(0, limit);
  }, [users]);

  return {
    users,
    lastScan,
    getRecentUsers
  };
}