-- Fix weight_records table issues for samples functionality
BEGIN;

-- Add sample_id column if it doesn't exist
ALTER TABLE public.weight_records
ADD COLUMN IF NOT EXISTS sample_id INTEGER;

-- Add foreign key constraint to samples_item if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_weight_records_sample_id'
  ) THEN
    ALTER TABLE public.weight_records 
    ADD CONSTRAINT fk_weight_records_sample_id 
    FOREIGN KEY (sample_id) REFERENCES public.samples_item(id);
  END IF;
END
$$;

-- Check if id column exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'weight_records' 
    AND column_name = 'id'
  ) THEN
    ALTER TABLE public.weight_records DROP COLUMN id;
    RAISE NOTICE 'Removed id column from weight_records table';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not drop id column, error: %', SQLERRM;
END
$$;

-- Create index for sample_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_weight_records_sample_id
ON public.weight_records(sample_id);

-- Migrasi data: Memperbarui sample_id dari item_id jika memungkinkan
DO $$
BEGIN
  -- Coba update sample_id berdasarkan kesesuaian nama antara ref_items dan samples_item
  EXECUTE '
    UPDATE weight_records wr
    SET sample_id = si.id
    FROM ref_items ri, samples_item si
    WHERE wr.item_id = ri.id
    AND LOWER(ri.name) LIKE LOWER(''%'' || si.item || ''%'')
    AND wr.sample_id IS NULL
  ';
  
  RAISE NOTICE 'Data migration completed for weight_records table';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error during data migration: %', SQLERRM;
END
$$;

COMMIT;
