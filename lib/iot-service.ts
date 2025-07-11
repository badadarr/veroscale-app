import { database, ref, onValue, ensureAuth } from "./firebase";

export interface IoTWeightData {
  berat_terakhir: string;
  timestamp?: string;
}

export interface RFIDUser {
  device_id: string;
  nama?: string;
  waktu: string;
}

export interface RFIDRequest {
  device_id: string;
  waktu: string;
  processed?: boolean;
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
        const weightRef = ref(database, `devices/${deviceId}/berat_terakhir`);
        const unsubscribe = onValue(
          weightRef,
          (snapshot) => {
            const weight = snapshot.val();
            if (weight) {
              callback({
                berat_terakhir: weight,
                timestamp: new Date().toISOString(),
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

  // Listen to RFID user scans
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

  // Listen to RFID requests
  subscribeToRFIDRequests(
    callback: (requests: Record<string, RFIDRequest>) => void
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

  // Get unprocessed RFID requests
  async getUnprocessedRFIDRequests(): Promise<Record<
    string,
    RFIDRequest
  > | null> {
    return new Promise((resolve) => {
      const requestsRef = ref(database, "rfid_requests");
      onValue(
        requestsRef,
        (snapshot) => {
          const requests = snapshot.val();
          if (requests) {
            // Filter for unprocessed requests (you might want to add a 'processed' field to your data structure)
            const unprocessed = Object.fromEntries(
              Object.entries(requests).filter(([, request]) => {
                // Assuming requests without a 'processed' field are unprocessed
                return !(request as RFIDRequest).processed;
              })
            );
            resolve(unprocessed as Record<string, RFIDRequest>);
          } else {
            resolve(null);
          }
        },
        { onlyOnce: true }
      );
    });
  }

  // Mark RFID request as processed
  async markRFIDRequestProcessed(requestId: string): Promise<void> {
    const { set } = await import("firebase/database");
    const requestRef = ref(database, `rfid_requests/${requestId}/processed`);
    await set(requestRef, true);
  }

  // Get current weight data (one-time read)
  async getCurrentWeight(deviceId: string): Promise<IoTWeightData | null> {
    return new Promise((resolve) => {
      const weightRef = ref(database, `devices/${deviceId}/berat_terakhir`);
      onValue(
        weightRef,
        (snapshot) => {
          const weight = snapshot.val();
          resolve(
            weight
              ? {
                  berat_terakhir: weight,
                  timestamp: new Date().toISOString(),
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
