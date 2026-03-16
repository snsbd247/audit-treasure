
-- Raw Materials
CREATE TABLE public.raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name TEXT NOT NULL,
  material_code TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view raw_materials" ON public.raw_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage raw_materials" ON public.raw_materials FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Bill of Materials (header)
CREATE TABLE public.bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view bom" ON public.bill_of_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bom" ON public.bill_of_materials FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- BOM Items
CREATE TABLE public.bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID REFERENCES public.bill_of_materials(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.raw_materials(id) NOT NULL,
  quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs'
);
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view bom_items" ON public.bom_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage bom_items" ON public.bom_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Production Entries
CREATE TABLE public.production_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_number TEXT NOT NULL UNIQUE,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  bom_id UUID REFERENCES public.bill_of_materials(id),
  quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
  branch_id UUID REFERENCES public.branches(id),
  raw_material_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  electricity_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view production" ON public.production_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert production" ON public.production_entries FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins manage production" ON public.production_entries FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Production consumed materials
CREATE TABLE public.production_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.production_entries(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.raw_materials(id) NOT NULL,
  quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
  cost NUMERIC(15,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.production_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view prod_materials" ON public.production_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage prod_materials" ON public.production_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'edit', 'delete', 'approve', 'reject', 'login', 'logout')),
  record_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can insert audit" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can view audit" ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

-- Add production number sequence
INSERT INTO public.number_sequences (id, prefix, current_number, year) VALUES ('production', 'PRD', 0, 2026);

-- Add raw material stock tracking to stock_movements
-- Already supports 'production_in' and 'production_out' movement types
