# Panduan Implementasi Fix Database Weight Records

## Masalah yang Diatasi

1. Tabel `weight_records` menggunakan `record_id` sebagai primary key, sedangkan kode di API terkadang mencoba menggunakan `id`.
2. Kolom `sample_id` tidak ada di tabel `weight_records`, sehingga tidak bisa mengaitkan weight records dengan sampel.
3. Kolom `item_id` masih memiliki constraint `NOT NULL` yang mencegah insert record baru dengan `sample_id` tanpa `item_id`.
4. Constraint pada kolom `status` mungkin tidak sesuai dengan nilai yang dikirim dari API.
5. Urutan parameter dalam query INSERT tidak sesuai dengan kolom yang didefinisikan.

## Solusi

1. Menambahkan kolom `sample_id` ke tabel `weight_records`.
2. Mengubah constraint pada kolom `item_id` menjadi nullable.
3. Memperbaiki constraint pada kolom `status` untuk hanya menerima nilai yang valid.
4. Menghapus kolom `id` jika ada (kolom ini hanya alias dan tidak diperlukan).
5. Memastikan kode di API menggunakan `record_id` secara konsisten.
6. Memperbaiki urutan parameter dalam query INSERT.

## Langkah Implementasi

### 1. Persiapan

Pastikan fungsi `exec_sql` tersedia di database Supabase:

1. Buka Supabase SQL Editor
2. Jalankan script `check-exec-sql.sql`

### 2. Diagnosa Masalah

1. Jalankan script `diagnose-weight-records-constraints.sql` untuk melihat constraint yang ada
2. Periksa hasil untuk memahami struktur tabel saat ini

### 3. Implementasi Fix Database

1. Jalankan script SQL `fix-weight-records-table.sql` di Supabase SQL Editor
2. Jalankan script SQL `additional-weight-records-fixes.sql` untuk perbaikan tambahan
3. Pastikan tidak ada error selama eksekusi

### 4. Verifikasi

Setelah mengimplementasikan fix, verifikasi bahwa:

1. Kolom `sample_id` ada di tabel `weight_records`
2. Kolom `item_id` sudah bisa menerima nilai NULL
3. Constraint status hanya menerima: 'pending', 'approved', 'rejected'
4. Tidak ada kolom `id` di tabel `weight_records` (hanya `record_id`)
5. Foreign key constraint ke tabel `samples_item` sudah terbentuk

Kueri SQL untuk verifikasi:

```sql
-- Periksa struktur tabel weight_records
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'weight_records'
ORDER BY ordinal_position;

-- Periksa constraint
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'weight_records' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Test insert sederhana
INSERT INTO weight_records 
(user_id, sample_id, total_weight, status, unit)
VALUES (1, 1, 10.5, 'pending', 'kg')
RETURNING *;
```

## Urutan Eksekusi Script

1. `check-exec-sql.sql` (opsional, untuk memastikan fungsi tersedia)
2. `diagnose-weight-records-constraints.sql` (untuk melihat kondisi saat ini)
3. `fix-weight-records-table.sql` (fix utama)
4. `additional-weight-records-fixes.sql` (perbaikan tambahan)

## Catatan Penting

- **Konsistensi API**: Query INSERT sudah diperbaiki untuk tidak menyertakan `item_id` dalam parameter.
- **Item ID**: Kolom `item_id` sekarang bisa NULL, tetapi tetap dipertahankan untuk kompatibilitas dengan data lama.
- **Status Values**: Pastikan constraint status hanya menerima nilai yang valid ('pending', 'approved', 'rejected').
- **Parameter Order**: Urutan parameter dalam query INSERT sudah diperbaiki untuk sesuai dengan kolom.
- **Testing**: Setelah implementasi, uji sistem dengan membuat weight records baru dan verifikasi bahwa `sample_id` disimpan dengan benar.
