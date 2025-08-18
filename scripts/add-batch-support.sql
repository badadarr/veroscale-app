-- Add batch support columns to weight_records table
ALTER TABLE public.weight_records
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS source VARCHAR(255),
ADD COLUMN IF NOT EXISTS destination VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'kg';

-- Create index for batch_number for better performance
CREATE INDEX IF NOT EXISTS idx_weight_records_batch_number ON public.weight_records(batch_number);

-- Create index for timestamp for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_weight_records_timestamp ON public.weight_records(timestamp);