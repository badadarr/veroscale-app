-- Add approval tracking columns to weight_records table
-- This script adds the approved_by and approved_at columns to existing weight_records tables

-- For Supabase/PostgreSQL
ALTER TABLE public.weight_records 
ADD COLUMN IF NOT EXISTS approved_by INTEGER NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;

-- Add foreign key constraint for approved_by
ALTER TABLE public.weight_records 
ADD CONSTRAINT fk_weight_records_approved_by 
FOREIGN KEY (approved_by) REFERENCES public.users(id);

-- For MySQL (if needed)
-- ALTER TABLE weight_records 
-- ADD COLUMN approved_by INT NULL,
-- ADD COLUMN approved_at TIMESTAMP NULL,
-- ADD CONSTRAINT fk_weight_records_approved_by 
-- FOREIGN KEY (approved_by) REFERENCES users(id);
