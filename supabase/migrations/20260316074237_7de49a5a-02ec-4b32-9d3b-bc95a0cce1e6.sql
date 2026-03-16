
-- Create backup_history table
CREATE TABLE public.backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  backup_type text NOT NULL DEFAULT 'manual', -- 'manual' or 'scheduled'
  format text NOT NULL DEFAULT 'json', -- 'json' or 'sql'
  status text NOT NULL DEFAULT 'completed', -- 'in_progress', 'completed', 'failed'
  tables_count integer NOT NULL DEFAULT 0,
  records_count integer NOT NULL DEFAULT 0,
  storage_path text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage backup history
CREATE POLICY "Super admins can manage backup history"
ON public.backup_history FOR ALL TO authenticated
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));

-- Create storage bucket for backups (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false);

-- Storage RLS: only admins can access backup files
CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'backups' AND is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can read backups"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'backups' AND is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can delete backups"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'backups' AND is_admin_or_super(auth.uid()));

-- Backup settings table for schedule config
CREATE TABLE public.backup_settings (
  id text PRIMARY KEY DEFAULT 'default',
  auto_backup_enabled boolean NOT NULL DEFAULT false,
  schedule_interval text NOT NULL DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  retention_days integer NOT NULL DEFAULT 30,
  last_auto_backup_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup settings"
ON public.backup_settings FOR ALL TO authenticated
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));

-- Insert default settings
INSERT INTO public.backup_settings (id) VALUES ('default');
