-- EMERGENCY FIX FOR ISSUES TABLE STRUCTURE
-- Run this SQL in your Supabase SQL Editor to fix the missing issue_type column

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'issues' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if issue_type column exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'issues' 
    AND table_schema = 'public'
    AND column_name = 'issue_type'
) as issue_type_exists;

-- Step 3: Check if type column exists (old column name)
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'issues' 
    AND table_schema = 'public'
    AND column_name = 'type'
) as type_exists;

-- Step 4: Add issue_type column if it doesn't exist
DO $$
BEGIN
  -- Check if issue_type column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'issues' 
      AND table_schema = 'public'
      AND column_name = 'issue_type'
  ) THEN
    -- Add issue_type column
    ALTER TABLE public.issues 
    ADD COLUMN issue_type VARCHAR(50) NOT NULL DEFAULT 'other';
    
    RAISE NOTICE 'Added issue_type column to issues table';
  ELSE
    RAISE NOTICE 'issue_type column already exists';
  END IF;
END
$$;

-- Step 5: Add constraint for issue_type if it doesn't exist
DO $$
BEGIN
  -- Check if constraint exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'issues_issue_type_check'
  ) THEN
    -- Add constraint
    ALTER TABLE public.issues 
    ADD CONSTRAINT issues_issue_type_check 
    CHECK (issue_type IN ('data_correction', 'system_error', 'feature_request', 'other'));
    
    RAISE NOTICE 'Added issue_type check constraint';
  ELSE
    RAISE NOTICE 'issue_type check constraint already exists';
  END IF;
END
$$;

-- Step 6: If there's a 'type' column, migrate data to 'issue_type' and drop 'type'
DO $$
BEGIN
  -- Check if old 'type' column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'issues' 
      AND table_schema = 'public'
      AND column_name = 'type'
  ) THEN
    -- Copy data from type to issue_type
    UPDATE public.issues 
    SET issue_type = COALESCE(type, 'other')
    WHERE issue_type IS NULL OR issue_type = '';
    
    -- Drop the old type column
    ALTER TABLE public.issues DROP COLUMN type;
    
    RAISE NOTICE 'Migrated data from type to issue_type column and dropped type column';
  ELSE
    RAISE NOTICE 'No type column found to migrate';
  END IF;
END
$$;

-- Step 7: Add record_id column if it doesn't exist (for linking to weight records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'issues' 
      AND table_schema = 'public'
      AND column_name = 'record_id'
  ) THEN
    ALTER TABLE public.issues 
    ADD COLUMN record_id INTEGER NULL;
    
    RAISE NOTICE 'Added record_id column to issues table';
  ELSE
    RAISE NOTICE 'record_id column already exists';
  END IF;
END
$$;

-- Step 8: Update any existing records with NULL issue_type to 'other'
UPDATE public.issues 
SET issue_type = 'other' 
WHERE issue_type IS NULL;

-- Step 9: Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'issues' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 10: Show current constraints
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

-- Step 11: Test inserting a record with issue_type
-- Uncomment to test:
-- INSERT INTO public.issues (title, description, issue_type, priority, status, reporter_id) 
-- VALUES ('Test Issue', 'Test description', 'data_correction', 'medium', 'pending', 1);
