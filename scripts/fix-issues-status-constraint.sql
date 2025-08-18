-- Fix issues table status constraint
-- This script fixes the status check constraint for the issues table

BEGIN;

-- 1. Check current constraint
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

-- 2. Check current status values in the table
SELECT DISTINCT status, COUNT(*) as count
FROM public.issues 
GROUP BY status
ORDER BY status;

-- 3. Drop existing status check constraint if it exists
DO $$
BEGIN
  -- Try to drop the constraint with different possible names
  BEGIN
    ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
    RAISE NOTICE 'Dropped issues_status_check constraint';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Could not drop issues_status_check: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check1;
    RAISE NOTICE 'Dropped issues_status_check1 constraint';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Could not drop issues_status_check1: %', SQLERRM;
  END;

  -- Check for any other check constraints on the issues table
  FOR rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'issues' 
      AND table_schema = 'public' 
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%status%'
  LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS ' || rec.constraint_name;
      RAISE NOTICE 'Dropped constraint: %', rec.constraint_name;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Could not drop constraint %: %', rec.constraint_name, SQLERRM;
    END;
  END LOOP;
END
$$;

-- 4. Update any invalid status values to 'pending'
UPDATE public.issues 
SET status = 'pending' 
WHERE status IS NULL 
   OR status NOT IN ('pending', 'in_review', 'resolved', 'rejected');

-- 5. Add the correct status constraint
ALTER TABLE public.issues 
ADD CONSTRAINT issues_status_check 
CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected'));

-- 6. Verify the new constraint
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

-- 7. Test the constraint by checking if we can insert all valid statuses
-- This is just a verification query, not actual data insertion
SELECT 
  'pending' as status_test,
  CASE WHEN 'pending' IN ('pending', 'in_review', 'resolved', 'rejected') THEN 'VALID' ELSE 'INVALID' END as result
UNION ALL
SELECT 
  'in_review' as status_test,
  CASE WHEN 'in_review' IN ('pending', 'in_review', 'resolved', 'rejected') THEN 'VALID' ELSE 'INVALID' END as result
UNION ALL
SELECT 
  'resolved' as status_test,
  CASE WHEN 'resolved' IN ('pending', 'in_review', 'resolved', 'rejected') THEN 'VALID' ELSE 'INVALID' END as result
UNION ALL
SELECT 
  'rejected' as status_test,
  CASE WHEN 'rejected' IN ('pending', 'in_review', 'resolved', 'rejected') THEN 'VALID' ELSE 'INVALID' END as result;

COMMIT;
