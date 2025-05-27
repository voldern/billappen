-- Test script to verify RLS policies are working correctly
-- Run these queries in Supabase SQL editor to test

-- 1. Test as an anonymous user (should fail)
SET ROLE anon;
SELECT COUNT(*) FROM questions; -- Should return error or 0
SELECT COUNT(*) FROM answer_options; -- Should return error or 0
SELECT COUNT(*) FROM test_results; -- Should return error or 0

-- 2. Test as an authenticated user
-- First, you need to get a user ID from your auth.users table
-- Replace 'your-user-uuid-here' with an actual user ID from your database

-- Switch to authenticated role
SET ROLE authenticated;

-- Set the current user (replace with actual user ID)
-- In production, this is handled automatically by Supabase
SET request.jwt.claim.sub = 'your-user-uuid-here';

-- These should work for authenticated users
SELECT COUNT(*) FROM questions; -- Should return count
SELECT COUNT(*) FROM answer_options; -- Should return count

-- These should only show the current user's data
SELECT * FROM test_results; -- Should only show results where user_id matches
SELECT * FROM test_answers ta 
JOIN test_results tr ON ta.test_result_id = tr.id
WHERE tr.user_id = current_setting('request.jwt.claim.sub')::uuid;

-- 3. Test that users cannot see other users' data
-- Create a test with a different user ID (this should fail)
INSERT INTO test_results (user_id, score, total_questions, duration)
VALUES ('different-user-uuid', 10, 20, 300000); -- Should fail

-- 4. Reset role
RESET ROLE;

-- Useful queries to check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;