
-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to branding bucket
CREATE POLICY "Public read branding" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'branding');

-- Allow authenticated users to upload to branding bucket
CREATE POLICY "Authenticated upload branding" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'branding');

-- Allow authenticated users to update branding assets
CREATE POLICY "Authenticated update branding" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'branding');

-- Allow authenticated users to delete branding assets
CREATE POLICY "Authenticated delete branding" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'branding');
