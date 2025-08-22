-- Add expected_weight column to samples_item table
ALTER TABLE public.samples_item ADD COLUMN IF NOT EXISTS expected_weight DECIMAL(10, 3);

-- Update existing samples with same value as sample_weight for now
UPDATE public.samples_item 
SET expected_weight = sample_weight 
WHERE expected_weight IS NULL;

-- Optional: Set default value for future records
ALTER TABLE public.samples_item ALTER COLUMN expected_weight SET DEFAULT 0.000;
