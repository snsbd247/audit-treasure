
-- Fix number_sequences for accounting vouchers
INSERT INTO number_sequences (id, prefix, current_number, year, description) VALUES
  ('journal_voucher', 'JV', 0, 2026, 'Journal Voucher'),
  ('payment_voucher', 'PV', 0, 2026, 'Payment Voucher'),
  ('receipt_voucher', 'RV', 0, 2026, 'Receipt Voucher'),
  ('contra_voucher', 'CV', 0, 2026, 'Contra Voucher')
ON CONFLICT (id) DO NOTHING;

-- Add missing CoA accounts
INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, parent_id) VALUES
  ('ca000001-0000-0000-0000-000000000018', '5500', 'Purchase', 'expense', 'ca000001-0000-0000-0000-000000000013'),
  ('ca000001-0000-0000-0000-000000000019', '5600', 'Raw Material', 'expense', 'ca000001-0000-0000-0000-000000000013'),
  ('ca000001-0000-0000-0000-000000000020', '5700', 'Work in Progress', 'expense', 'ca000001-0000-0000-0000-000000000013'),
  ('ca000001-0000-0000-0000-000000000021', '5800', 'Manufacturing Overhead', 'expense', 'ca000001-0000-0000-0000-000000000013'),
  ('ca000001-0000-0000-0000-000000000022', '4200', 'Sales Return', 'income', 'ca000001-0000-0000-0000-000000000011'),
  ('ca000001-0000-0000-0000-000000000023', '5900', 'Purchase Return', 'expense', 'ca000001-0000-0000-0000-000000000013'),
  ('ca000001-0000-0000-0000-000000000024', '5150', 'Office Expense', 'expense', 'ca000001-0000-0000-0000-000000000013'),
  ('ca000001-0000-0000-0000-000000000025', '5160', 'Stock Adjustment', 'expense', 'ca000001-0000-0000-0000-000000000013')
ON CONFLICT (id) DO NOTHING;

-- Update company settings
UPDATE company_settings SET
  company_name = 'Demo Trading & Manufacturing Ltd',
  currency_code = 'BDT', currency_symbol = '৳',
  currency_name = 'Bangladeshi Taka', currency_position = 'before'
WHERE id = 'default';

-- Update branch
UPDATE branches SET name = 'Dhaka Branch', code = 'DHK', address = 'Dhaka, Bangladesh' WHERE id = 'b0000001-0000-0000-0000-000000000001';

-- Create warehouses (using valid hex UUIDs)
INSERT INTO warehouses (id, warehouse_code, warehouse_name, branch_id, description) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'MW', 'Main Warehouse', 'b0000001-0000-0000-0000-000000000001', 'Primary storage'),
  ('a0000001-0000-0000-0000-000000000002', 'RMW', 'Raw Material Warehouse', 'b0000001-0000-0000-0000-000000000001', 'Raw material storage'),
  ('a0000001-0000-0000-0000-000000000003', 'FGW', 'Finished Goods Warehouse', 'b0000001-0000-0000-0000-000000000001', 'Finished goods storage')
ON CONFLICT (id) DO NOTHING;

-- Create units
INSERT INTO units (id, name, abbreviation) VALUES
  ('a0000002-0000-0000-0000-000000000001', 'Piece', 'pcs'),
  ('a0000002-0000-0000-0000-000000000002', 'Kilogram', 'kg'),
  ('a0000002-0000-0000-0000-000000000003', 'Box', 'box')
ON CONFLICT (id) DO NOTHING;

-- Create item categories
INSERT INTO item_categories (id, name, description) VALUES
  ('a0000003-0000-0000-0000-000000000001', 'Electronics', 'Electronic products'),
  ('a0000003-0000-0000-0000-000000000002', 'Raw Materials', 'Raw materials for manufacturing'),
  ('a0000003-0000-0000-0000-000000000003', 'Packaging', 'Packaging materials')
ON CONFLICT (id) DO NOTHING;

-- Create items (products, raw materials, service)
INSERT INTO item_master (id, item_code, item_name, item_type, category_id, unit_id, cost_price, selling_price, min_stock_level, opening_stock, is_stock_item) VALUES
  ('a0000004-0000-0000-0000-000000000001', 'RTR-001', 'Router', 'product', 'a0000003-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000001', 2500, 4500, 10, 0, true),
  ('a0000004-0000-0000-0000-000000000002', 'ONU-001', 'ONU Device', 'product', 'a0000003-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000001', 1800, 3200, 10, 0, true),
  ('a0000004-0000-0000-0000-000000000003', 'NC-001', 'Network Cable', 'product', 'a0000003-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000001', 50, 120, 50, 0, true),
  ('a0000004-0000-0000-0000-000000000004', 'PLS-001', 'Plastic', 'raw_material', 'a0000003-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 80, 0, 50, 0, true),
  ('a0000004-0000-0000-0000-000000000005', 'CW-001', 'Copper Wire', 'raw_material', 'a0000003-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 350, 0, 20, 0, true),
  ('a0000004-0000-0000-0000-000000000006', 'PB-001', 'Packaging Box', 'raw_material', 'a0000003-0000-0000-0000-000000000003', 'a0000002-0000-0000-0000-000000000003', 15, 0, 100, 0, true),
  ('a0000004-0000-0000-0000-000000000007', 'SVC-001', 'Installation Service', 'service', NULL, 'a0000002-0000-0000-0000-000000000001', 0, 2000, 0, 0, false),
  ('a0000004-0000-0000-0000-000000000008', 'BTL-001', 'Plastic Bottle', 'product', 'a0000003-0000-0000-0000-000000000003', 'a0000002-0000-0000-0000-000000000001', 50, 95, 50, 0, true)
ON CONFLICT (id) DO NOTHING;

-- Create customers
INSERT INTO customers (id, name, email, phone, address) VALUES
  ('a0000005-0000-0000-0000-000000000001', 'ABC Traders', 'abc@traders.com', '01711000001', 'Gulshan, Dhaka'),
  ('a0000005-0000-0000-0000-000000000002', 'XYZ Corporation', 'info@xyz.com', '01711000002', 'Banani, Dhaka'),
  ('a0000005-0000-0000-0000-000000000003', 'Rahim Enterprise', 'rahim@enterprise.com', '01711000003', 'Motijheel, Dhaka')
ON CONFLICT (id) DO NOTHING;

-- Create suppliers
INSERT INTO suppliers (id, name, email, phone, address) VALUES
  ('a0000006-0000-0000-0000-000000000001', 'Tech Supply Ltd', 'tech@supply.com', '01811000001', 'Uttara, Dhaka'),
  ('a0000006-0000-0000-0000-000000000002', 'Raw Material Supplier', 'raw@supplier.com', '01811000002', 'Gazipur'),
  ('a0000006-0000-0000-0000-000000000003', 'Packaging Supplier', 'pack@supplier.com', '01811000003', 'Narayanganj')
ON CONFLICT (id) DO NOTHING;

-- Create departments
INSERT INTO departments (id, name, description) VALUES
  ('a0000007-0000-0000-0000-000000000001', 'Administration', 'Admin department'),
  ('a0000007-0000-0000-0000-000000000002', 'Sales', 'Sales department'),
  ('a0000007-0000-0000-0000-000000000003', 'Production', 'Manufacturing department')
ON CONFLICT (id) DO NOTHING;

-- Create designations
INSERT INTO designations (id, name, description) VALUES
  ('a0000008-0000-0000-0000-000000000001', 'Manager', 'Managerial role'),
  ('a0000008-0000-0000-0000-000000000002', 'Sales Executive', 'Sales team member'),
  ('a0000008-0000-0000-0000-000000000003', 'Operator', 'Factory operator')
ON CONFLICT (id) DO NOTHING;

-- Create shift
INSERT INTO shifts (id, shift_name, start_time, end_time, late_after_minutes) VALUES
  ('a0000009-0000-0000-0000-000000000001', 'Morning Shift', '09:00', '17:00', 15)
ON CONFLICT (id) DO NOTHING;

-- Create leave types
INSERT INTO leave_types (id, name, days_per_year) VALUES
  ('a000000a-0000-0000-0000-000000000001', 'Annual Leave', 15),
  ('a000000a-0000-0000-0000-000000000002', 'Sick Leave', 10),
  ('a000000a-0000-0000-0000-000000000003', 'Casual Leave', 10)
ON CONFLICT (id) DO NOTHING;

-- Create employees
INSERT INTO employees (id, employee_code, first_name, last_name, email, mobile, department_id, designation_id, branch_id, shift_id, salary, joining_date, employment_type) VALUES
  ('a000000b-0000-0000-0000-000000000001', 'EMP-001', 'Karim', 'Ahmed', 'karim@demo.com', '01911000001', 'a0000007-0000-0000-0000-000000000001', 'a0000008-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'a0000009-0000-0000-0000-000000000001', 45000, '2024-01-15', 'permanent'),
  ('a000000b-0000-0000-0000-000000000002', 'EMP-002', 'Fatima', 'Rahman', 'fatima@demo.com', '01911000002', 'a0000007-0000-0000-0000-000000000002', 'a0000008-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'a0000009-0000-0000-0000-000000000001', 30000, '2024-03-01', 'permanent'),
  ('a000000b-0000-0000-0000-000000000003', 'EMP-003', 'Rafiq', 'Islam', 'rafiq@demo.com', '01911000003', 'a0000007-0000-0000-0000-000000000003', 'a0000008-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'a0000009-0000-0000-0000-000000000001', 20000, '2024-06-01', 'permanent')
ON CONFLICT (id) DO NOTHING;
