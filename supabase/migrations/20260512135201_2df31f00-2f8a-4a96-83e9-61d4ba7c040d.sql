
DO $$
DECLARE t text;
  remaining text[] := ARRAY[
    'acc_vouchers','bill_of_materials','bom_items','branches','chart_of_accounts',
    'company_settings','custom_roles','departments','designations','financial_years',
    'item_categories','item_master','leave_types','module_settings','number_sequences',
    'party_notes','payment_allocations','product_categories','production_entries',
    'production_materials','products','purchase_items','purchase_return_items',
    'purchase_returns','purchases','raw_materials','role_permissions',
    'sales_invoice_items','sales_invoices','sales_return_items','sales_returns',
    'shifts','stock_ledger','stock_movements','stock_transfers','system_settings',
    'units','voucher_entries','warehouse_stock','warehouses'
  ];
BEGIN
  FOREACH t IN ARRAY remaining LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "Super admins manage %1$s" ON public.%1$I', t);
      EXECUTE format(
        'CREATE POLICY "Super admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()))',
        t
      );
    END IF;
  END LOOP;
END $$;
