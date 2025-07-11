#!/usr/bin/env node

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  serverTimestamp,
} from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDwdYrP2FEYV2hAS1QrYEcjXDJqcvUI4WQ",
  authDomain: "timbangan-online-3cd46.firebaseapp.com",
  databaseURL:
    "https://timbangan-online-3cd46-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timbangan-online-3cd46",
  storageBucket: "timbangan-online-3cd46.firebasestorage.app",
  messagingSenderId: "200904460259",
  appId: "1:200904460259:web:4cebd33928a3190ac382d6",
  measurementId: "G-1N8YW11PM8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

async function simulateIoTData() {
  console.log("🚀 Starting IoT Data Simulation...");

  try {
    // Step 1: Authenticate first
    console.log("🔑 Authenticating with Firebase...");
    await signInAnonymously(auth);
    console.log("✅ Authentication successful");

    // Test 1: Write basic device structure
    console.log("📝 Creating device structure...");
    const deviceRef = ref(database, "devices/esp32_timbangan_001");
    await set(deviceRef, {
      device_id: "esp32_timbangan_001",
      name: "Timbangan Utama",
      status: "online",
      last_update: new Date().toISOString(),
      berat_terakhir: "0.00",
    });
    console.log("✅ Device structure created");

    // Test 2: Simulate weight data updates
    console.log("⚖️ Simulating weight updates...");
    for (let i = 0; i < 10; i++) {
      const weight = (Math.random() * 50 + 1).toFixed(2); // Random weight 1-50 kg
      const timestamp = new Date().toISOString();

      // Update weight
      const weightRef = ref(
        database,
        "devices/esp32_timbangan_001/berat_terakhir"
      );
      await set(weightRef, weight);

      // Update timestamp
      const timestampRef = ref(
        database,
        "devices/esp32_timbangan_001/last_update"
      );
      await set(timestampRef, timestamp);

      console.log(`   📊 Weight: ${weight} kg at ${timestamp}`);

      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Test 3: Create RFID test data
    console.log("🏷️ Creating RFID test data...");
    const rfidUsersRef = ref(database, "rfid_users");
    await set(rfidUsersRef, {
      user_001: {
        device_id: "RFID_001",
        nama: "Test User 1",
        waktu: new Date().toISOString(),
      },
      user_002: {
        device_id: "RFID_002",
        nama: "Test User 2",
        waktu: new Date().toISOString(),
      },
    });
    console.log("✅ RFID test data created");

    // Test 4: Test continuous weight monitoring
    console.log("🔄 Starting continuous weight monitoring (30 seconds)...");
    const startTime = Date.now();
    const duration = 30000; // 30 seconds

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        clearInterval(interval);
        console.log("✅ Monitoring complete");
        process.exit(0);
        return;
      }

      const weight = (Math.random() * 25 + 0.1).toFixed(2);
      const weightRef = ref(
        database,
        "devices/esp32_timbangan_001/berat_terakhir"
      );
      await set(weightRef, weight);

      console.log(
        `   🔄 Live weight: ${weight} kg (${Math.round(elapsed / 1000)}s)`
      );
    }, 3000); // Update every 3 seconds
  } catch (error) {
    console.error("❌ Simulation error:", error);
    process.exit(1);
  }
}

// Error handling
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\n👋 Simulation stopped by user");
  process.exit(0);
});

// Run simulation
simulateIoTData();
