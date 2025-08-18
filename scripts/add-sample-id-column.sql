-- Add sample_id column to weight_records table and update identifiers
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

-- Create index for sample_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_weight_records_sample_id
ON public.weight_records(sample_id);

COMMIT;
