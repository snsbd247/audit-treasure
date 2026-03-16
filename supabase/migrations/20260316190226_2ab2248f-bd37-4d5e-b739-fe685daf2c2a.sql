
UPDATE public.company_settings SET default_branch_id = NULL, default_financial_year_id = NULL;

DELETE FROM public.voucher_entries;
DELETE FROM public.acc_vouchers;
DELETE FROM public.stock_ledger;
DELETE FROM public.stock_movements;
DELETE FROM public.stock_transfers;
DELETE FROM public.warehouse_stock;
DELETE FROM public.production_materials;
DELETE FROM public.production_entries;
DELETE FROM public.bom_items;
DELETE FROM public.bill_of_materials;
DELETE FROM public.purchase_return_items;
DELETE FROM public.purchase_returns;
DELETE FROM public.purchase_items;
DELETE FROM public.purchases;
DELETE FROM public.sales_return_items;
DELETE FROM public.sales_returns;
DELETE FROM public.sales_invoice_items;
DELETE FROM public.sales_invoices;
DELETE FROM public.payroll;
DELETE FROM public.salary_structures;
DELETE FROM public.overtime_records;
DELETE FROM public.leave_requests;
DELETE FROM public.attendance;
DELETE FROM public.biometric_logs;
DELETE FROM public.face_data;
DELETE FROM public.employee_documents;
DELETE FROM public.employees;
DELETE FROM public.shifts;
DELETE FROM public.departments;
DELETE FROM public.designations;
DELETE FROM public.leave_types;
DELETE FROM public.raw_materials;
DELETE FROM public.customers;
DELETE FROM public.suppliers;
DELETE FROM public.item_master;
DELETE FROM public.item_categories;
DELETE FROM public.units;
DELETE FROM public.products;
DELETE FROM public.product_categories;
DELETE FROM public.warehouses;
DELETE FROM public.branches;
DELETE FROM public.chart_of_accounts;
DELETE FROM public.financial_years;
DELETE FROM public.number_sequences;
DELETE FROM public.role_permissions;
DELETE FROM public.user_custom_roles;
DELETE FROM public.custom_roles;
DELETE FROM public.module_settings;
DELETE FROM public.audit_log;
DELETE FROM public.backup_history;
DELETE FROM public.system_settings;

INSERT INTO public.branches (id, code, name, address, phone, status) VALUES
('b0000001-0000-0000-0000-000000000001', 'HQ', 'Head Office', '123 Business Park, San Francisco, CA', '+1-415-555-0100', 'active'),
('b0000001-0000-0000-0000-000000000002', 'WH', 'West Hub', '456 Commerce Ave, Los Angeles, CA', '+1-310-555-0200', 'active'),
('b0000001-0000-0000-0000-000000000003', 'EH', 'East Hub', '789 Trade Center, New York, NY', '+1-212-555-0300', 'active');

INSERT INTO public.financial_years (id, name, start_date, end_date, is_active) VALUES
('f0000001-0000-0000-0000-000000000001', 'FY 2025-2026', '2025-04-01', '2026-03-31', true),
('f0000001-0000-0000-0000-000000000002', 'FY 2024-2025', '2024-04-01', '2025-03-31', false);

UPDATE public.company_settings SET company_name='TechVista Solutions Ltd.', address='123 Business Park, Suite 400, San Francisco, CA 94105', phone='+1-415-555-0100', email='info@techvista.com', website='www.techvista.com', currency_name='US Dollar', currency_code='USD', currency_symbol='$', currency_position='before', default_branch_id='b0000001-0000-0000-0000-000000000001', default_financial_year_id='f0000001-0000-0000-0000-000000000001' WHERE id='default';

INSERT INTO public.departments (id, name, description, status) VALUES
('d0000001-0000-0000-0000-000000000001', 'Engineering', 'Software development', 'active'),
('d0000001-0000-0000-0000-000000000002', 'Human Resources', 'HR management', 'active'),
('d0000001-0000-0000-0000-000000000003', 'Sales & Marketing', 'Sales ops', 'active'),
('d0000001-0000-0000-0000-000000000004', 'Finance', 'Accounting', 'active'),
('d0000001-0000-0000-0000-000000000005', 'Operations', 'Logistics', 'active');

INSERT INTO public.designations (id, name, description, status) VALUES
('a0000001-0000-0000-0000-000000000001', 'CEO', 'Chief Executive Officer', 'active'),
('a0000001-0000-0000-0000-000000000002', 'HR Manager', 'Human Resources Manager', 'active'),
('a0000001-0000-0000-0000-000000000003', 'Software Engineer', 'Full-stack developer', 'active'),
('a0000001-0000-0000-0000-000000000004', 'Sales Executive', 'Sales representative', 'active'),
('a0000001-0000-0000-0000-000000000005', 'Accountant', 'Financial accountant', 'active'),
('a0000001-0000-0000-0000-000000000006', 'Warehouse Manager', 'Warehouse ops', 'active'),
('a0000001-0000-0000-0000-000000000007', 'Production Supervisor', 'Manufacturing', 'active');

INSERT INTO public.shifts (id, shift_name, start_time, end_time, late_after_minutes) VALUES
('c0000001-0000-0000-0000-000000000001', 'Morning Shift', '08:00', '17:00', 15),
('c0000001-0000-0000-0000-000000000002', 'Evening Shift', '14:00', '22:00', 10),
('c0000001-0000-0000-0000-000000000003', 'Night Shift', '22:00', '06:00', 15);

INSERT INTO public.leave_types (id, name, days_per_year) VALUES
('aa000001-0000-0000-0000-000000000001', 'Annual Leave', 20),
('aa000001-0000-0000-0000-000000000002', 'Sick Leave', 12),
('aa000001-0000-0000-0000-000000000003', 'Casual Leave', 10),
('aa000001-0000-0000-0000-000000000004', 'Maternity Leave', 90);

INSERT INTO public.customers (id, name, email, phone, address, status) VALUES
('cc000001-0000-0000-0000-000000000001', 'Acme Corporation', 'orders@acme.com', '+1-555-0201', '100 Industrial Blvd, Chicago', 'active'),
('cc000001-0000-0000-0000-000000000002', 'Global Traders Inc.', 'buy@globaltraders.com', '+1-555-0202', '200 Trade Center, Houston', 'active'),
('cc000001-0000-0000-0000-000000000003', 'Metro Retail Group', 'purchasing@metro.com', '+1-555-0203', '300 Shopping Ave, Miami', 'active'),
('cc000001-0000-0000-0000-000000000004', 'Pacific Supplies Co.', 'info@pacific.com', '+1-555-0204', '400 Harbor St, Seattle', 'active'),
('cc000001-0000-0000-0000-000000000005', 'Sunrise Electronics', 'contact@sunrise.com', '+1-555-0205', '500 Tech Lane, Austin', 'inactive');

INSERT INTO public.suppliers (id, name, email, phone, address, status) VALUES
('dd000001-0000-0000-0000-000000000001', 'Alpha Materials Ltd.', 'sales@alpha.com', '+1-555-0301', '10 Factory Rd, Detroit', 'active'),
('dd000001-0000-0000-0000-000000000002', 'Beta Components Inc.', 'orders@beta.com', '+1-555-0302', '20 Parts Ave, Cleveland', 'active'),
('dd000001-0000-0000-0000-000000000003', 'Omega Packaging', 'supply@omega.com', '+1-555-0303', '30 Box Lane, Memphis', 'active'),
('dd000001-0000-0000-0000-000000000004', 'Delta Electronics', 'vendor@delta.com', '+1-555-0304', '40 Circuit Blvd, San Jose', 'active');

INSERT INTO public.units (id, name, abbreviation) VALUES
('ee000001-0000-0000-0000-000000000001', 'Pieces', 'pcs'),
('ee000001-0000-0000-0000-000000000002', 'Kilograms', 'kg'),
('ee000001-0000-0000-0000-000000000003', 'Liters', 'ltr'),
('ee000001-0000-0000-0000-000000000004', 'Meters', 'mtr'),
('ee000001-0000-0000-0000-000000000005', 'Boxes', 'box');

INSERT INTO public.item_categories (id, name, description, is_active) VALUES
('ab000001-0000-0000-0000-000000000001', 'Electronics', 'Electronic items', true),
('ab000001-0000-0000-0000-000000000002', 'Raw Materials', 'Manufacturing materials', true),
('ab000001-0000-0000-0000-000000000003', 'Office Supplies', 'Office stationery', true),
('ab000001-0000-0000-0000-000000000004', 'Packaging', 'Packaging materials', true);

INSERT INTO public.item_master (id, item_code, item_name, item_type, category_id, unit_id, cost_price, selling_price, min_stock_level, opening_stock, is_stock_item, status) VALUES
('ac000001-0000-0000-0000-000000000001', 'ITM-001', 'Wireless Router Pro', 'product', 'ab000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 45, 89.99, 20, 150, true, 'active'),
('ac000001-0000-0000-0000-000000000002', 'ITM-002', 'USB-C Hub 7-Port', 'product', 'ab000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 18, 39.99, 30, 200, true, 'active'),
('ac000001-0000-0000-0000-000000000003', 'ITM-003', 'LED Monitor 24in', 'product', 'ab000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 120, 249.99, 10, 50, true, 'active'),
('ac000001-0000-0000-0000-000000000004', 'ITM-004', 'Copper Wire Spool', 'raw_material', 'ab000001-0000-0000-0000-000000000002', 'ee000001-0000-0000-0000-000000000004', 8, 0, 100, 500, true, 'active'),
('ac000001-0000-0000-0000-000000000005', 'ITM-005', 'Plastic Casing', 'raw_material', 'ab000001-0000-0000-0000-000000000002', 'ee000001-0000-0000-0000-000000000001', 2.50, 0, 200, 1000, true, 'active'),
('ac000001-0000-0000-0000-000000000006', 'ITM-006', 'A4 Paper Ream', 'product', 'ab000001-0000-0000-0000-000000000003', 'ee000001-0000-0000-0000-000000000005', 3, 6.99, 50, 300, true, 'active'),
('ac000001-0000-0000-0000-000000000007', 'ITM-007', 'Cardboard Box Large', 'product', 'ab000001-0000-0000-0000-000000000004', 'ee000001-0000-0000-0000-000000000001', 1.50, 3.99, 100, 500, true, 'active'),
('ac000001-0000-0000-0000-000000000008', 'ITM-008', 'Network Switch 8-Port', 'product', 'ab000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 55, 119.99, 15, 80, true, 'active'),
('ac000001-0000-0000-0000-000000000009', 'ITM-009', 'Ethernet Cable Cat6', 'product', 'ab000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 3, 8.99, 50, 400, true, 'active'),
('ac000001-0000-0000-0000-000000000010', 'ITM-010', 'Bubble Wrap Roll', 'product', 'ab000001-0000-0000-0000-000000000004', 'ee000001-0000-0000-0000-000000000004', 5, 12.99, 30, 100, true, 'active');

INSERT INTO public.warehouses (id, warehouse_code, warehouse_name, branch_id, description, status) VALUES
('ae000001-0000-0000-0000-000000000001', 'WH-MAIN', 'Main Warehouse', 'b0000001-0000-0000-0000-000000000001', 'Primary storage', 'active'),
('ae000001-0000-0000-0000-000000000002', 'WH-WEST', 'West Warehouse', 'b0000001-0000-0000-0000-000000000002', 'LA center', 'active'),
('ae000001-0000-0000-0000-000000000003', 'WH-EAST', 'East Warehouse', 'b0000001-0000-0000-0000-000000000003', 'NY facility', 'active');

INSERT INTO public.employees (id, employee_code, first_name, last_name, email, mobile, department_id, designation_id, branch_id, shift_id, joining_date, salary, status, employment_type, address) VALUES
('e0000001-0000-0000-0000-000000000001', 'EMP-0001', 'James', 'Anderson', 'james@techvista.com', '+1-415-555-1001', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', '2020-01-15', 12000, 'active', 'permanent', '100 Oak St, SF'),
('e0000001-0000-0000-0000-000000000002', 'EMP-0002', 'Sarah', 'Mitchell', 'sarah@techvista.com', '+1-415-555-1002', 'd0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', '2021-03-10', 8500, 'active', 'permanent', '200 Elm Ave, SF'),
('e0000001-0000-0000-0000-000000000003', 'EMP-0003', 'Michael', 'Chen', 'michael@techvista.com', '+1-415-555-1003', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', '2022-06-01', 7500, 'active', 'permanent', '300 Pine Rd, SF'),
('e0000001-0000-0000-0000-000000000004', 'EMP-0004', 'Emily', 'Rodriguez', 'emily@techvista.com', '+1-310-555-1004', 'd0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', '2022-09-15', 6000, 'active', 'permanent', '400 Maple St, LA'),
('e0000001-0000-0000-0000-000000000005', 'EMP-0005', 'David', 'Kim', 'david@techvista.com', '+1-212-555-1005', 'd0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', '2023-01-10', 7000, 'active', 'permanent', '500 Broadway, NY'),
('e0000001-0000-0000-0000-000000000006', 'EMP-0006', 'Jessica', 'Taylor', 'jessica@techvista.com', '+1-415-555-1006', 'd0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002', '2023-04-20', 5500, 'active', 'permanent', '600 Cedar, SF'),
('e0000001-0000-0000-0000-000000000007', 'EMP-0007', 'Robert', 'Wilson', 'robert@techvista.com', '+1-310-555-1007', 'd0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', '2023-07-01', 5000, 'active', 'contract', '700 Vine St, LA'),
('e0000001-0000-0000-0000-000000000008', 'EMP-0008', 'Amanda', 'Brown', 'amanda@techvista.com', '+1-212-555-1008', 'd0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', '2024-01-15', 7200, 'active', 'permanent', '800 Park Ave, NY'),
('e0000001-0000-0000-0000-000000000009', 'EMP-0009', 'Daniel', 'Garcia', 'daniel@techvista.com', '+1-415-555-1009', 'd0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', '2024-06-01', 5800, 'active', 'probation', '900 Market, SF'),
('e0000001-0000-0000-0000-000000000010', 'EMP-0010', 'Lisa', 'Wang', 'lisa@techvista.com', '+1-310-555-1010', 'd0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', '2024-08-01', 6500, 'inactive', 'permanent', '1000 Sunset, LA');

INSERT INTO public.attendance (employee_id, date, check_in, check_out, status) VALUES
('e0000001-0000-0000-0000-000000000001', '2026-03-16', '07:58', NULL, 'present'),
('e0000001-0000-0000-0000-000000000002', '2026-03-16', '08:05', NULL, 'present'),
('e0000001-0000-0000-0000-000000000003', '2026-03-16', '08:30', NULL, 'late'),
('e0000001-0000-0000-0000-000000000004', '2026-03-16', '08:00', NULL, 'present'),
('e0000001-0000-0000-0000-000000000005', '2026-03-16', NULL, NULL, 'absent'),
('e0000001-0000-0000-0000-000000000006', '2026-03-16', '14:00', NULL, 'present'),
('e0000001-0000-0000-0000-000000000008', '2026-03-16', '08:00', NULL, 'present'),
('e0000001-0000-0000-0000-000000000009', '2026-03-16', '08:10', NULL, 'present'),
('e0000001-0000-0000-0000-000000000001', '2026-03-11', '07:55', '17:05', 'present'),
('e0000001-0000-0000-0000-000000000002', '2026-03-11', '08:10', '17:00', 'present'),
('e0000001-0000-0000-0000-000000000003', '2026-03-11', '08:25', '17:10', 'late'),
('e0000001-0000-0000-0000-000000000004', '2026-03-11', '08:00', '17:00', 'present'),
('e0000001-0000-0000-0000-000000000005', '2026-03-11', NULL, NULL, 'absent'),
('e0000001-0000-0000-0000-000000000006', '2026-03-11', '13:55', '22:00', 'present'),
('e0000001-0000-0000-0000-000000000007', '2026-03-11', '14:30', '22:05', 'late'),
('e0000001-0000-0000-0000-000000000008', '2026-03-11', '08:00', '17:00', 'present'),
('e0000001-0000-0000-0000-000000000009', '2026-03-11', '08:05', '17:00', 'present');

INSERT INTO public.leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status) VALUES
('e0000001-0000-0000-0000-000000000002', 'aa000001-0000-0000-0000-000000000001', '2026-03-13', '2026-03-13', 'Personal appointment', 'approved'),
('e0000001-0000-0000-0000-000000000004', 'aa000001-0000-0000-0000-000000000002', '2026-03-20', '2026-03-21', 'Feeling unwell', 'pending'),
('e0000001-0000-0000-0000-000000000007', 'aa000001-0000-0000-0000-000000000003', '2026-03-25', '2026-03-26', 'Family event', 'pending');

INSERT INTO public.overtime_records (employee_id, date, hours, status) VALUES
('e0000001-0000-0000-0000-000000000001', '2026-03-11', 2, 'approved'),
('e0000001-0000-0000-0000-000000000003', '2026-03-12', 3, 'approved'),
('e0000001-0000-0000-0000-000000000008', '2026-03-14', 2, 'approved');

INSERT INTO public.salary_structures (employee_id, basic_salary, allowances, deductions, effective_from) VALUES
('e0000001-0000-0000-0000-000000000001', 10000, 1500, 500, '2025-04-01'),
('e0000001-0000-0000-0000-000000000002', 7000, 1200, 300, '2025-04-01'),
('e0000001-0000-0000-0000-000000000003', 6000, 1000, 500, '2025-04-01'),
('e0000001-0000-0000-0000-000000000004', 5000, 800, 200, '2025-04-01'),
('e0000001-0000-0000-0000-000000000005', 6000, 800, 200, '2025-04-01'),
('e0000001-0000-0000-0000-000000000006', 4500, 700, 300, '2025-04-01'),
('e0000001-0000-0000-0000-000000000007', 4000, 700, 300, '2025-04-01'),
('e0000001-0000-0000-0000-000000000008', 6000, 900, 300, '2025-04-01'),
('e0000001-0000-0000-0000-000000000009', 4800, 700, 300, '2025-04-01');

INSERT INTO public.payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, status) VALUES
('e0000001-0000-0000-0000-000000000001', 2, 2026, 10000, 1500, 500, 11000, 'approved'),
('e0000001-0000-0000-0000-000000000002', 2, 2026, 7000, 1200, 300, 7900, 'approved'),
('e0000001-0000-0000-0000-000000000003', 2, 2026, 6000, 1000, 500, 6500, 'approved'),
('e0000001-0000-0000-0000-000000000004', 2, 2026, 5000, 800, 200, 5600, 'approved'),
('e0000001-0000-0000-0000-000000000005', 2, 2026, 6000, 800, 200, 6600, 'approved'),
('e0000001-0000-0000-0000-000000000006', 2, 2026, 4500, 700, 300, 4900, 'approved'),
('e0000001-0000-0000-0000-000000000007', 2, 2026, 4000, 700, 300, 4400, 'approved'),
('e0000001-0000-0000-0000-000000000008', 2, 2026, 6000, 900, 300, 6600, 'approved'),
('e0000001-0000-0000-0000-000000000009', 2, 2026, 4800, 700, 300, 5200, 'approved');

-- Chart of Accounts (using 'income' not 'revenue')
INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, is_active, opening_balance, opening_balance_type) VALUES
('ca000001-0000-0000-0000-000000000001', '1000', 'Assets', 'asset', true, 0, 'debit'),
('ca000001-0000-0000-0000-000000000002', '1100', 'Cash', 'asset', true, 50000, 'debit'),
('ca000001-0000-0000-0000-000000000003', '1200', 'Bank Account', 'asset', true, 200000, 'debit'),
('ca000001-0000-0000-0000-000000000004', '1300', 'Accounts Receivable', 'asset', true, 15000, 'debit'),
('ca000001-0000-0000-0000-000000000005', '1400', 'Inventory', 'asset', true, 75000, 'debit'),
('ca000001-0000-0000-0000-000000000006', '2000', 'Liabilities', 'liability', true, 0, 'credit'),
('ca000001-0000-0000-0000-000000000007', '2100', 'Accounts Payable', 'liability', true, 25000, 'credit'),
('ca000001-0000-0000-0000-000000000008', '2200', 'Salary Payable', 'liability', true, 0, 'credit'),
('ca000001-0000-0000-0000-000000000009', '3000', 'Equity', 'equity', true, 0, 'credit'),
('ca000001-0000-0000-0000-000000000010', '3100', 'Owner Equity', 'equity', true, 300000, 'credit'),
('ca000001-0000-0000-0000-000000000011', '4000', 'Income', 'income', true, 0, 'credit'),
('ca000001-0000-0000-0000-000000000012', '4100', 'Sales Revenue', 'income', true, 0, 'credit'),
('ca000001-0000-0000-0000-000000000013', '5000', 'Expenses', 'expense', true, 0, 'debit'),
('ca000001-0000-0000-0000-000000000014', '5100', 'Salary Expense', 'expense', true, 0, 'debit'),
('ca000001-0000-0000-0000-000000000015', '5200', 'Rent Expense', 'expense', true, 0, 'debit'),
('ca000001-0000-0000-0000-000000000016', '5300', 'Utilities Expense', 'expense', true, 0, 'debit'),
('ca000001-0000-0000-0000-000000000017', '5400', 'Cost of Goods Sold', 'expense', true, 0, 'debit');

UPDATE public.chart_of_accounts SET parent_id='ca000001-0000-0000-0000-000000000001' WHERE account_code IN ('1100','1200','1300','1400');
UPDATE public.chart_of_accounts SET parent_id='ca000001-0000-0000-0000-000000000006' WHERE account_code IN ('2100','2200');
UPDATE public.chart_of_accounts SET parent_id='ca000001-0000-0000-0000-000000000009' WHERE account_code='3100';
UPDATE public.chart_of_accounts SET parent_id='ca000001-0000-0000-0000-000000000011' WHERE account_code='4100';
UPDATE public.chart_of_accounts SET parent_id='ca000001-0000-0000-0000-000000000013' WHERE account_code IN ('5100','5200','5300','5400');

INSERT INTO public.number_sequences (id, prefix, year, current_number, description) VALUES
('sales_invoice', 'INV', 2026, 3, 'Sales Invoice'),
('purchase', 'PUR', 2026, 2, 'Purchase'),
('production', 'PRD', 2026, 1, 'Production'),
('stock_transfer', 'STR', 2026, 1, 'Stock Transfer'),
('sales_return', 'SRN', 2026, 1, 'Sales Return'),
('purchase_return', 'PRN', 2026, 1, 'Purchase Return'),
('voucher', 'VCH', 2026, 4, 'Accounting Voucher');

INSERT INTO public.purchases (id, purchase_number, purchase_date, supplier_id, branch_id, total_amount, status, payment_method, notes) VALUES
('af000001-0000-0000-0000-000000000001', 'PUR-2026-00001', '2026-03-01', 'dd000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 6750, 'completed', 'bank', 'Bulk router purchase'),
('af000001-0000-0000-0000-000000000002', 'PUR-2026-00002', '2026-03-05', 'dd000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 3600, 'completed', 'cash', 'USB hubs and cables');

INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, total) VALUES
('af000001-0000-0000-0000-000000000001', 'ac000001-0000-0000-0000-000000000001', 100, 45, 4500),
('af000001-0000-0000-0000-000000000001', 'ac000001-0000-0000-0000-000000000008', 30, 55, 1650),
('af000001-0000-0000-0000-000000000002', 'ac000001-0000-0000-0000-000000000002', 150, 18, 2700);

INSERT INTO public.sales_invoices (id, invoice_number, invoice_date, customer_id, branch_id, total_amount, discount, net_amount, status) VALUES
('ba000001-0000-0000-0000-000000000001', 'INV-2026-00001', '2026-03-03', 'cc000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 4499.25, 200, 4299.25, 'completed'),
('ba000001-0000-0000-0000-000000000002', 'INV-2026-00002', '2026-03-08', 'cc000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 2999.88, 0, 2999.88, 'completed'),
('ba000001-0000-0000-0000-000000000003', 'INV-2026-00003', '2026-03-14', 'cc000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 1260.32, 50, 1210.32, 'completed');

INSERT INTO public.sales_invoice_items (sales_invoice_id, product_id, quantity, price, discount, total) VALUES
('ba000001-0000-0000-0000-000000000001', 'ac000001-0000-0000-0000-000000000001', 30, 89.99, 0, 2699.70),
('ba000001-0000-0000-0000-000000000001', 'ac000001-0000-0000-0000-000000000002', 45, 39.99, 0, 1799.55),
('ba000001-0000-0000-0000-000000000002', 'ac000001-0000-0000-0000-000000000003', 12, 249.99, 0, 2999.88),
('ba000001-0000-0000-0000-000000000003', 'ac000001-0000-0000-0000-000000000009', 100, 8.99, 0, 899.00),
('ba000001-0000-0000-0000-000000000003', 'ac000001-0000-0000-0000-000000000006', 30, 6.99, 0, 209.70);

INSERT INTO public.acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, total_amount, status, branch_id, financial_year_id) VALUES
('bb000001-0000-0000-0000-000000000001', 'VCH-2026-00001', 'payment', '2026-03-01', 'Office rent - March', 5000, 'approved', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001'),
('bb000001-0000-0000-0000-000000000002', 'VCH-2026-00002', 'receipt', '2026-03-03', 'Payment from Acme Corp', 4299.25, 'approved', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001'),
('bb000001-0000-0000-0000-000000000003', 'VCH-2026-00003', 'payment', '2026-03-10', 'Utilities bill', 1200, 'approved', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001');

INSERT INTO public.voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
('bb000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000015', 5000, 0, 'March rent', 1),
('bb000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000003', 0, 5000, 'Bank payment', 2),
('bb000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000003', 4299.25, 0, 'Acme Corp', 1),
('bb000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000012', 0, 4299.25, 'Sales revenue', 2),
('bb000001-0000-0000-0000-000000000003', 'ca000001-0000-0000-0000-000000000016', 1200, 0, 'Utilities', 1),
('bb000001-0000-0000-0000-000000000003', 'ca000001-0000-0000-0000-000000000002', 0, 1200, 'Cash payment', 2);

INSERT INTO public.warehouse_stock (item_id, warehouse_id, quantity) VALUES
('ac000001-0000-0000-0000-000000000001', 'ae000001-0000-0000-0000-000000000001', 220),
('ac000001-0000-0000-0000-000000000002', 'ae000001-0000-0000-0000-000000000001', 305),
('ac000001-0000-0000-0000-000000000003', 'ae000001-0000-0000-0000-000000000001', 50),
('ac000001-0000-0000-0000-000000000003', 'ae000001-0000-0000-0000-000000000002', 38),
('ac000001-0000-0000-0000-000000000008', 'ae000001-0000-0000-0000-000000000001', 110),
('ac000001-0000-0000-0000-000000000009', 'ae000001-0000-0000-0000-000000000001', 800),
('ac000001-0000-0000-0000-000000000006', 'ae000001-0000-0000-0000-000000000001', 270),
('ac000001-0000-0000-0000-000000000007', 'ae000001-0000-0000-0000-000000000001', 462),
('ac000001-0000-0000-0000-000000000010', 'ae000001-0000-0000-0000-000000000001', 100);

INSERT INTO public.module_settings (module_key, module_name, is_enabled) VALUES
('accounts', 'Accounting', true),
('inventory', 'Inventory', true),
('sales', 'Sales', true),
('purchase', 'Purchase', true),
('hrm', 'HRM', true),
('manufacturing', 'Manufacturing', true),
('bank', 'Banking', true),
('reports', 'Reports', true);

INSERT INTO public.product_categories (id, name) VALUES
('bc000001-0000-0000-0000-000000000001', 'Networking'),
('bc000001-0000-0000-0000-000000000002', 'Accessories');
