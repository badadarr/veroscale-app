-- Fix priority constraint in issues table
-- The current constraint uses 'urgent' but the app uses 'critical'

-- Step 1: Check current priority values in the table
SELECT DISTINCT priority, COUNT(*) as count
FROM public.issues 
GROUP BY priority
ORDER BY priority;

-- Step 2: Update any 'urgent' values to 'critical' (if any exist)
UPDATE public.issues 
SET priority = 'critical' 
WHERE priority = 'urgent';

-- Step 3: Drop the existing priority constraint
ALTER TABLE public.issues 
DROP CONSTRAINT IF EXISTS issues_priority_check;

-- Step 4: Add new priority constraint with 'critical' instead of 'urgent'
ALTER TABLE public.issues 
ADD CONSTRAINT issues_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Step 5: Verify the constraint is updated
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'issues' 
  AND tc.table_schema = 'public'
  AND tc.constraint_name = 'issues_priority_check';

-- Step 6: Test the constraint with valid values
-- Uncomment to test:
-- INSERT INTO public.issues (title, description, issue_type, priority, status, reporter_id) 
-- VALUES ('Test Critical', 'Test description', 'other', 'critical', 'pending', 1);
