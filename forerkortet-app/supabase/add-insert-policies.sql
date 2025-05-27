-- Add INSERT policies for migration
-- NOTE: In production, you should restrict these to authenticated admin users only

CREATE POLICY "Questions can be inserted by anyone" 
    ON public.questions FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Answer options can be inserted by anyone" 
    ON public.answer_options FOR INSERT 
    WITH CHECK (true); 