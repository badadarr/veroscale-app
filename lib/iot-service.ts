import { database, ref, onValue, ensureAuth } from "./firebase";

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
      ref: import("firebase/database").DatabaseReference;
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
        const weightRef = ref(database, `devices/${deviceId}/current`);
        const unsubscribe = onValue(
          weightRef,
          (snapshot) => {
            const currentData = snapshot.val();
            if (currentData) {
              callback({
                weight: currentData.weight,
                timestamp: currentData.timestamp,
                device_id: currentData.device_id,
              });
            }
          },
          (error) => {
            console.error("IoT Weight subscription error:", error);
          }
        );

        const key = `weight_${deviceId}`;
        this.listeners.set(key, { ref: weightRef, unsubscribe });
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
    return new Promise((resolve) => {
      const weightRef = ref(database, `devices/${deviceId}/current`);
      onValue(
        weightRef,
        (snapshot) => {
          const currentData = snapshot.val();
          resolve(
            currentData
              ? {
                  weight: currentData.weight,
                  timestamp: currentData.timestamp,
                  device_id: currentData.device_id,
                }
              : null
          );
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
