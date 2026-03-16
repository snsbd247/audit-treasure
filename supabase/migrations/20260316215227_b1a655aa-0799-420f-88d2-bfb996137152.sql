
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('software_name', 'SmartERP'),
  ('software_version', '1.0'),
  ('footer_text', '© 2026 SmartERP. All Rights Reserved.'),
  ('developer_name', 'Ismail Software Solutions'),
  ('white_label_mode', 'false'),
  ('primary_color', '221 83% 53%'),
  ('secondary_color', '220 14% 96%'),
  ('company_logo_url', ''),
  ('login_logo_url', ''),
  ('favicon_url', '')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now();
