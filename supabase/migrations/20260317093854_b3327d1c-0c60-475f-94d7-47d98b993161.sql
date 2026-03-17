ALTER TABLE profiles DROP CONSTRAINT profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'deleted'::text]));