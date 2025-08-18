#!/usr/bin/env node
/**
 * Test script to verify Firebase configuration and database structure
 * Run with: node scripts/test-new-firebase-config.js
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

console.log("🔥 Testing Firebase Configuration...");
console.log("Database URL:", firebaseConfig.databaseURL);

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function testDatabaseAccess() {
  try {
    console.log("\n📊 Testing database access...");

    // Test 1: Check authorized_users
    console.log("\n1. Testing authorized_users structure...");
    const authUsersRef = ref(database, "authorized_users");
    const authSnapshot = await get(authUsersRef);

    if (authSnapshot.exists()) {
      const authUsers = authSnapshot.val();
      console.log("✅ Authorized users found:", Object.keys(authUsers).length);
      console.log("Users:", Object.keys(authUsers));

      // Show first user details
      const firstUserId = Object.keys(authUsers)[0];
      if (firstUserId) {
        console.log(`First user (${firstUserId}):`, authUsers[firstUserId]);
      }
    } else {
      console.log("❌ No authorized_users data found");
    }

    // Test 2: Check devices structure
    console.log("\n2. Testing devices structure...");
    const deviceRef = ref(database, "devices/esp32_timbangan_001/current");
    const deviceSnapshot = await get(deviceRef);

    if (deviceSnapshot.exists()) {
      const currentData = deviceSnapshot.val();
      console.log("✅ Device current data found:", currentData);
    } else {
      console.log("❌ No device current data found");
    }

    // Test 3: Check RFID requests
    console.log("\n3. Testing RFID requests...");
    const rfidRequestsRef = ref(database, "rfid_requests");
    const rfidSnapshot = await get(rfidRequestsRef);

    if (rfidSnapshot.exists()) {
      const requests = rfidSnapshot.val();
      console.log("✅ RFID requests found:", Object.keys(requests).length);
      console.log("Recent requests:", Object.entries(requests).slice(0, 3));
    } else {
      console.log("❌ No RFID requests found");
    }

    // Test 4: Check RFID users with new structure
    console.log("\n4. Testing RFID users structure...");
    const rfidUsersRef = ref(database, "rfid_users");
    const rfidUsersSnapshot = await get(rfidUsersRef);

    if (rfidUsersSnapshot.exists()) {
      const users = rfidUsersSnapshot.val();
      console.log("✅ RFID users found:", Object.keys(users).length);
      console.log("User UIDs:", Object.keys(users));

      // Show details of first user
      const firstUserId = Object.keys(users)[0];
      if (firstUserId) {
        const userDetails = users[firstUserId];
        console.log(`First user details (${firstUserId}):`, {
          name: userDetails.name,
          email: userDetails.email,
          active: userDetails.active,
          device_id: userDetails.device_id,
          created_at: userDetails.created_at,
        });
      }

      // Count active users
      const activeUsers = Object.values(users).filter(
        (user) => user.active === true
      );
      console.log(
        `Active users: ${activeUsers.length}/${Object.keys(users).length}`
      );
    } else {
      console.log("❌ No RFID users found");
    }

    // Test 5: Test RFID request to user mapping
    console.log("\n5. Testing RFID request to user mapping...");
    if (rfidSnapshot.exists() && rfidUsersSnapshot.exists()) {
      const requests = rfidSnapshot.val();
      const users = rfidUsersSnapshot.val();

      console.log("Testing user lookup from requests:");
      Object.entries(requests)
        .slice(0, 3)
        .forEach(([timestamp, userId]) => {
          const user = users[userId];
          if (user) {
            console.log(
              `  Request ${timestamp} -> User: ${user.name} (${user.email})`
            );
          } else {
            console.log(
              `  Request ${timestamp} -> User ${userId} not found in rfid_users`
            );
          }
        });
    }

    console.log("\n🎉 Database access test completed!");
  } catch (error) {
    console.error("❌ Error testing database access:", error);
  }
}

// Test real-time subscription
function testRealtimeSubscription() {
  console.log("\n📡 Testing real-time subscription...");

  const weightRef = ref(database, "devices/esp32_timbangan_001/current");

  const unsubscribe = onValue(
    weightRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("🔔 Real-time weight update:", data);
      } else {
        console.log("📭 No current weight data available");
      }
    },
    (error) => {
      console.error("❌ Real-time subscription error:", error);
    }
  );

  // Stop listening after 10 seconds
  setTimeout(() => {
    unsubscribe();
    console.log("⏹️  Stopped real-time subscription");
    process.exit(0);
  }, 10000);
}

// Run tests
testDatabaseAccess().then(() => {
  testRealtimeSubscription();
});
