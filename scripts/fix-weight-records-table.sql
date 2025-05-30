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

-- Create an alias/view to make record_id accessible as id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'weight_records' 
    AND column_name = 'id'
  ) THEN
    ALTER TABLE public.weight_records ADD COLUMN id INTEGER GENERATED ALWAYS AS (record_id) STORED;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add generated column, error: %', SQLERRM;
END
$$;

-- Create index for sample_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_weight_records_sample_id
ON public.weight_records(sample_id);

COMMIT;
