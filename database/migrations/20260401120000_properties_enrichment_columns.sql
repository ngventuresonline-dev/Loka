-- Additive only: first-class coordinates + pocket-derived locality fields on listings.
-- Safe to run on Supabase/Postgres; does not modify property_intelligence or ward_demographics.
-- location_id may already exist from 20250223_location_intelligence_schema.sql

ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS map_link TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS locality VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS micro_market VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS footfall_tier VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_score INTEGER;

CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON properties (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN properties.location_score IS 'Mirrors spending_power_index from bangalore_locality_intel when pocket-matched.';
