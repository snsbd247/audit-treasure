
-- Clean all transactional data while preserving profiles, settings, roles, permissions

-- 1. Child tables first (FK dependents)
DELETE FROM payment_allocations;
DELETE FROM party_payments;
DELETE FROM party_notes;

DELETE FROM sales_invoice_items;
DELETE FROM sales_return_items;
DELETE FROM sales_returns;
DELETE FROM sales_invoices;

DELETE FROM purchase_items;
DELETE FROM purchase_return_items;
DELETE FROM purchase_returns;
DELETE FROM purchases;

DELETE FROM stock_movements;
DELETE FROM stock_ledger;

DELETE FROM production_materials;
DELETE FROM production_entries;
DELETE FROM bom_items;
DELETE FROM bill_of_materials;

DELETE FROM payroll;
DELETE FROM acc_vouchers;

DELETE FROM audit_log;
DELETE FROM sms_logs;

-- 2. Master transactional data
DELETE FROM customers;
DELETE FROM suppliers;
