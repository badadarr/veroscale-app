-- Add missing columns to weight_records table for multi-material API
BEGIN;

-- Add batch_number column if it doesn't exist
ALTER TABLE public.weight_records
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);

-- Add source and destination columns if they don't exist
ALTER TABLE public.weight_records
ADD COLUMN IF NOT EXISTS source VARCHAR(255),
ADD COLUMN IF NOT EXISTS destination VARCHAR(255);

-- Add unit column if it doesn't exist
ALTER TABLE public.weight_records
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'kg';

-- Add created_at column if it doesn't exist
-- Note: This table already has a "timestamp" column which serves a similar purpose,
-- but the API is expecting a column specifically named "created_at"
ALTER TABLE public.weight_records
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add index for batch_number for faster querying
CREATE INDEX IF NOT EXISTS idx_weight_records_batch_number 
ON public.weight_records(batch_number);

COMMIT;
