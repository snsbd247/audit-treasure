
-- Insert demo roles
INSERT INTO custom_roles (id, name, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Super Admin', 'Full system access to all modules'),
  ('a1000000-0000-0000-0000-000000000002', 'Accountant', 'Access to accounting and financial reports'),
  ('a1000000-0000-0000-0000-000000000003', 'Sales Manager', 'Manage sales operations and customer relations'),
  ('a1000000-0000-0000-0000-000000000004', 'HR Manager', 'Manage employees, attendance, and payroll'),
  ('a1000000-0000-0000-0000-000000000005', 'Inventory Clerk', 'Manage stock and warehouse operations'),
  ('a1000000-0000-0000-0000-000000000006', 'Viewer', 'Read-only access to all modules');

-- Super Admin: full access
INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Dashboard', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Accounts', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Sales', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Purchase', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Manufacturing', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Inventory', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Reports', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Administration', true, true, true, true);

-- Accountant
INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Dashboard', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000002', 'Accounts', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000002', 'Sales', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000002', 'Purchase', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000002', 'Manufacturing', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000002', 'Inventory', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000002', 'Reports', true, true, false, false),
  ('a1000000-0000-0000-0000-000000000002', 'Administration', false, false, false, false);

-- Sales Manager
INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Dashboard', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000003', 'Accounts', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000003', 'Sales', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000003', 'Purchase', true, true, true, false),
  ('a1000000-0000-0000-0000-000000000003', 'Manufacturing', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000003', 'Inventory', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000003', 'Reports', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000003', 'Administration', false, false, false, false);

-- HR Manager
INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'Dashboard', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000004', 'Accounts', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000004', 'Sales', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000004', 'Purchase', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000004', 'Manufacturing', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000004', 'Inventory', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000004', 'Reports', true, true, false, false),
  ('a1000000-0000-0000-0000-000000000004', 'Administration', true, true, true, false);

-- Inventory Clerk
INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'Dashboard', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000005', 'Accounts', false, false, false, false),
  ('a1000000-0000-0000-0000-000000000005', 'Sales', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000005', 'Purchase', true, true, true, false),
  ('a1000000-0000-0000-0000-000000000005', 'Manufacturing', true, true, true, false),
  ('a1000000-0000-0000-0000-000000000005', 'Inventory', true, true, true, true),
  ('a1000000-0000-0000-0000-000000000005', 'Reports', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000005', 'Administration', false, false, false, false);

-- Viewer: read-only
INSERT INTO role_permissions (custom_role_id, module, can_view, can_add, can_edit, can_delete) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'Dashboard', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000006', 'Accounts', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000006', 'Sales', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000006', 'Purchase', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000006', 'Manufacturing', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000006', 'Inventory', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000006', 'Reports', true, false, false, false),
  ('a1000000-0000-0000-0000-000000000006', 'Administration', false, false, false, false);
