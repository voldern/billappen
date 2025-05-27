-- Enable Row Level Security on all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Answer options are viewable by authenticated users" ON answer_options;
DROP POLICY IF EXISTS "Users can view own test results" ON test_results;
DROP POLICY IF EXISTS "Users can insert own test results" ON test_results;
DROP POLICY IF EXISTS "Users can view own test answers" ON test_answers;
DROP POLICY IF EXISTS "Users can insert own test answers" ON test_answers;

-- QUESTIONS TABLE POLICIES
-- Only authenticated users can view questions
CREATE POLICY "Questions are viewable by authenticated users" 
ON questions FOR SELECT 
TO authenticated 
USING (true);

-- ANSWER_OPTIONS TABLE POLICIES
-- Only authenticated users can view answer options
CREATE POLICY "Answer options are viewable by authenticated users" 
ON answer_options FOR SELECT 
TO authenticated 
USING (true);

-- TEST_RESULTS TABLE POLICIES
-- Users can only view their own test results
CREATE POLICY "Users can view own test results" 
ON test_results FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can only insert test results for themselves
CREATE POLICY "Users can insert own test results" 
ON test_results FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Users cannot update test results (maintain data integrity)
-- No UPDATE policy means updates are not allowed

-- Users cannot delete test results (maintain history)
-- No DELETE policy means deletes are not allowed

-- TEST_ANSWERS TABLE POLICIES
-- Users can view test answers for their own test results
CREATE POLICY "Users can view own test answers" 
ON test_answers FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM test_results 
    WHERE test_results.id = test_answers.test_result_id 
    AND test_results.user_id = auth.uid()
  )
);

-- Users can insert test answers for their own test results
CREATE POLICY "Users can insert own test answers" 
ON test_answers FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_results 
    WHERE test_results.id = test_answers.test_result_id 
    AND test_results.user_id = auth.uid()
  )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT ON questions TO authenticated;
GRANT SELECT ON answer_options TO authenticated;
GRANT SELECT, INSERT ON test_results TO authenticated;
GRANT SELECT, INSERT ON test_answers TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_test_result_id ON test_answers(test_result_id);

-- Add a function to get user statistics (optional but useful)
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid UUID)
RETURNS TABLE (
  total_tests INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  average_score NUMERIC,
  best_score NUMERIC,
  total_time_ms BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT tr.id)::INTEGER as total_tests,
    SUM(tr.total_questions)::INTEGER as total_questions,
    SUM(tr.score)::INTEGER as correct_answers,
    CASE 
      WHEN SUM(tr.total_questions) > 0 
      THEN ROUND((SUM(tr.score)::NUMERIC / SUM(tr.total_questions)::NUMERIC * 100), 2)
      ELSE 0
    END as average_score,
    COALESCE(MAX((tr.score::NUMERIC / tr.total_questions::NUMERIC * 100)), 0) as best_score,
    SUM(tr.duration)::BIGINT as total_time_ms
  FROM test_results tr
  WHERE tr.user_id = user_uuid
  AND tr.user_id = auth.uid(); -- Extra security check
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_statistics(UUID) TO authenticated;