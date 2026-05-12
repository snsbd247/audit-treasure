
-- 1. Revoke EXECUTE on internal SECURITY DEFINER functions from API roles.
--    They still work inside RLS policies and triggers (run as definer), but
--    cannot be invoked directly via PostgREST.
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Make employee-photos bucket private (sensitive PII).
UPDATE storage.buckets SET public = false WHERE id = 'employee-photos';

-- 3. Remove any overly broad SELECT policies on storage.objects, then
--    add scoped ones.
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
DROP POLICY IF EXISTS "Public read employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins manage branding" ON storage.objects;
DROP POLICY IF EXISTS "Super admins manage employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins manage backups" ON storage.objects;

-- Branding (logos) — anyone may fetch a known file, but cannot list the bucket
CREATE POLICY "Public read branding"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'branding' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "Super admins manage branding"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'branding' AND public.is_super_admin(auth.uid()))
  WITH CHECK (bucket_id = 'branding' AND public.is_super_admin(auth.uid()));

-- Employee photos — only signed-in users may read
CREATE POLICY "Authenticated read employee photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-photos');

CREATE POLICY "Super admins manage employee photos"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'employee-photos' AND public.is_super_admin(auth.uid()))
  WITH CHECK (bucket_id = 'employee-photos' AND public.is_super_admin(auth.uid()));

-- Backups — already private, but ensure only super admins can touch
CREATE POLICY "Super admins manage backups"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'backups' AND public.is_super_admin(auth.uid()))
  WITH CHECK (bucket_id = 'backups' AND public.is_super_admin(auth.uid()));
