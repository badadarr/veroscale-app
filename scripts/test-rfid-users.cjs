#!/usr/bin/env node
/**
 * Simple test for RFID Users structure
 * Run with: node scripts/test-rfid-users.cjs
 */

const { initializeApp } = require("firebase/app");
const { getDatabase, ref, onValue, get } = require("firebase/database");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("🔥 Testing RFID Users Structure...");

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function testRFIDStructure() {
  try {
    console.log("\n📊 Testing accessible endpoints only...");

    // Test devices (known to work)
    console.log("\n1. Testing devices structure...");
    const deviceRef = ref(database, "devices/esp32_timbangan_001/current");
    const deviceSnapshot = await get(deviceRef);

    if (deviceSnapshot.exists()) {
      const currentData = deviceSnapshot.val();
      console.log("✅ Device current data:", currentData);
    }

    // Test rfid_requests
    console.log("\n2. Testing RFID requests...");
    const rfidRequestsRef = ref(database, "rfid_requests");

    try {
      const rfidSnapshot = await get(rfidRequestsRef);
      if (rfidSnapshot.exists()) {
        const requests = rfidSnapshot.val();
        console.log("✅ RFID requests found:", Object.keys(requests).length);
        console.log("Recent requests:", Object.entries(requests).slice(0, 3));
      } else {
        console.log("📭 No RFID requests found");
      }
    } catch (error) {
      console.log("❌ Cannot access rfid_requests:", error.message);
    }

    // Test rfid_users
    console.log("\n3. Testing RFID users...");
    const rfidUsersRef = ref(database, "rfid_users");

    try {
      const rfidUsersSnapshot = await get(rfidUsersRef);
      if (rfidUsersSnapshot.exists()) {
        const users = rfidUsersSnapshot.val();
        console.log("✅ RFID users found:", Object.keys(users).length);
        console.log("User UIDs:", Object.keys(users));

        // Show details of first user
        const firstUserId = Object.keys(users)[0];
        if (firstUserId) {
          const userDetails = users[firstUserId];
          console.log(`\nFirst user details (${firstUserId}):`);
          console.log("  Name:", userDetails.name);
          console.log("  Email:", userDetails.email);
          console.log("  Active:", userDetails.active);
          console.log("  Device ID:", userDetails.device_id);
          console.log("  Created at:", userDetails.created_at);
        }

        // Count active users
        const activeUsers = Object.values(users).filter(
          (user) => user.active === true
        );
        console.log(
          `\n📊 Active users: ${activeUsers.length}/${
            Object.keys(users).length
          }`
        );

        // Show all user names
        console.log("\n👥 All users:");
        Object.entries(users).forEach(([uid, user]) => {
          console.log(
            `  ${uid}: ${user.name} (${user.email}) - ${
              user.active ? "Active" : "Inactive"
            }`
          );
        });
      } else {
        console.log("📭 No RFID users found");
      }
    } catch (error) {
      console.log("❌ Cannot access rfid_users:", error.message);
    }

    console.log("\n🎉 RFID structure test completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

testRFIDStructure();
