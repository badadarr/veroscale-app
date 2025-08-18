# Firebase Database Structure Migration

## Changes Made

### 1. Environment Variables (.env.local)

Updated Firebase configuration to use the new database:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCpT8kEDaXLxqTavO4Als-w7Wn4BDcyRMM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=iot-scales-enhancement.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://iot-scales-enhancement-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=iot-scales-enhancement
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=iot-scales-enhancement.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=316724489735
NEXT_PUBLIC_FIREBASE_APP_ID=1:316724489735:web:b9ec96a24f56e76ef2c4a2
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-2E8QZTEFTX
```

### 2. Firebase Configuration (lib/firebase.ts)

- Updated to use environment variables instead of hardcoded values
- This allows for easier configuration management across environments

### 3. New Database Structure

The new Realtime Database structure is:

```
authorized_users/
  039CA70D/
    authorized: true
    name: "Badar Maulana"
  12CCB463/
    authorized: true
    name: "Operator"

devices/
  esp32_timbangan_001/
    current/
      device_id: "esp32_timbangan_001"
      timestamp: 91591
      weight: "0.501"
    history/
      // Historical weight data

rfid_requests/
  41542803: "039CA70D"
  // Other RFID request timestamps with corresponding user IDs

rfid_users/
  035B1430/
    active: true
    created_at: "349064"
    device_id: "esp32_timbangan_001"
    email: "admin@kws.co.id"
    name: "admin dev"
    uid: "035B1430"
  039CA70D/
    active: true
    created_at: "227417"
    device_id: "esp32_timbangan_001"
    email: "badar@kws.co.id"
    name: "Badar maulana"
    uid: "039CA70D"
  12CCB463/
    active: true
    // ... other user properties
```

### 4. Updated IoT Service (lib/iot-service.ts)

Key changes:

- **Weight Data Path**: Changed from `devices/{deviceId}/berat_terakhir` to `devices/{deviceId}/current`
- **Data Structure**: Updated to match new format with `weight`, `timestamp`, and `device_id` fields
- **New Methods**:
  - `subscribeToAuthorizedUsers()` - Listen to authorized users
  - `checkUserAuthorization()` - Check if RFID user is authorized
  - `getAllRFIDRequests()` - Get all RFID requests
- **Updated Interfaces**:
  - `IoTWeightData` now includes `weight`, `timestamp`, and `device_id`
  - `AuthorizedUser` for user authorization data (legacy support)
  - `RFIDUser` for complete RFID user information with email, name, active status
  - `DeviceData` for complete device information
- **New RFID User Methods**:
  - `getRFIDUser(uid)` - Get specific RFID user by UID
  - `getActiveRFIDUsers()` - Get all active RFID users
  - `isUserActiveAndAuthorized(uid)` - Check if user is active and authorized

### 5. Updated API Routes

- **current-weight.ts**: Updated to use `devices/{deviceId}/current` path instead of `berat_terakhir`

## Migration Steps

1. ✅ Updated environment variables
2. ✅ Updated Firebase configuration to use env vars
3. ✅ Updated IoT service interfaces and methods
4. ✅ Updated API routes to use new database structure
5. ✅ Updated .env.example for reference
6. ✅ **Enhanced RFID Users Support**: Updated to use detailed user profiles instead of simple references
7. ✅ **Updated Hooks**: Enhanced `useRFIDUsers` hook with new methods for user management

## Testing - UPDATED

After these changes, test the following:

1. Weight data subscription from ESP32 device ✅ (Working)
2. RFID user authorization (Enhanced with new user profiles)
3. Real-time weight updates ✅ (Working)
4. API endpoints for current weight data ✅ (Working)
5. **NEW**: Active user filtering and management
6. **NEW**: User lookup by email and UID
7. **NEW**: RFID request to user mapping

**Note**: Some Firebase endpoints may require permission configuration (`rfid_users`, `rfid_requests`, `authorized_users`)

## Key Differences - UPDATED

- Weight is now under `current` object instead of direct `berat_terakhir`
- User authorization is now centralized under `authorized_users`
- **RFID Users Enhanced**: `rfid_users` now contains complete user profiles with:
  - `active` status (boolean)
  - `created_at` timestamp
  - `device_id` associated device
  - `email` user email address
  - `name` full user name
  - `uid` unique user identifier
- RFID requests are simplified to timestamp -> user_id mapping
- **RFID Requests link to RFID Users**: `rfid_requests` entries point to UIDs in `rfid_users`
- Database structure is more organized and scalable
