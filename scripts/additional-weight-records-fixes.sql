-- Script tambahan untuk memastikan semua constraint benar
-- Jalankan script ini setelah fix-weight-records-table.sql

BEGIN;

-- Update existing records yang mungkin memiliki status tidak valid
UPDATE public.weight_records 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- Pastikan item_id nullable jika ada constraint NOT NULL
DO $$
BEGIN
  -- Check jika masih ada constraint NOT NULL di item_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'weight_records' 
    AND column_name = 'item_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.weight_records ALTER COLUMN item_id DROP NOT NULL;
    RAISE NOTICE 'Made item_id nullable';
  END IF;
END
$$;

-- Pastikan kolom unit ada dan nullable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'weight_records' 
    AND column_name = 'unit'
  ) THEN
    ALTER TABLE public.weight_records ADD COLUMN unit VARCHAR(10) DEFAULT 'kg';
    RAISE NOTICE 'Added unit column';
  END IF;
END
$$;

COMMIT;
