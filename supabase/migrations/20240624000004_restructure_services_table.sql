-- ============================================
-- LK Gloss & Detail — Restructure Services Table (Phase 6.2)
-- ============================================
-- Replaces JSONB i18n columns with plain text.
-- Adds per-car-size pricing columns.
-- Replaces duration_minutes with duration_hours.

-- Drop old columns
ALTER TABLE services DROP COLUMN IF EXISTS name;
ALTER TABLE services DROP COLUMN IF EXISTS description;
ALTER TABLE services DROP COLUMN IF EXISTS short_description;
ALTER TABLE services DROP COLUMN IF EXISTS price_min;
ALTER TABLE services DROP COLUMN IF EXISTS price_max;
ALTER TABLE services DROP COLUMN IF EXISTS duration_minutes;
ALTER TABLE services DROP COLUMN IF EXISTS multipliers;

-- Add new columns
ALTER TABLE services ADD COLUMN name TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN short_description TEXT;
ALTER TABLE services ADD COLUMN price_small NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN price_medium NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN price_large NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN price_suv NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN duration_hours NUMERIC(4,2) NOT NULL DEFAULT 1;

-- Remove defaults for clean schema
ALTER TABLE services ALTER COLUMN name DROP DEFAULT;
ALTER TABLE services ALTER COLUMN price_small DROP DEFAULT;
ALTER TABLE services ALTER COLUMN price_medium DROP DEFAULT;
ALTER TABLE services ALTER COLUMN price_large DROP DEFAULT;
ALTER TABLE services ALTER COLUMN price_suv DROP DEFAULT;
ALTER TABLE services ALTER COLUMN duration_hours DROP DEFAULT;