CREATE TABLE IF NOT EXISTS employee_fund_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  fund_type text NOT NULL CHECK (fund_type IN ('provident_fund', 'savings_fund')),
  is_active boolean NOT NULL DEFAULT true,
  calculation_type text NOT NULL DEFAULT 'percentage' CHECK (calculation_type IN ('percentage', 'fixed')),
  employee_rate numeric NOT NULL DEFAULT 0,
  employer_rate numeric NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, fund_type)
);

CREATE TABLE IF NOT EXISTS fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  fund_type text NOT NULL CHECK (fund_type IN ('provident_fund', 'savings_fund')),
  transaction_type text NOT NULL DEFAULT 'contribution' CHECK (transaction_type IN ('contribution', 'withdrawal', 'interest', 'adjustment')),
  employee_amount numeric NOT NULL DEFAULT 0,
  employer_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  month integer,
  year integer,
  payroll_id uuid,
  voucher_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fund_settings_employee ON employee_fund_settings(employee_id);
CREATE INDEX idx_fund_transactions_employee ON fund_transactions(employee_id);
CREATE INDEX idx_fund_transactions_period ON fund_transactions(year, month);
CREATE INDEX idx_fund_transactions_type ON fund_transactions(fund_type);