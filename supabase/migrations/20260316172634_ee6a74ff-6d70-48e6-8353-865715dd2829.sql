
-- Performance indexes for ERP reporting queries
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_voucher_date ON acc_vouchers(voucher_date);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_voucher_number ON acc_vouchers(voucher_number);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_branch_id ON acc_vouchers(branch_id);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_financial_year_id ON acc_vouchers(financial_year_id);
CREATE INDEX IF NOT EXISTS idx_acc_vouchers_status ON acc_vouchers(status);

CREATE INDEX IF NOT EXISTS idx_voucher_entries_account_id ON voucher_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_voucher_entries_voucher_id ON voucher_entries(voucher_id);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_branch_id ON sales_invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_number ON sales_invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_branch_id ON purchases(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_number ON purchases(purchase_number);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse_id ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_id ON stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_item_id ON warehouse_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_warehouse_id ON warehouse_stock(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_production_entries_product_id ON production_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_production_entries_branch_id ON production_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_production_entries_production_date ON production_entries(production_date);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON chart_of_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_type ON chart_of_accounts(account_type);

CREATE INDEX IF NOT EXISTS idx_item_master_category_id ON item_master(category_id);
CREATE INDEX IF NOT EXISTS idx_item_master_item_type ON item_master(item_type);

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

CREATE INDEX IF NOT EXISTS idx_sales_return_items_product_id ON sales_return_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_return_items_product_id ON purchase_return_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_product_id ON sales_invoice_items(product_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_module ON audit_log(module);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
