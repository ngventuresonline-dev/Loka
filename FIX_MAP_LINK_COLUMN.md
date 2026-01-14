# Fix: Adding map_link Column to Supabase (Timeout Issues)

## Problem
Getting timeout errors when trying to add `map_link` column to `properties` table in Supabase.

## Solution Options

### Option 1: Use Prisma DB Push (Recommended - Easiest)

If you have Prisma configured:

```bash
# Make sure your DATABASE_URL is set in .env
npx prisma db push
```

This will sync your Prisma schema to the database automatically.

### Option 2: Direct Database Connection

If Supabase SQL Editor is timing out, connect directly:

1. **Get your connection string** from Supabase:
   - Go to Project Settings → Database
   - Copy the "Connection string" (use the "Direct connection" one)

2. **Use a database client** like:
   - **pgAdmin** (PostgreSQL GUI)
   - **DBeaver** (Free, cross-platform)
   - **TablePlus** (Mac/Windows)
   - **psql** (Command line)

3. **Connect and run**:
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS map_link VARCHAR(1000);
```

### Option 3: Supabase Dashboard - Table Editor (Try This First!)

1. Go to **Table Editor** in Supabase Dashboard
2. Click on **`properties`** table
3. Scroll to the right to see all columns
4. Click **"Add Column"** button (usually at the end of the row)
5. Fill in:
   - **Name**: `map_link`
   - **Type**: `varchar`
   - **Length**: `1000`
   - **Nullable**: ✅ Check this box
6. Click **"Save"**

### Option 4: Kill Active Connections First

If table is locked, kill active connections:

```sql
-- Find active connections
SELECT pid, usename, application_name, state, query_start, query
FROM pg_stat_activity
WHERE datname = current_database()
AND state != 'idle';

-- Kill specific connection (replace PID with actual pid from above)
SELECT pg_terminate_backend(PID_HERE);

-- Then try adding column
ALTER TABLE properties ADD COLUMN map_link VARCHAR(1000);
```

### Option 5: Wait and Retry

Sometimes Supabase has temporary issues:
1. Wait 5-10 minutes
2. Try again during off-peak hours
3. The timeout might be temporary

## Temporary Workaround

If you can't add the column right now, the API will:
- ✅ Still save all other property data
- ⚠️ Skip saving `mapLink` (won't cause errors)
- ✅ Work normally once column is added

You can add the column later when Supabase is less busy.

## Verify Column Was Added

Run this query to check:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name = 'map_link';
```

If you see a row returned, the column exists!

## Need Help?

If none of these work:
1. Check Supabase status page for outages
2. Try during off-peak hours
3. Contact Supabase support
4. Use Prisma DB Push (easiest option if available)
