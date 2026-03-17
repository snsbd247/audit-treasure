-- Create employee-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to employee-photos bucket
CREATE POLICY "Authenticated users can upload employee photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update employee photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-photos');

-- Allow public read access to employee photos
CREATE POLICY "Public can view employee photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'employee-photos');

-- Allow authenticated users to delete employee photos
CREATE POLICY "Authenticated users can delete employee photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-photos');