# Row Level Security Implementation Guide

## Overview
This guide explains how to implement Row Level Security (RLS) in Supabase to ensure:
- Only authenticated users can view questions
- Users can only see and create their own test results
- Users cannot modify or delete historical test data

## Implementation Steps

### 1. Backup Your Data
Before implementing RLS, backup your existing data:
```sql
-- Export your data using Supabase dashboard or pg_dump
```

### 2. Run the RLS Policy Script
Execute the `enable-rls-policies.sql` script in your Supabase SQL editor:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire contents of `enable-rls-policies.sql`
5. Click "Run"

### 3. Verify Implementation
Run the test queries from `test-rls-policies.sql` to ensure policies work correctly.

### 4. Update Your Application (if needed)
The application code should already be compatible, but verify:
- Authentication is required before accessing questions
- User ID is included when saving test results (already implemented)

## Security Rules Summary

### Questions & Answer Options
- **Read**: ✅ Authenticated users only
- **Write**: ❌ Not allowed (admin only via dashboard)

### Test Results
- **Read**: ✅ Own records only
- **Insert**: ✅ Own records only  
- **Update**: ❌ Not allowed (maintain integrity)
- **Delete**: ❌ Not allowed (maintain history)

### Test Answers
- **Read**: ✅ Own test answers only
- **Insert**: ✅ For own tests only
- **Update**: ❌ Not allowed
- **Delete**: ❌ Not allowed

## Benefits

1. **Data Privacy**: Users can only see their own test history
2. **Data Integrity**: Test results cannot be modified after creation
3. **Security**: Questions only accessible to logged-in users
4. **Performance**: Indexes on user_id for faster queries

## Troubleshooting

### If users cannot see questions:
1. Verify they are authenticated
2. Check the auth token is being sent with requests
3. Verify RLS is enabled on the questions table

### If test results aren't saving:
1. Ensure user_id is being included in the insert
2. Verify the user is authenticated
3. Check Supabase logs for policy violations

### To temporarily disable RLS (development only):
```sql
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers DISABLE ROW LEVEL SECURITY;
```

## Important Notes

1. **Always test in a development environment first**
2. **RLS policies are enforced at the database level** - even direct SQL queries respect them
3. **Service role keys bypass RLS** - never expose these in client applications
4. **The anon key respects RLS** - safe to use in client applications

## Additional Security Recommendations

1. **API Key Rotation**: Regularly rotate your API keys
2. **Monitor Usage**: Use Supabase's built-in monitoring
3. **Rate Limiting**: Consider implementing rate limiting
4. **Audit Logs**: Enable audit logs for sensitive operations