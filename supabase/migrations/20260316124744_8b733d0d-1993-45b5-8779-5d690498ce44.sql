
ALTER TABLE public.sales_returns ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.purchase_returns ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
