import {
  database,
  ref,
  onValue,
  ensureAuth,
  query,
  orderByChild,
  limitToLast,
} from "./firebase";

export interface IoTWeightData {
  weight: string;
  timestamp: number;
  device_id: string;
}

export interface AuthorizedUser {
  authorized: boolean;
  name: string;
}

export interface RFIDUser {
  active: boolean;
  created_at: string;
  device_id: string;
  email: string;
  name: string;
  uid: string;
  waktu?: string; // Add optional waktu property
}

export interface RFIDRequest {
  uid?: string;
  rfid?: string;
  timestamp?: string;
  device_id?: string;
}

export interface DeviceData {
  current: {
    device_id: string;
    timestamp: number;
    weight: string;
  };
  history?: Record<string, unknown>; // History data structure can be expanded as needed
}

export class IoTService {
  private static instance: IoTService;
  private listeners: Map<
    string,
    {
      ref:
        | import("firebase/database").Query
        | import("firebase/database").DatabaseReference;
      unsubscribe: () => void;
    }
  > = new Map();

  static getInstance(): IoTService {
    if (!IoTService.instance) {
      IoTService.instance = new IoTService();
    }
    return IoTService.instance;
  }

  // Listen to real-time weight data from ESP32
  subscribeToWeightData(
    deviceId: string,
    callback: (data: IoTWeightData) => void
  ) {
    // Ensure authentication before subscribing
    ensureAuth()
      .then(() => {
        // Subscribe to current reading at devices/{deviceId}/current (single object)
        const currentRef = ref(database, `devices/${deviceId}/current`);
        const unsubscribeCurrent = onValue(
          currentRef,
          (snapshot) => {
            type CurrentEntry = {
              weight: string | number;
              timestamp: number;
              device_id?: string;
            } | null;
            const data = snapshot.val() as CurrentEntry;
            if (!data) return;
            const weightStr =
              typeof data.weight === "number"
                ? String(data.weight)
                : data.weight;
            if (weightStr == null) return;
            callback({
              weight: weightStr,
              timestamp:
                typeof data.timestamp === "number"
                  ? data.timestamp
                  : Date.now(),
              device_id: data.device_id ?? deviceId,
            });
          },
          (error) => {
            console.error("IoT Weight subscription error:", error);
          }
        );

        // Compatibility fallback: some devices still write to berat_terakhir (string)
        const legacyRef = ref(database, `devices/${deviceId}/berat_terakhir`);
        const unsubscribeLegacy = onValue(
          legacyRef,
          (snapshot) => {
            const legacyWeight = snapshot.val() as string | number | null;
            if (legacyWeight == null) return;
            const weightStr =
              typeof legacyWeight === "number"
                ? String(legacyWeight)
                : legacyWeight;
            callback({
              weight: weightStr,
              timestamp: Date.now(),
              device_id: deviceId,
            });
          },
          (error) => {
            console.error("IoT legacy weight subscription error:", error);
          }
        );

        const key = `weight_${deviceId}`;
        this.listeners.set(key, {
          ref: currentRef,
          unsubscribe: () => {
            unsubscribeCurrent();
            unsubscribeLegacy();
          },
        });
      })
      .catch((error) => {
        console.error("Auth failed for weight subscription:", error);
      });

    return () => this.unsubscribe(`weight_${deviceId}`);
  }

  // Listen to authorized users
  subscribeToAuthorizedUsers(
    callback: (users: Record<string, AuthorizedUser>) => void
  ) {
    const authorizedRef = ref(database, "authorized_users");
    const unsubscribe = onValue(authorizedRef, (snapshot) => {
      const users = snapshot.val();
      if (users) {
        callback(users);
      }
    });

    const key = "authorized_users";
    this.listeners.set(key, { ref: authorizedRef, unsubscribe });
    return () => this.unsubscribe(key);
  }

  // Listen to RFID requests
  subscribeToRFIDRequests(
    callback: (requests: Record<string, string>) => void
  ) {
    const requestsRef = ref(database, "rfid_requests");
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const requests = snapshot.val();
      if (requests) {
        callback(requests);
      }
    });

    const key = "rfid_requests";
    this.listeners.set(key, { ref: requestsRef, unsubscribe });
    return () => this.unsubscribe(key);
  }

  // authorization_requests support removed per requirement; use rfid_requests instead

  // Listen to RFID users
  subscribeToRFIDUsers(callback: (users: Record<string, RFIDUser>) => void) {
    const rfidRef = ref(database, "rfid_users");
    const unsubscribe = onValue(rfidRef, (snapshot) => {
      const users = snapshot.val();
      if (users) {
        callback(users);
      }
    });

    const key = "rfid_users";
    this.listeners.set(key, { ref: rfidRef, unsubscribe });
    return () => this.unsubscribe(key);
  }

  // Get all RFID requests
  async getAllRFIDRequests(): Promise<Record<string, string> | null> {
    return new Promise((resolve) => {
      const requestsRef = ref(database, "rfid_requests");
      onValue(
        requestsRef,
        (snapshot) => {
          const requests = snapshot.val();
          resolve(requests || null);
        },
        { onlyOnce: true }
      );
    });
  }

  // Check if user is authorized (legacy method - kept for compatibility)
  async checkUserAuthorization(rfidId: string): Promise<AuthorizedUser | null> {
    return new Promise((resolve) => {
      const userRef = ref(database, `authorized_users/${rfidId}`);
      onValue(
        userRef,
        (snapshot) => {
          const userData = snapshot.val();
          resolve(userData || null);
        },
        { onlyOnce: true }
      );
    });
  }

  // Get RFID user information by UID
  async getRFIDUser(uid: string): Promise<RFIDUser | null> {
    return new Promise((resolve) => {
      const userRef = ref(database, `rfid_users/${uid}`);
      onValue(
        userRef,
        (snapshot) => {
          const userData = snapshot.val();
          resolve(userData || null);
        },
        { onlyOnce: true }
      );
    });
  }

  // Get all active RFID users
  async getActiveRFIDUsers(): Promise<Record<string, RFIDUser> | null> {
    return new Promise((resolve) => {
      const usersRef = ref(database, "rfid_users");
      onValue(
        usersRef,
        (snapshot) => {
          const users = snapshot.val();
          if (users) {
            // Filter only active users
            const activeUsers = Object.fromEntries(
              Object.entries(users).filter(([, user]) => {
                return (user as RFIDUser).active === true;
              })
            );
            resolve(activeUsers as Record<string, RFIDUser>);
          } else {
            resolve(null);
          }
        },
        { onlyOnce: true }
      );
    });
  }

  // Check if RFID user is active and authorized
  async isUserActiveAndAuthorized(
    uid: string
  ): Promise<{ isActive: boolean; user: RFIDUser | null }> {
    const user = await this.getRFIDUser(uid);
    return {
      isActive: user ? user.active : false,
      user,
    };
  }

  // Get current weight data (one-time read)
  async getCurrentWeight(deviceId: string): Promise<IoTWeightData | null> {
    // Try current first; if missing, fall back to latest in history
    return new Promise((resolve) => {
      const currentRef = ref(database, `devices/${deviceId}/current`);
      onValue(
        currentRef,
        (snap) => {
          const cur = snap.val() as {
            weight?: string | number;
            timestamp?: number;
            device_id?: string;
          } | null;
          if (cur && cur.weight != null) {
            const weightStr =
              typeof cur.weight === "number" ? String(cur.weight) : cur.weight;
            resolve({
              weight: weightStr,
              timestamp:
                typeof cur.timestamp === "number" ? cur.timestamp : Date.now(),
              device_id: cur.device_id ?? deviceId,
            });
          } else {
            // Fallback to history
            const historyRef = ref(database, `devices/${deviceId}/history`);
            const latestQuery = query(
              historyRef,
              orderByChild("timestamp"),
              limitToLast(1)
            );
            onValue(
              latestQuery,
              (snapshot) => {
                type HistoryEntry = {
                  weight: string | number;
                  timestamp: number;
                  device_id?: string;
                };
                const val = snapshot.val() as Record<
                  string,
                  HistoryEntry
                > | null;
                if (!val) {
                  resolve(null);
                  return;
                }
                const data = Object.values(val)[0] as HistoryEntry;
                const weightStr =
                  typeof data.weight === "number"
                    ? String(data.weight)
                    : data.weight;
                resolve(
                  data
                    ? {
                        weight: weightStr,
                        timestamp: data.timestamp,
                        device_id: data.device_id ?? deviceId,
                      }
                    : null
                );
              },
              { onlyOnce: true }
            );
          }
        },
        { onlyOnce: true }
      );
      // Also attempt legacy path if both are missing
      onValue(
        ref(database, `devices/${deviceId}/berat_terakhir`),
        (legacySnap) => {
          const legacy = legacySnap.val() as string | number | null;
          if (legacy != null) {
            const weightStr =
              typeof legacy === "number" ? String(legacy) : legacy;
            resolve({
              weight: weightStr,
              timestamp: Date.now(),
              device_id: deviceId,
            });
          }
        },
        { onlyOnce: true }
      );
    });
  }

  // Unsubscribe from a specific listener
  unsubscribe(key: string) {
    const listener = this.listeners.get(key);
    if (listener) {
      listener.unsubscribe();
      this.listeners.delete(key);
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.listeners.forEach((listener) => {
      listener.unsubscribe();
    });
    this.listeners.clear();
  }
}

export default IoTService.getInstance();
