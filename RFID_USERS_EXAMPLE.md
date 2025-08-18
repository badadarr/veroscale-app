# RFID Users Implementation Example

## Menggunakan Hook useRFIDUsers yang Baru

```typescript
import { useRFIDUsers } from "@/hooks/useIoT";

function RFIDUserManager() {
  const {
    rfidUsers, // Semua RFID users
    activeUsers, // Hanya user yang active: true
    getRFIDUser, // Function untuk get user by UID
    isUserActiveAndAuthorized, // Check user status
    getActiveUsersList, // Get list of active users
    getUserByEmail, // Find user by email
  } = useRFIDUsers();

  // Contoh: Mendapatkan user berdasarkan UID
  const handleGetUser = async (uid: string) => {
    const user = await getRFIDUser(uid);
    if (user) {
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`Active: ${user.active}`);
      console.log(`Device: ${user.device_id}`);
    }
  };

  // Contoh: Check authorization
  const handleCheckAuth = async (uid: string) => {
    const { isActive, user } = await isUserActiveAndAuthorized(uid);
    if (isActive && user) {
      console.log(`User ${user.name} is authorized`);
    } else {
      console.log(`User not authorized or inactive`);
    }
  };

  // Contoh: Tampilkan daftar user aktif
  const activeUsersList = getActiveUsersList();

  return (
    <div>
      <h3>Active RFID Users ({activeUsersList.length})</h3>
      {activeUsersList.map((user) => (
        <div key={user.id}>
          {user.name} ({user.email}) - Device: {user.device_id}
        </div>
      ))}
    </div>
  );
}
```

## Contoh Data Structure

### RFID Users

```json
{
  "035B1430": {
    "active": true,
    "created_at": "349064",
    "device_id": "esp32_timbangan_001",
    "email": "admin@kws.co.id",
    "name": "admin dev",
    "uid": "035B1430"
  },
  "039CA70D": {
    "active": true,
    "created_at": "227417",
    "device_id": "esp32_timbangan_001",
    "email": "badar@kws.co.id",
    "name": "Badar maulana",
    "uid": "039CA70D"
  }
}
```

### RFID Requests (Log)

```json
{
  "41542803": "039CA70D", // timestamp: user_uid
  "41542854": "035B1430"
}
```

## IoT Service Methods yang Baru

```typescript
import IoTService from "@/lib/iot-service";

// Get specific user
const user = await IoTService.getRFIDUser("039CA70D");

// Get all active users
const activeUsers = await IoTService.getActiveRFIDUsers();

// Check user status
const { isActive, user } = await IoTService.isUserActiveAndAuthorized(
  "039CA70D"
);

// Subscribe to real-time RFID users
const unsubscribe = IoTService.subscribeToRFIDUsers((users) => {
  console.log("RFID Users updated:", users);
});
```

## Use Cases

1. **User Management Dashboard**: Tampilkan semua user dengan status aktif/non-aktif
2. **Access Control**: Verifikasi user yang melakukan scan RFID
3. **Audit Log**: Track aktivitas berdasarkan RFID requests
4. **User Profile**: Tampilkan detail lengkap user termasuk email dan device
5. **Real-time Monitoring**: Monitor user yang aktif secara real-time
