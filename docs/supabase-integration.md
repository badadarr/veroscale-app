# Panduan Integrasi Supabase untuk Project Weight Management System

Panduan ini menjelaskan cara mengintegrasikan database PostgreSQL dari Supabase ke aplikasi Next.js Anda.

> **Dokumen Terkait:**
> * [Panduan Pengelolaan Data Supabase](./supabase-data-management.md) - Petunjuk cara menambahkan dummy data dan mengelola data di Supabase

## Langkah 1: Membuat Akun Supabase

1. Kunjungi [Supabase](https://supabase.com/) dan daftar akun baru (atau login jika sudah memiliki)
2. Buat project baru
3. Pilih region terdekat dengan pengguna akhir Anda
4. Catat URL dan anon key dari Supabase dashboard

## Langkah 2: Setup Database di Supabase

Anda memiliki beberapa opsi untuk setup database:

### Opsi 1: Menggunakan SQL Editor

1. Di dashboard Supabase, navigasi ke SQL Editor
2. Upload dan jalankan file `scripts/supabase-migration.sql`
3. Scriptnya akan membuat semua tabel yang diperlukan dan menambahkan data awal

### Opsi 2: Menggunakan Script Setup

1. Perbarui file `.env.local` dengan kredensial Supabase Anda:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Jalankan script setup:
   ```
   npm run setup-supabase
   ```
3. Script ini akan terhubung ke akun Supabase Anda dan menginisialisasi struktur database

### Opsi 3: Migrasi Data dari MySQL yang Ada

Jika Anda sudah memiliki data di MySQL dan ingin memindahkannya ke Supabase:

1. Pastikan Anda memiliki akses ke database MySQL dan telah mengatur kredensial MySQL di `.env.local`
2. Pastikan juga kredensial Supabase sudah diatur di `.env.local`
3. Jalankan script migrasi:
   ```
   npm run migrate-to-supabase
   ```
4. Script ini akan memindahkan semua data dari MySQL ke Supabase, termasuk:
   - Peran/roles
   - Pengguna/users (dengan password yang sudah ter-hash)
   - Data referensi items
   - Catatan berat/weight records
   - Sesi/sessions
   - Data sampel/samples

## Langkah 3: Update Aplikasi untuk Menggunakan Supabase

Kami telah membuat file `lib/db-supabase.ts` yang menggantikan fungsi database MySQL yang lama. Untuk menggunakan ini:

1. Impor fungsi-fungsi dari file ini daripada dari file `db.ts` lama
2. Gunakan format query Supabase alih-alih query SQL langsung

Contoh penggunaan:

```typescript
// Sebelumnya (MySQL)
import { executeQuery } from '../lib/db';

const users = await executeQuery({
  query: 'SELECT * FROM users WHERE role_id = ?',
  values: [2]
});

// Sekarang (Supabase)
import { query } from '../lib/db-supabase';

const users = await query({
  table: 'users',
  filters: { role_id: 2 }
});
```

## Langkah 4: Deploy ke Vercel

1. Pastikan repository Anda sudah push ke GitHub
2. Buat akun di [Vercel](https://vercel.com/) jika belum punya
3. Hubungkan repository GitHub Anda ke Vercel
4. Tambahkan environment variables berikut di dashboard Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NODE_ENV=production
   JWT_SECRET=your-secure-jwt-secret
   ```
5. Deploy aplikasi Anda

## Keuntungan Menggunakan Supabase

1. **Free tier yang murah**: Supabase menyediakan 500MB database dan 1GB bandwidth per bulan secara gratis
2. **Autentikasi bawaan**: Supabase memiliki sistem autentikasi yang bisa Anda gunakan
3. **Realtime subscriptions**: Perubahan database bisa di-stream secara real-time ke frontend
4. **Storage**: Supabase juga menawarkan penyimpanan file
5. **Dashboard UI**: Interface yang user-friendly untuk mengelola database

## Migrasi API

Untuk mengadaptasikan API endpoints yang ada, gunakan pola berikut:

```typescript
// Sebelumnya
import { executeQuery } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const weights = await executeQuery({
      query: 'SELECT * FROM weight_records WHERE user_id = ?',
      values: [req.query.userId]
    });
    res.status(200).json(weights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
}

// Sekarang
import { query } from '../../lib/db-supabase';

export default async function handler(req, res) {
  try {
    const weights = await query({
      table: 'weight_records',
      filters: { user_id: req.query.userId }
    });
    res.status(200).json(weights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
}
```

## Troubleshooting

Jika Anda mengalami masalah dengan koneksi Supabase:

1. Pastikan URL dan anon key sudah benar
2. Periksa apakah Row Level Security (RLS) sudah dikonfigurasi dengan benar
3. Periksa log di dashboard Supabase untuk error
