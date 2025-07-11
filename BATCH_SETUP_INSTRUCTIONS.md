# Batch Mode Setup Instructions

## Database Schema Update Required

Untuk mengaktifkan fitur batch mode sepenuhnya, Anda perlu menambahkan kolom-kolom berikut ke tabel `weight_records` di Supabase Dashboard:

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda
   - Masuk ke "Table Editor"

2. **Edit Tabel weight_records**
   - Klik pada tabel `weight_records`
   - Klik tombol "Add Column" untuk setiap kolom berikut:

### Kolom yang Perlu Ditambahkan:

| Column Name | Type | Default | Nullable | Description |
|-------------|------|---------|----------|-------------|
| `batch_number` | `varchar` | - | ✅ Yes | Identifier untuk mengelompokkan records |
| `source` | `varchar` | - | ✅ Yes | Lokasi asal material |
| `destination` | `varchar` | - | ✅ Yes | Lokasi tujuan material |
| `notes` | `text` | - | ✅ Yes | Catatan tambahan untuk record |
| `unit` | `varchar` | `'kg'` | ✅ Yes | Satuan berat (kg, g, lb, ton) |

### SQL Commands (Alternative):

Jika Anda memiliki akses SQL Editor di Supabase, jalankan perintah berikut:

```sql
-- Add batch support columns
ALTER TABLE public.weight_records 
ADD COLUMN batch_number VARCHAR(100),
ADD COLUMN source VARCHAR(255),
ADD COLUMN destination VARCHAR(255), 
ADD COLUMN notes TEXT,
ADD COLUMN unit VARCHAR(10) DEFAULT 'kg';

-- Add indexes for better performance
CREATE INDEX idx_weight_records_batch_number ON public.weight_records(batch_number);
CREATE INDEX idx_weight_records_timestamp ON public.weight_records(timestamp);
```

## Setelah Kolom Ditambahkan:

1. **Restart aplikasi** untuk memastikan schema cache ter-update
2. **Test batch functionality** di halaman Weight Entry
3. **Verifikasi data** di halaman Weight Records

## Status Saat Ini:

- ✅ Batch UI sudah siap
- ✅ API sudah mendukung batch (dengan fallback)
- ⏳ Database schema perlu update manual
- ⏳ Kolom batch belum tersedia di database

## Fitur yang Akan Aktif Setelah Setup:

- ✅ Batch number tracking
- ✅ Source/destination tracking  
- ✅ Notes per weight entry
- ✅ Unit selection (kg, g, lb, ton)
- ✅ Batch filtering dan search
- ✅ Enhanced weight records display