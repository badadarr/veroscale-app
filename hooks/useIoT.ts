import { useState, useEffect, useCallback } from "react";
import IoTService, {
  IoTWeightData,
  AuthorizedUser,
  RFIDUser,
} from "@/lib/iot-service";

export interface IoTStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  currentWeight: number | null;
  deviceId: string;
}

export function useIoTWeight(deviceId: string = "esp32_timbangan_001") {
  const [status, setStatus] = useState<IoTStatus>({
    isConnected: false,
    lastUpdate: null,
    currentWeight: null,
    deviceId,
  });

  const [weightData, setWeightData] = useState<IoTWeightData | null>(null);

  useEffect(() => {
    const unsubscribe = IoTService.subscribeToWeightData(deviceId, (data) => {
      setWeightData(data);
      setStatus((prev) => ({
        ...prev,
        isConnected: true,
        lastUpdate: new Date(),
        currentWeight: parseFloat(data.weight),
      }));
    });

    // Connection timeout check
    const connectionTimer = setInterval(() => {
      setStatus((prev) => {
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
    return data ? parseFloat(data.weight) : null;
  }, [deviceId]);

  return {
    status,
    weightData,
    getCurrentWeight,
  };
}

export function useRFIDUsers() {
  const [authorizedUsers, setAuthorizedUsers] = useState<
    Record<string, AuthorizedUser>
  >({});
  const [rfidRequests, setRfidRequests] = useState<Record<string, string>>({});
  const [rfidUsers, setRfidUsers] = useState<Record<string, RFIDUser>>({});
  const [activeUsers, setActiveUsers] = useState<Record<string, RFIDUser>>({});

  useEffect(() => {
    const unsubscribeAuth = IoTService.subscribeToAuthorizedUsers(
      (userData) => {
        setAuthorizedUsers(userData);
      }
    );

    const unsubscribeRequests = IoTService.subscribeToRFIDRequests(
      (requestData) => {
        setRfidRequests(requestData);
      }
    );

    const unsubscribeUsers = IoTService.subscribeToRFIDUsers((userData) => {
      setRfidUsers(userData);

      // Filter active users
      const activeOnly = Object.fromEntries(
        Object.entries(userData).filter(([, user]) => user.active === true)
      );
      setActiveUsers(activeOnly);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRequests();
      unsubscribeUsers();
    };
  }, []);

  const checkUserAuthorization = useCallback(async (rfidId: string) => {
    return await IoTService.checkUserAuthorization(rfidId);
  }, []);

  const getRFIDUser = useCallback(async (uid: string) => {
    return await IoTService.getRFIDUser(uid);
  }, []);

  const isUserActiveAndAuthorized = useCallback(async (uid: string) => {
    return await IoTService.isUserActiveAndAuthorized(uid);
  }, []);

  const getRecentRequests = useCallback(
    (limit: number = 5) => {
      const entries = Object.entries(rfidRequests);
      return entries
        .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort by timestamp (descending)
        .slice(0, limit);
    },
    [rfidRequests]
  );

  const getActiveUsersList = useCallback(() => {
    return Object.entries(activeUsers).map(([uid, user]) => ({
      id: uid,
      ...user,
    }));
  }, [activeUsers]);

  const getUserByEmail = useCallback(
    (email: string) => {
      return Object.entries(rfidUsers).find(([, user]) => user.email === email);
    },
    [rfidUsers]
  );

  return {
    authorizedUsers,
    rfidRequests,
    rfidUsers,
    activeUsers,
    checkUserAuthorization,
    getRFIDUser,
    isUserActiveAndAuthorized,
    getRecentRequests,
    getActiveUsersList,
    getUserByEmail,
  };
}
