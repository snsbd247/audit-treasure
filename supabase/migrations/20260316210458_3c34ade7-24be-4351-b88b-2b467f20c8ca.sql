
-- ═══════════════ MANUFACTURING ═══════════════
-- BOM: Plastic Bottle requires 0.5 kg Plastic + 1 Packaging Box
INSERT INTO bill_of_materials (id, name, product_id, notes) VALUES
  ('a000000f-0000-0000-0000-000000000001', 'Plastic Bottle BOM', 'a0000004-0000-0000-0000-000000000008', 'Requires Plastic and Packaging Box');
INSERT INTO bom_items (bom_id, material_id, quantity, unit) VALUES
  ('a000000f-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000004', 0.5, 'kg'),
  ('a000000f-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000006', 1, 'box');

-- Production: Produce 100 Plastic Bottles (PRD-2026-00001)
-- Raw material cost: 100 * 0.5kg * 80 = 4000 + 100 * 1 * 15 = 1500 = 5500
INSERT INTO production_entries (id, production_number, production_date, product_id, bom_id, quantity, branch_id, raw_material_cost, labor_cost, electricity_cost, total_cost, status) VALUES
  ('a0000010-0000-0000-0000-000000000001', 'PRD-2026-00001', '2026-03-10', 'a0000004-0000-0000-0000-000000000008', 'a000000f-0000-0000-0000-000000000001', 100, 'b0000001-0000-0000-0000-000000000001', 5500, 2000, 500, 8000, 'completed');
INSERT INTO production_materials (production_id, material_id, quantity, cost) VALUES
  ('a0000010-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000004', 50, 4000),
  ('a0000010-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000006', 100, 1500);

-- Stock movements: raw materials decrease, finished goods increase
INSERT INTO stock_movements (product_id, branch_id, movement_type, reference_type, reference_id, quantity) VALUES
  ('a0000004-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'production_out', 'production', 'a0000010-0000-0000-0000-000000000001', -50),
  ('a0000004-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000001', 'production_out', 'production', 'a0000010-0000-0000-0000-000000000001', -100),
  ('a0000004-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000001', 'production_in', 'production', 'a0000010-0000-0000-0000-000000000001', 100);

UPDATE number_sequences SET current_number = 1 WHERE id = 'production';

-- Manufacturing accounting: Dr WIP, Cr Raw Material + Dr WIP, Cr Manufacturing Overhead
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, branch_id, financial_year_id, total_amount, status, approved_at) VALUES
  ('a000000d-0000-0000-0000-000000000008', 'JV-2026-00008', 'journal', '2026-03-10', 'Production PRD-2026-00001 - Materials', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 5500, 'approved', '2026-03-10'),
  ('a000000d-0000-0000-0000-000000000009', 'JV-2026-00009', 'journal', '2026-03-10', 'Production PRD-2026-00001 - Overhead', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 2500, 'approved', '2026-03-10');
INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('a000000d-0000-0000-0000-000000000008', 'ca000001-0000-0000-0000-000000000020', 5500, 0, 'WIP - Materials', 0),
  ('a000000d-0000-0000-0000-000000000008', 'ca000001-0000-0000-0000-000000000019', 0, 5500, 'Raw Material consumed', 1),
  ('a000000d-0000-0000-0000-000000000009', 'ca000001-0000-0000-0000-000000000020', 2500, 0, 'WIP - Overhead', 0),
  ('a000000d-0000-0000-0000-000000000009', 'ca000001-0000-0000-0000-000000000021', 0, 2500, 'Manufacturing Overhead', 1);

-- ═══════════════ MANUAL ACCOUNTING VOUCHERS ═══════════════
-- Journal Voucher: Office Expense 5000 (JV-2026-00010)
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, branch_id, financial_year_id, total_amount, status, approved_at) VALUES
  ('a000000d-0000-0000-0000-000000000010', 'JV-2026-00010', 'journal', '2026-03-08', 'Office supplies expense', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 5000, 'approved', '2026-03-08');
INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('a000000d-0000-0000-0000-000000000010', 'ca000001-0000-0000-0000-000000000024', 5000, 0, 'Office supplies', 0),
  ('a000000d-0000-0000-0000-000000000010', 'ca000001-0000-0000-0000-000000000002', 0, 5000, 'Paid from cash', 1);

-- Payment Voucher: Pay supplier 100,000 (PV-2026-00001)
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, branch_id, financial_year_id, total_amount, status, approved_at) VALUES
  ('a000000d-0000-0000-0000-000000000011', 'PV-2026-00001', 'payment', '2026-03-12', 'Payment to Tech Supply Ltd', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 100000, 'approved', '2026-03-12');
INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('a000000d-0000-0000-0000-000000000011', 'ca000001-0000-0000-0000-000000000007', 100000, 0, 'Supplier payment', 0),
  ('a000000d-0000-0000-0000-000000000011', 'ca000001-0000-0000-0000-000000000003', 0, 100000, 'Bank payment', 1);

-- Receipt Voucher: Customer payment 45,000 (RV-2026-00001)
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, branch_id, financial_year_id, total_amount, status, approved_at) VALUES
  ('a000000d-0000-0000-0000-000000000012', 'RV-2026-00001', 'receipt', '2026-03-14', 'Payment from ABC Traders', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 45000, 'approved', '2026-03-14');
INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('a000000d-0000-0000-0000-000000000012', 'ca000001-0000-0000-0000-000000000003', 45000, 0, 'Customer payment received', 0),
  ('a000000d-0000-0000-0000-000000000012', 'ca000001-0000-0000-0000-000000000004', 0, 45000, 'ABC Traders payment', 1);

-- Contra Voucher: Cash to Bank 50,000 (CV-2026-00001)
INSERT INTO acc_vouchers (id, voucher_number, voucher_type, voucher_date, description, branch_id, financial_year_id, total_amount, status, approved_at) VALUES
  ('a000000d-0000-0000-0000-000000000013', 'CV-2026-00001', 'contra', '2026-03-15', 'Cash deposit to bank', 'b0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 50000, 'approved', '2026-03-15');
INSERT INTO voucher_entries (voucher_id, account_id, debit, credit, narration, sort_order) VALUES
  ('a000000d-0000-0000-0000-000000000013', 'ca000001-0000-0000-0000-000000000003', 50000, 0, 'Cash deposited to bank', 0),
  ('a000000d-0000-0000-0000-000000000013', 'ca000001-0000-0000-0000-000000000002', 0, 50000, 'Cash withdrawal', 1);

-- Update number sequences for vouchers
UPDATE number_sequences SET current_number = 10 WHERE id = 'journal_voucher';
UPDATE number_sequences SET current_number = 1 WHERE id = 'payment_voucher';
UPDATE number_sequences SET current_number = 1 WHERE id = 'receipt_voucher';
UPDATE number_sequences SET current_number = 1 WHERE id = 'contra_voucher';
