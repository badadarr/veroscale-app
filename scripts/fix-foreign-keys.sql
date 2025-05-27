-- Fix foreign key constraint conflicts in weight_records table
-- This script removes conflicting foreign key constraints and creates them with proper names

-- First, check existing constraints
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
AND conrelid = 'public.weight_records'::regclass;

-- Drop all existing foreign key constraints on weight_records table
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.weight_records'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.weight_records DROP CONSTRAINT IF EXISTS ' || constraint_rec.conname;
    END LOOP;
END $$;

-- Recreate foreign key constraints with proper names
-- Foreign key for user_id (the creator of the weight record)
ALTER TABLE public.weight_records 
ADD CONSTRAINT weight_records_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Foreign key for item_id
ALTER TABLE public.weight_records 
ADD CONSTRAINT weight_records_item_id_fkey 
FOREIGN KEY (item_id) REFERENCES public.ref_items(id);

-- Foreign key for approved_by (the user who approved the record)
ALTER TABLE public.weight_records 
ADD CONSTRAINT fk_weight_records_approved_by 
FOREIGN KEY (approved_by) REFERENCES public.users(id);

-- Verify the constraints are created properly
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
AND conrelid = 'public.weight_records'::regclass
ORDER BY conname;
