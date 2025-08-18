-- Add missing columns to weight_records table
-- This script adds columns that are required by the application but missing from the current schema

-- Add sample_id column (nullable for backward compatibility)
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS sample_id INTEGER;

-- Add source column
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS source VARCHAR(255);

-- Add destination column  
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS destination VARCHAR(255);

-- Add notes column
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add unit column with default value
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'kg';

-- Add batch_number column
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);

-- Add foreign key constraint for sample_id (only if samples_item table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'samples_item') THEN
        ALTER TABLE public.weight_records 
        ADD CONSTRAINT fk_weight_records_sample_id 
        FOREIGN KEY (sample_id) REFERENCES public.samples_item(id);
    END IF;
EXCEPTION 
    WHEN duplicate_object THEN 
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Make item_id nullable for backward compatibility with sample-based records
ALTER TABLE public.weight_records ALTER COLUMN item_id DROP NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_weight_records_sample_id ON public.weight_records(sample_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_status ON public.weight_records(status);
CREATE INDEX IF NOT EXISTS idx_weight_records_user_id ON public.weight_records(user_id);
