
-- Shifts table
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_name TEXT NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  late_after_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add shift_id to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id);

-- Overtime records
CREATE TABLE public.overtime_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC NOT NULL DEFAULT 0,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Biometric logs
CREATE TABLE public.biometric_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIME,
  check_out_time TIME,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Face data
CREATE TABLE public.face_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  face_encoding TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock ledger
CREATE TABLE public.stock_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL,
  transaction_id UUID,
  item_id UUID NOT NULL REFERENCES public.item_master(id),
  branch_id UUID REFERENCES public.branches(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  quantity_in NUMERIC NOT NULL DEFAULT 0,
  quantity_out NUMERIC NOT NULL DEFAULT 0,
  balance_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  reference_number TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for stock ledger queries
CREATE INDEX idx_stock_ledger_item ON public.stock_ledger(item_id);
CREATE INDEX idx_stock_ledger_warehouse ON public.stock_ledger(warehouse_id);
CREATE INDEX idx_stock_ledger_date ON public.stock_ledger(transaction_date);
CREATE INDEX idx_biometric_logs_processed ON public.biometric_logs(processed);
