
-- Clear FK references first
UPDATE company_settings SET default_branch_id = NULL, default_financial_year_id = NULL WHERE id = 'default';

-- Clear all data
DELETE FROM voucher_entries;
DELETE FROM production_materials;
DELETE FROM bom_items;
DELETE FROM purchase_return_items;
DELETE FROM sales_return_items;
DELETE FROM purchase_items;
DELETE FROM sales_invoice_items;
DELETE FROM stock_ledger;
DELETE FROM stock_movements;
DELETE FROM warehouse_stock;
DELETE FROM stock_transfers;
DELETE FROM acc_vouchers;
DELETE FROM production_entries;
DELETE FROM bill_of_materials;
DELETE FROM purchase_returns;
DELETE FROM sales_returns;
DELETE FROM purchases;
DELETE FROM sales_invoices;
DELETE FROM payroll;
DELETE FROM salary_structures;
DELETE FROM attendance;
DELETE FROM leave_requests;
DELETE FROM overtime_records;
DELETE FROM biometric_logs;
DELETE FROM employee_documents;
DELETE FROM face_data;
DELETE FROM employees;
DELETE FROM customers;
DELETE FROM suppliers;
DELETE FROM item_master;
DELETE FROM item_categories;
DELETE FROM units;
DELETE FROM warehouses;
DELETE FROM departments;
DELETE FROM designations;
DELETE FROM shifts;
DELETE FROM leave_types;
DELETE FROM raw_materials;
DELETE FROM products;
DELETE FROM product_categories;
DELETE FROM branches;
DELETE FROM chart_of_accounts;
DELETE FROM financial_years;
DELETE FROM number_sequences;
DELETE FROM page_shortcuts;
DELETE FROM user_favorite_pages;

-- BRANCHES
INSERT INTO branches (id, code, name, address, phone, status) VALUES
('b0000000-0000-0000-0000-000000000001', 'DHK', 'Dhaka Head Office', '123 Motijheel, Dhaka-1000', '+880-2-1234567', 'active'),
('b0000000-0000-0000-0000-000000000002', 'CTG', 'Chittagong Branch', '45 Agrabad, Chittagong-4100', '+880-31-7654321', 'active');

-- FINANCIAL YEARS
INSERT INTO financial_years (id, name, start_date, end_date, is_active) VALUES
('f1000000-0000-0000-0000-000000000001', '2025-2026', '2025-07-01', '2026-06-30', true),
('f1000000-0000-0000-0000-000000000002', '2024-2025', '2024-07-01', '2025-06-30', false);

-- CHART OF ACCOUNTS
INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, parent_id, opening_balance, opening_balance_type) VALUES
('a0000000-0000-0000-0000-000000000001', '1000', 'Assets', 'asset', NULL, 0, 'debit'),
('a0000000-0000-0000-0000-000000000002', '1100', 'Cash', 'asset', 'a0000000-0000-0000-0000-000000000001', 500000, 'debit'),
('a0000000-0000-0000-0000-000000000003', '1200', 'Bank - Sonali Bank', 'asset', 'a0000000-0000-0000-0000-000000000001', 1000000, 'debit'),
('a0000000-0000-0000-0000-000000000004', '1300', 'Accounts Receivable', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit'),
('a0000000-0000-0000-0000-000000000005', '1400', 'Inventory', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit'),
('a0000000-0000-0000-0000-000000000006', '1500', 'Fixed Assets', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit'),
('a0000000-0000-0000-0000-000000000007', '1510', 'Office Equipment', 'asset', 'a0000000-0000-0000-0000-000000000006', 200000, 'debit'),
('a0000000-0000-0000-0000-000000000008', '1600', 'Raw Material Stock', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit'),
('a0000000-0000-0000-0000-000000000009', '1700', 'Work in Progress', 'asset', 'a0000000-0000-0000-0000-000000000001', 0, 'debit'),
('a0000000-0000-0000-0000-000000000010', '2000', 'Liabilities', 'liability', NULL, 0, 'credit'),
('a0000000-0000-0000-0000-000000000011', '2100', 'Accounts Payable', 'liability', 'a0000000-0000-0000-0000-000000000010', 0, 'credit'),
('a0000000-0000-0000-0000-000000000012', '2200', 'Salary Payable', 'liability', 'a0000000-0000-0000-0000-000000000010', 0, 'credit'),
('a0000000-0000-0000-0000-000000000013', '2300', 'Tax Payable', 'liability', 'a0000000-0000-0000-0000-000000000010', 0, 'credit'),
('a0000000-0000-0000-0000-000000000014', '3000', 'Equity', 'equity', NULL, 0, 'credit'),
('a0000000-0000-0000-0000-000000000015', '3100', 'Owner Capital', 'equity', 'a0000000-0000-0000-0000-000000000014', 1700000, 'credit'),
('a0000000-0000-0000-0000-000000000016', '3200', 'Retained Earnings', 'equity', 'a0000000-0000-0000-0000-000000000014', 0, 'credit'),
('a0000000-0000-0000-0000-000000000017', '4000', 'Income', 'income', NULL, 0, 'credit'),
('a0000000-0000-0000-0000-000000000018', '4100', 'Sales Revenue', 'income', 'a0000000-0000-0000-0000-000000000017', 0, 'credit'),
('a0000000-0000-0000-0000-000000000019', '4200', 'Service Revenue', 'income', 'a0000000-0000-0000-0000-000000000017', 0, 'credit'),
('a0000000-0000-0000-0000-000000000020', '4300', 'Other Income', 'income', 'a0000000-0000-0000-0000-000000000017', 0, 'credit'),
('a0000000-0000-0000-0000-000000000021', '5000', 'Expenses', 'expense', NULL, 0, 'debit'),
('a0000000-0000-0000-0000-000000000022', '5100', 'Cost of Goods Sold', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000023', '5200', 'Salary Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000024', '5300', 'Rent Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000025', '5400', 'Office Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000026', '5500', 'Utility Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000027', '5600', 'Purchase Account', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000028', '5700', 'Manufacturing Overhead', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000029', '5800', 'Transportation Expense', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit'),
('a0000000-0000-0000-0000-000000000030', '5900', 'Stock Adjustment', 'expense', 'a0000000-0000-0000-0000-000000000021', 0, 'debit');

-- UNITS
INSERT INTO units (id, name, abbreviation) VALUES
('00000000-0000-0000-0001-000000000001', 'Piece', 'pcs'),
('00000000-0000-0000-0001-000000000002', 'Kilogram', 'kg'),
('00000000-0000-0000-0001-000000000003', 'Box', 'box'),
('00000000-0000-0000-0001-000000000004', 'Meter', 'm'),
('00000000-0000-0000-0001-000000000005', 'Liter', 'ltr');

-- ITEM CATEGORIES
INSERT INTO item_categories (id, name, description) VALUES
('00000000-0000-0000-0002-000000000001', 'Electronics', 'Electronic products and devices'),
('00000000-0000-0000-0002-000000000002', 'Raw Materials', 'Manufacturing raw materials'),
('00000000-0000-0000-0002-000000000003', 'Packaging', 'Packaging materials'),
('00000000-0000-0000-0002-000000000004', 'Services', 'Service items');

-- WAREHOUSES
INSERT INTO warehouses (id, warehouse_code, warehouse_name, description, branch_id) VALUES
('00000000-0000-0000-0003-000000000001', 'WH-MAIN', 'Main Warehouse', 'Primary warehouse for finished goods', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0003-000000000002', 'WH-RAW', 'Raw Material Warehouse', 'Storage for raw materials', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0003-000000000003', 'WH-FG', 'Finished Goods Warehouse', 'Finished goods storage', 'b0000000-0000-0000-0000-000000000001');

-- ITEMS
INSERT INTO item_master (id, item_code, item_name, item_type, category_id, unit_id, cost_price, selling_price, min_stock_level, opening_stock, is_stock_item) VALUES
('00000000-0000-0000-0004-000000000001', 'PROD-001', 'Router', 'product', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 2500, 3500, 10, 0, true),
('00000000-0000-0000-0004-000000000002', 'PROD-002', 'ONU Device', 'product', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 1800, 2800, 5, 0, true),
('00000000-0000-0000-0004-000000000003', 'PROD-003', 'Network Cable (Cat6)', 'product', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000004', 15, 25, 100, 0, true),
('00000000-0000-0000-0004-000000000004', 'RAW-001', 'Plastic Granules', 'raw_material', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 80, 0, 50, 0, true),
('00000000-0000-0000-0004-000000000005', 'RAW-002', 'Copper Wire', 'raw_material', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 600, 0, 20, 0, true),
('00000000-0000-0000-0004-000000000006', 'PKG-001', 'Packaging Box (Small)', 'product', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 10, 0, 100, 0, true),
('00000000-0000-0000-0004-000000000007', 'SRV-001', 'Installation Service', 'service', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000001', 0, 2000, 0, 0, false),
('00000000-0000-0000-0004-000000000008', 'PROD-004', 'Plastic Bottle', 'product', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 50, 120, 50, 0, true);

-- CUSTOMERS
INSERT INTO customers (id, name, email, phone, address) VALUES
('c0000000-0000-0000-0000-000000000001', 'ABC Traders', 'abc@traders.com', '01711-111111', '10 Banani, Dhaka'),
('c0000000-0000-0000-0000-000000000002', 'XYZ Corporation', 'info@xyz.com', '01722-222222', '25 Gulshan, Dhaka'),
('c0000000-0000-0000-0000-000000000003', 'Rahim Enterprise', 'rahim@enterprise.com', '01733-333333', '8 Dhanmondi, Dhaka');

-- SUPPLIERS
INSERT INTO suppliers (id, name, email, phone, address) VALUES
('50000000-0000-0000-0000-000000000001', 'Tech Supply Ltd', 'sales@techsupply.com', '01811-111111', '15 Tejgaon, Dhaka'),
('50000000-0000-0000-0000-000000000002', 'Raw Material Supplier', 'info@rawmat.com', '01822-222222', '32 Tongi, Gazipur'),
('50000000-0000-0000-0000-000000000003', 'Packaging Supplier', 'order@packco.com', '01833-333333', '7 Savar, Dhaka');

-- DEPARTMENTS
INSERT INTO departments (id, name, description) VALUES
('d0000000-0000-0000-0000-000000000001', 'Administration', 'General administration'),
('d0000000-0000-0000-0000-000000000002', 'Sales', 'Sales and marketing'),
('d0000000-0000-0000-0000-000000000003', 'Production', 'Manufacturing and production'),
('d0000000-0000-0000-0000-000000000004', 'Accounts', 'Finance and accounting');

-- DESIGNATIONS
INSERT INTO designations (id, name, description) VALUES
('de000000-0000-0000-0000-000000000001', 'Manager', 'Department head'),
('de000000-0000-0000-0000-000000000002', 'Senior Executive', 'Senior staff'),
('de000000-0000-0000-0000-000000000003', 'Executive', 'Regular staff'),
('de000000-0000-0000-0000-000000000004', 'Operator', 'Factory operator');

-- SHIFTS
INSERT INTO shifts (id, shift_name, start_time, end_time, late_after_minutes) VALUES
('00000000-0000-0000-0005-000000000001', 'Morning Shift', '09:00', '17:00', 15),
('00000000-0000-0000-0005-000000000002', 'Evening Shift', '14:00', '22:00', 15);

-- LEAVE TYPES
INSERT INTO leave_types (id, name, days_per_year) VALUES
('00000000-0000-0000-0006-000000000001', 'Annual Leave', 15),
('00000000-0000-0000-0006-000000000002', 'Sick Leave', 14),
('00000000-0000-0000-0006-000000000003', 'Casual Leave', 10);

-- EMPLOYEES
INSERT INTO employees (id, employee_code, first_name, last_name, email, mobile, department_id, designation_id, branch_id, shift_id, salary, joining_date, employment_type) VALUES
('e0000000-0000-0000-0000-000000000001', 'EMP-001', 'Kamal', 'Hossain', 'kamal@demo.com', '01911-111111', 'd0000000-0000-0000-0000-000000000001', 'de000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', 45000, '2023-01-15', 'permanent'),
('e0000000-0000-0000-0000-000000000002', 'EMP-002', 'Fatema', 'Begum', 'fatema@demo.com', '01922-222222', 'd0000000-0000-0000-0000-000000000002', 'de000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', 28000, '2023-06-01', 'permanent'),
('e0000000-0000-0000-0000-000000000003', 'EMP-003', 'Raju', 'Ahmed', 'raju@demo.com', '01933-333333', 'd0000000-0000-0000-0000-000000000003', 'de000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', 22000, '2024-01-10', 'permanent'),
('e0000000-0000-0000-0000-000000000004', 'EMP-004', 'Nasreen', 'Akter', 'nasreen@demo.com', '01944-444444', 'd0000000-0000-0000-0000-000000000004', 'de000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0005-000000000001', 35000, '2023-03-20', 'permanent');

-- NUMBER SEQUENCES
INSERT INTO number_sequences (id, prefix, current_number, year, description) VALUES
('journal_voucher', 'JV', 7, 2026, 'Journal Voucher'),
('payment_voucher', 'PV', 2, 2026, 'Payment Voucher'),
('receipt_voucher', 'RV', 1, 2026, 'Receipt Voucher'),
('contra_voucher', 'CV', 1, 2026, 'Contra Voucher'),
('sales_invoice', 'SI', 3, 2026, 'Sales Invoice'),
('purchase_entry', 'PI', 4, 2026, 'Purchase Entry'),
('production_entry', 'PRD', 1, 2026, 'Production Entry'),
('sales_return', 'SR', 0, 2026, 'Sales Return'),
('purchase_return', 'PR', 0, 2026, 'Purchase Return'),
('stock_transfer', 'ST', 0, 2026, 'Stock Transfer');

-- PURCHASES
INSERT INTO purchases (id, purchase_number, purchase_date, supplier_id, branch_id, total_amount, status, notes) VALUES
('00000000-0000-0000-0010-000000000001', 'PI-2026-00001', '2026-03-02', '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 250000, 'completed', '100 Routers purchase'),
('00000000-0000-0000-0010-000000000002', 'PI-2026-00002', '2026-03-03', '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 90000, 'completed', '50 ONU Devices'),
('00000000-0000-0000-0010-000000000003', 'PI-2026-00003', '2026-03-04', '50000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 16000, 'completed', '200 Kg Plastic'),
('00000000-0000-0000-0010-000000000004', 'PI-2026-00004', '2026-03-05', '50000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 5000, 'completed', '500 Packaging Boxes');

INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_price, total) VALUES
('00000000-0000-0000-0011-000000000001', '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0004-000000000001', 100, 2500, 250000),
('00000000-0000-0000-0011-000000000002', '00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0004-000000000002', 50, 1800, 90000),
('00000000-0000-0000-0011-000000000003', '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0004-000000000004', 200, 80, 16000),
('00000000-0000-0000-0011-000000000004', '00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0004-000000000006', 500, 10, 5000);

-- STOCK LEDGER - PURCHASES
INSERT INTO stock_ledger (id, item_id, transaction_type, transaction_date, quantity_in, quantity_out, balance_quantity, unit_cost, total_value, reference_number, transaction_id, warehouse_id, branch_id) VALUES
('00000000-0000-0000-0020-000000000001', '00000000-0000-0000-0004-000000000001', 'purchase', '2026-03-02', 100, 0, 100, 2500, 250000, 'PI-2026-00001', '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0003-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0020-000000000002', '00000000-0000-0000-0004-000000000002', 'purchase', '2026-03-03', 50, 0, 50, 1800, 90000, 'PI-2026-00002', '00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0003-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0020-000000000003', '00000000-0000-0000-0004-000000000004', 'purchase', '2026-03-04', 200, 0, 200, 80, 16000, 'PI-2026-00003', '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0003-000000000002', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0020-000000000004', '00000000-0000-0000-0004-000000000006', 'purchase', '2026-03-05', 500, 0, 500, 10, 5000, 'PI-2026-00004', '00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0003-000000000002', 'b0000000-0000-0000-0000-000000000001');

-- SALES
INSERT INTO sales_invoices (id, invoice_number, invoice_date, customer_id, branch_id, total_amount, discount, net_amount, status) VALUES
('00000000-0000-0000-0012-000000000001', 'SI-2026-00001', '2026-03-06', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 35000, 0, 35000, 'completed'),
('00000000-0000-0000-0012-000000000002', 'SI-2026-00002', '2026-03-08', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 14000, 0, 14000, 'completed'),
('00000000-0000-0000-0012-000000000003', 'SI-2026-00003', '2026-03-10', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 10000, 0, 10000, 'completed');

INSERT INTO sales_invoice_items (id, sales_invoice_id, product_id, quantity, price, discount, total) VALUES
('00000000-0000-0000-0013-000000000001', '00000000-0000-0000-0012-000000000001', '00000000-0000-0000-0004-000000000001', 10, 3500, 0, 35000),
('00000000-0000-0000-0013-000000000002', '00000000-0000-0000-0012-000000000002', '00000000-0000-0000-0004-000000000002', 5, 2800, 0, 14000),
('00000000-0000-0000-0013-000000000003', '00000000-0000-0000-0012-000000000003', '00000000-0000-0000-0004-000000000007', 5, 2000, 0, 10000);

-- STOCK LEDGER - SALES
INSERT INTO stock_ledger (id, item_id, transaction_type, transaction_date, quantity_in, quantity_out, balance_quantity, unit_cost, total_value, reference_number, transaction_id, warehouse_id, branch_id) VALUES
('00000000-0000-0000-0020-000000000005', '00000000-0000-0000-0004-000000000001', 'sales', '2026-03-06', 0, 10, 90, 2500, 25000, 'SI-2026-00001', '00000000-0000-0000-0012-000000000001', '00000000-0000-0000-0003-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0020-000000000006', '00000000-0000-0000-0004-000000000002', 'sales', '2026-03-08', 0, 5, 45, 1800, 9000, 'SI-2026-00002', '00000000-0000-0000-0012-000000000002', '00000000-0000-0000-0003-000000000001', 'b0000000-0000-0000-0000-000000000001');

-- MANUFACTURING
INSERT INTO bill_of_materials (id, name, product_id, notes) VALUES
('00000000-0000-0000-0014-000000000001', 'Plastic Bottle BOM', '00000000-0000-0000-0004-000000000008', 'Standard plastic bottle manufacturing');

INSERT INTO bom_items (id, bom_id, material_id, quantity, unit) VALUES
('00000000-0000-0000-0015-000000000001', '00000000-0000-0000-0014-000000000001', '00000000-0000-0000-0004-000000000004', 0.5, 'kg'),
('00000000-0000-0000-0015-000000000002', '00000000-0000-0000-0014-000000000001', '00000000-0000-0000-0004-000000000006', 1, 'pcs');

INSERT INTO production_entries (id, production_number, production_date, product_id, bom_id, quantity, raw_material_cost, labor_cost, electricity_cost, total_cost, branch_id, status) VALUES
('00000000-0000-0000-0016-000000000001', 'PRD-2026-00001', '2026-03-12', '00000000-0000-0000-0004-000000000008', '00000000-0000-0000-0014-000000000001', 100, 5000, 2000, 500, 7500, 'b0000000-0000-0000-0000-000000000001', 'completed');

INSERT INTO production_materials (id, production_id, material_id, quantity, cost) VALUES
('00000000-0000-0000-0017-000000000001', '00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0004-000000000004', 50, 4000),
('00000000-0000-0000-0017-000000000002', '00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0004-000000000006', 100, 1000);

-- STOCK LEDGER - PRODUCTION
INSERT INTO stock_ledger (id, item_id, transaction_type, transaction_date, quantity_in, quantity_out, balance_quantity, unit_cost, total_value, reference_number, transaction_id, warehouse_id, branch_id) VALUES
('00000000-0000-0000-0020-000000000007', '00000000-0000-0000-0004-000000000004', 'production_out', '2026-03-12', 0, 50, 150, 80, 4000, 'PRD-2026-00001', '00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0003-000000000002', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0020-000000000008', '00000000-0000-0000-0004-000000000006', 'production_out', '2026-03-12', 0, 100, 400, 10, 1000, 'PRD-2026-00001', '00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0003-000000000002', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0020-000000000009', '00000000-0000-0000-0004-000000000008', 'production_in', '2026-03-12', 100, 0, 100, 75, 7500, 'PRD-2026-00001', '00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0003-000000000003', 'b0000000-0000-0000-0000-000000000001');

-- VOUCHERS
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, total_amount, status, financial_year_id, branch_id) VALUES
('00000000-0000-0000-00a0-000000000001', 'JV-2026-00001', 'journal', '2026-03-03', 'Office supplies purchased', 5000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000002', 'PV-2026-00001', 'payment', '2026-03-05', 'Payment to Tech Supply Ltd', 200000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000003', 'RV-2026-00001', 'receipt', '2026-03-07', 'Payment received from ABC Traders', 35000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000004', 'CV-2026-00001', 'contra', '2026-03-08', 'Cash deposited to bank', 100000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000005', 'JV-2026-00002', 'journal', '2026-03-02', 'Purchase - 100 Routers', 250000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000006', 'JV-2026-00003', 'journal', '2026-03-06', 'Sales - 10 Routers to ABC Traders', 35000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000007', 'JV-2026-00004', 'journal', '2026-03-06', 'COGS - 10 Routers', 25000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000008', 'JV-2026-00005', 'journal', '2026-03-01', 'Monthly rent - March 2026', 30000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000009', 'JV-2026-00006', 'journal', '2026-03-15', 'Utility bills - March 2026', 8000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000010', 'JV-2026-00007', 'journal', '2026-03-25', 'March 2026 salary', 130000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-00a0-000000000011', 'PV-2026-00002', 'payment', '2026-03-28', 'Salary payment - March 2026', 130000, 'approved', 'f1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');

INSERT INTO voucher_entries (id, voucher_id, account_id, debit, credit, narration, sort_order) VALUES
('00000000-0000-0000-00b0-000000000001', '00000000-0000-0000-00a0-000000000001', 'a0000000-0000-0000-0000-000000000025', 5000, 0, 'Office supplies', 1),
('00000000-0000-0000-00b0-000000000002', '00000000-0000-0000-00a0-000000000001', 'a0000000-0000-0000-0000-000000000002', 0, 5000, 'Paid from cash', 2),
('00000000-0000-0000-00b0-000000000003', '00000000-0000-0000-00a0-000000000002', 'a0000000-0000-0000-0000-000000000011', 200000, 0, 'Supplier payment', 1),
('00000000-0000-0000-00b0-000000000004', '00000000-0000-0000-00a0-000000000002', 'a0000000-0000-0000-0000-000000000003', 0, 200000, 'Paid via bank', 2),
('00000000-0000-0000-00b0-000000000005', '00000000-0000-0000-00a0-000000000003', 'a0000000-0000-0000-0000-000000000003', 35000, 0, 'Received in bank', 1),
('00000000-0000-0000-00b0-000000000006', '00000000-0000-0000-00a0-000000000003', 'a0000000-0000-0000-0000-000000000004', 0, 35000, 'Customer payment', 2),
('00000000-0000-0000-00b0-000000000007', '00000000-0000-0000-00a0-000000000004', 'a0000000-0000-0000-0000-000000000003', 100000, 0, 'Bank deposit', 1),
('00000000-0000-0000-00b0-000000000008', '00000000-0000-0000-00a0-000000000004', 'a0000000-0000-0000-0000-000000000002', 0, 100000, 'Cash withdrawn', 2),
('00000000-0000-0000-00b0-000000000009', '00000000-0000-0000-00a0-000000000005', 'a0000000-0000-0000-0000-000000000027', 250000, 0, 'Purchase account', 1),
('00000000-0000-0000-00b0-000000000010', '00000000-0000-0000-00a0-000000000005', 'a0000000-0000-0000-0000-000000000011', 0, 250000, 'Accounts payable', 2),
('00000000-0000-0000-00b0-000000000011', '00000000-0000-0000-00a0-000000000006', 'a0000000-0000-0000-0000-000000000004', 35000, 0, 'Receivable from ABC', 1),
('00000000-0000-0000-00b0-000000000012', '00000000-0000-0000-00a0-000000000006', 'a0000000-0000-0000-0000-000000000018', 0, 35000, 'Sales revenue', 2),
('00000000-0000-0000-00b0-000000000013', '00000000-0000-0000-00a0-000000000007', 'a0000000-0000-0000-0000-000000000022', 25000, 0, 'Cost of goods sold', 1),
('00000000-0000-0000-00b0-000000000014', '00000000-0000-0000-00a0-000000000007', 'a0000000-0000-0000-0000-000000000005', 0, 25000, 'Inventory decrease', 2),
('00000000-0000-0000-00b0-000000000015', '00000000-0000-0000-00a0-000000000008', 'a0000000-0000-0000-0000-000000000024', 30000, 0, 'Rent expense', 1),
('00000000-0000-0000-00b0-000000000016', '00000000-0000-0000-00a0-000000000008', 'a0000000-0000-0000-0000-000000000003', 0, 30000, 'Paid from bank', 2),
('00000000-0000-0000-00b0-000000000017', '00000000-0000-0000-00a0-000000000009', 'a0000000-0000-0000-0000-000000000026', 8000, 0, 'Utility expense', 1),
('00000000-0000-0000-00b0-000000000018', '00000000-0000-0000-00a0-000000000009', 'a0000000-0000-0000-0000-000000000002', 0, 8000, 'Paid from cash', 2),
('00000000-0000-0000-00b0-000000000019', '00000000-0000-0000-00a0-000000000010', 'a0000000-0000-0000-0000-000000000023', 130000, 0, 'Salary expense', 1),
('00000000-0000-0000-00b0-000000000020', '00000000-0000-0000-00a0-000000000010', 'a0000000-0000-0000-0000-000000000012', 0, 130000, 'Salary payable', 2),
('00000000-0000-0000-00b0-000000000021', '00000000-0000-0000-00a0-000000000011', 'a0000000-0000-0000-0000-000000000012', 130000, 0, 'Clear salary payable', 1),
('00000000-0000-0000-00b0-000000000022', '00000000-0000-0000-00a0-000000000011', 'a0000000-0000-0000-0000-000000000003', 0, 130000, 'Paid via bank', 2);

-- HRM
INSERT INTO salary_structures (id, employee_id, basic_salary, allowances, deductions, effective_from) VALUES
('00000000-0000-0000-0030-000000000001', 'e0000000-0000-0000-0000-000000000001', 35000, 10000, 0, '2023-01-15'),
('00000000-0000-0000-0030-000000000002', 'e0000000-0000-0000-0000-000000000002', 20000, 8000, 0, '2023-06-01'),
('00000000-0000-0000-0030-000000000003', 'e0000000-0000-0000-0000-000000000003', 17000, 5000, 0, '2024-01-10'),
('00000000-0000-0000-0030-000000000004', 'e0000000-0000-0000-0000-000000000004', 25000, 10000, 0, '2023-03-20');

INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES
('e0000000-0000-0000-0000-000000000001', '2026-03-01', '08:55', '17:05', 'present'),
('e0000000-0000-0000-0000-000000000001', '2026-03-02', '08:50', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000001', '2026-03-03', '09:20', '17:00', 'late'),
('e0000000-0000-0000-0000-000000000001', '2026-03-04', '08:58', '17:10', 'present'),
('e0000000-0000-0000-0000-000000000001', '2026-03-05', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000001', '2026-03-08', '08:55', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000001', '2026-03-09', '08:45', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000001', '2026-03-10', NULL, NULL, 'absent'),
('e0000000-0000-0000-0000-000000000001', '2026-03-11', '08:50', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000001', '2026-03-12', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-01', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-02', '08:55', '17:05', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-03', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-04', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-05', NULL, NULL, 'absent'),
('e0000000-0000-0000-0000-000000000002', '2026-03-08', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-09', '09:25', '17:00', 'late'),
('e0000000-0000-0000-0000-000000000002', '2026-03-10', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-11', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000002', '2026-03-12', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-01', '08:50', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-02', '08:55', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-03', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-04', '09:30', '17:00', 'late'),
('e0000000-0000-0000-0000-000000000003', '2026-03-05', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-08', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-09', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-10', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000003', '2026-03-11', NULL, NULL, 'absent'),
('e0000000-0000-0000-0000-000000000003', '2026-03-12', '08:45', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-01', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-02', '09:00', '17:05', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-03', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-04', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-05', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-08', '09:15', '17:00', 'late'),
('e0000000-0000-0000-0000-000000000004', '2026-03-09', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-10', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-11', '09:00', '17:00', 'present'),
('e0000000-0000-0000-0000-000000000004', '2026-03-12', '09:00', '17:00', 'present');

INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, reason, status) VALUES
('00000000-0000-0000-0040-000000000001', 'e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0006-000000000002', '2026-03-10', '2026-03-10', 'Sick - fever', 'approved'),
('00000000-0000-0000-0040-000000000002', 'e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0006-000000000003', '2026-03-05', '2026-03-05', 'Personal work', 'approved'),
('00000000-0000-0000-0040-000000000003', 'e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0006-000000000001', '2026-03-11', '2026-03-11', 'Family event', 'approved');

INSERT INTO payroll (id, employee_id, month, year, basic_salary, allowances, deductions, net_salary, status) VALUES
('00000000-0000-0000-0050-000000000001', 'e0000000-0000-0000-0000-000000000001', 3, 2026, 35000, 10000, 0, 45000, 'paid'),
('00000000-0000-0000-0050-000000000002', 'e0000000-0000-0000-0000-000000000002', 3, 2026, 20000, 8000, 0, 28000, 'paid'),
('00000000-0000-0000-0050-000000000003', 'e0000000-0000-0000-0000-000000000003', 3, 2026, 17000, 5000, 0, 22000, 'paid'),
('00000000-0000-0000-0050-000000000004', 'e0000000-0000-0000-0000-000000000004', 3, 2026, 25000, 10000, 0, 35000, 'paid');

-- PAGE SHORTCUTS
INSERT INTO page_shortcuts (shortcut_code, page_name, page_url, module_name) VALUES
('D1', 'Dashboard', '/', 'Dashboard'),
('A10', 'Chart of Accounts', '/accounts/chart', 'Accounts'),
('A20', 'Accounting Vouchers', '/accounts/vouchers', 'Accounts'),
('A30', 'Journal Voucher', '/accounts/vouchers?type=journal', 'Accounts'),
('A40', 'Payment Voucher', '/accounts/vouchers?type=payment', 'Accounts'),
('A50', 'Receipt Voucher', '/accounts/vouchers?type=receipt', 'Accounts'),
('A60', 'Contra Voucher', '/accounts/vouchers?type=contra', 'Accounts'),
('S10', 'Sales Invoices', '/sales', 'Sales'),
('S20', 'Customers', '/customers', 'Sales'),
('P10', 'Purchase Entries', '/purchase', 'Purchase'),
('P20', 'Suppliers', '/suppliers', 'Purchase'),
('I10', 'Item Master', '/inventory/items', 'Inventory'),
('I20', 'Item Categories', '/inventory/categories', 'Inventory'),
('I30', 'Units', '/inventory/units', 'Inventory'),
('I40', 'Warehouses', '/inventory/warehouses', 'Inventory'),
('I50', 'Stock Ledger', '/inventory/stock-ledger', 'Inventory'),
('I60', 'Stock Transfer', '/inventory/stock-transfer', 'Inventory'),
('I70', 'Stock Adjustment', '/inventory/stock-adjustment', 'Inventory'),
('I80', 'Inventory Overview', '/inventory', 'Inventory'),
('M10', 'Bill of Materials', '/manufacturing/bom', 'Manufacturing'),
('M20', 'Production Entries', '/manufacturing/production', 'Manufacturing'),
('M30', 'Raw Materials', '/manufacturing/raw-materials', 'Manufacturing'),
('M40', 'Manufacturing Reports', '/manufacturing/reports', 'Manufacturing'),
('H10', 'Employees', '/hrm/employees', 'HRM'),
('H20', 'Departments', '/hrm/departments', 'HRM'),
('H30', 'Designations', '/hrm/designations', 'HRM'),
('H40', 'Attendance', '/hrm/attendance', 'HRM'),
('H50', 'Leave Management', '/hrm/leave', 'HRM'),
('H60', 'Payroll', '/hrm/payroll', 'HRM'),
('H70', 'Shifts', '/hrm/shifts', 'HRM'),
('H80', 'Overtime', '/hrm/overtime', 'HRM'),
('H90', 'HR Dashboard', '/hrm/dashboard', 'HRM'),
('H95', 'HR Reports', '/hrm/reports', 'HRM'),
('R10', 'Trial Balance', '/reports/accounting/trial-balance', 'Reports'),
('R20', 'Profit & Loss', '/reports/accounting/profit-loss', 'Reports'),
('R30', 'Balance Sheet', '/reports/accounting/balance-sheet', 'Reports'),
('R40', 'General Ledger', '/reports/accounting/general-ledger', 'Reports'),
('R50', 'Cash Book', '/reports/accounting/cash-book', 'Reports'),
('R60', 'Bank Book', '/reports/accounting/bank-book', 'Reports'),
('R70', 'Accounts Receivable', '/reports/accounting/accounts-receivable', 'Reports'),
('R80', 'Accounts Payable', '/reports/accounting/accounts-payable', 'Reports'),
('R85', 'Account Ledger', '/reports/accounting/account-ledger', 'Reports'),
('R90', 'Financial Summary', '/reports/accounting/financial-summary', 'Reports'),
('R95', 'Stock Reports', '/reports/stock', 'Reports'),
('B10', 'Bank Accounts', '/bank/accounts', 'Bank'),
('B20', 'Cash Book', '/bank/cashbook', 'Bank'),
('X10', 'General Settings', '/admin/settings', 'Admin'),
('X20', 'User Management', '/admin/users', 'Admin'),
('X30', 'Roles & Permissions', '/admin/roles', 'Admin'),
('X40', 'Branches', '/admin/branches', 'Admin'),
('X50', 'Financial Years', '/financial-years', 'Admin'),
('X60', 'Document Numbering', '/admin/document-numbering', 'Admin'),
('X70', 'Branding', '/admin/branding', 'Admin'),
('X80', 'Audit Log', '/admin/audit-log', 'Admin'),
('X90', 'Backup & Restore', '/admin/backup', 'Admin'),
('X95', 'Page Shortcuts', '/admin/shortcuts', 'Admin'),
('EP10', 'My Profile', '/portal/profile', 'Employee Portal'),
('EP20', 'My Attendance', '/portal/attendance', 'Employee Portal'),
('EP30', 'My Leave', '/portal/leave', 'Employee Portal'),
('EP40', 'My Payslips', '/portal/payslips', 'Employee Portal'),
('EP50', 'My Documents', '/portal/documents', 'Employee Portal');

-- UPDATE COMPANY SETTINGS
UPDATE company_settings SET
  company_name = 'Demo Trading & Manufacturing Ltd',
  currency_code = 'BDT',
  currency_symbol = '৳',
  currency_name = 'Bangladeshi Taka',
  currency_position = 'before',
  address = '123 Motijheel, Dhaka-1000, Bangladesh',
  phone = '+880-2-1234567',
  email = 'info@demotrading.com',
  website = 'www.demotrading.com',
  default_branch_id = 'b0000000-0000-0000-0000-000000000001',
  default_financial_year_id = 'f1000000-0000-0000-0000-000000000001'
WHERE id = 'default';
