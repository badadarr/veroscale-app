# RFID Scan Entry Integration

## Overview
Fitur scan entry telah direvisi untuk menggunakan data RFID requests dari Firebase dan terintegrasi dengan timbangan IoT ESP32.

## Perubahan Utama

### 1. Halaman Scan Entry (`pages/operations/scan-entry.tsx`)
- **Sebelum**: Menggunakan barcode/QR scanner dengan kamera
- **Sesudah**: Menggunakan data RFID requests dari Firebase
- Menampilkan daftar RFID requests yang belum diproses
- Integrasi real-time dengan data berat dari timbangan IoT
- Auto-fill berat dari pembacaan timbangan IoT

### 2. IoT Service (`lib/iot-service.ts`)
- Menambahkan method `getUnprocessedRFIDRequests()` untuk mendapatkan request yang belum diproses
- Menambahkan method `markRFIDRequestProcessed()` untuk menandai request sebagai selesai
- Update interface `RFIDRequest` dengan field `processed`

### 3. API Weight Records (`pages/api/weights/index.ts`)
- Menambahkan dukungan untuk data RFID dalam `addWeightRecord()`
- Menerima parameter `rfid_device_id`, `scan_time`, dan `operator_id`
- Membuat entry khusus untuk data RFID tanpa memerlukan `item_id`

### 4. Komponen RFIDWeightEntry (`components/ui/RFIDWeightEntry.tsx`)
- Komponen baru yang menggabungkan tampilan RFID requests dan form input berat
- Real-time display dari pembacaan timbangan IoT
- Tombol untuk menggunakan pembacaan IoT secara otomatis
- Status tracking untuk request yang sudah diproses

## Fitur Utama

### Real-time Integration
- **RFID Requests**: Menampilkan daftar scan RFID secara real-time dari Firebase
- **IoT Weight**: Menampilkan pembacaan berat terkini dari timbangan ESP32
- **Auto-sync**: Otomatis mengisi berat dari pembacaan IoT

### User Experience
- Pilih RFID request dari daftar
- Lihat pembacaan berat real-time dari timbangan
- Gunakan pembacaan IoT atau input manual
- Tambahkan informasi source dan destination
- Status tracking untuk request yang sudah diproses

### Data Flow
1. RFID scanner mengirim data ke Firebase (`rfid_requests`)
2. Timbangan IoT mengirim data berat ke Firebase (`devices/{deviceId}/berat_terakhir`)
3. Operator memilih RFID request dari daftar
4. Sistem auto-fill berat dari pembacaan IoT
5. Operator konfirmasi dan simpan record
6. RFID request ditandai sebagai processed

## Struktur Data Firebase

### RFID Requests
```json
{
  "rfid_requests": {
    "request_id": {
      "device_id": "RFID_001",
      "waktu": "2025-01-27T10:30:00Z",
      "processed": false
    }
  }
}
```

### IoT Weight Data
```json
{
  "devices": {
    "ESP32_001": {
      "berat_terakhir": "25.5"
    }
  }
}
```

## Penggunaan

1. **Akses halaman**: `/operations/scan-entry`
2. **Monitor RFID requests**: Daftar akan update secara real-time
3. **Pilih request**: Klik pada RFID request yang ingin diproses
4. **Input berat**: Gunakan pembacaan IoT atau input manual
5. **Simpan**: Record akan tersimpan dan request ditandai sebagai processed

## Keuntungan

- **Efisiensi**: Tidak perlu scan manual barcode/QR
- **Akurasi**: Integrasi langsung dengan timbangan IoT
- **Real-time**: Data update secara langsung
- **Tracking**: Status request yang jelas
- **User-friendly**: Interface yang sederhana dan intuitif