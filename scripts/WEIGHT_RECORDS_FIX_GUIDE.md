# Panduan Implementasi Fix Database Weight Records

## Masalah yang Diatasi

1. Tabel `weight_records` menggunakan `record_id` sebagai primary key, sedangkan kode di API terkadang mencoba menggunakan `id`.
2. Kolom `sample_id` tidak ada di tabel `weight_records`, sehingga tidak bisa mengaitkan weight records dengan sampel.
3. Kolom `item_id` masih memiliki constraint `NOT NULL` yang mencegah insert record baru dengan `sample_id` tanpa `item_id`.

## Solusi

1. Menambahkan kolom `sample_id` ke tabel `weight_records`.
2. Mengubah constraint pada kolom `item_id` menjadi nullable.
3. Menghapus kolom `id` jika ada (kolom ini hanya alias dan tidak diperlukan).
4. Memastikan kode di API menggunakan `record_id` secara konsisten.
5. Membuat migrasi data untuk mengisi `sample_id` di records yang sudah ada.

## Langkah Implementasi

### 1. Persiapan

Pastikan fungsi `exec_sql` tersedia di database Supabase:

1. Buka Supabase SQL Editor
2. Jalankan script `check-exec-sql.sql`

### 2. Implementasi Fix Database

1. Jalankan script SQL `fix-weight-records-table.sql` di Supabase SQL Editor
2. Pastikan tidak ada error selama eksekusi

### 3. Verifikasi

Setelah mengimplementasikan fix, verifikasi bahwa:

1. Kolom `sample_id` ada di tabel `weight_records`
2. Kolom `item_id` sudah bisa menerima nilai NULL
3. Tidak ada kolom `id` di tabel `weight_records` (hanya `record_id`)
4. Foreign key constraint ke tabel `samples_item` sudah terbentuk

Kueri SQL untuk verifikasi:

```sql
-- Periksa struktur tabel weight_records
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'weight_records'
ORDER BY ordinal_position;

-- Periksa foreign key constraint
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'weight_records' 
  AND tc.constraint_type = 'FOREIGN KEY';
```

## Catatan Penting

- **Konsistensi API**: Pastikan semua endpoint API menggunakan `record_id` sebagai identifier, bukan `id`.
- **Item ID**: Kolom `item_id` sekarang bisa NULL, tetapi tetap dipertahankan untuk kompatibilitas dengan data lama.
- **Data Migration**: Script sudah mencakup upaya untuk memigrasikan data yang ada, tetapi mungkin perlu penyesuaian tambahan tergantung pada struktur data.
- **Testing**: Setelah implementasi, uji sistem dengan membuat weight records baru dan verifikasi bahwa `sample_id` disimpan dengan benar.
