# How to Add map_link Column to Properties Table in Supabase

## Step-by-Step Instructions

### Method 1: Using Supabase SQL Editor (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration SQL**
   - Copy and paste the following SQL into the editor:

```sql
-- Add map_link column to properties table if it doesn't exist
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
```

4. **Execute the Query**
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - You should see a success message

5. **Verify the Column**
   - Run this query to verify:
```sql
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'map_link';
```

### Method 2: Using Supabase Table Editor

1. **Go to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - Find and click on the `properties` table

2. **Add New Column**
   - Click the "+" button or "Add Column" button
   - Fill in the details:
     - **Name**: `map_link`
     - **Type**: `varchar`
     - **Length**: `1000`
     - **Nullable**: ✅ (checked)
     - **Default Value**: Leave empty

3. **Save**
   - Click "Save" or "Add Column"

### Method 3: Using Prisma Migrate (If you have Prisma CLI set up)

If you have Prisma configured with your Supabase database:

```bash
# Generate migration
npx prisma migrate dev --name add_map_link_column

# Or push schema directly
npx prisma db push
```

## Verification

After adding the column, verify it exists:

```sql
-- Check if column exists
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'map_link';
```

Expected result:
- `column_name`: `map_link`
- `data_type`: `character varying`
- `character_maximum_length`: `1000`
- `is_nullable`: `YES`

## Troubleshooting

### If you get "column already exists" error:
- The column is already there! You can skip this step.

### If you get permission errors:
- Make sure you're logged in as the project owner or have admin permissions
- Check that you're connected to the correct database

### If the column doesn't appear in the app:
- Refresh your browser
- Clear browser cache
- Restart your Next.js development server if running locally

## Next Steps

Once the column is added:
1. The API will automatically start saving `mapLink` values
2. You can test by editing a property and adding a Google Maps link
3. The link will be saved and displayed when viewing the property
