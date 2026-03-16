
-- Company settings table (singleton pattern with id = 'default')
CREATE TABLE public.company_settings (
  id text NOT NULL DEFAULT 'default' PRIMARY KEY,
  company_name text NOT NULL DEFAULT '',
  company_logo_url text,
  address text,
  phone text,
  email text,
  website text,
  currency_name text NOT NULL DEFAULT 'US Dollar',
  currency_code text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  currency_position text NOT NULL DEFAULT 'before',
  default_branch_id uuid REFERENCES public.branches(id),
  default_financial_year_id uuid REFERENCES public.financial_years(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Auth users can view company settings"
  ON public.company_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage company settings"
  ON public.company_settings FOR ALL
  TO authenticated
  USING (is_admin_or_super(auth.uid()))
  WITH CHECK (is_admin_or_super(auth.uid()));

-- Insert default row
INSERT INTO public.company_settings (id) VALUES ('default');
