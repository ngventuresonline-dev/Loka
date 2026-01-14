-- Simple, fast way to add map_link column
-- Run this in Supabase SQL Editor

-- Step 1: Check if column already exists (optional, but helpful)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'map_link';

-- Step 2: If column doesn't exist, add it (run this separately)
ALTER TABLE properties ADD COLUMN map_link VARCHAR(1000);
