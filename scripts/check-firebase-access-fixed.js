#!/usr/bin/env node

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, get } from "firebase/database";
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

async function checkFirebaseAccess() {
  console.log("🔍 Checking Firebase Database Access...\n");

  try {
    // Step 1: Authenticate first
    console.log("🔑 Authenticating with Firebase...");
    await signInAnonymously(auth);
    console.log("✅ Authentication successful\n");
  } catch (error) {
    console.log("❌ Authentication failed:", error.message);
    console.log("   This might be why data access is failing\n");
  }

  const tests = [
    {
      name: "Connection Status",
      path: ".info/connected",
      description: "Test basic Firebase connection",
    },
    {
      name: "Root Access",
      path: "/",
      description: "Test root database access",
    },
    {
      name: "Devices Node",
      path: "devices",
      description: "Test devices node access",
    },
    {
      name: "ESP32 Device",
      path: "devices/esp32_timbangan_001",
      description: "Test specific device access",
    },
    {
      name: "Weight Data",
      path: "devices/esp32_timbangan_001/berat_terakhir",
      description: "Test weight data access",
    },
    {
      name: "RFID Users",
      path: "rfid_users",
      description: "Test RFID users access",
    },
  ];

  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      console.log(`   Path: ${test.path}`);
      console.log(`   Description: ${test.description}`);

      const snapshot = await get(ref(database, test.path));
      const data = snapshot.val();

      if (data !== null) {
        console.log(`   ✅ Success: Data found`);
        if (test.path === ".info/connected") {
          console.log(`   📡 Connected: ${data}`);
        } else if (typeof data === "object") {
          console.log(`   📊 Keys: ${Object.keys(data).join(", ")}`);
        } else {
          console.log(`   📄 Value: ${data}`);
        }
      } else {
        console.log(`   ⚠️ Warning: No data found (null)`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);

      if (error.code === "PERMISSION_DENIED") {
        console.log(`   🔒 Permission denied - check Firebase rules`);
      } else if (error.code === "NETWORK_ERROR") {
        console.log(`   🌐 Network error - check internet connection`);
      }
    }

    console.log(""); // Empty line
  }

  // Test real-time listener
  console.log("🔄 Testing Real-time Listener...");
  try {
    const weightRef = ref(
      database,
      "devices/esp32_timbangan_001/berat_terakhir"
    );

    const listenerPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Listener timeout after 5 seconds"));
      }, 5000);

      const unsubscribe = onValue(
        weightRef,
        (snapshot) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(snapshot.val());
        },
        (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      );
    });

    const result = await listenerPromise;
    console.log("   ✅ Real-time listener works");
    console.log(`   📊 Current value: ${result}`);
  } catch (error) {
    console.log("   ❌ Real-time listener failed");
    console.log(`   💥 Error: ${error.message}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 ANALYSIS RESULTS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Current Firebase Rules require authentication.");
  console.log("Anonymous authentication should now work.");
  console.log("");
  console.log("If still having issues, check:");
  console.log("1. Enable Anonymous Auth in Firebase Console");
  console.log("2. ESP32 should also authenticate before writing");
  console.log("3. Consider using Firebase Service Account for ESP32");

  process.exit(0);
}

// Error handling
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
  process.exit(1);
});

// Run checks
checkFirebaseAccess();
