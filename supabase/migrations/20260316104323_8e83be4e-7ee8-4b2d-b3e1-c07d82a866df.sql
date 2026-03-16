
-- Add description column to number_sequences for admin UI
ALTER TABLE public.number_sequences ADD COLUMN IF NOT EXISTS description text;

-- Insert all document numbering sequences (ignore if already exist)
INSERT INTO public.number_sequences (id, prefix, year, current_number, description) VALUES
  ('sales_invoice', 'SI', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Sales Invoice'),
  ('purchase', 'PO', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Purchase Order'),
  ('journal_voucher', 'JV', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Journal Voucher'),
  ('payment_voucher', 'PV', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Payment Voucher'),
  ('receipt_voucher', 'RV', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Receipt Voucher'),
  ('contra_voucher', 'CV', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Contra Voucher'),
  ('production', 'PR', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Production Entry'),
  ('stock_transfer', 'ST', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Stock Transfer'),
  ('purchase_return', 'PRN', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Purchase Return'),
  ('sales_return', 'SRN', EXTRACT(year FROM CURRENT_DATE)::int, 0, 'Sales Return')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;
