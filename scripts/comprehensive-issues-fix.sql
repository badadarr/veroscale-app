-- COMPREHENSIVE FIX for Issues Table
-- Run this complete script in Supabase SQL Editor

-- Step 1: Clear any potential cache issues by refreshing schema
NOTIFY pgrst, 'reload schema';

-- Step 2: Fix priority constraint (change 'urgent' to 'critical')
ALTER TABLE public.issues 
DROP CONSTRAINT IF EXISTS issues_priority_check;

ALTER TABLE public.issues 
ADD CONSTRAINT issues_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Step 3: Ensure all required columns exist with correct types
-- Add record_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issues' 
      AND table_schema = 'public'
      AND column_name = 'record_id'
  ) THEN
    ALTER TABLE public.issues ADD COLUMN record_id INTEGER NULL;
  END IF;
END
$$;

-- Step 4: Update any existing urgent priority to critical
UPDATE public.issues SET priority = 'critical' WHERE priority = 'urgent';

-- Step 5: Test insert with exact data from error log
DO $$
DECLARE
  test_user_id INTEGER;
  test_result TEXT;
BEGIN
  -- First check if user exists
  SELECT id INTO test_user_id FROM public.users WHERE id = 4 LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'User with ID 4 does not exist. Creating test user...';
    INSERT INTO public.users (id, email, name, role, password_hash, created_at, updated_at)
    VALUES (4, 'badar@gmail.com', 'Badar Test', 'operator', 'dummy_hash', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- Now test the exact insert that's failing
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
      'Issue with record #2: feature_request',
      'sdsdsd',
      'feature_request',
      'medium', 
      'pending',
      4,
      2,
      NOW(),
      NOW()
    );
    
    test_result := 'SUCCESS: Test insert completed successfully';
    
    -- Clean up test record
    DELETE FROM public.issues 
    WHERE title = 'Issue with record #2: feature_request' 
      AND description = 'sdsdsd';
      
  EXCEPTION WHEN OTHERS THEN
    test_result := 'ERROR in test insert: ' || SQLERRM;
  END;
  
  RAISE NOTICE '%', test_result;
END
$$;

-- Step 6: Show final table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'issues' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Show updated constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'issues' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;
