# RLS Quick Reference

## What Can Users Do?

### ✅ Authenticated Users CAN:
- View all questions
- View all answer options  
- View their own test results
- View their own test answers
- Create new test results (for themselves)
- Create new test answers (for their own tests)

### ❌ Users CANNOT:
- View other users' test results
- View other users' test answers
- Modify any test results (even their own)
- Delete any test results
- Create/modify/delete questions
- Create/modify/delete answer options

### 🚫 Unauthenticated Users CANNOT:
- Access any data at all

## SQL Commands Cheat Sheet

```sql
-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relnamespace = 'public'::regnamespace;

-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Test as different roles
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
-- Run your queries
RESET ROLE;
```

## Common Patterns

### "Users can view own data"
```sql
CREATE POLICY "View own data" ON table_name
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

### "Users can insert own data"
```sql
CREATE POLICY "Insert own data" ON table_name
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
```

### "Authenticated users can view"
```sql
CREATE POLICY "Auth can view" ON table_name
FOR SELECT TO authenticated
USING (true);
```

## Debugging Tips

1. **Check Supabase Logs**: Dashboard → Logs → Filter by "auth"
2. **Test with SQL Editor**: Use SET ROLE to simulate different users
3. **Verify Auth**: Ensure `auth.uid()` returns expected value
4. **Check Policies**: Use `pg_policies` view to see active policies