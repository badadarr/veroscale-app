# Weight Variance Tracking Implementation

## Overview

Fitur baru telah ditambahkan untuk melacak selisih berat antara:

- **Berat IoT**: Berat yang diukur langsung dari timbangan IoT
- **Berat Manager**: Berat yang diinput manual oleh manager

## Database Changes

### New Columns Added to `weight_records` table:

- `iot_weight` - Berat dari timbangan IoT
- `manager_weight` - Berat input manual dari manager
- `weight_variance` - Selisih berat (IoT - Manager)
- `weight_variance_percentage` - Persentase selisih
- `variance_status` - Status: 'normal', 'warning', 'critical'
- `iot_device_id` - ID perangkat IoT
- `verification_required` - Flag apakah perlu verifikasi manual

### Automatic Calculation Trigger

Database trigger otomatis menghitung:

- Selisih berat absolut
- Persentase selisih
- Status berdasarkan threshold:
  - **Normal**: < 5% selisih
  - **Warning**: 5-10% selisih
  - **Critical**: > 10% selisih

## Frontend Implementation

### Weight Entry Form (`/operations/weight-entry.tsx`)

**New Features:**

1. **Primary Weight Field** - Berat utama yang akan disimpan
2. **IoT Scale Weight Field** - Input berat dari timbangan IoT
3. **Manager Weight Field** - Input berat manual dari manager
4. **Real-time Variance Display** - Menampilkan selisih secara real-time
5. **Status Indicator** - Visual indicator (normal/warning/critical)

**Visual Feedback:**

- Green: Selisih normal (< 5%)
- Yellow: Selisih warning (5-10%)
- Red: Selisih critical (> 10%)

### API Updates (`/api/weights/index.ts`)

**Enhanced Weight Record Creation:**

- Menerima `iot_weight` dan `manager_weight` terpisah
- Menghitung variance otomatis
- Mengembalikan informasi variance dalam response

### New Component (`/components/ui/WeightVarianceDisplay.tsx`)

**Reusable component untuk:**

- Menampilkan informasi variance dengan visual yang jelas
- Mode compact dan full display
- Status indicators dengan icon dan warna

## Workflow Baru

### Untuk Operator:

1. Pilih sample yang akan ditimbang
2. Input berat IoT (dari timbangan otomatis)
3. Input berat manager (input manual)
4. System otomatis menghitung dan menampilkan selisih
5. Submit weight record dengan informasi variance

### Visual Feedback:

- **Normal (< 5%)**: ✅ Hijau - "All good"
- **Warning (5-10%)**: ⚠️ Kuning - "Manual verification recommended"
- **Critical (> 10%)**: 🚨 Merah - "Significant variance detected"

## Database Migration

Jalankan script berikut di Supabase SQL Editor:

```sql
-- File: scripts/add-weight-variance-tracking.sql
```

## Benefits

1. **Transparansi**: Selisih berat IoT vs manual terlihat jelas
2. **Quality Control**: Alert otomatis untuk selisih besar
3. **Audit Trail**: Record lengkap untuk tracking
4. **Verification**: Flag otomatis untuk record yang perlu verifikasi
5. **Real-time Feedback**: Operator langsung tahu ada selisih

## Status

✅ Database schema updated
✅ API endpoints updated  
✅ Weight entry form enhanced
✅ Real-time variance calculation
✅ Visual feedback components
✅ Automatic status classification

Fitur ini sekarang siap digunakan untuk tracking selisih berat antara IoT dan input manual manager.
