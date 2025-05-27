# Supabase Setup Guide for Førerkort App

## Overview

This guide will help you set up Supabase for the Førerkort app to store and retrieve questions, answer options, and test results.

## Database Schema

The app uses the following tables:

### 1. `questions` table

- `id` (UUID, Primary Key): Unique identifier for each question
- `question` (TEXT): The question text
- `correct_answer` (INTEGER): Index of the correct answer option (0-based)
- `explanation` (TEXT): Explanation shown after answering
- `category` (VARCHAR): Question category (e.g., "Fartsregler", "Lysbruk")
- `created_at` (TIMESTAMP): When the question was created
- `updated_at` (TIMESTAMP): When the question was last updated

### 2. `answer_options` table

- `id` (UUID, Primary Key): Unique identifier
- `question_id` (UUID, Foreign Key): References questions.id
- `option_text` (TEXT): The answer option text
- `option_index` (INTEGER): Order of the option (0-based)
- `created_at` (TIMESTAMP): When the option was created

### 3. `test_results` table

- `id` (UUID, Primary Key): Unique identifier for each test
- `user_id` (UUID, nullable): For future user authentication
- `score` (INTEGER): Number of correct answers
- `total_questions` (INTEGER): Total questions in the test
- `duration` (INTEGER): Test duration in seconds
- `created_at` (TIMESTAMP): When the test was taken

### 4. `test_answers` table

- `id` (UUID, Primary Key): Unique identifier
- `test_result_id` (UUID, Foreign Key): References test_results.id
- `question_id` (UUID, Foreign Key): References questions.id
- `selected_answer` (INTEGER): Index of selected answer
- `is_correct` (BOOLEAN): Whether the answer was correct
- `time_spent` (INTEGER): Time spent on question in seconds
- `created_at` (TIMESTAMP): When the answer was recorded

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Choose a name, database password, and region
3. Wait for the project to be provisioned

### 2. Run the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste it into the SQL Editor and click "Run"
4. This will create all the necessary tables, indexes, and security policies

### 3. Get Your API Keys

1. In the Supabase dashboard, go to Settings → API
2. Copy the following values:
   - `Project URL` (this is your SUPABASE_URL)
   - `anon` public key (this is your SUPABASE_ANON_KEY)

### 4. Configure the App

1. Create a `.env` file in the `forerkortet-app` directory:

   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 5. Migrate Existing Questions (Optional)

If you want to populate the database with the sample questions:

1. Make sure your `.env` file is configured
2. Run the migration script:
   ```bash
   npx tsx src/scripts/migrateQuestions.ts
   ```

This will upload all questions from `src/assets/data/questions.json` to your Supabase database.

## Using the Supabase Service

The app now uses `SupabaseQuestionService` instead of the local JSON file. The service provides these methods:

```typescript
// Get all questions
const questions = await supabaseQuestionService.getAllQuestions();

// Get a specific question
const question = await supabaseQuestionService.getQuestionById('question-id');

// Get questions by category
const categoryQuestions = await supabaseQuestionService.getQuestionsByCategory('Fartsregler');

// Get random questions for a test
const testQuestions = await supabaseQuestionService.getRandomQuestions(40);

// Get all categories
const categories = await supabaseQuestionService.getCategories();

// Save test results
const testResultId = await supabaseQuestionService.saveTestResult({
  score: 35,
  totalQuestions: 40,
  duration: 1800, // 30 minutes in seconds
  answers: [...]
});
```

## Security

The current setup allows:

- Anyone to read questions and answer options
- Anyone to create test results and answers
- Test results are readable by everyone (can be restricted later with authentication)

Row Level Security (RLS) is enabled on all tables for future authentication implementation.

## Adding New Questions

You can add questions directly in Supabase:

1. Go to the Table Editor in Supabase
2. Select the `questions` table
3. Click "Insert row" and fill in the question details
4. After adding the question, go to `answer_options` table
5. Add 4 answer options for the question, setting the correct `option_index` (0-3)

## Troubleshooting

### "Missing Supabase environment variables" error

- Make sure you've created the `.env` file with your credentials
- Restart the Expo development server after adding environment variables

### Questions not loading

- Check that your Supabase URL and anon key are correct
- Verify that the tables were created successfully in Supabase
- Check the browser console for any error messages

### Migration script fails

- Ensure your `.env` file is properly configured
- Check that the tables exist in your Supabase project
- Look for specific error messages in the console output
