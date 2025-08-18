-- Script untuk melihat constraint dan memperbaiki masalah status
-- Jalankan script ini untuk melihat dan memperbaiki constraint status

-- 1. Lihat constraint yang ada
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

-- 2. Lihat data status yang ada saat ini
SELECT DISTINCT status, COUNT(*) as count
FROM weight_records 
GROUP BY status
ORDER BY status;

-- 3. Perbaiki constraint status
-- Hapus constraint status yang bermasalah
ALTER TABLE public.weight_records DROP CONSTRAINT IF EXISTS weight_records_status_check;

-- Update semua status yang tidak valid menjadi 'pending'
UPDATE public.weight_records 
SET status = 'pending' 
WHERE status IS NULL 
   OR status NOT IN ('pending', 'approved', 'rejected');

-- Tambah constraint status yang benar
ALTER TABLE public.weight_records 
ADD CONSTRAINT weight_records_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 4. Verifikasi bahwa constraint sudah benar
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'weight_records' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.constraint_name;
