-- SAFE FIX for Issues Table - Clean data first
-- Run this script in Supabase SQL Editor

-- Step 1: Check what data currently exists
SELECT 'Current priority values:' as info;
SELECT priority, COUNT(*) as count
FROM public.issues 
GROUP BY priority
ORDER BY priority;

SELECT 'Current status values:' as info;
SELECT status, COUNT(*) as count
FROM public.issues 
GROUP BY status
ORDER BY status;

-- Step 2: Drop existing constraints first
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_priority_check;
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check1;

-- Step 3: Clean up invalid data BEFORE adding constraints
-- Fix priority values
UPDATE public.issues 
SET priority = CASE 
  WHEN priority = 'urgent' THEN 'critical'
  WHEN priority NOT IN ('low', 'medium', 'high', 'critical') THEN 'medium'
  ELSE priority
END
WHERE priority IS NULL 
   OR priority NOT IN ('low', 'medium', 'high', 'critical');

-- Fix status values  
UPDATE public.issues 
SET status = CASE 
  WHEN status IS NULL THEN 'pending'
  WHEN status NOT IN ('pending', 'in_review', 'resolved', 'rejected') THEN 'pending'
  ELSE status
END
WHERE status IS NULL 
   OR status NOT IN ('pending', 'in_review', 'resolved', 'rejected');

-- Step 4: Verify data is clean
SELECT 'Priority values after cleanup:' as info;
SELECT priority, COUNT(*) as count
FROM public.issues 
GROUP BY priority
ORDER BY priority;

SELECT 'Status values after cleanup:' as info;
SELECT status, COUNT(*) as count
FROM public.issues 
GROUP BY status
ORDER BY status;

-- Step 5: Add constraints back
ALTER TABLE public.issues 
ADD CONSTRAINT issues_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.issues 
ADD CONSTRAINT issues_status_check 
CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected'));

-- Step 6: Add issue_type constraint if missing
ALTER TABLE public.issues 
DROP CONSTRAINT IF EXISTS issues_issue_type_check;

ALTER TABLE public.issues 
ADD CONSTRAINT issues_issue_type_check 
CHECK (issue_type IN ('data_correction', 'system_error', 'feature_request', 'other'));

-- Step 7: Ensure record_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' 
      AND table_schema = 'public'
      AND column_name = 'record_id'
  ) THEN
    ALTER TABLE public.issues ADD COLUMN record_id INTEGER NULL;
    RAISE NOTICE 'Added record_id column';
  ELSE
    RAISE NOTICE 'record_id column already exists';
  END IF;
END
$$;

-- Step 8: Test insert
DO $$
DECLARE
  test_result TEXT;
BEGIN
  BEGIN
    INSERT INTO public.issues (
      title,
      description, 
      issue_type,
      priority,
      status,
      reporter_id,
      record_id,
      created_at,
      updated_at
    ) VALUES (
      'Test Issue',
      'Test description',
      'feature_request',
      'medium', 
      'pending',
      1,
      NULL,
      NOW(),
      NOW()
    );
    
    test_result := 'SUCCESS: Test insert completed successfully';
    
    -- Clean up test record
    DELETE FROM public.issues 
    WHERE title = 'Test Issue' 
      AND description = 'Test description';
      
  EXCEPTION WHEN OTHERS THEN
    test_result := 'ERROR in test insert: ' || SQLERRM;
  END;
  
  RAISE NOTICE '%', test_result;
END
$$;

-- Step 9: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 10: Show final table info
SELECT 'Final table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'issues' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Final constraints:' as info;
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'issues' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.constraint_name;
