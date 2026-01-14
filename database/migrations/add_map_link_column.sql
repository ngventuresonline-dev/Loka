-- Add map_link column to properties table if it doesn't exist
-- This migration is idempotent and safe to run multiple times

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'map_link'
    ) THEN
        ALTER TABLE properties 
        ADD COLUMN map_link VARCHAR(1000) NULL;
        
        RAISE NOTICE 'Column map_link added to properties table';
    ELSE
        RAISE NOTICE 'Column map_link already exists in properties table';
    END IF;
END $$;
