ALTER TABLE members
ALTER COLUMN batch_code DROP NOT NULL,
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN last_name DROP NOT NULL,
ALTER COLUMN internal_role DROP NOT NULL,
ALTER COLUMN discord_id DROP NOT NULL,
ALTER COLUMN discord_role_id DROP NOT NULL;
