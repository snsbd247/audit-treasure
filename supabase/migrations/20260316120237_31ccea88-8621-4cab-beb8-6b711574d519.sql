
-- 1. Customers
INSERT INTO customers (id, name, email, phone, address, status) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Rahim Textiles Ltd', 'rahim@textiles.bd', '+880-1711-001001', '12 Motijheel, Dhaka', 'active'),
  ('a1000001-0000-0000-0000-000000000002', 'Karim Fashion House', 'karim@fashion.bd', '+880-1711-002002', '45 Gulshan Ave, Dhaka', 'active'),
  ('a1000001-0000-0000-0000-000000000003', 'Fatema Garments', 'fatema@garments.bd', '+880-1711-003003', '78 Uttara, Dhaka', 'active'),
  ('a1000001-0000-0000-0000-000000000004', 'Bangladesh Trading Co', 'info@bdtrading.com', '+880-1711-004004', '23 Banani, Dhaka', 'active'),
  ('a1000001-0000-0000-0000-000000000005', 'Star Export Ltd', 'star@export.bd', '+880-1711-005005', '90 Narayanganj', 'active');

-- 2. Suppliers
INSERT INTO suppliers (id, name, email, phone, address, status) VALUES
  ('b1000001-0000-0000-0000-000000000001', 'Global Raw Materials', 'global@raw.com', '+880-1811-001001', '56 Chittagong Port', 'active'),
  ('b1000001-0000-0000-0000-000000000002', 'Dhaka Chemicals Ltd', 'dhaka@chem.bd', '+880-1811-002002', '34 Tejgaon, Dhaka', 'active'),
  ('b1000001-0000-0000-0000-000000000003', 'Eastern Fabrics', 'eastern@fabrics.bd', '+880-1811-003003', '12 Gazipur', 'active'),
  ('b1000001-0000-0000-0000-000000000004', 'Prime Packaging', 'prime@pack.bd', '+880-1811-004004', '67 Savar', 'active');

-- 3. Warehouses
INSERT INTO warehouses (id, warehouse_code, warehouse_name, description, branch_id, status) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'WH-MAIN', 'Main Warehouse', 'Primary storage facility', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 'active'),
  ('c1000001-0000-0000-0000-000000000002', 'WH-FACT', 'Factory Warehouse', 'Factory raw material store', '8787efd6-c8ee-4ff2-a757-a31af235a627', 'active'),
  ('c1000001-0000-0000-0000-000000000003', 'WH-FG', 'Finished Goods Store', 'Finished product storage', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 'active');

-- 4. Product Categories
INSERT INTO product_categories (id, name) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Fabrics'),
  ('d1000001-0000-0000-0000-000000000002', 'Garments'),
  ('d1000001-0000-0000-0000-000000000003', 'Accessories');

-- 5. Products
INSERT INTO products (id, product_code, product_name, category_id, unit, cost_price, selling_price, low_stock_threshold, status) VALUES
  ('e1000001-0000-0000-0000-000000000001', 'PRD-001', 'Cotton T-Shirt', 'd1000001-0000-0000-0000-000000000002', 'pcs', 250, 450, 50, 'active'),
  ('e1000001-0000-0000-0000-000000000002', 'PRD-002', 'Polo Shirt', 'd1000001-0000-0000-0000-000000000002', 'pcs', 350, 650, 30, 'active'),
  ('e1000001-0000-0000-0000-000000000003', 'PRD-003', 'Denim Jeans', 'd1000001-0000-0000-0000-000000000002', 'pcs', 500, 950, 20, 'active'),
  ('e1000001-0000-0000-0000-000000000004', 'PRD-004', 'Cotton Fabric Roll', 'd1000001-0000-0000-0000-000000000001', 'M', 120, 200, 100, 'active'),
  ('e1000001-0000-0000-0000-000000000005', 'PRD-005', 'Button Set (12pc)', 'd1000001-0000-0000-0000-000000000003', 'SET', 15, 30, 200, 'active'),
  ('e1000001-0000-0000-0000-000000000006', 'PRD-006', 'Zipper (Metal)', 'd1000001-0000-0000-0000-000000000003', 'pcs', 8, 18, 500, 'active');

-- 6. Item Master
INSERT INTO item_master (id, item_code, item_name, item_type, unit_id, cost_price, selling_price, min_stock_level, status) VALUES
  ('f1000001-0000-0000-0000-000000000001', 'ITM-001', 'Cotton Yarn (White)', 'raw_material', '5c402c39-08bf-46d5-8ae8-ac76732dddee', 180, 0, 500, 'active'),
  ('f1000001-0000-0000-0000-000000000002', 'ITM-002', 'Polyester Thread', 'raw_material', '0476926c-bce1-41a6-b442-91631f16b8fb', 25, 0, 1000, 'active'),
  ('f1000001-0000-0000-0000-000000000003', 'ITM-003', 'Fabric Dye (Blue)', 'raw_material', '75ce7b39-71b8-4e65-bc99-f2671d2de425', 320, 0, 50, 'active'),
  ('f1000001-0000-0000-0000-000000000004', 'ITM-004', 'Packaging Box (Medium)', 'product', '19a27935-fabf-4911-956e-0f6e32decb71', 12, 25, 200, 'active');

-- 7. Raw Materials
INSERT INTO raw_materials (id, material_code, material_name, unit, cost_price, supplier_id, status) VALUES
  ('aa000001-0000-0000-0000-000000000001', 'RM-001', 'Cotton Fiber', 'KG', 180, 'b1000001-0000-0000-0000-000000000001', 'active'),
  ('aa000001-0000-0000-0000-000000000002', 'RM-002', 'Polyester Fiber', 'KG', 150, 'b1000001-0000-0000-0000-000000000001', 'active'),
  ('aa000001-0000-0000-0000-000000000003', 'RM-003', 'Indigo Dye', 'L', 450, 'b1000001-0000-0000-0000-000000000002', 'active'),
  ('aa000001-0000-0000-0000-000000000004', 'RM-004', 'Elastic Band', 'M', 12, 'b1000001-0000-0000-0000-000000000004', 'active'),
  ('aa000001-0000-0000-0000-000000000005', 'RM-005', 'Thread Spool', 'PCS', 8, 'b1000001-0000-0000-0000-000000000003', 'active');

-- 8. Sales Invoices
INSERT INTO sales_invoices (id, invoice_number, invoice_date, customer_id, branch_id, total_amount, discount, net_amount, status) VALUES
  ('ab000001-0000-0000-0000-000000000001', 'INV-2026-00001', '2026-01-15', 'a1000001-0000-0000-0000-000000000001', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 45000, 2000, 43000, 'completed'),
  ('ab000001-0000-0000-0000-000000000002', 'INV-2026-00002', '2026-02-10', 'a1000001-0000-0000-0000-000000000002', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 32500, 0, 32500, 'completed'),
  ('ab000001-0000-0000-0000-000000000003', 'INV-2026-00003', '2026-03-01', 'a1000001-0000-0000-0000-000000000003', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 95000, 5000, 90000, 'completed'),
  ('ab000001-0000-0000-0000-000000000004', 'INV-2026-00004', '2026-03-10', 'a1000001-0000-0000-0000-000000000004', '8787efd6-c8ee-4ff2-a757-a31af235a627', 18500, 500, 18000, 'completed'),
  ('ab000001-0000-0000-0000-000000000005', 'INV-2026-00005', '2026-03-15', 'a1000001-0000-0000-0000-000000000005', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 67000, 0, 67000, 'draft');

-- 9. Sales Invoice Items
INSERT INTO sales_invoice_items (sales_invoice_id, product_id, quantity, price, discount, total) VALUES
  ('ab000001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000001', 100, 450, 0, 45000),
  ('ab000001-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000002', 50, 650, 0, 32500),
  ('ab000001-0000-0000-0000-000000000003', 'e1000001-0000-0000-0000-000000000003', 100, 950, 0, 95000),
  ('ab000001-0000-0000-0000-000000000004', 'e1000001-0000-0000-0000-000000000005', 100, 30, 0, 3000),
  ('ab000001-0000-0000-0000-000000000004', 'e1000001-0000-0000-0000-000000000004', 50, 200, 0, 10000);

-- 10. Purchases
INSERT INTO purchases (id, purchase_number, purchase_date, supplier_id, branch_id, total_amount, payment_method, status) VALUES
  ('ac000001-0000-0000-0000-000000000001', 'PUR-2026-00001', '2026-01-05', 'b1000001-0000-0000-0000-000000000001', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 90000, 'bank', 'completed'),
  ('ac000001-0000-0000-0000-000000000002', 'PUR-2026-00002', '2026-02-01', 'b1000001-0000-0000-0000-000000000002', '8787efd6-c8ee-4ff2-a757-a31af235a627', 45000, 'cash', 'completed'),
  ('ac000001-0000-0000-0000-000000000003', 'PUR-2026-00003', '2026-03-05', 'b1000001-0000-0000-0000-000000000003', 'ece35b78-1f13-4f5d-bead-13fe44555e85', 120000, 'bank', 'completed');

-- 11. Purchase Items
INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total) VALUES
  ('ac000001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000004', 500, 120, 60000),
  ('ac000001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000005', 2000, 15, 30000),
  ('ac000001-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000006', 3000, 8, 24000),
  ('ac000001-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000001', 100, 250, 25000),
  ('ac000001-0000-0000-0000-000000000003', 'e1000001-0000-0000-0000-000000000003', 200, 500, 100000);

-- 12. Accounting Vouchers
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, total_amount, description, status, branch_id, financial_year_id) VALUES
  ('ad000001-0000-0000-0000-000000000001', 'JV-2026-00001', 'journal', '2026-01-15', 45000, 'Sales Invoice INV-2026-00001', 'approved', 'ece35b78-1f13-4f5d-bead-13fe44555e85', '5210730b-f494-4ba8-80c0-825e78dafb86'),
  ('ad000001-0000-0000-0000-000000000002', 'PV-2026-00001', 'payment', '2026-01-05', 90000, 'Purchase PUR-2026-00001 Payment', 'approved', 'ece35b78-1f13-4f5d-bead-13fe44555e85', '5210730b-f494-4ba8-80c0-825e78dafb86'),
  ('ad000001-0000-0000-0000-000000000003', 'RV-2026-00001', 'receipt', '2026-02-15', 43000, 'Receipt from Rahim Textiles', 'approved', 'ece35b78-1f13-4f5d-bead-13fe44555e85', '5210730b-f494-4ba8-80c0-825e78dafb86'),
  ('ad000001-0000-0000-0000-000000000004', 'JV-2026-00002', 'journal', '2026-03-01', 5000, 'Salary Expense - March', 'draft', 'ece35b78-1f13-4f5d-bead-13fe44555e85', '5210730b-f494-4ba8-80c0-825e78dafb86');

-- 13. Voucher Entries
INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('ad000001-0000-0000-0000-000000000001', 'a7c610c5-2024-48e9-bcc8-2140c8d2c322', 45000, 0, 'Accounts Receivable', 1),
  ('ad000001-0000-0000-0000-000000000001', '00210820-4e8b-4bff-85d1-f6228f894e87', 0, 45000, 'Sales Revenue', 2),
  ('ad000001-0000-0000-0000-000000000002', '75cd77da-60fb-4694-8923-5c55c97caf68', 90000, 0, 'Purchase - Raw Materials', 1),
  ('ad000001-0000-0000-0000-000000000002', '95e329a6-d611-43f9-b2b5-179a265c32a4', 0, 90000, 'Bank Payment', 2),
  ('ad000001-0000-0000-0000-000000000003', '15a9a8de-fc83-4a59-bce7-7c7bdebd5bd3', 43000, 0, 'Cash Received', 1),
  ('ad000001-0000-0000-0000-000000000003', 'a7c610c5-2024-48e9-bcc8-2140c8d2c322', 0, 43000, 'AR Settlement', 2),
  ('ad000001-0000-0000-0000-000000000004', '80125377-5e71-4ab9-8784-21fdf6b36820', 5000, 0, 'Salary Expense', 1),
  ('ad000001-0000-0000-0000-000000000004', '15a9a8de-fc83-4a59-bce7-7c7bdebd5bd3', 0, 5000, 'Cash Payment', 2);

-- 14. Stock Movements (valid check constraint values)
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, branch_id) VALUES
  ('e1000001-0000-0000-0000-000000000001', 'purchase', 100, 'purchase', 'ece35b78-1f13-4f5d-bead-13fe44555e85'),
  ('e1000001-0000-0000-0000-000000000002', 'purchase', 50, 'purchase', 'ece35b78-1f13-4f5d-bead-13fe44555e85'),
  ('e1000001-0000-0000-0000-000000000003', 'purchase', 200, 'purchase', 'ece35b78-1f13-4f5d-bead-13fe44555e85'),
  ('e1000001-0000-0000-0000-000000000001', 'sale', -100, 'sale', 'ece35b78-1f13-4f5d-bead-13fe44555e85'),
  ('e1000001-0000-0000-0000-000000000002', 'sale', -50, 'sale', 'ece35b78-1f13-4f5d-bead-13fe44555e85'),
  ('e1000001-0000-0000-0000-000000000004', 'purchase', 600, 'purchase', 'ece35b78-1f13-4f5d-bead-13fe44555e85'),
  ('e1000001-0000-0000-0000-000000000005', 'purchase', 2000, 'purchase', 'ece35b78-1f13-4f5d-bead-13fe44555e85'),
  ('e1000001-0000-0000-0000-000000000006', 'purchase', 3000, 'purchase', '8787efd6-c8ee-4ff2-a757-a31af235a627');

-- 15. Warehouse Stock
INSERT INTO warehouse_stock (warehouse_id, item_id, quantity) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001', 350),
  ('c1000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000002', 800),
  ('c1000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000003', 45),
  ('c1000001-0000-0000-0000-000000000003', 'f1000001-0000-0000-0000-000000000004', 150);

-- 16. Company settings
INSERT INTO company_settings (id, company_name, currency_name, currency_code, currency_symbol, currency_position)
VALUES ('default', 'Rahim Group of Industries', 'Bangladeshi Taka', 'BDT', '৳', 'before')
ON CONFLICT (id) DO UPDATE SET
  currency_name = EXCLUDED.currency_name,
  currency_code = EXCLUDED.currency_code,
  currency_symbol = EXCLUDED.currency_symbol,
  currency_position = EXCLUDED.currency_position,
  company_name = EXCLUDED.company_name;
