
-- Step 1: Add new columns to item_master
ALTER TABLE item_master ADD COLUMN IF NOT EXISTS opening_stock numeric NOT NULL DEFAULT 0;
ALTER TABLE item_master ADD COLUMN IF NOT EXISTS is_stock_item boolean NOT NULL DEFAULT true;

-- Step 2: Migrate products into item_master using same IDs (preserves all FK references)
INSERT INTO item_master (id, item_code, item_name, item_type, cost_price, selling_price, min_stock_level, status, created_at, updated_at)
SELECT p.id, p.product_code, p.product_name, 'product', p.cost_price, p.selling_price, p.low_stock_threshold, p.status, p.created_at, p.updated_at
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM item_master im WHERE im.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Migrate raw_materials into item_master using same IDs (preserves all FK references)
INSERT INTO item_master (id, item_code, item_name, item_type, cost_price, status, created_at, updated_at)
SELECT r.id, r.material_code, r.material_name, 'raw_material', r.cost_price, r.status, r.created_at, r.updated_at
FROM raw_materials r
WHERE NOT EXISTS (SELECT 1 FROM item_master im WHERE im.id = r.id)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Drop old FK constraints pointing to products/raw_materials
ALTER TABLE sales_invoice_items DROP CONSTRAINT IF EXISTS sales_invoice_items_product_id_fkey;
ALTER TABLE sales_return_items DROP CONSTRAINT IF EXISTS sales_return_items_product_id_fkey;
ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS purchase_items_product_id_fkey;
ALTER TABLE purchase_return_items DROP CONSTRAINT IF EXISTS purchase_return_items_product_id_fkey;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;
ALTER TABLE production_entries DROP CONSTRAINT IF EXISTS production_entries_product_id_fkey;
ALTER TABLE bill_of_materials DROP CONSTRAINT IF EXISTS bill_of_materials_product_id_fkey;
ALTER TABLE bom_items DROP CONSTRAINT IF EXISTS bom_items_material_id_fkey;
ALTER TABLE production_materials DROP CONSTRAINT IF EXISTS production_materials_material_id_fkey;

-- Step 5: Re-add FK constraints pointing to item_master
ALTER TABLE sales_invoice_items ADD CONSTRAINT sales_invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES item_master(id);
ALTER TABLE sales_return_items ADD CONSTRAINT sales_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES item_master(id);
ALTER TABLE purchase_items ADD CONSTRAINT purchase_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES item_master(id);
ALTER TABLE purchase_return_items ADD CONSTRAINT purchase_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES item_master(id);
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES item_master(id);
ALTER TABLE production_entries ADD CONSTRAINT production_entries_product_id_fkey FOREIGN KEY (product_id) REFERENCES item_master(id);
ALTER TABLE bill_of_materials ADD CONSTRAINT bill_of_materials_product_id_fkey FOREIGN KEY (product_id) REFERENCES item_master(id);
ALTER TABLE bom_items ADD CONSTRAINT bom_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES item_master(id);
ALTER TABLE production_materials ADD CONSTRAINT production_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES item_master(id);
