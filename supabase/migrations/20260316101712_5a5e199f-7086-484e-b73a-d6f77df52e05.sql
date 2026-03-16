
-- Drop storage policies that depend on is_admin_or_super
DROP POLICY IF EXISTS "Admins can upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete backups" ON storage.objects;

-- Now drop trigger and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_admin_or_super(uuid);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.next_number(text);
DROP FUNCTION IF EXISTS public.get_email_by_username(text);
