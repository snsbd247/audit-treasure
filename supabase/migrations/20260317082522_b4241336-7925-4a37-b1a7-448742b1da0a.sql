
-- Update existing role_permissions module names from title case to lowercase keys
UPDATE role_permissions SET module = 'dashboard' WHERE module = 'Dashboard';
UPDATE role_permissions SET module = 'accounts' WHERE module = 'Accounts';
UPDATE role_permissions SET module = 'sales' WHERE module = 'Sales';
UPDATE role_permissions SET module = 'purchase' WHERE module = 'Purchase';
UPDATE role_permissions SET module = 'inventory' WHERE module = 'Inventory';
UPDATE role_permissions SET module = 'manufacturing' WHERE module = 'Manufacturing';
UPDATE role_permissions SET module = 'reports' WHERE module = 'Reports';
UPDATE role_permissions SET module = 'administration' WHERE module = 'Administration';

-- Insert bank and hrm permissions for all existing roles that don't have them
INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete)
SELECT cr.id, 'bank', false, false, false, false
FROM custom_roles cr
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp WHERE rp.custom_role_id = cr.id AND rp.module = 'bank'
);

INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete)
SELECT cr.id, 'hrm', false, false, false, false
FROM custom_roles cr
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp WHERE rp.custom_role_id = cr.id AND rp.module = 'hrm'
);

-- Grant bank permissions to roles that had Accounts access (Accountant, Super Admin)
UPDATE role_permissions rp SET can_view = true, can_add = true, can_edit = true, can_delete = true
FROM role_permissions rp2
WHERE rp.custom_role_id = rp2.custom_role_id
  AND rp.module = 'bank'
  AND rp2.module = 'accounts'
  AND rp2.can_view = true AND rp2.can_add = true;

-- Grant hrm permissions to HR Manager role
UPDATE role_permissions SET can_view = true, can_add = true, can_edit = true, can_delete = true
WHERE module = 'hrm'
  AND custom_role_id IN (SELECT id FROM custom_roles WHERE name = 'HR Manager');

-- Grant hrm view to Viewer role
UPDATE role_permissions SET can_view = true
WHERE module = 'hrm'
  AND custom_role_id IN (SELECT id FROM custom_roles WHERE name = 'Viewer');

-- Grant bank view to Viewer role  
UPDATE role_permissions SET can_view = true
WHERE module = 'bank'
  AND custom_role_id IN (SELECT id FROM custom_roles WHERE name = 'Viewer');
