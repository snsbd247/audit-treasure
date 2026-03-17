
-- Update salary_structures table: add house_rent, medical_allowance, other_allowance, total_salary
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS house_rent numeric NOT NULL DEFAULT 0;
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS medical_allowance numeric NOT NULL DEFAULT 0;
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS other_allowance numeric NOT NULL DEFAULT 0;
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS total_salary numeric NOT NULL DEFAULT 0;

-- Drop old columns that are no longer needed
ALTER TABLE salary_structures DROP COLUMN IF EXISTS allowances;
ALTER TABLE salary_structures DROP COLUMN IF EXISTS deductions;

-- Create employee_bank_info table (one-to-one with employee)
CREATE TABLE IF NOT EXISTS employee_bank_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  bank_name text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  branch_name text NOT NULL DEFAULT '',
  routing_number text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create employee_education table (one-to-many)
CREATE TABLE IF NOT EXISTS employee_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  degree text NOT NULL DEFAULT '',
  institution text NOT NULL DEFAULT '',
  passing_year text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create employee_experience table (one-to-many)
CREATE TABLE IF NOT EXISTS employee_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  designation text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  job_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create employee_emergency_contacts table (one-to-many)
CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  relation text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
