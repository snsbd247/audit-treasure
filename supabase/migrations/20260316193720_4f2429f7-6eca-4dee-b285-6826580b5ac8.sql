-- Insert missing module_settings rows for multi_warehouse and multi_branch
INSERT INTO module_settings (module_key, module_name, is_enabled)
VALUES
  ('multi_warehouse', 'Multi Warehouse', true),
  ('multi_branch', 'Multi Branch', true)
ON CONFLICT DO NOTHING;