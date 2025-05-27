-- Add image support to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS sign_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20),
ADD COLUMN IF NOT EXISTS source_question_id VARCHAR(100);

-- Create index for sign_id for better performance
CREATE INDEX IF NOT EXISTS idx_questions_sign_id ON public.questions(sign_id);

-- Create index for difficulty
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);

-- Create index for source_question_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_source_id ON public.questions(source_question_id);

-- Add comment to explain the new columns
COMMENT ON COLUMN public.questions.image_url IS 'URL to the image associated with the question (e.g., road sign image)';
COMMENT ON COLUMN public.questions.sign_id IS 'ID of the road sign if this is a sign-related question';
COMMENT ON COLUMN public.questions.difficulty IS 'Question difficulty level: easy, medium, hard';
COMMENT ON COLUMN public.questions.source_question_id IS 'Original question ID from the source data (prevents duplicate imports)';