-- Migration Script: Update existing properties to have correct status
-- Run this in Supabase SQL Editor or your PostgreSQL client

-- Step 1: Update properties with null status
-- If availability = true, set status = 'approved'
-- If availability = false, set status = 'pending'
UPDATE properties 
SET status = CASE 
  WHEN is_available = true THEN 'approved'::property_status_enum
  WHEN is_available = false THEN 'pending'::property_status_enum
  ELSE 'pending'::property_status_enum
END
WHERE status IS NULL;

-- Step 2: Ensure availability matches status
-- Approved properties should be available
UPDATE properties 
SET is_available = true 
WHERE status = 'approved' AND is_available = false;

-- Step 3: Verify the update
SELECT 
  status,
  is_available,
  COUNT(*) as count
FROM properties
GROUP BY status, is_available
ORDER BY status, is_available;

