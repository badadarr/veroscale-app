-- DEBUG: Check what's causing the constraint violation
-- Run this to identify the problematic data

-- Step 1: Check what status values currently exist in the table
SELECT status, COUNT(*) as count
FROM public.issues 
GROUP BY status
ORDER BY status;

-- Step 2: Find any rows with NULL or invalid status values
SELECT id, title, status, 
       CASE 
         WHEN status IS NULL THEN 'NULL STATUS'
         WHEN status NOT IN ('pending', 'in_review', 'resolved', 'rejected') THEN 'INVALID STATUS'
         ELSE 'VALID'
       END as status_check
FROM public.issues 
WHERE status IS NULL 
   OR status NOT IN ('pending', 'in_review', 'resolved', 'rejected');

-- Step 3: Check for any hidden characters or encoding issues
SELECT id, title, 
       status,
       LENGTH(status) as status_length,
       ASCII(LEFT(status, 1)) as first_char_ascii,
       ASCII(RIGHT(status, 1)) as last_char_ascii
FROM public.issues
WHERE status IS NOT NULL;

-- Step 4: Try to identify the exact problematic row
-- This will show any status that doesn't exactly match our expected values
SELECT id, title, status,
       CASE status
         WHEN 'pending' THEN 'OK'
         WHEN 'in_review' THEN 'OK'
         WHEN 'resolved' THEN 'OK' 
         WHEN 'rejected' THEN 'OK'
         ELSE 'PROBLEM: ' || COALESCE(status, 'NULL')
       END as status_analysis
FROM public.issues;
