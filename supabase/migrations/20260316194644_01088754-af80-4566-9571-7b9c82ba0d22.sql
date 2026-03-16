
CREATE TABLE public.page_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut_code text NOT NULL UNIQUE,
  page_name text NOT NULL,
  page_url text NOT NULL,
  module_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_shortcuts_code ON public.page_shortcuts (shortcut_code);
CREATE INDEX idx_page_shortcuts_module ON public.page_shortcuts (module_name);

CREATE TABLE public.user_favorite_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_url)
);

ALTER TABLE public.page_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active shortcuts" ON public.page_shortcuts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own favorites" ON public.user_favorite_pages
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.page_shortcuts (shortcut_code, page_name, page_url, module_name) VALUES
  ('A10', 'Chart of Accounts', '/accounts/chart', 'Accounts'),
  ('A20', 'Accounting Vouchers', '/accounts/vouchers', 'Accounts'),
  ('S10', 'Sales Invoice', '/sales', 'Sales'),
  ('S20', 'Sales Returns', '/sales/returns', 'Sales'),
  ('P10', 'Purchase Entry', '/purchase', 'Purchase'),
  ('P20', 'Purchase Returns', '/purchase/returns', 'Purchase'),
  ('I10', 'Item Master', '/inventory/items', 'Inventory'),
  ('I20', 'Item Categories', '/inventory/categories', 'Inventory'),
  ('I30', 'Units', '/inventory/units', 'Inventory'),
  ('I40', 'Warehouses', '/inventory/warehouses', 'Inventory'),
  ('I50', 'Stock Transfers', '/inventory/transfers', 'Inventory'),
  ('I60', 'Stock Adjustments', '/inventory/adjustments', 'Inventory'),
  ('I70', 'Stock Ledger', '/inventory/stock-ledger', 'Inventory'),
  ('M10', 'Bill of Materials', '/manufacturing/bom', 'Manufacturing'),
  ('M20', 'Production', '/manufacturing/production', 'Manufacturing'),
  ('M30', 'Manufacturing Reports', '/manufacturing/reports', 'Manufacturing'),
  ('H10', 'Employees', '/hrm/employees', 'HRM'),
  ('H20', 'Departments', '/hrm/departments', 'HRM'),
  ('H30', 'Designations', '/hrm/designations', 'HRM'),
  ('H40', 'Attendance', '/hrm/attendance', 'HRM'),
  ('H50', 'Leave Management', '/hrm/leave', 'HRM'),
  ('H60', 'Payroll', '/hrm/payroll', 'HRM'),
  ('H70', 'Shifts', '/hrm/shifts', 'HRM'),
  ('H80', 'HR Dashboard', '/hrm/dashboard', 'HRM'),
  ('B10', 'Bank Accounts', '/bank/accounts', 'Bank'),
  ('B20', 'Cash Book', '/bank/cashbook', 'Bank'),
  ('R10', 'Financial Reports', '/reports/financial', 'Reports'),
  ('R20', 'Stock Reports', '/reports/stock-reports', 'Reports'),
  ('R30', 'Low Stock Report', '/reports/low-stock', 'Reports'),
  ('C10', 'Customers', '/customers', 'Sales'),
  ('C20', 'Suppliers', '/suppliers', 'Purchase'),
  ('D10', 'Dashboard', '/', 'General'),
  ('X10', 'Users', '/admin/users', 'Admin'),
  ('X20', 'Roles', '/admin/roles', 'Admin'),
  ('X30', 'Branches', '/admin/branches', 'Admin'),
  ('X40', 'General Settings', '/admin/settings', 'Admin'),
  ('X50', 'Document Numbering', '/admin/numbering', 'Admin'),
  ('X60', 'Audit Log', '/admin/audit-log', 'Admin'),
  ('X70', 'Backup', '/admin/backup', 'Admin'),
  ('X80', 'Page Shortcuts', '/admin/shortcuts', 'Admin');
