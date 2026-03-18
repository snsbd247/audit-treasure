
-- Payment allocations table for invoice-wise payment adjustment
CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.party_payments(id) ON DELETE CASCADE,
  invoice_type text NOT NULL CHECK (invoice_type IN ('sales_invoice', 'purchase')),
  invoice_id uuid NOT NULL,
  allocated_amount numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_alloc_payment ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_alloc_invoice ON public.payment_allocations(invoice_type, invoice_id);
