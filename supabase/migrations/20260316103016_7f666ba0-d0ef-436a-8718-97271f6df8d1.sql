
-- Units table
CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  abbreviation text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default units
INSERT INTO public.units (name, abbreviation) VALUES
  ('Pieces', 'PCS'),
  ('Kilogram', 'KG'),
  ('Gram', 'G'),
  ('Liter', 'L'),
  ('Meter', 'M'),
  ('Set', 'SET'),
  ('Box', 'BOX'),
  ('Dozen', 'DZ');

-- Item Categories (hierarchical)
CREATE TABLE public.item_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.item_categories(id) ON DELETE SET NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default categories
INSERT INTO public.item_categories (name) VALUES
  ('Raw Materials'),
  ('Finished Goods'),
  ('Services'),
  ('Consumables'),
  ('Spare Parts');

-- Item Master (unified)
CREATE TABLE public.item_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text NOT NULL UNIQUE,
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'product',
  category_id uuid REFERENCES public.item_categories(id),
  unit_id uuid REFERENCES public.units(id),
  cost_price numeric NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL DEFAULT 0,
  min_stock_level numeric NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_type_check CHECK (item_type IN ('raw_material','finished_goods','product','service','consumable'))
);

-- Warehouses
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_code text NOT NULL UNIQUE,
  warehouse_name text NOT NULL,
  branch_id uuid REFERENCES public.branches(id),
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Warehouse Stock (per item per warehouse)
CREATE TABLE public.warehouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.item_master(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, warehouse_id)
);

-- Stock Transfers
CREATE TABLE public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number text NOT NULL UNIQUE,
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  from_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  to_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  item_id uuid NOT NULL REFERENCES public.item_master(id),
  quantity numeric NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'completed',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add warehouse_id to stock_movements for warehouse-level tracking
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES public.warehouses(id);

-- Add item_id reference to stock_movements (for item_master items)
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.item_master(id);

-- Add transfer number sequence
INSERT INTO public.number_sequences (id, prefix, current_number) VALUES ('stock_transfer', 'ST', 0)
ON CONFLICT (id) DO NOTHING;
