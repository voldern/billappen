-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    category VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answer_options table
CREATE TABLE IF NOT EXISTS public.answer_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, option_index)
);

-- Create test_results table
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Can be NULL for anonymous users
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_answers table
CREATE TABLE IF NOT EXISTS public.test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_result_id UUID NOT NULL REFERENCES public.test_results(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id),
    selected_answer INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER NOT NULL, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_answer_options_question_id ON public.answer_options(question_id);
CREATE INDEX idx_test_answers_test_result_id ON public.test_answers(test_result_id);
CREATE INDEX idx_test_answers_question_id ON public.test_answers(question_id);
CREATE INDEX idx_questions_category ON public.questions(category);
CREATE INDEX idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX idx_test_results_created_at ON public.test_results(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for questions table
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (read-only for questions)
CREATE POLICY "Questions are readable by everyone" 
    ON public.questions FOR SELECT 
    USING (true);

CREATE POLICY "Answer options are readable by everyone" 
    ON public.answer_options FOR SELECT 
    USING (true);

-- Policies for migration and admin operations
-- NOTE: In production, you should restrict these to authenticated admin users only
CREATE POLICY "Questions can be inserted by anyone" 
    ON public.questions FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Answer options can be inserted by anyone" 
    ON public.answer_options FOR INSERT 
    WITH CHECK (true);

-- Test results and answers can be created by anyone but only read by the creator
CREATE POLICY "Anyone can create test results" 
    ON public.test_results FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Anyone can create test answers" 
    ON public.test_answers FOR INSERT 
    WITH CHECK (true);

-- For reading test results, we'll allow all for now (you can restrict later with auth)
CREATE POLICY "Test results are readable by everyone" 
    ON public.test_results FOR SELECT 
    USING (true);

CREATE POLICY "Test answers are readable by everyone" 
    ON public.test_answers FOR SELECT 
    USING (true); 