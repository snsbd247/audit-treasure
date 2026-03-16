
-- Add only missing FK constraints using DO blocks to skip existing ones

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_supplier_id_fkey') THEN
    ALTER TABLE public.purchases ADD CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_branch_id_fkey') THEN
    ALTER TABLE public.purchases ADD CONSTRAINT purchases_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_items_purchase_id_fkey') THEN
    ALTER TABLE public.purchase_items ADD CONSTRAINT purchase_items_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_items_product_id_fkey') THEN
    ALTER TABLE public.purchase_items ADD CONSTRAINT purchase_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_returns_supplier_id_fkey') THEN
    ALTER TABLE public.purchase_returns ADD CONSTRAINT purchase_returns_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_returns_branch_id_fkey') THEN
    ALTER TABLE public.purchase_returns ADD CONSTRAINT purchase_returns_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_returns_purchase_id_fkey') THEN
    ALTER TABLE public.purchase_returns ADD CONSTRAINT purchase_returns_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_return_items_purchase_return_id_fkey') THEN
    ALTER TABLE public.purchase_return_items ADD CONSTRAINT purchase_return_items_purchase_return_id_fkey FOREIGN KEY (purchase_return_id) REFERENCES public.purchase_returns(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_return_items_product_id_fkey') THEN
    ALTER TABLE public.purchase_return_items ADD CONSTRAINT purchase_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoices_customer_id_fkey') THEN
    ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoices_branch_id_fkey') THEN
    ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoice_items_sales_invoice_id_fkey') THEN
    ALTER TABLE public.sales_invoice_items ADD CONSTRAINT sales_invoice_items_sales_invoice_id_fkey FOREIGN KEY (sales_invoice_id) REFERENCES public.sales_invoices(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoice_items_product_id_fkey') THEN
    ALTER TABLE public.sales_invoice_items ADD CONSTRAINT sales_invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_returns_customer_id_fkey') THEN
    ALTER TABLE public.sales_returns ADD CONSTRAINT sales_returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_returns_branch_id_fkey') THEN
    ALTER TABLE public.sales_returns ADD CONSTRAINT sales_returns_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_returns_sales_invoice_id_fkey') THEN
    ALTER TABLE public.sales_returns ADD CONSTRAINT sales_returns_sales_invoice_id_fkey FOREIGN KEY (sales_invoice_id) REFERENCES public.sales_invoices(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_return_items_sales_return_id_fkey') THEN
    ALTER TABLE public.sales_return_items ADD CONSTRAINT sales_return_items_sales_return_id_fkey FOREIGN KEY (sales_return_id) REFERENCES public.sales_returns(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_return_items_product_id_fkey') THEN
    ALTER TABLE public.sales_return_items ADD CONSTRAINT sales_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'acc_vouchers_branch_id_fkey') THEN
    ALTER TABLE public.acc_vouchers ADD CONSTRAINT acc_vouchers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'acc_vouchers_financial_year_id_fkey') THEN
    ALTER TABLE public.acc_vouchers ADD CONSTRAINT acc_vouchers_financial_year_id_fkey FOREIGN KEY (financial_year_id) REFERENCES public.financial_years(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_entries_voucher_id_fkey') THEN
    ALTER TABLE public.voucher_entries ADD CONSTRAINT voucher_entries_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.acc_vouchers(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_entries_account_id_fkey') THEN
    ALTER TABLE public.voucher_entries ADD CONSTRAINT voucher_entries_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_entries_product_id_fkey') THEN
    ALTER TABLE public.production_entries ADD CONSTRAINT production_entries_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_entries_branch_id_fkey') THEN
    ALTER TABLE public.production_entries ADD CONSTRAINT production_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_entries_bom_id_fkey') THEN
    ALTER TABLE public.production_entries ADD CONSTRAINT production_entries_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.bill_of_materials(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_materials_production_id_fkey') THEN
    ALTER TABLE public.production_materials ADD CONSTRAINT production_materials_production_id_fkey FOREIGN KEY (production_id) REFERENCES public.production_entries(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_materials_material_id_fkey') THEN
    ALTER TABLE public.production_materials ADD CONSTRAINT production_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.raw_materials(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bill_of_materials_product_id_fkey') THEN
    ALTER TABLE public.bill_of_materials ADD CONSTRAINT bill_of_materials_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bom_items_bom_id_fkey') THEN
    ALTER TABLE public.bom_items ADD CONSTRAINT bom_items_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.bill_of_materials(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bom_items_material_id_fkey') THEN
    ALTER TABLE public.bom_items ADD CONSTRAINT bom_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.raw_materials(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_product_id_fkey') THEN
    ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_branch_id_fkey') THEN
    ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_item_id_fkey') THEN
    ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item_master(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_warehouse_id_fkey') THEN
    ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfers_from_warehouse_id_fkey') THEN
    ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_from_warehouse_id_fkey FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfers_to_warehouse_id_fkey') THEN
    ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_to_warehouse_id_fkey FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transfers_item_id_fkey') THEN
    ALTER TABLE public.stock_transfers ADD CONSTRAINT stock_transfers_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item_master(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'warehouse_stock_item_id_fkey') THEN
    ALTER TABLE public.warehouse_stock ADD CONSTRAINT warehouse_stock_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item_master(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'warehouse_stock_warehouse_id_fkey') THEN
    ALTER TABLE public.warehouse_stock ADD CONSTRAINT warehouse_stock_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'warehouses_branch_id_fkey') THEN
    ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_master_category_id_fkey') THEN
    ALTER TABLE public.item_master ADD CONSTRAINT item_master_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.item_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_master_unit_id_fkey') THEN
    ALTER TABLE public.item_master ADD CONSTRAINT item_master_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_categories_parent_id_fkey') THEN
    ALTER TABLE public.item_categories ADD CONSTRAINT item_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.item_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chart_of_accounts_parent_id_fkey') THEN
    ALTER TABLE public.chart_of_accounts ADD CONSTRAINT chart_of_accounts_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_branch_id_fkey') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'raw_materials_supplier_id_fkey') THEN
    ALTER TABLE public.raw_materials ADD CONSTRAINT raw_materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_custom_role_id_fkey') THEN
    ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_custom_role_id_fkey FOREIGN KEY (custom_role_id) REFERENCES public.custom_roles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_custom_roles_custom_role_id_fkey') THEN
    ALTER TABLE public.user_custom_roles ADD CONSTRAINT user_custom_roles_custom_role_id_fkey FOREIGN KEY (custom_role_id) REFERENCES public.custom_roles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_settings_default_branch_id_fkey') THEN
    ALTER TABLE public.company_settings ADD CONSTRAINT company_settings_default_branch_id_fkey FOREIGN KEY (default_branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_settings_default_financial_year_id_fkey') THEN
    ALTER TABLE public.company_settings ADD CONSTRAINT company_settings_default_financial_year_id_fkey FOREIGN KEY (default_financial_year_id) REFERENCES public.financial_years(id) ON DELETE SET NULL;
  END IF;
END $$;
