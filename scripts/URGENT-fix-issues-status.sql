-- IMMEDIATE FIX FOR ISSUES STATUS CONSTRAINT
-- Run this SQL in your Supabase SQL Editor to fix the status constraint issue

-- Step 1: Check what constraints currently exist
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'issues' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK';

-- Step 2: Check what status values currently exist in the table
SELECT status, COUNT(*) as count
FROM public.issues 
GROUP BY status
ORDER BY status;

-- Step 3: Drop any existing status constraints
-- (This must be done before updating invalid values)
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check1;

-- Step 4: Update any invalid status values to valid ones
-- This fixes existing data that might be causing the constraint violation
UPDATE public.issues 
SET status = CASE 
  WHEN status IS NULL THEN 'pending'
  WHEN status NOT IN ('pending', 'in_review', 'resolved', 'rejected') THEN 'pending'
  ELSE status
END
WHERE status IS NULL 
   OR status NOT IN ('pending', 'in_review', 'resolved', 'rejected');

-- Step 5: Check status values after cleanup
SELECT status, COUNT(*) as count
FROM public.issues 
GROUP BY status
ORDER BY status;

-- Step 6: Add the correct constraint that allows 'rejected' status
ALTER TABLE public.issues 
ADD CONSTRAINT issues_status_check 
CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected'));

-- Step 7: Verify the constraint was added correctly
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'issues' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK';

-- Step 8: Test that 'rejected' status is now allowed
-- Uncomment and run this line to test:
-- UPDATE public.issues SET status = 'rejected' WHERE id = (SELECT id FROM public.issues LIMIT 1);
