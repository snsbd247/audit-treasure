
-- Financial Years
CREATE TABLE public.financial_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view financial years" ON public.financial_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage financial years" ON public.financial_years FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Chart of Accounts
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_code TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'income', 'expense', 'equity')),
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  opening_balance_type TEXT NOT NULL DEFAULT 'debit' CHECK (opening_balance_type IN ('debit', 'credit')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view accounts" ON public.chart_of_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage accounts" ON public.chart_of_accounts FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Accounting Vouchers
CREATE TABLE public.acc_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number TEXT NOT NULL UNIQUE,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('journal', 'payment', 'receipt', 'contra')),
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  branch_id UUID REFERENCES public.branches(id),
  financial_year_id UUID REFERENCES public.financial_years(id),
  description TEXT,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.acc_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view vouchers" ON public.acc_vouchers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert vouchers" ON public.acc_vouchers FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update draft vouchers" ON public.acc_vouchers FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins can manage vouchers" ON public.acc_vouchers FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Voucher Entries (debit/credit lines)
CREATE TABLE public.voucher_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES public.acc_vouchers(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  narration TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.voucher_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view entries" ON public.voucher_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage entries" ON public.voucher_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product Categories
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.product_categories FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.product_categories(id),
  unit TEXT NOT NULL DEFAULT 'pcs',
  selling_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  low_stock_threshold INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number TEXT NOT NULL UNIQUE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES public.suppliers(id),
  branch_id UUID REFERENCES public.branches(id),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view purchases" ON public.purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins manage purchases" ON public.purchases FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Purchase Items
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view purchase items" ON public.purchase_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage purchase items" ON public.purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Returns
CREATE TABLE public.purchase_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purchase_id UUID REFERENCES public.purchases(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  branch_id UUID REFERENCES public.branches(id),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view purchase returns" ON public.purchase_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage purchase returns" ON public.purchase_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Return Items
CREATE TABLE public.purchase_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_return_id UUID REFERENCES public.purchase_returns(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.purchase_return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view pr items" ON public.purchase_return_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage pr items" ON public.purchase_return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales Invoices
CREATE TABLE public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES public.customers(id),
  branch_id UUID REFERENCES public.branches(id),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view sales" ON public.sales_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert sales" ON public.sales_invoices FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins manage sales" ON public.sales_invoices FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Sales Invoice Items
CREATE TABLE public.sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_invoice_id UUID REFERENCES public.sales_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view sales items" ON public.sales_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage sales items" ON public.sales_invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales Returns
CREATE TABLE public.sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sales_invoice_id UUID REFERENCES public.sales_invoices(id),
  customer_id UUID REFERENCES public.customers(id),
  branch_id UUID REFERENCES public.branches(id),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view sales returns" ON public.sales_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage sales returns" ON public.sales_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales Return Items
CREATE TABLE public.sales_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_return_id UUID REFERENCES public.sales_returns(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.sales_return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view sr items" ON public.sales_return_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage sr items" ON public.sales_return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock Movements (ledger for inventory)
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'purchase_return', 'sale', 'sale_return', 'production_in', 'production_out', 'adjustment')),
  reference_type TEXT,
  reference_id UUID,
  quantity NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users view stock movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage stock movements" ON public.stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Voucher number sequences
CREATE TABLE public.number_sequences (
  id TEXT PRIMARY KEY,
  prefix TEXT NOT NULL,
  current_number INT NOT NULL DEFAULT 0,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
);
ALTER TABLE public.number_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can use sequences" ON public.number_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default sequences
INSERT INTO public.number_sequences (id, prefix, current_number, year) VALUES
  ('journal', 'JV', 0, 2026),
  ('payment', 'PV', 0, 2026),
  ('receipt', 'RV', 0, 2026),
  ('contra', 'CV', 0, 2026),
  ('purchase', 'PUR', 0, 2026),
  ('purchase_return', 'PR', 0, 2026),
  ('sales', 'INV', 0, 2026),
  ('sales_return', 'SR', 0, 2026);

-- Function to generate next number
CREATE OR REPLACE FUNCTION public.next_number(seq_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix TEXT;
  _num INT;
  _year INT;
BEGIN
  UPDATE public.number_sequences
  SET current_number = current_number + 1
  WHERE id = seq_id
  RETURNING prefix, current_number, year INTO _prefix, _num, _year;
  
  RETURN _prefix || '-' || _year || '-' || LPAD(_num::TEXT, 4, '0');
END;
$$;
