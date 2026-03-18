-- Party notes table for customer & supplier notes
CREATE TABLE IF NOT EXISTS public.party_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_type text NOT NULL,
  party_id uuid NOT NULL,
  note text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_party_notes_party ON public.party_notes(party_type, party_id);