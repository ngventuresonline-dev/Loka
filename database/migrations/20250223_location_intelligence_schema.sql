-- LOKAZEN Location Intelligence - Phase 1 Schema
-- 1000+ attribute framework - core tables

-- =============================================
-- LOCATIONS (Core - attributes 1-50)
-- =============================================
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    geo_hash VARCHAR(20),
    ward_name VARCHAR(100),
    ward_number VARCHAR(20),
    assembly_constituency VARCHAR(100),
    parliamentary_constituency VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    micro_market VARCHAR(150),
    sub_micro_market VARCHAR(150),
    pin_code VARCHAR(10),
    bbmp_zone VARCHAR(100),
    police_station VARCHAR(100),
    road_name VARCHAR(255),
    road_width_meters DECIMAL(6, 2),
    road_type VARCHAR(50),
    zoning_classification VARCHAR(100),
    attributes_json JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_lat_lng ON locations(latitude, longitude);
CREATE INDEX idx_locations_geo_hash ON locations(geo_hash);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_micro_market ON locations(micro_market);
CREATE INDEX idx_locations_pin_code ON locations(pin_code);

-- =============================================
-- LOCATION_DEMOGRAPHICS (attributes 51-250)
-- =============================================
CREATE TABLE IF NOT EXISTS location_demographics (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    location_id VARCHAR(36) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    population_100m INT,
    population_250m INT,
    population_500m INT,
    population_1km INT,
    population_3km INT,
    population_density_500m DECIMAL(12, 2),
    household_count_500m INT,
    attributes_json JSONB DEFAULT '{}',
    version INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_demographics_location_id ON location_demographics(location_id);

-- =============================================
-- LOCATION_COMMERCIAL (attributes 251-500)
-- =============================================
CREATE TABLE IF NOT EXISTS location_commercial (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    location_id VARCHAR(36) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    competitor_brand_presence JSONB DEFAULT '{}',
    saturation_indices JSONB DEFAULT '{}',
    attributes_json JSONB DEFAULT '{}',
    version INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_commercial_location_id ON location_commercial(location_id);

-- =============================================
-- LOCATION_MOBILITY (attributes 501-650)
-- =============================================
CREATE TABLE IF NOT EXISTS location_mobility (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    location_id VARCHAR(36) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    avg_daily_footfall INT,
    weekday_footfall INT,
    weekend_footfall INT,
    peak_hour_footfall INT,
    dwell_time_avg INT,
    attributes_json JSONB DEFAULT '{}',
    version INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_mobility_location_id ON location_mobility(location_id);

-- =============================================
-- LOCATION_REAL_ESTATE (attributes 651-850)
-- =============================================
CREATE TABLE IF NOT EXISTS location_real_estate (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    location_id VARCHAR(36) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    rent_per_sqft DECIMAL(10, 2),
    frontage_width DECIMAL(8, 2),
    ceiling_height DECIMAL(5, 2),
    power_load_capacity VARCHAR(50),
    attributes_json JSONB DEFAULT '{}',
    version INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_real_estate_location_id ON location_real_estate(location_id);

-- =============================================
-- LOCATION_SCORES (attributes 851-1000)
-- =============================================
CREATE TABLE IF NOT EXISTS location_scores (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    location_id VARCHAR(36) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    cafe_fit_score DECIMAL(5, 2),
    qsr_fit_score DECIMAL(5, 2),
    luxury_fit_score DECIMAL(5, 2),
    revenue_projection_mid DECIMAL(15, 2),
    roi_3yr DECIMAL(8, 2),
    whitespace_score DECIMAL(5, 2),
    demand_gap_score DECIMAL(5, 2),
    scores_json JSONB DEFAULT '{}',
    explanation_text TEXT,
    version INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_scores_location_id ON location_scores(location_id);

-- Link locations to properties (optional - for property-specific enrichment)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_id VARCHAR(36) REFERENCES locations(id);
CREATE INDEX IF NOT EXISTS idx_properties_location_id ON properties(location_id);
