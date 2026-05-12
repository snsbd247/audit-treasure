
-- ============================================================
-- Comprehensive RLS hardening — fix scan findings
-- Enable RLS + super-admin-only (or owner+super-admin) policies
-- All app data access goes through Laravel (service role), so
-- locking the anon/authenticated paths is safe.
-- ============================================================

-- Helper: ensure is_super_admin exists (idempotent re-create)
CREATE OR REPLACE FUNCTION public.is_super_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role::text = 'super_admin'
  )
$$;

-- ---------- Generic: super-admin-only tables ----------
DO $$
DECLARE
  t text;
  super_only text[] := ARRAY[
    'employee_documents','sms_logs','biometric_devices','biometric_logs',
    'face_data','backup_settings','backup_history','login_logs',
    'employee_emergency_contacts','fund_transactions','employee_fund_settings',
    'user_activities','user_custom_roles'
  ];
BEGIN
  FOREACH t IN ARRAY super_only LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "Super admins manage %1$s" ON public.%1$I', t);
      EXECUTE format(
        'CREATE POLICY "Super admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()))',
        t
      );
    END IF;
  END LOOP;
END $$;

-- ---------- Authenticated-read tables (PII but needed by app) ----------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read customers" ON public.customers;
DROP POLICY IF EXISTS "Super admins manage customers" ON public.customers;
CREATE POLICY "Authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='suppliers') THEN
    EXECUTE 'ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated read suppliers" ON public.suppliers';
    EXECUTE 'DROP POLICY IF EXISTS "Super admins manage suppliers" ON public.suppliers';
    EXECUTE 'CREATE POLICY "Authenticated read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Super admins manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()))';
  END IF;
END $$;

-- ---------- profiles: own row + super admin ----------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins manage profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Super admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ---------- employees: own row (via user_id) + super admin ----------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees view own row" ON public.employees;
DROP POLICY IF EXISTS "Super admins manage employees" ON public.employees;
CREATE POLICY "Employees view own row" ON public.employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins manage employees" ON public.employees FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ---------- Owner-or-super-admin via employee_id ----------
DO $$
DECLARE t text;
  owner_tbl text[] := ARRAY['employee_education','employee_experience'];
BEGIN
  FOREACH t IN ARRAY owner_tbl LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "Employees view own %1$s" ON public.%1$I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Super admins manage %1$s" ON public.%1$I', t);
      EXECUTE format(
        'CREATE POLICY "Employees view own %1$s" ON public.%1$I FOR SELECT TO authenticated USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR public.is_super_admin(auth.uid()))',
        t
      );
      EXECUTE format(
        'CREATE POLICY "Super admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()))',
        t
      );
    END IF;
  END LOOP;
END $$;

-- ---------- Messaging: only conversation participants ----------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Super admins manage conversations" ON public.conversations;
CREATE POLICY "Participants view conversations" ON public.conversations FOR SELECT TO authenticated
  USING (id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
         OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins manage conversations" ON public.conversations FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Super admins manage participants" ON public.conversation_participants;
CREATE POLICY "Users view own participation" ON public.conversation_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid())
         OR conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Super admins manage participants" ON public.conversation_participants FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Participants view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
DROP POLICY IF EXISTS "Super admins manage messages" ON public.messages;
CREATE POLICY "Participants view messages" ON public.messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
         OR public.is_super_admin(auth.uid()));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()
              AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Super admins manage messages" ON public.messages FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ---------- page_shortcuts: tighten ALL policy ----------
DROP POLICY IF EXISTS "Authenticated can manage shortcuts" ON public.page_shortcuts;
DROP POLICY IF EXISTS "Super admins manage page_shortcuts" ON public.page_shortcuts;
CREATE POLICY "Super admins manage page_shortcuts" ON public.page_shortcuts FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
-- (existing "Anyone can read active shortcuts" policy stays)
