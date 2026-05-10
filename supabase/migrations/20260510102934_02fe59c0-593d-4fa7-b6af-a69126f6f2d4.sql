
-- Helper function: check super_admin via user_roles (SECURITY DEFINER, avoids recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role::text = 'super_admin'
  )
$$;

-- ============ user_roles: fix permissive policy ============
DROP POLICY IF EXISTS "Authenticated users can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins manage user_roles" ON public.user_roles;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ payroll ============
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees view own payroll" ON public.payroll;
DROP POLICY IF EXISTS "Super admins manage payroll" ON public.payroll;
CREATE POLICY "Employees view own payroll" ON public.payroll
  FOR SELECT TO authenticated
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Super admins manage payroll" ON public.payroll
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ salary_structures ============
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees view own salary" ON public.salary_structures;
DROP POLICY IF EXISTS "Super admins manage salary" ON public.salary_structures;
CREATE POLICY "Employees view own salary" ON public.salary_structures
  FOR SELECT TO authenticated
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Super admins manage salary" ON public.salary_structures
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ attendance ============
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Super admins manage attendance" ON public.attendance;
CREATE POLICY "Employees view own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Super admins manage attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ overtime_records ============
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees view own overtime" ON public.overtime_records;
DROP POLICY IF EXISTS "Super admins manage overtime" ON public.overtime_records;
CREATE POLICY "Employees view own overtime" ON public.overtime_records
  FOR SELECT TO authenticated
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Super admins manage overtime" ON public.overtime_records
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ leave_requests ============
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees view own leave" ON public.leave_requests;
DROP POLICY IF EXISTS "Employees create own leave" ON public.leave_requests;
DROP POLICY IF EXISTS "Super admins manage leave" ON public.leave_requests;
CREATE POLICY "Employees view own leave" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Employees create own leave" ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Super admins manage leave" ON public.leave_requests
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ employee_bank_info ============
ALTER TABLE public.employee_bank_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees view own bank info" ON public.employee_bank_info;
DROP POLICY IF EXISTS "Super admins manage bank info" ON public.employee_bank_info;
CREATE POLICY "Employees view own bank info" ON public.employee_bank_info
  FOR SELECT TO authenticated
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Super admins manage bank info" ON public.employee_bank_info
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ audit_log: admins only ============
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins read audit log" ON public.audit_log;
CREATE POLICY "Super admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
-- Inserts happen via service role (edge functions / triggers) which bypass RLS.

-- ============ party_payments ============
ALTER TABLE public.party_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read party_payments" ON public.party_payments;
DROP POLICY IF EXISTS "Super admins manage party_payments" ON public.party_payments;
CREATE POLICY "Authenticated read party_payments" ON public.party_payments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage party_payments" ON public.party_payments
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
