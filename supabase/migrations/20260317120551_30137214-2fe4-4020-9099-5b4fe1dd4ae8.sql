-- STEP 1: Full data cleanup
DELETE FROM messages;
DELETE FROM conversation_participants;
DELETE FROM conversations;
DELETE FROM payroll;
DELETE FROM salary_structures;
DELETE FROM overtime_records;
DELETE FROM leave_requests;
DELETE FROM attendance;
DELETE FROM face_data;
DELETE FROM employee_documents;
DELETE FROM employee_education;
DELETE FROM employee_experience;
DELETE FROM employee_emergency_contacts;
DELETE FROM employee_bank_info;
DELETE FROM production_materials;
DELETE FROM production_entries;
DELETE FROM bom_items;
DELETE FROM bill_of_materials;
DELETE FROM sales_return_items;
DELETE FROM sales_returns;
DELETE FROM sales_invoice_items;
DELETE FROM sales_invoices;
DELETE FROM purchase_return_items;
DELETE FROM purchase_returns;
DELETE FROM purchase_items;
DELETE FROM purchases;
DELETE FROM stock_movements;
DELETE FROM stock_ledger;
DELETE FROM stock_transfers;
DELETE FROM voucher_entries;
DELETE FROM acc_vouchers;
DELETE FROM item_master;
DELETE FROM customers;
DELETE FROM suppliers;
DELETE FROM employees;
DELETE FROM audit_log;
DELETE FROM sms_logs;
DELETE FROM profiles WHERE employee_id IS NOT NULL;

-- STEP 2: Seed test master data

-- Customers
INSERT INTO customers (name, phone, email, address, status) VALUES
  ('ABC Trading Co.', '+8801711111111', 'abc@trading.com', '123 Commerce Road, Dhaka', 'active'),
  ('XYZ Enterprises', '+8801722222222', 'xyz@enterprise.com', '456 Business Ave, Chittagong', 'active'),
  ('Star Industries Ltd.', '+8801733333333', 'star@industries.com', '789 Industrial Zone, Gazipur', 'active');

-- Suppliers
INSERT INTO suppliers (name, phone, email, address, status) VALUES
  ('Global Raw Materials', '+8801744444444', 'global@rawmat.com', '10 Supply Chain Rd, Dhaka', 'active'),
  ('Prime Components Ltd.', '+8801755555555', 'prime@components.com', '20 Vendor Street, Narayanganj', 'active'),
  ('Eastern Supplies', '+8801766666666', 'eastern@supplies.com', '30 Import Lane, Sylhet', 'active');

-- Units
INSERT INTO units (name, abbreviation) VALUES
  ('Pieces', 'pcs'),
  ('Kilograms', 'kg'),
  ('Liters', 'ltr'),
  ('Meters', 'm')
ON CONFLICT DO NOTHING;

-- Item Categories
INSERT INTO item_categories (name, description) VALUES
  ('Raw Materials', 'Raw materials for production'),
  ('Finished Goods', 'Final products ready for sale'),
  ('Trading Goods', 'Items bought and sold as-is'),
  ('Services', 'Service items')
ON CONFLICT DO NOTHING;

-- Item Master with subqueries for category/unit references
INSERT INTO item_master (item_code, item_name, item_type, category_id, unit_id, cost_price, selling_price, min_stock_level, opening_stock, is_stock_item, status) VALUES
  ('RM-001', 'Steel Rod 12mm', 'raw_material', (SELECT id FROM item_categories WHERE name='Raw Materials' LIMIT 1), (SELECT id FROM units WHERE abbreviation='kg' LIMIT 1), 85, 0, 100, 500, true, 'active'),
  ('RM-002', 'Cotton Fabric', 'raw_material', (SELECT id FROM item_categories WHERE name='Raw Materials' LIMIT 1), (SELECT id FROM units WHERE abbreviation='m' LIMIT 1), 120, 0, 50, 300, true, 'active'),
  ('FG-001', 'Steel Frame Assembly', 'product', (SELECT id FROM item_categories WHERE name='Finished Goods' LIMIT 1), (SELECT id FROM units WHERE abbreviation='pcs' LIMIT 1), 500, 850, 20, 50, true, 'active'),
  ('FG-002', 'Cotton T-Shirt', 'product', (SELECT id FROM item_categories WHERE name='Finished Goods' LIMIT 1), (SELECT id FROM units WHERE abbreviation='pcs' LIMIT 1), 200, 450, 30, 100, true, 'active'),
  ('TG-001', 'Office Chair', 'product', (SELECT id FROM item_categories WHERE name='Trading Goods' LIMIT 1), (SELECT id FROM units WHERE abbreviation='pcs' LIMIT 1), 1500, 2500, 10, 25, true, 'active'),
  ('SRV-001', 'Installation Service', 'service', (SELECT id FROM item_categories WHERE name='Services' LIMIT 1), (SELECT id FROM units WHERE abbreviation='pcs' LIMIT 1), 0, 1000, 0, 0, false, 'active');

-- Departments
INSERT INTO departments (name, status) VALUES
  ('Administration', 'active'),
  ('Production', 'active'),
  ('Sales', 'active'),
  ('Finance', 'active')
ON CONFLICT DO NOTHING;

-- Designations
INSERT INTO designations (name, status) VALUES
  ('Manager', 'active'),
  ('Supervisor', 'active'),
  ('Officer', 'active'),
  ('Worker', 'active')
ON CONFLICT DO NOTHING;

-- Shifts
INSERT INTO shifts (shift_name, start_time, end_time, late_after_minutes) VALUES
  ('Day Shift', '09:00', '17:00', 15),
  ('Night Shift', '21:00', '05:00', 15)
ON CONFLICT DO NOTHING;

-- Leave Types
INSERT INTO leave_types (name, days_per_year) VALUES
  ('Annual Leave', 14),
  ('Sick Leave', 10),
  ('Casual Leave', 7)
ON CONFLICT DO NOTHING;