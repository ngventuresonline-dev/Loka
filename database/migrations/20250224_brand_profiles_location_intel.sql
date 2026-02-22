-- Phase 5: Brand Matching - extend brand_profiles for location intelligence
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS avg_ticket_size DECIMAL(10,2);
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS preferred_income_bracket VARCHAR(20);
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS ideal_footfall_min INTEGER;
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS max_saturation_tolerance DECIMAL(5,2);
ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS weight_config_json JSONB;
