# Panduan Deployment ke Vercel dengan Integrasi Supabase

Dokumen ini berisi langkah-langkah untuk melakukan deployment aplikasi Next.js ke Vercel dengan integrasi database Supabase.

## 1. Setup Repository Git

Pastikan project Anda sudah berada di repository Git (GitHub, GitLab, atau Bitbucket). Jika belum:

```bash
# Inisialisasi Git repository
git init

# Tambahkan semua file (kecuali node_modules, .env.local, dll)
git add .

# Commit perubahan
git commit -m "Initial commit"

# Hubungkan dengan repository remote (ganti URL sesuai repository Anda)
git remote add origin https://github.com/username/nama-repository.git

# Push ke repository
git push -u origin main
```

## 2. Setup Database di Supabase

1. Login ke [Supabase](https://app.supabase.com)
2. Buat project baru (jika belum ada)
3. Jalankan script migrasi:
   - Dari SQL Editor di Supabase, jalankan file `scripts/supabase-migration.sql`, ATAU
   - Jalankan `npm run setup-supabase` secara lokal dengan kredensial Supabase yang benar

## 3. Deploy ke Vercel

1. Login ke [Vercel](https://vercel.com)
2. Klik tombol "Import Project" atau "New Project"
3. Connect dengan repository Git Anda
4. Konfigurasi project:
   - Framework Preset: Next.js
   - Root Directory: `./` (jika project berada di root repository)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. Tambahkan environment variables berikut:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   JWT_SECRET=your-secure-random-string
   NODE_ENV=production
   ```

6. Klik "Deploy"

## 4. Setelah Deployment

1. Verifikasi bahwa aplikasi berfungsi dengan baik
2. Tambahkan domain kustom jika diperlukan (melalui Settings > Domains)
3. Konfigurasi analitik jika diperlukan
4. Setup CI/CD untuk otomatisasi deployment

## 5. Menambahkan Data ke Database Production

Ada beberapa opsi untuk menambahkan data ke database Supabase production:

### Opsi 1: Jalankan Script Dummy Data

Jika ingin menambahkan data dummy untuk testing:

1. Konfigurasi kredensial Supabase production di file `.env.local` lokal
2. Jalankan `npm run add-dummy-data:supabase`

### Opsi 2: Migrasi Data dari MySQL

Jika ingin memindahkan data dari database MySQL lokal:

1. Konfigurasi kredensial MySQL lokal dan Supabase production di file `.env.local`
2. Jalankan `npm run migrate-to-supabase`

### Opsi 3: Import Data Manual

Jika memiliki data dalam format CSV atau SQL:

1. Login ke dashboard Supabase
2. Pilih table yang ingin diimport
3. Klik "Import Data" dan ikuti petunjuk

## 6. Troubleshooting

### Masalah Database

- **Error koneksi**: Pastikan environment variables Supabase sudah benar
- **CORS Error**: Tambahkan domain aplikasi Vercel ke daftar allowed origins di Supabase
- **RLS Error**: Periksa konfigurasi Row Level Security di Supabase

### Masalah Deployment

- **Build Error**: Periksa log build di dashboard Vercel
- **API Error**: Periksa format API routes dan pastikan kompatibel dengan Vercel Serverless Functions
- **404 Error**: Periksa konfigurasi routing di Next.js

## 7. Best Practices

1. **Monitoring**: Setup monitoring untuk aplikasi dan database
2. **Backup**: Aktifkan backup otomatis untuk database Supabase
3. **Staging Environment**: Buat environment staging untuk testing sebelum deployment ke production
4. **Environment Branching**: Manfaatkan Vercel Preview Deployments untuk testing per branch

## 8. Resources

- [Dokumentasi Vercel](https://vercel.com/docs)
- [Dokumentasi Supabase](https://supabase.com/docs)
- [Dokumentasi Next.js](https://nextjs.org/docs)
