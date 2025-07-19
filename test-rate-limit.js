// Test script untuk memverifikasi Arcjet rate limiting

import axios from "axios";
const BASE_URL = "http://localhost:3000";

async function testRateLimit() {
  console.log("🧪 Testing Arcjet Rate Limiting...\n");

  // Test 1: Login endpoint rate limiting (5 requests per 15 minutes)
  console.log("1. Testing Login Rate Limiting (5 requests/15min)");
  console.log("   Sending 6 rapid login requests...");

  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: "test@example.com",
        password: "wrongpassword",
      });
      console.log(
        `   Request ${i}: ${response.status} - ${response.statusText}`
      );
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(
          `   Request ${i}: ⚠️  RATE LIMITED (429) - ${error.response.data.message}`
        );
        console.log(`   Retry After: ${error.response.data.retryAfter}`);
      } else if (error.response?.status === 401) {
        console.log(`   Request ${i}: 401 - Invalid credentials (expected)`);
      } else {
        console.log(
          `   Request ${i}: ${error.response?.status} - ${error.message}`
        );
      }
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n2. Testing Dashboard API Rate Limiting (200 requests/hour)");
  console.log("   Sending requests without authentication...");

  for (let i = 1; i <= 3; i++) {
    try {
      const response = await axios.get(`${BASE_URL}/api/dashboard`);
      console.log(
        `   Request ${i}: ${response.status} - ${response.statusText}`
      );
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(
          `   Request ${i}: ⚠️  RATE LIMITED (429) - ${error.response.data.message}`
        );
      } else if (error.response?.status === 401) {
        console.log(`   Request ${i}: 401 - Unauthorized (expected)`);
      } else {
        console.log(
          `   Request ${i}: ${error.response?.status} - ${error.message}`
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(
    "\n3. Testing Global Middleware Rate Limiting (1000 requests/hour)"
  );
  console.log("   Testing homepage access...");

  for (let i = 1; i <= 3; i++) {
    try {
      const response = await axios.get(`${BASE_URL}/`);
      console.log(
        `   Request ${i}: ${response.status} - Page loaded successfully`
      );
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(
          `   Request ${i}: ⚠️  RATE LIMITED (429) - ${error.response.data.message}`
        );
      } else {
        console.log(
          `   Request ${i}: ${error.response?.status} - ${error.message}`
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n✅ Rate limiting test completed!");
  console.log(
    "\nNote: To see rate limiting in action, run this script multiple times rapidly"
  );
  console.log("or increase the number of requests in the loops above.");
}

// Run the test
testRateLimit().catch(console.error);
