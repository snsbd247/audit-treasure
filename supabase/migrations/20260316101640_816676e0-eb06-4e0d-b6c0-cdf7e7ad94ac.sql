
-- ============================================
-- DROP ALL RLS POLICIES FROM ALL TABLES
-- ============================================

-- acc_vouchers
DROP POLICY IF EXISTS "Admins can manage vouchers" ON public.acc_vouchers;
DROP POLICY IF EXISTS "Auth users can insert vouchers" ON public.acc_vouchers;
DROP POLICY IF EXISTS "Auth users can view vouchers" ON public.acc_vouchers;
DROP POLICY IF EXISTS "Creators can update draft vouchers" ON public.acc_vouchers;
ALTER TABLE public.acc_vouchers DISABLE ROW LEVEL SECURITY;

-- audit_log
DROP POLICY IF EXISTS "Admins can view audit" ON public.audit_log;
DROP POLICY IF EXISTS "Auth users can insert audit" ON public.audit_log;
ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;

-- backup_history
DROP POLICY IF EXISTS "Super admins can manage backup history" ON public.backup_history;
ALTER TABLE public.backup_history DISABLE ROW LEVEL SECURITY;

-- backup_settings
DROP POLICY IF EXISTS "Admins can manage backup settings" ON public.backup_settings;
ALTER TABLE public.backup_settings DISABLE ROW LEVEL SECURITY;

-- bill_of_materials
DROP POLICY IF EXISTS "Admins manage bom" ON public.bill_of_materials;
DROP POLICY IF EXISTS "Auth users view bom" ON public.bill_of_materials;
ALTER TABLE public.bill_of_materials DISABLE ROW LEVEL SECURITY;

-- bom_items
DROP POLICY IF EXISTS "Auth users manage bom_items" ON public.bom_items;
DROP POLICY IF EXISTS "Auth users view bom_items" ON public.bom_items;
ALTER TABLE public.bom_items DISABLE ROW LEVEL SECURITY;

-- branches
DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;

-- chart_of_accounts
DROP POLICY IF EXISTS "Admins manage accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Auth users can view accounts" ON public.chart_of_accounts;
ALTER TABLE public.chart_of_accounts DISABLE ROW LEVEL SECURITY;

-- custom_roles
DROP POLICY IF EXISTS "Admins can manage custom roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Authenticated can view custom roles" ON public.custom_roles;
ALTER TABLE public.custom_roles DISABLE ROW LEVEL SECURITY;

-- customers
DROP POLICY IF EXISTS "Admins manage customers" ON public.customers;
DROP POLICY IF EXISTS "Auth users view customers" ON public.customers;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- financial_years
DROP POLICY IF EXISTS "Admins manage financial years" ON public.financial_years;
DROP POLICY IF EXISTS "Auth users can view financial years" ON public.financial_years;
ALTER TABLE public.financial_years DISABLE ROW LEVEL SECURITY;

-- number_sequences
DROP POLICY IF EXISTS "Auth users can use sequences" ON public.number_sequences;
ALTER TABLE public.number_sequences DISABLE ROW LEVEL SECURITY;

-- product_categories
DROP POLICY IF EXISTS "Admins manage categories" ON public.product_categories;
DROP POLICY IF EXISTS "Auth users view categories" ON public.product_categories;
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;

-- production_entries
DROP POLICY IF EXISTS "Admins manage production" ON public.production_entries;
DROP POLICY IF EXISTS "Auth users insert production" ON public.production_entries;
DROP POLICY IF EXISTS "Auth users view production" ON public.production_entries;
ALTER TABLE public.production_entries DISABLE ROW LEVEL SECURITY;

-- production_materials
DROP POLICY IF EXISTS "Auth users manage prod_materials" ON public.production_materials;
DROP POLICY IF EXISTS "Auth users view prod_materials" ON public.production_materials;
ALTER TABLE public.production_materials DISABLE ROW LEVEL SECURITY;

-- products
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
DROP POLICY IF EXISTS "Auth users view products" ON public.products;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- purchase_items
DROP POLICY IF EXISTS "Auth users manage purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Auth users view purchase items" ON public.purchase_items;
ALTER TABLE public.purchase_items DISABLE ROW LEVEL SECURITY;

-- purchase_return_items
DROP POLICY IF EXISTS "Auth users manage pr items" ON public.purchase_return_items;
DROP POLICY IF EXISTS "Auth users view pr items" ON public.purchase_return_items;
ALTER TABLE public.purchase_return_items DISABLE ROW LEVEL SECURITY;

-- purchase_returns
DROP POLICY IF EXISTS "Auth users manage purchase returns" ON public.purchase_returns;
DROP POLICY IF EXISTS "Auth users view purchase returns" ON public.purchase_returns;
ALTER TABLE public.purchase_returns DISABLE ROW LEVEL SECURITY;

-- purchases
DROP POLICY IF EXISTS "Admins manage purchases" ON public.purchases;
DROP POLICY IF EXISTS "Auth users insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Auth users view purchases" ON public.purchases;
ALTER TABLE public.purchases DISABLE ROW LEVEL SECURITY;

-- raw_materials
DROP POLICY IF EXISTS "Admins manage raw_materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Auth users view raw_materials" ON public.raw_materials;
ALTER TABLE public.raw_materials DISABLE ROW LEVEL SECURITY;

-- role_permissions
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated can view role permissions" ON public.role_permissions;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;

-- sales_invoice_items
DROP POLICY IF EXISTS "Auth users manage sales items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Auth users view sales items" ON public.sales_invoice_items;
ALTER TABLE public.sales_invoice_items DISABLE ROW LEVEL SECURITY;

-- sales_invoices
DROP POLICY IF EXISTS "Admins manage sales" ON public.sales_invoices;
DROP POLICY IF EXISTS "Auth users insert sales" ON public.sales_invoices;
DROP POLICY IF EXISTS "Auth users view sales" ON public.sales_invoices;
ALTER TABLE public.sales_invoices DISABLE ROW LEVEL SECURITY;

-- sales_return_items
DROP POLICY IF EXISTS "Auth users manage sr items" ON public.sales_return_items;
DROP POLICY IF EXISTS "Auth users view sr items" ON public.sales_return_items;
ALTER TABLE public.sales_return_items DISABLE ROW LEVEL SECURITY;

-- sales_returns
DROP POLICY IF EXISTS "Auth users manage sales returns" ON public.sales_returns;
DROP POLICY IF EXISTS "Auth users view sales returns" ON public.sales_returns;
ALTER TABLE public.sales_returns DISABLE ROW LEVEL SECURITY;

-- stock_movements
DROP POLICY IF EXISTS "Auth users manage stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Auth users view stock movements" ON public.stock_movements;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;

-- suppliers
DROP POLICY IF EXISTS "Admins manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Auth users view suppliers" ON public.suppliers;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- user_custom_roles
DROP POLICY IF EXISTS "Admins can manage user custom roles" ON public.user_custom_roles;
DROP POLICY IF EXISTS "Users can view own custom roles" ON public.user_custom_roles;
ALTER TABLE public.user_custom_roles DISABLE ROW LEVEL SECURITY;

-- user_roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- voucher_entries
DROP POLICY IF EXISTS "Auth users can manage entries" ON public.voucher_entries;
DROP POLICY IF EXISTS "Auth users can view entries" ON public.voucher_entries;
ALTER TABLE public.voucher_entries DISABLE ROW LEVEL SECURITY;

-- company_settings
DROP POLICY IF EXISTS "Auth users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;
