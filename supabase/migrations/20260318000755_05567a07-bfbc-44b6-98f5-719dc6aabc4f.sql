-- Party payments table for tracking customer & supplier payments
CREATE TABLE IF NOT EXISTS public.party_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_type text NOT NULL CHECK (party_type IN ('customer', 'supplier')),
  party_id uuid NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  reference text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_party_payments_party ON public.party_payments(party_type, party_id);
CREATE INDEX IF NOT EXISTS idx_party_payments_date ON public.party_payments(payment_date);