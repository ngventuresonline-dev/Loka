-- Brand confirmation flags for site visits (Hyderabad / owner portal)
ALTER TABLE site_visits
  ADD COLUMN IF NOT EXISTS visit_confirmed_by_brand BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand_confirmed_at TIMESTAMPTZ NULL;
