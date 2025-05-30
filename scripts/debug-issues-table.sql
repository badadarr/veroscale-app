-- Debug script to understand the exact issue with issues table
-- Run this in Supabase SQL Editor to get detailed information

-- Step 1: Show exact table structure
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'issues' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Show all constraints with details
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause,
  tc.table_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'issues' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Step 3: Try to insert a test record to see exact error
-- This will show us what exactly is failing
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
      'Test Issue Debug',
      'Test description for debugging',
      'feature_request',
      'medium',
      'pending',
      1,
      2,
      NOW(),
      NOW()
    );
    
    test_result := 'SUCCESS: Test record inserted successfully';
    
    -- Clean up test record
    DELETE FROM public.issues WHERE title = 'Test Issue Debug';
    
  EXCEPTION WHEN OTHERS THEN
    test_result := 'ERROR: ' || SQLERRM;
  END;
  
  RAISE NOTICE '%', test_result;
END
$$;

-- Step 4: Show current data in issues table
SELECT 
  id,
  title,
  issue_type,
  priority,
  status,
  reporter_id,
  record_id,
  created_at
FROM public.issues 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 5: Check if reporter_id exists in users table
SELECT 
  u.id,
  u.name,
  u.email,
  u.role
FROM public.users u 
WHERE u.id = 4  -- The reporter_id from the error
LIMIT 1;
