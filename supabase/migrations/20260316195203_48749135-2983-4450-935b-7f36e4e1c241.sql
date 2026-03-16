
-- Allow authenticated users to manage shortcuts (admin-only enforced at app level)
CREATE POLICY "Authenticated can manage shortcuts" ON public.page_shortcuts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
