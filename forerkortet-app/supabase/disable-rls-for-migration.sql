-- Temporarily disable RLS for migration
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options DISABLE ROW LEVEL SECURITY;

-- After migration, re-enable with:
-- ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY; 