-- ============================================
-- LK Gloss & Detail — Restructure Services Table (Phase 6.2)
-- ============================================
-- Replaces JSONB i18n columns with plain text.
-- Adds per-car-size pricing columns.
-- Replaces duration_minutes with duration_hours.

-- Add new columns BEFORE dropping old ones (backfill data)
ALTER TABLE services ADD COLUMN name_new TEXT;
ALTER TABLE services ADD COLUMN short_description_new TEXT;
ALTER TABLE services ADD COLUMN price_small NUMERIC(10,2);
ALTER TABLE services ADD COLUMN price_medium NUMERIC(10,2);
ALTER TABLE services ADD COLUMN price_large NUMERIC(10,2);
ALTER TABLE services ADD COLUMN price_suv NUMERIC(10,2);
ALTER TABLE services ADD COLUMN duration_hours NUMERIC(4,2);

-- Backfill: extract values from old columns
UPDATE services SET
	name_new = COALESCE(name->>'de', name->>'en', name::text),
	short_description_new = COALESCE(short_description->>'de', short_description->>'en', short_description::text),
	price_small = COALESCE((multipliers->>'small')::numeric, 1.0) * price_min,
	price_medium = COALESCE((multipliers->>'medium')::numeric, 1.3) * price_min,
	price_large = COALESCE((multipliers->>'large')::numeric, 1.6) * price_min,
	price_suv = COALESCE((multipliers->>'xl')::numeric, 2.0) * price_min,
	duration_hours = ROUND(duration_minutes::numeric / 60.0, 1);

-- Drop old columns
ALTER TABLE services DROP COLUMN IF EXISTS name;
ALTER TABLE services DROP COLUMN IF EXISTS description;
ALTER TABLE services DROP COLUMN IF EXISTS short_description;
ALTER TABLE services DROP COLUMN IF EXISTS price_min;
ALTER TABLE services DROP COLUMN IF EXISTS price_max;
ALTER TABLE services DROP COLUMN IF EXISTS duration_minutes;
ALTER TABLE services DROP COLUMN IF EXISTS multipliers;

-- Rename new columns to final names
ALTER TABLE services RENAME COLUMN name_new TO name;
ALTER TABLE services RENAME COLUMN short_description_new TO short_description;

-- Add NOT NULL constraints and defaults
ALTER TABLE services ALTER COLUMN name SET NOT NULL;
ALTER TABLE services ALTER COLUMN price_small SET NOT NULL;
ALTER TABLE services ALTER COLUMN price_medium SET NOT NULL;
ALTER TABLE services ALTER COLUMN price_large SET NOT NULL;
ALTER TABLE services ALTER COLUMN price_suv SET NOT NULL;
ALTER TABLE services ALTER COLUMN duration_hours SET NOT NULL;
ALTER TABLE services ALTER COLUMN price_small SET DEFAULT 0;
ALTER TABLE services ALTER COLUMN price_medium SET DEFAULT 0;
ALTER TABLE services ALTER COLUMN price_large SET DEFAULT 0;
ALTER TABLE services ALTER COLUMN price_suv SET DEFAULT 0;
ALTER TABLE services ALTER COLUMN duration_hours SET DEFAULT 1;

-- Add unique constraint on name for upsert support
ALTER TABLE services ADD CONSTRAINT services_name_unique UNIQUE (name);