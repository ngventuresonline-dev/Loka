-- Ensures properties.location_id exists when the full 20250223 migration was not applied
-- (avoids Prisma errors on read/update). No FK here so it is safe if `locations` is missing.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_id VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_properties_location_id ON properties(location_id);
