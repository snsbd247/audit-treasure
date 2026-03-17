-- Add enhanced fields to audit_log
ALTER TABLE public.audit_log 
  ADD COLUMN IF NOT EXISTS old_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS new_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS user_agent text DEFAULT NULL;

-- Create user_activities table for login/page tracking
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  activity_type text NOT NULL,
  description text DEFAULT NULL,
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  metadata jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_module ON public.audit_log(module);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);