-- Migration: Convert services table name and short_description to JSONB

-- Drop unique constraint on name if exists
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_name_unique;

-- Convert name column to JSONB safely
ALTER TABLE services 
  ALTER COLUMN name TYPE JSONB 
  USING jsonb_build_object('de', name, 'en', name, 'el', name);

-- Convert short_description column to JSONB safely
ALTER TABLE services 
  ALTER COLUMN short_description TYPE JSONB 
  USING jsonb_build_object('de', short_description, 'en', short_description, 'el', short_description);
