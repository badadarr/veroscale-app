# Panduan Mengelola Data di Supabase

## Setup Database Supabase

Pastikan Anda sudah menyiapkan database Supabase terlebih dahulu dengan cara:
1. Jalankan migrasi SQL dari `scripts/supabase-migration.sql` pada SQL Editor Supabase, ATAU
2. Gunakan command: `npm run setup-supabase`

## Menambahkan Dummy Data ke Supabase

Untuk menambahkan data pengujian ke database Supabase, ikuti langkah-langkah berikut:

### Persiapan

1. Pastikan credential Supabase sudah dikonfigurasi dengan benar di file `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Pastikan struktur tabel sudah dibuat dengan benar di Supabase.

### Menambahkan Dummy Data

Gunakan perintah berikut untuk menambahkan dummy data ke Supabase:

```bash
npm run add-dummy-data:supabase
```

Proses ini akan menambahkan:
- User dengan berbagai peran (admin, manager, operator)
- Item referensi untuk penimbangan
- Data sampel dengan berbagai kategori
- Record berat untuk simulasi data historis
- Record sesi untuk simulasi aktivitas pengguna

### Output yang Diharapkan

Script akan menampilkan log progres untuk setiap data yang ditambahkan. Jika berhasil, Anda akan melihat pesan:

```
Dummy data added to Supabase successfully!
```

### Memigrasikan Data dari MySQL ke Supabase

Jika Anda sudah memiliki data di database MySQL lokal dan ingin memindahkannya ke Supabase, gunakan:

```bash
npm run migrate-to-supabase
```

Hal ini akan menyalin semua data dari database MySQL lokal ke database Supabase Anda.

### Troubleshooting

Jika script tidak berjalan dengan benar:

1. Periksa log error untuk informasi lebih detail
2. Pastikan kredensial Supabase Anda benar
3. Periksa apakah Row Level Security (RLS) menghalangi operasi insert
4. Pastikan tidak ada batasan unik yang dilanggar

Untuk menghapus semua data pengujian dan memulai dari awal, gunakan SQL Editor di dashboard Supabase untuk menjalankan query:

```sql
-- Hapus data tetapi pertahankan struktur tabel
TRUNCATE TABLE weight_records CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE ref_items CASCADE;
TRUNCATE TABLE samples_item CASCADE;

-- Lalu setup ulang data dasar
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('operator');
```

## Transisi dari SQL Query ke Supabase API

Jika Anda mengalami error seperti `Could not find the function public.execute_sql(params, sql_query) in the schema cache`, ini terjadi karena aplikasi mencoba menjalankan query SQL langsung. 

Supabase **tidak** mendukung eksekusi query SQL langsung melalui API JavaScript-nya. Sebagai gantinya, gunakan pendekatan berbasis tabel dari Supabase.

Untuk informasi lebih lengkap tentang cara migrasi dari query SQL ke API Supabase, lihat [Panduan Migrasi SQL ke Supabase API](./sql-to-supabase-migration.md).
