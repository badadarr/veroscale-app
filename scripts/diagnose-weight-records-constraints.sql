-- Script untuk mendiagnosis dan memperbaiki constraint di tabel weight_records
-- Jalankan script ini untuk melihat constraint apa saja yang ada

-- 1. Lihat semua constraint di tabel weight_records
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

-- 2. Lihat struktur kolom lengkap
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'weight_records'
ORDER BY ordinal_position;

-- 3. Jika ada masalah dengan constraint status, jalankan ini untuk memperbaikinya:
-- (Hapus komentar jika diperlukan)

/*
-- Hapus constraint status yang bermasalah
ALTER TABLE public.weight_records DROP CONSTRAINT IF EXISTS weight_records_status_check;

-- Tambah constraint status yang benar
ALTER TABLE public.weight_records 
ADD CONSTRAINT weight_records_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));
*/
