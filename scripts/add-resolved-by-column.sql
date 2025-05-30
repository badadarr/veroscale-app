-- Add resolved_by and resolution columns to issues table
-- This script can be run on existing database without losing data

-- Add the resolved_by column
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS resolved_by INTEGER NULL;

-- Add the resolution column
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS resolution TEXT NULL;

-- Add foreign key constraint for resolved_by
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_issues_resolved_by'
    ) THEN
        ALTER TABLE public.issues 
        ADD CONSTRAINT fk_issues_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES public.users(id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_issues_resolved_by ON public.issues(resolved_by);

-- Update timestamp function (if needed)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists for updated_at
DROP TRIGGER IF EXISTS set_timestamp ON public.issues;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();
