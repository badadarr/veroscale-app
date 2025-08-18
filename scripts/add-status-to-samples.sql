-- Add status column to samples_item table
ALTER TABLE public.samples_item ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Update existing records to have 'shipped' status
UPDATE public.samples_item SET status = 'shipped' WHERE status IS NULL OR status = 'pending';

-- Create index on status column for faster queries
CREATE INDEX IF NOT EXISTS idx_samples_item_status ON public.samples_item(status);