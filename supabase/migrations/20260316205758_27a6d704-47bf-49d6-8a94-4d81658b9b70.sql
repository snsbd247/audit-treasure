
-- Seed number sequences (critical for document numbering)
INSERT INTO number_sequences (id, prefix, current_number, year, description) VALUES
  ('sales_invoice', 'SI', 0, 2026, 'Sales Invoice'),
  ('purchase', 'PU', 0, 2026, 'Purchase'),
  ('journal', 'JV', 0, 2026, 'Journal Voucher'),
  ('payment', 'PV', 0, 2026, 'Payment Voucher'),
  ('receipt', 'RV', 0, 2026, 'Receipt Voucher'),
  ('contra', 'CV', 0, 2026, 'Contra Voucher'),
  ('sales_return', 'SR', 0, 2026, 'Sales Return'),
  ('purchase_return', 'PR', 0, 2026, 'Purchase Return'),
  ('stock_transfer', 'ST', 0, 2026, 'Stock Transfer'),
  ('production', 'PRD', 0, 2026, 'Production Entry')
ON CONFLICT (id) DO NOTHING;
