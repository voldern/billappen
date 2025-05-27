# Road Signs Questions Setup Guide

This guide explains how to set up and use road sign questions in the Førerkort app.

## Overview

The system supports questions with images (road signs) that are embedded directly in the React Native app for offline access.

## Setup Steps

### 1. Database Schema Update

Run the following SQL in your Supabase dashboard to add image support:

```sql
-- Add image support to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS sign_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20),
ADD COLUMN IF NOT EXISTS source_question_id VARCHAR(100);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_sign_id ON public.questions(sign_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_source_id ON public.questions(source_question_id);
```

### 2. Generate Sign Questions

```bash
cd questions-generator/forerkortet-tools

# Generate questions for road signs
forerkortet questions road-signs-separate \
  -s data/input/signs.json \
  -o data/output/signs \
  -a 10 \
  --no-descriptions
```

### 3. Copy Sign Images to React Native App

```bash
# This script copies and renames sign images to the app
python copy_signs_to_app.py
```

This will:
- Copy all sign images to `forerkortet-app/src/assets/signs/`
- Create a TypeScript mapping file `signImages.ts`
- Generate clean filenames (e.g., `sign_100_1100.gif`)

### 4. Import Questions to Supabase

```bash
# First, create a .env file from the example
cp env.example .env
# Edit .env and add your Supabase credentials

# Run the import script
python import_signs_to_supabase.py
```

The import script will:
- Load all generated sign questions
- Import them to Supabase with proper relationships
- Skip duplicates automatically
- Show import statistics

## How It Works

### Question Structure

Each sign question includes:
- `id`: Unique question ID
- `question`: The question text
- `options`: Array of answer options
- `correctAnswer`: Index of correct answer
- `explanation`: Explanation text
- `category`: Question category (e.g., "Fareskilt")
- `signId`: ID of the road sign (e.g., "100.1100")
- `imageUrl`: URL to sign image (stored but not used in app)
- `difficulty`: Question difficulty level

### Image Display

The React Native app uses embedded images:
1. Images are stored in `src/assets/signs/`
2. A TypeScript mapping file maps sign IDs to images
3. The `QuestionScreen` component displays the image when `signId` is present
4. Images are displayed at 120x120 pixels with proper scaling

### Example Question with Image

```json
{
  "id": "sign_100.1100_q1",
  "question": "Hva betyr dette trafikkskiltet?",
  "options": ["Varsel om farlig høyresving", ...],
  "correctAnswer": 0,
  "explanation": "Dette skiltet varsler om...",
  "category": "Fareskilt",
  "difficulty": "easy",
  "signId": "100.1100"
}
```

## Troubleshooting

### Images Not Showing
- Check that sign images are in `src/assets/signs/`
- Verify `signImages.ts` exists and is properly imported
- Ensure the question has a valid `signId` field

### Import Errors
- Verify Supabase credentials in `.env`
- Check that the schema updates were applied
- Look for duplicate `source_question_id` values

### Missing Sign Images
- Run `copy_signs_to_app.py` again
- Check that source images exist in `data/input/signs/`
- Verify the sign ID matches between question and image

## Adding New Signs

1. Add new sign data to `data/input/signs.json`
2. Place sign images in `data/input/signs/`
3. Re-run the generation and import process