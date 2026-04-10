-- Owner portal: extend inquiry workflow + site visits
-- Run against PostgreSQL (e.g. Supabase). Enum additions are idempotent via DO blocks.

DO $$ BEGIN
  ALTER TYPE inquiry_status_enum ADD VALUE 'contacted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE inquiry_status_enum ADD VALUE 'scheduled';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE inquiry_status_enum ADD VALUE 'completed';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE inquiry_status_enum ADD VALUE 'cancelled';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE site_visit_status_enum AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS site_visits (
  id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id VARCHAR(36) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  inquiry_id VARCHAR(36) REFERENCES inquiries(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP(6) NOT NULL,
  status site_visit_status_enum NOT NULL DEFAULT 'scheduled',
  outcome VARCHAR(80),
  notes TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_visits_owner_id ON site_visits(owner_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_brand_id ON site_visits(brand_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_property_id ON site_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_scheduled_at ON site_visits(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);

DROP TRIGGER IF EXISTS update_site_visits_updated_at ON site_visits;
CREATE TRIGGER update_site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
