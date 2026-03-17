-- Remove duplicate departments (keep oldest)
DELETE FROM departments WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM departments GROUP BY name
);

-- Remove duplicate designations
DELETE FROM designations WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM designations GROUP BY name
);

-- Remove duplicate leave types
DELETE FROM leave_types WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM leave_types GROUP BY name
);

-- Remove duplicate shifts
DELETE FROM shifts WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM shifts GROUP BY shift_name
);

-- Remove duplicate units
DELETE FROM units WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM units GROUP BY name
);

-- Remove duplicate item categories
DELETE FROM item_categories WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM item_categories GROUP BY name
);

-- Clean deleted profiles (keep only active ones)
DELETE FROM profiles WHERE status = 'deleted';