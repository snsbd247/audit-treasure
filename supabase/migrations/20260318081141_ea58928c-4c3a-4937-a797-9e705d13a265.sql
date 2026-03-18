
-- Clear existing COA data (cascade through voucher_entries)
DELETE FROM voucher_entries;
DELETE FROM acc_vouchers;
DELETE FROM chart_of_accounts;

-- Insert Bangladesh Standard COA
-- Level 1: Root accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('1000', 'Assets', 'asset', NULL, true),
('2000', 'Liabilities', 'liability', NULL, true),
('3000', 'Equity', 'equity', NULL, true),
('4000', 'Income', 'income', NULL, true),
('5000', 'Expenses', 'expense', NULL, true),
('6000', 'VAT & TAX', 'liability', NULL, true);

-- Level 2: Sub-groups under Assets
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('1100', 'Current Assets', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1000'), true),
('1200', 'Fixed Assets', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1000'), true);

-- Level 3: Current Assets children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('1101', 'Cash in Hand', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true),
('1102', 'Bank Account', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true),
('1103', 'Accounts Receivable', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true),
('1104', 'Advance to Supplier', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true),
('1105', 'Inventory', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true),
('1106', 'Prepaid Expenses', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true);

-- Level 3: Fixed Assets children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('1201', 'Furniture & Fixtures', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true),
('1202', 'Office Equipment', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true),
('1203', 'Vehicles', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true),
('1204', 'Building', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true),
('1205', 'Accumulated Depreciation', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true);

-- Level 2: Liabilities sub-groups
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('2100', 'Current Liabilities', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2000'), true),
('2200', 'Long-Term Liabilities', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2000'), true);

-- Level 3: Current Liabilities children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('2101', 'Accounts Payable', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true),
('2102', 'Supplier Payable', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true),
('2103', 'Accrued Expenses', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true),
('2104', 'VAT Payable', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true),
('2105', 'Loan Payable (Short Term)', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true);

-- Level 3: Long-Term Liabilities children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('2201', 'Bank Loan', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2200'), true),
('2202', 'Directors Loan', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '2200'), true);

-- Level 2: Equity children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('3101', 'Owner Capital', 'equity', (SELECT id FROM chart_of_accounts WHERE account_code = '3000'), true),
('3102', 'Retained Earnings', 'equity', (SELECT id FROM chart_of_accounts WHERE account_code = '3000'), true),
('3103', 'Drawings', 'equity', (SELECT id FROM chart_of_accounts WHERE account_code = '3000'), true);

-- Level 2: Income children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('4101', 'Sales Revenue', 'income', (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), true),
('4102', 'Service Income', 'income', (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), true),
('4103', 'Other Income', 'income', (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), true),
('4104', 'Discount Received', 'income', (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), true);

-- Level 2: Expense sub-groups
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('5100', 'Direct Expenses', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5000'), true),
('5200', 'Operating Expenses', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5000'), true),
('5300', 'Financial Expenses', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5000'), true);

-- Level 3: Direct Expenses children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('5101', 'Purchase', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5100'), true),
('5102', 'Cost of Goods Sold', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5100'), true);

-- Level 3: Operating Expenses children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('5201', 'Salary Expense', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true),
('5202', 'Rent Expense', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true),
('5203', 'Utility Bills', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true),
('5204', 'Office Expense', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true),
('5205', 'Transportation', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true),
('5206', 'Marketing Expense', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true),
('5207', 'Internet Bill', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true),
('5208', 'Maintenance Expense', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true);

-- Level 3: Financial Expenses children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('5301', 'Bank Charge', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5300'), true),
('5302', 'Interest Expense', 'expense', (SELECT id FROM chart_of_accounts WHERE account_code = '5300'), true);

-- Level 2: VAT & TAX children
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, is_active) VALUES
('6101', 'Input VAT', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '6000'), true),
('6102', 'Output VAT', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '6000'), true),
('6103', 'VAT Payable', 'liability', (SELECT id FROM chart_of_accounts WHERE account_code = '6000'), true);
