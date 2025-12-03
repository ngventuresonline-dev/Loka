-- GVS Platform Database Schema
-- Commercial Real Estate Platform (PostgreSQL)

-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE user_type_enum AS ENUM ('brand', 'owner', 'admin');
CREATE TYPE price_type_enum AS ENUM ('monthly', 'yearly', 'sqft');
CREATE TYPE property_type_enum AS ENUM ('office', 'retail', 'warehouse', 'restaurant', 'other');
CREATE TYPE inquiry_status_enum AS ENUM ('pending', 'responded', 'closed');
CREATE TYPE report_status_enum AS ENUM ('pending', 'completed', 'failed');

-- =============================================
-- FUNCTION FOR AUTO-UPDATING updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type user_type_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- BRAND PROFILES TABLE
-- =============================================
CREATE TABLE brand_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    preferred_locations JSONB, -- Array of location strings
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    min_size INT, -- in sq ft
    max_size INT, -- in sq ft
    preferred_property_types JSONB, -- Array of property types
    must_have_amenities JSONB, -- Array of amenity strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);

CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- OWNER PROFILES TABLE
-- =============================================
CREATE TABLE owner_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    license_number VARCHAR(100),
    total_properties INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_owner_profiles_user_id ON owner_profiles(user_id);

CREATE TRIGGER update_owner_profiles_updated_at BEFORE UPDATE ON owner_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PROPERTIES TABLE
-- =============================================
CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    
    -- Pricing
    price DECIMAL(15, 2) NOT NULL,
    price_type price_type_enum NOT NULL DEFAULT 'monthly',
    security_deposit DECIMAL(15, 2),
    rent_escalation DECIMAL(5, 2), -- Annual percentage
    
    -- Property Details
    size INT NOT NULL, -- in sq ft
    property_type property_type_enum NOT NULL,
    
    -- Power & Utilities
    store_power_capacity VARCHAR(50), -- e.g., "10 KW", "25 KW"
    power_backup BOOLEAN DEFAULT FALSE,
    water_facility BOOLEAN DEFAULT FALSE,
    
    -- Amenities (stored as JSONB array)
    amenities JSONB,
    
    -- Images (stored as JSONB array of URLs)
    images JSONB,
    
    -- Ownership & Status
    owner_id VARCHAR(36) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_size ON properties(size);
CREATE INDEX idx_properties_is_available ON properties(is_available);

-- Full-text search index for PostgreSQL
CREATE INDEX idx_properties_search ON properties USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || address));

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INQUIRIES TABLE
-- =============================================
CREATE TABLE inquiries (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    property_id VARCHAR(36) NOT NULL,
    brand_id VARCHAR(36) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    status inquiry_status_enum DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX idx_inquiries_brand_id ON inquiries(brand_id);
CREATE INDEX idx_inquiries_owner_id ON inquiries(owner_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INQUIRY RESPONSES TABLE
-- =============================================
CREATE TABLE inquiry_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    inquiry_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_inquiry_responses_inquiry_id ON inquiry_responses(inquiry_id);

-- =============================================
-- SAVED PROPERTIES (Favorites)
-- =============================================
CREATE TABLE saved_properties (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE (user_id, property_id)
);

CREATE INDEX idx_saved_properties_user_id ON saved_properties(user_id);

-- =============================================
-- PROPERTY VIEWS (Analytics)
-- =============================================
CREATE TABLE property_views (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    property_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_property_views_property_id ON property_views(property_id);
CREATE INDEX idx_property_views_viewed_at ON property_views(viewed_at);

-- =============================================
-- LOCATION INTELLIGENCE REPORTS
-- =============================================
CREATE TABLE location_reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    location VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    report_data JSONB, -- Full report data
    is_free BOOLEAN DEFAULT FALSE,
    payment_id VARCHAR(100),
    amount DECIMAL(10, 2),
    status report_status_enum DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_location_reports_user_id ON location_reports(user_id);
CREATE INDEX idx_location_reports_status ON location_reports(status);

-- =============================================
-- SAMPLE DATA INSERT
-- =============================================

-- Insert sample admin user
INSERT INTO users (id, email, password_hash, name, phone, user_type) VALUES
('admin-001', 'admin@gvsplatform.com', '$2b$10$hashedpassword', 'Admin User', '+919876543210', 'admin');

-- Insert sample owner
INSERT INTO users (id, email, password_hash, name, phone, user_type) VALUES
('owner-001', 'owner@example.com', '$2b$10$hashedpassword', 'Property Owner', '+919876543211', 'owner');

-- Insert sample brand
INSERT INTO users (id, email, password_hash, name, phone, user_type) VALUES
('brand-001', 'brand@example.com', '$2b$10$hashedpassword', 'Brand Manager', '+919876543212', 'brand');

-- Insert sample properties
INSERT INTO properties (id, title, description, address, city, state, zip_code, price, price_type, security_deposit, rent_escalation, size, property_type, store_power_capacity, power_backup, water_facility, amenities, images, owner_id) VALUES
('prop-001', 'Premium Cafe Space in Indiranagar', 'High-footfall location perfect for specialty coffee chains and QSR brands with modern interiors.', '100 Feet Road, Indiranagar', 'Bangalore', 'Karnataka', '560038', 85000, 'monthly', 510000, 5.00, 1200, 'retail', '15 KW', TRUE, TRUE, '["WiFi", "Parking", "Air Conditioning", "Kitchen Setup", "Street Facing"]'::jsonb, '["/images/cafe1.jpg"]'::jsonb, 'owner-001'),

('prop-002', 'Prime Retail Space in Koramangala', 'Corner property in upscale shopping district, ideal for fashion outlets and D2C brands.', '5th Block, Koramangala', 'Bangalore', 'Karnataka', '560095', 120000, 'monthly', 720000, 7.00, 1800, 'retail', '20 KW', TRUE, TRUE, '["Parking", "Security", "Air Conditioning", "Glass Frontage", "High Ceiling"]'::jsonb, '["/images/retail1.jpg"]'::jsonb, 'owner-001'),

('prop-003', 'Restaurant Space on MG Road', 'Premium dining space in Bangalore''s most prestigious location with rooftop access.', 'MG Road, Shanthala Nagar', 'Bangalore', 'Karnataka', '560001', 200000, 'monthly', 1200000, 8.00, 2500, 'restaurant', '50 KW', TRUE, TRUE, '["Kitchen", "Parking", "Air Conditioning", "Rooftop", "Bar License", "Elevator"]'::jsonb, '["/images/restaurant1.jpg"]'::jsonb, 'owner-001'),

('prop-004', 'Cloud Kitchen Space in HSR Layout', 'Fully-equipped kitchen space perfect for delivery-first food brands and cloud kitchens.', 'Sector 1, HSR Layout', 'Bangalore', 'Karnataka', '560102', 65000, 'monthly', 390000, 5.00, 800, 'restaurant', '30 KW', TRUE, TRUE, '["Commercial Kitchen", "Gas Pipeline", "Ventilation", "Storage", "Parking"]'::jsonb, '["/images/kitchen1.jpg"]'::jsonb, 'owner-001'),

('prop-005', 'Boutique Space in Whitefield', 'Modern retail space in emerging commercial hub, ideal for specialty stores and boutiques.', 'ITPL Main Road, Whitefield', 'Bangalore', 'Karnataka', '560066', 75000, 'monthly', 450000, 6.00, 1000, 'retail', '10 KW', TRUE, TRUE, '["Air Conditioning", "Parking", "Security", "WiFi", "Display Windows"]'::jsonb, '["/images/boutique1.jpg"]'::jsonb, 'owner-001'),

('prop-006', 'Fitness Center Space in Jayanagar', 'Spacious ground floor property perfect for gyms, yoga studios, and fitness centers.', '4th Block, Jayanagar', 'Bangalore', 'Karnataka', '560011', 95000, 'monthly', 570000, 5.00, 2000, 'office', '25 KW', TRUE, TRUE, '["Ground Floor", "Parking", "Restrooms", "Air Conditioning", "High Ceiling"]'::jsonb, '["/images/gym1.jpg"]'::jsonb, 'owner-001');
