
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  is_encrypted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed Google Drive setting keys
INSERT INTO public.system_settings (setting_key, setting_value, is_encrypted) VALUES
  ('google_client_id', '', false),
  ('google_client_secret', '', true),
  ('google_refresh_token', '', true),
  ('google_drive_folder_id', '', false);
