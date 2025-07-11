# Cara Kerja Integrasi Timbangan IoT

## Alur Data dari ESP32 ke Database

### 1. Real-time Data Flow
```
ESP32 Timbangan → Firebase RTDB → Web App → Database Lokal
```

### 2. Metode Integrasi

#### A. Manual Selection (Halaman Samples & Weight Entry)
1. ESP32 mengirim data berat ke Firebase RTDB
2. Komponen `IoTWeightDisplay` menampilkan berat real-time
3. User klik tombol "Gunakan Berat Ini"
4. Berat otomatis terisi di form entry
5. User submit form untuk simpan ke database

#### B. Auto-Sync (Halaman Samples)
1. User aktifkan auto-sync dengan pilih material
2. Sistem monitor perubahan berat dari Firebase
3. Jika perubahan ≥ 0.1 kg, otomatis simpan ke database
4. Data tersimpan dengan source "IoT_ESP32"

#### C. Direct Webhook (ESP32 → Database)
1. ESP32 kirim POST request ke `/api/iot/webhook`
2. Data langsung tersimpan ke tabel `weightrecords`
3. Tidak perlu melalui Firebase RTDB

## Konfigurasi ESP32

### Arduino Code Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

void sendWeightData(float weight) {
  HTTPClient http;
  http.begin("https://your-app.vercel.app/api/iot/webhook");
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  doc["device_id"] = "esp32_timbangan_001";
  doc["weight"] = weight;
  doc["timestamp"] = WiFi.getTime();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  http.end();
}
```

## Database Schema

### Tabel weightrecords
```sql
CREATE TABLE weightrecords (
  id SERIAL PRIMARY KEY,
  item_id INTEGER,
  total_weight DECIMAL(10,3),
  unit VARCHAR(10) DEFAULT 'kg',
  source VARCHAR(50), -- 'IoT_ESP32', 'Manual', etc
  destination VARCHAR(100),
  batch_number VARCHAR(50),
  notes TEXT,
  recorded_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel rfid_logs (Optional)
```sql
CREATE TABLE rfid_logs (
  id SERIAL PRIMARY KEY,
  rfid_id VARCHAR(20),
  device_id VARCHAR(50),
  weight_record_id INTEGER REFERENCES weightrecords(id),
  scan_time TIMESTAMP DEFAULT NOW()
);
```

## Komponen UI

### 1. IoTWeightDisplay
- Menampilkan berat real-time
- Status koneksi ESP32
- Tombol untuk gunakan berat

### 2. RFIDUserDisplay
- Menampilkan scan RFID terbaru
- Riwayat user yang scan

### 3. IoTAutoSync
- Toggle auto-sync on/off
- Manual sync button
- Counter data tersinkronkan

### 4. IoTWeightHistory
- Riwayat data dari IoT
- Filter berdasarkan source

## API Endpoints

### GET /api/iot/status
Cek status sistem IoT

### POST /api/iot/webhook
Terima data langsung dari ESP32
```json
{
  "device_id": "esp32_timbangan_001",
  "weight": 12.50,
  "rfid_id": "A1B2C3D4",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /api/weights?source=IoT
Filter data weights dari IoT

## Monitoring & Troubleshooting

### 1. Cek Koneksi
- Status indicator di IoTWeightDisplay
- Firebase console untuk data real-time
- Network tab browser untuk API calls

### 2. Debug Data Flow
```javascript
// Console log di browser
IoTService.subscribeToWeightData('esp32_timbangan_001', (data) => {
  console.log('Weight data:', data);
});
```

### 3. Common Issues
- **Data tidak update**: Cek koneksi WiFi ESP32
- **Auto-sync tidak jalan**: Pastikan material dipilih
- **Webhook gagal**: Cek URL endpoint dan format JSON

## Security Considerations

1. **API Rate Limiting**: Batasi request dari ESP32
2. **Authentication**: Gunakan API key untuk webhook
3. **Data Validation**: Validasi format dan range data
4. **HTTPS Only**: Pastikan semua komunikasi encrypted

## Performance Tips

1. **Batch Updates**: Kumpulkan beberapa reading sebelum kirim
2. **Debouncing**: Hindari spam data saat berat berfluktuasi
3. **Connection Pooling**: Reuse HTTP connections
4. **Local Caching**: Cache data di ESP32 jika offline