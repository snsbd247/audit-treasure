
-- Seed Chart of Accounts with standard accounts for auto-posting (lowercase types)
INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_active, opening_balance, opening_balance_type)
VALUES
  ('1000', 'Cash', 'asset', true, 0, 'debit'),
  ('1010', 'Bank', 'asset', true, 0, 'debit'),
  ('1020', 'Accounts Receivable', 'asset', true, 0, 'debit'),
  ('1030', 'Inventory', 'asset', true, 0, 'debit'),
  ('1040', 'Raw Material', 'asset', true, 0, 'debit'),
  ('1050', 'Work in Progress', 'asset', true, 0, 'debit'),
  ('1060', 'Finished Goods', 'asset', true, 0, 'debit'),
  ('2000', 'Accounts Payable', 'liability', true, 0, 'credit'),
  ('2010', 'Accrued Expenses', 'liability', true, 0, 'credit'),
  ('3000', 'Owner Equity', 'equity', true, 0, 'credit'),
  ('3010', 'Retained Earnings', 'equity', true, 0, 'credit'),
  ('4000', 'Sales', 'income', true, 0, 'credit'),
  ('4010', 'Sales Revenue', 'income', true, 0, 'credit'),
  ('4020', 'Other Income', 'income', true, 0, 'credit'),
  ('4100', 'Sales Return', 'income', true, 0, 'debit'),
  ('5000', 'Purchase', 'expense', true, 0, 'debit'),
  ('5010', 'Cost of Goods Sold', 'expense', true, 0, 'debit'),
  ('5020', 'Manufacturing Overhead', 'expense', true, 0, 'debit'),
  ('5030', 'Salary Expense', 'expense', true, 0, 'debit'),
  ('5040', 'Rent Expense', 'expense', true, 0, 'debit'),
  ('5050', 'Utility Expense', 'expense', true, 0, 'debit'),
  ('5060', 'Office Supplies', 'expense', true, 0, 'debit'),
  ('5070', 'Depreciation', 'expense', true, 0, 'debit'),
  ('5100', 'Purchase Return', 'expense', true, 0, 'credit'),
  ('5200', 'Stock Adjustment', 'expense', true, 0, 'debit');

-- Add stock_adjustment sequence
INSERT INTO public.number_sequences (id, prefix, description, current_number, year)
VALUES ('stock_adjustment', 'ADJ', 'Stock Adjustment', 0, EXTRACT(year FROM CURRENT_DATE))
ON CONFLICT (id) DO NOTHING;
