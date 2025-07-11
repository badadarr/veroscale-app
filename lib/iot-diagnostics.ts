import { database, ref, onValue, off } from "../lib/firebase";

class IoTDiagnostics {
  static async testFirebaseConnection() {
    console.log("🔍 Testing Firebase Connection...");

    try {
      const connectedRef = ref(database, ".info/connected");

      return new Promise((resolve) => {
        onValue(connectedRef, (snapshot) => {
          const connected = snapshot.val();
          console.log("✅ Firebase connected:", connected);
          resolve(connected);
        });
      });
    } catch (error) {
      console.error("❌ Firebase connection error:", error);
      return false;
    }
  }

  static async testDeviceData() {
    console.log("🔍 Testing Device Data...");

    try {
      const deviceRef = ref(database, "devices/esp32_timbangan_001");

      return new Promise((resolve) => {
        onValue(
          deviceRef,
          (snapshot) => {
            const data = snapshot.val();
            console.log("📊 Device data:", data);
            resolve(data);
          },
          { onlyOnce: true }
        );
      });
    } catch (error) {
      console.error("❌ Device data error:", error);
      return null;
    }
  }

  static async testWeightData() {
    console.log("🔍 Testing Weight Data...");

    try {
      const weightRef = ref(
        database,
        "devices/esp32_timbangan_001/berat_terakhir"
      );

      return new Promise((resolve) => {
        onValue(
          weightRef,
          (snapshot) => {
            const weight = snapshot.val();
            console.log("⚖️ Weight data:", weight);
            resolve(weight);
          },
          { onlyOnce: true }
        );
      });
    } catch (error) {
      console.error("❌ Weight data error:", error);
      return null;
    }
  }

  static async testRealTimeListener() {
    console.log("🔍 Testing Real-time Listener...");

    try {
      const weightRef = ref(
        database,
        "devices/esp32_timbangan_001/berat_terakhir"
      );
      let dataReceived = false;

      const testPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log("⏰ Listener timeout after 10 seconds");
          resolve(false);
        }, 10000);

        const unsubscribe = onValue(weightRef, (snapshot) => {
          console.log("🔄 Real-time data received:", snapshot.val());
          dataReceived = true;
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        });
      });

      return await testPromise;
    } catch (error) {
      console.error("❌ Real-time listener error:", error);
      return false;
    }
  }

  static async testDatabaseStructure() {
    console.log("🔍 Testing Database Structure...");

    try {
      const rootRef = ref(database, "/");

      return new Promise((resolve) => {
        onValue(
          rootRef,
          (snapshot) => {
            const data = snapshot.val();
            console.log("🏗️ Database structure:", Object.keys(data || {}));
            resolve(data);
          },
          { onlyOnce: true }
        );
      });
    } catch (error) {
      console.error("❌ Database structure error:", error);
      return null;
    }
  }

  static async runFullDiagnostics() {
    console.log("🚀 Starting IoT Diagnostics...\n");

    const results = {
      firebaseConnection: await this.testFirebaseConnection(),
      databaseStructure: await this.testDatabaseStructure(),
      deviceData: await this.testDeviceData(),
      weightData: await this.testWeightData(),
      realTimeListener: await this.testRealTimeListener(),
    };

    console.log("\n📋 Diagnostic Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      `Firebase Connection: ${results.firebaseConnection ? "✅" : "❌"}`
    );
    console.log(
      `Database Structure: ${results.databaseStructure ? "✅" : "❌"}`
    );
    console.log(`Device Data: ${results.deviceData ? "✅" : "❌"}`);
    console.log(`Weight Data: ${results.weightData !== null ? "✅" : "❌"}`);
    console.log(
      `Real-time Listener: ${results.realTimeListener ? "✅" : "❌"}`
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Recommendations
    if (!results.firebaseConnection) {
      console.log("🔧 REKOMENDASI: Cek koneksi internet dan Firebase config");
    }

    if (!results.deviceData) {
      console.log("🔧 REKOMENDASI: ESP32 tidak mengirim data atau path salah");
    }

    if (results.weightData === null) {
      console.log("🔧 REKOMENDASI: Data berat tidak ada, cek sensor di ESP32");
    }

    if (!results.realTimeListener) {
      console.log(
        "🔧 REKOMENDASI: Real-time listener tidak merespons, cek Firebase rules"
      );
    }

    return results;
  }
}

// For browser console usage
if (typeof window !== "undefined") {
  (window as any).IoTDiagnostics = IoTDiagnostics;
}

export default IoTDiagnostics;
