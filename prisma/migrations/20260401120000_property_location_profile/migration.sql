-- Phase 2: Site-visit location profile for revenue model (run once; IF NOT EXISTS is idempotent)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS road_type_confirmed TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_corner_unit BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS frontage_width_ft INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_offices_count INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_coworking_count INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_residential_units INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_colleges_count INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_gyms_clinics INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_level TEXT DEFAULT 'ground';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_signal_nearby BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS daily_footfall_estimate INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS peak_hours TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_profile_updated_at TIMESTAMPTZ;
