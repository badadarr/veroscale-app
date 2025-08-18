-- Add created_at column to weight_records table
-- This script adds the missing created_at column that the dashboard API expects

BEGIN;

-- Add created_at column if it doesn't exist
ALTER TABLE public.weight_records
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to copy timestamp values to created_at
-- This ensures existing data has the created_at field populated
UPDATE public.weight_records 
SET created_at = timestamp 
WHERE created_at IS NULL;

-- Create index for better performance on created_at queries
CREATE INDEX IF NOT EXISTS idx_weight_records_created_at 
ON public.weight_records(created_at);

-- Verify the column was added successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'weight_records' 
    AND column_name = 'created_at'
  ) THEN
    RAISE NOTICE 'SUCCESS: created_at column added to weight_records table';
  ELSE
    RAISE NOTICE 'ERROR: created_at column was not added';
  END IF;
END
$$;

COMMIT;

-- Show final table structure to verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'weight_records'
ORDER BY ordinal_position;
