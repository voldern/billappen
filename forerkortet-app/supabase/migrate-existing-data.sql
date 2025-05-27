-- Migration script for existing data without user_id
-- Only run this if you have existing test results without user_id

-- 1. First, check if you have any test results without user_id
SELECT COUNT(*) as orphaned_results
FROM test_results 
WHERE user_id IS NULL;

-- 2. If you want to assign orphaned results to a specific user
-- Replace 'your-user-uuid' with the actual user ID
/*
UPDATE test_results 
SET user_id = 'your-user-uuid'
WHERE user_id IS NULL;
*/

-- 3. Or delete orphaned results (data loss warning!)
/*
DELETE FROM test_answers 
WHERE test_result_id IN (
  SELECT id FROM test_results WHERE user_id IS NULL
);

DELETE FROM test_results 
WHERE user_id IS NULL;
*/

-- 4. Make user_id required going forward (if not already)
ALTER TABLE test_results 
ALTER COLUMN user_id SET NOT NULL;

-- 5. Add foreign key constraint to auth.users (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'test_results_user_id_fkey'
  ) THEN
    ALTER TABLE test_results
    ADD CONSTRAINT test_results_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;