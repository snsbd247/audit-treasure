
-- ═══════════════ PURCHASES ═══════════════
-- Purchase 1: 100 Routers from Tech Supply Ltd (PU-2026-00001)
INSERT INTO purchases (id, purchase_number, purchase_date, supplier_id, branch_id, total_amount, payment_method, notes, status) VALUES
  ('a000000c-0000-0000-0000-000000000001', 'PU-2026-00001', '2026-03-01', 'a0000006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 250000, 'cash', 'Purchase 100 Routers', 'completed');
INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total) VALUES
  ('a000000c-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000001', 100, 2500, 250000);

-- Purchase 2: 50 ONU Devices (PU-2026-00002)
INSERT INTO purchases (id, purchase_number, purchase_date, supplier_id, branch_id, total_amount, payment_method, notes, status) VALUES
  ('a000000c-0000-0000-0000-000000000002', 'PU-2026-00002', '2026-03-02', 'a0000006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 90000, 'cash', 'Purchase 50 ONU Devices', 'completed');
INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total) VALUES
  ('a000000c-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000002', 50, 1800, 90000);

-- Purchase 3: 200 Kg Plastic (PU-2026-00003)
INSERT INTO purchases (id, purchase_number, purchase_date, supplier_id, branch_id, total_amount, payment_method, notes, status) VALUES
  ('a000000c-0000-0000-0000-000000000003', 'PU-2026-00003', '2026-03-03', 'a0000006-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 16000, 'cash', 'Purchase 200 Kg Plastic', 'completed');
INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total) VALUES
  ('a000000c-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000004', 200, 80, 16000);

-- Purchase 4: 500 Packaging Boxes (PU-2026-00004)
INSERT INTO purchases (id, purchase_number, purchase_date, supplier_id, branch_id, total_amount, payment_method, notes, status) VALUES
  ('a000000c-0000-0000-0000-000000000004', 'PU-2026-00004', '2026-03-03', 'a0000006-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 7500, 'cash', 'Purchase 500 Packaging Boxes', 'completed');
INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, total) VALUES
  ('a000000c-0000-0000-0000-000000000004', 'a0000004-0000-0000-0000-000000000006', 500, 15, 7500);

-- Stock movements for purchases (quantity positive = stock in)
INSERT INTO stock_movements (product_id, branch_id, movement_type, reference_type, reference_id, quantity) VALUES
  ('a0000004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'purchase', 'purchase', 'a000000c-0000-0000-0000-000000000001', 100),
  ('a0000004-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'purchase', 'purchase', 'a000000c-0000-0000-0000-000000000002', 50),
  ('a0000004-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'purchase', 'purchase', 'a000000c-0000-0000-0000-000000000003', 200),
  ('a0000004-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000001', 'purchase', 'purchase', 'a000000c-0000-0000-0000-000000000004', 500);

-- Update number_sequences for purchases
UPDATE number_sequences SET current_number = 4 WHERE id = 'purchase';

-- ═══════════════ PURCHASE ACCOUNTING ═══════════════
-- Auto-post: Dr Purchase, Cr Accounts Payable
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, branch_id, financial_year_id, total_amount, status, approved_at) VALUES
  ('a000000d-0000-0000-0000-000000000001', 'JV-2026-00001', 'journal', '2026-03-01', 'Purchase PU-2026-00001', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 250000, 'approved', '2026-03-01'),
  ('a000000d-0000-0000-0000-000000000002', 'JV-2026-00002', 'journal', '2026-03-02', 'Purchase PU-2026-00002', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 90000, 'approved', '2026-03-02'),
  ('a000000d-0000-0000-0000-000000000003', 'JV-2026-00003', 'journal', '2026-03-03', 'Purchase PU-2026-00003', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 16000, 'approved', '2026-03-03'),
  ('a000000d-0000-0000-0000-000000000004', 'JV-2026-00004', 'journal', '2026-03-03', 'Purchase PU-2026-00004', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 7500, 'approved', '2026-03-03');

INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('a000000d-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000018', 250000, 0, 'Purchase PU-2026-00001', 0),
  ('a000000d-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000007', 0, 250000, 'Purchase PU-2026-00001', 1),
  ('a000000d-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000018', 90000, 0, 'Purchase PU-2026-00002', 0),
  ('a000000d-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000007', 0, 90000, 'Purchase PU-2026-00002', 1),
  ('a000000d-0000-0000-0000-000000000003', 'ca000001-0000-0000-0000-000000000018', 16000, 0, 'Purchase PU-2026-00003', 0),
  ('a000000d-0000-0000-0000-000000000003', 'ca000001-0000-0000-0000-000000000007', 0, 16000, 'Purchase PU-2026-00003', 1),
  ('a000000d-0000-0000-0000-000000000004', 'ca000001-0000-0000-0000-000000000018', 7500, 0, 'Purchase PU-2026-00004', 0),
  ('a000000d-0000-0000-0000-000000000004', 'ca000001-0000-0000-0000-000000000007', 0, 7500, 'Purchase PU-2026-00004', 1);

-- ═══════════════ SALES ═══════════════
-- Sale 1: 10 Routers to ABC Traders (SI-2026-00001) = 45,000
INSERT INTO sales_invoices (id, invoice_number, invoice_date, customer_id, branch_id, total_amount, discount, net_amount, status) VALUES
  ('a000000e-0000-0000-0000-000000000001', 'SI-2026-00001', '2026-03-05', 'a0000005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 45000, 0, 45000, 'completed');
INSERT INTO sales_invoice_items (sales_invoice_id, product_id, quantity, price, discount, total) VALUES
  ('a000000e-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000001', 10, 4500, 0, 45000);

-- Sale 2: 5 ONU Devices to XYZ Corporation (SI-2026-00002) = 16,000
INSERT INTO sales_invoices (id, invoice_number, invoice_date, customer_id, branch_id, total_amount, discount, net_amount, status) VALUES
  ('a000000e-0000-0000-0000-000000000002', 'SI-2026-00002', '2026-03-06', 'a0000005-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 16000, 0, 16000, 'completed');
INSERT INTO sales_invoice_items (sales_invoice_id, product_id, quantity, price, discount, total) VALUES
  ('a000000e-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000002', 5, 3200, 0, 16000);

-- Sale 3: Installation Service to Rahim Enterprise (SI-2026-00003) = 2,000
INSERT INTO sales_invoices (id, invoice_number, invoice_date, customer_id, branch_id, total_amount, discount, net_amount, status) VALUES
  ('a000000e-0000-0000-0000-000000000003', 'SI-2026-00003', '2026-03-07', 'a0000005-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 2000, 0, 2000, 'completed');
INSERT INTO sales_invoice_items (sales_invoice_id, product_id, quantity, price, discount, total) VALUES
  ('a000000e-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000007', 1, 2000, 0, 2000);

-- Stock movements for sales (negative = stock out)
INSERT INTO stock_movements (product_id, branch_id, movement_type, reference_type, reference_id, quantity) VALUES
  ('a0000004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'sale', 'sales_invoice', 'a000000e-0000-0000-0000-000000000001', -10),
  ('a0000004-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'sale', 'sales_invoice', 'a000000e-0000-0000-0000-000000000002', -5),
  ('a0000004-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000001', 'sale', 'sales_invoice', 'a000000e-0000-0000-0000-000000000003', -1);

UPDATE number_sequences SET current_number = 3 WHERE id = 'sales_invoice';

-- Sales accounting: Dr Accounts Receivable, Cr Sales Revenue
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, branch_id, financial_year_id, total_amount, status, approved_at) VALUES
  ('a000000d-0000-0000-0000-000000000005', 'JV-2026-00005', 'journal', '2026-03-05', 'Sales Invoice SI-2026-00001', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 45000, 'approved', '2026-03-05'),
  ('a000000d-0000-0000-0000-000000000006', 'JV-2026-00006', 'journal', '2026-03-06', 'Sales Invoice SI-2026-00002', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 16000, 'approved', '2026-03-06'),
  ('a000000d-0000-0000-0000-000000000007', 'JV-2026-00007', 'journal', '2026-03-07', 'Sales Invoice SI-2026-00003', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 2000, 'approved', '2026-03-07');

INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('a000000d-0000-0000-0000-000000000005', 'ca000001-0000-0000-0000-000000000004', 45000, 0, 'Sales SI-2026-00001', 0),
  ('a000000d-0000-0000-0000-000000000005', 'ca000001-0000-0000-0000-000000000012', 0, 45000, 'Sales SI-2026-00001', 1),
  ('a000000d-0000-0000-0000-000000000006', 'ca000001-0000-0000-0000-000000000004', 16000, 0, 'Sales SI-2026-00002', 0),
  ('a000000d-0000-0000-0000-000000000006', 'ca000001-0000-0000-0000-000000000012', 0, 16000, 'Sales SI-2026-00002', 1),
  ('a000000d-0000-0000-0000-000000000007', 'ca000001-0000-0000-0000-000000000004', 2000, 0, 'Sales SI-2026-00003', 0),
  ('a000000d-0000-0000-0000-000000000007', 'ca000001-0000-0000-0000-000000000012', 0, 2000, 'Sales SI-2026-00003', 1);
