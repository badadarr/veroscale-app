# Integrasi Sistem Timbangan IoT

## Overview
Sistem ini terintegrasi dengan timbangan IoT menggunakan ESP32 yang terhubung ke Firebase Realtime Database. Data berat dan RFID users disinkronkan secara real-time.

## Konfigurasi Firebase

### Database Structure
```
timbangan-online-3cd46-default-rtdb/
├── devices/
│   └── esp32_timbangan_001/
│       └── berat_terakhir: "0.100"
├── rfid_users/
│   ├── 4154283/
│   │   ├── device_id: "esp32_timbangan_001"
│   │   ├── nama: "Operator B"
│   │   └── waktu: "2024-06-01T08:31:00Z"
│   └── A1B2C3D4/
│       ├── device_id: "esp32_timbangan_001"
│       ├── nama: "Operator A"
│       └── waktu: "2024-06-01T08:40:00Z"
└── rfid_requests/
    ├── 23F6CE01/
    │   ├── device_id: "esp32_timbangan_001"
    │   └── waktu: "Jun 29 2025 23:55:38"
    └── 57A62A03/
        ├── device_id: "esp32_timbangan_001"
        └── waktu: "Jun 29 2025 23:55:38"
```

## Fitur Integrasi

### 1. Real-time Weight Display
- Menampilkan berat terkini dari timbangan ESP32
- Status koneksi real-time
- Tombol untuk menggunakan berat dari IoT ke form entry

### 2. RFID User Tracking
- Menampilkan scan RFID terbaru
- Riwayat pengguna yang melakukan scan
- Tracking waktu scan

### 3. Komponen yang Terintegrasi

#### IoTWeightDisplay
```tsx
<IoTWeightDisplay 
  deviceId="esp32_timbangan_001"
  showSelectButton={true} 
  onWeightSelect={handleWeightSelect}
/>
```

#### RFIDUserDisplay
```tsx
<RFIDUserDisplay />
```

## API Endpoints

### GET /api/iot/status
Mengecek status sistem IoT
```json
{
  "firebase_connected": true,
  "devices": {
    "esp32_timbangan_001": {
      "status": "online",
      "last_update": "2024-01-01T00:00:00Z",
      "current_weight": "0.100"
    }
  }
}
```

### POST /api/iot/sync
Sinkronisasi data IoT ke database lokal
```json
{
  "deviceId": "esp32_timbangan_001",
  "weight": "12.50",
  "rfidId": "A1B2C3D4"
}
```

## Penggunaan

### Di Halaman Samples
1. Komponen IoT ditampilkan di bagian atas
2. Saat form terbuka, tombol "Gunakan Berat Ini" akan muncul
3. Klik tombol untuk mengisi otomatis field sample_weight

### Di Halaman Weight Entry
1. Komponen IoT selalu ditampilkan
2. Berat dari timbangan dapat langsung digunakan untuk entry
3. RFID tracking menunjukkan operator yang melakukan scan

## Konfigurasi Environment

Tambahkan ke `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDwdYrP2FEYV2hAS1QrYEcjXDJqcvUI4WQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=timbangan-online-3cd46.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://timbangan-online-3cd46-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=timbangan-online-3cd46
```

## Troubleshooting

### Koneksi Terputus
- Periksa koneksi internet
- Pastikan Firebase config benar
- Cek status ESP32 device

### Data Tidak Update
- Refresh halaman
- Periksa Firebase console
- Cek log browser untuk error

## Dependencies Tambahan

Pastikan package berikut terinstall:
```bash
npm install firebase
```

## Security Notes

- Firebase rules harus dikonfigurasi dengan benar
- API keys sebaiknya menggunakan environment variables
- Implementasikan rate limiting untuk API endpoints