
CREATE TABLE public.module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  module_key text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO public.module_settings (module_name, module_key, is_enabled) VALUES
  ('Manufacturing Module', 'manufacturing', true),
  ('Inventory Module', 'inventory', true),
  ('Multi Warehouse System', 'multi_warehouse', true),
  ('Multi Branch System', 'multi_branch', true);
