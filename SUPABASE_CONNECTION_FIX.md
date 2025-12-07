# Supabase PostgreSQL Connection Fix

## Issue
The prepared statement error (`prepared statement "s0" already exists`) occurs when using Supabase's connection pooler with Prisma.

## Solution

Update your `.env.local` file to use the **direct connection** instead of the pooler:

### Current (Pooler - Port 6543):
```
DATABASE_URL="postgresql://postgres.pasuywntzuyomkwfagep:TWEETYdolls@123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
```

### Recommended (Direct - Port 5432):
```
DATABASE_URL="postgresql://postgres.pasuywntzuyomkwfagep:TWEETYdolls@123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**OR** if you have a direct connection string from Supabase:
```
DATABASE_URL="postgresql://postgres.pasuywntzuyomkwfagep:TWEETYdolls@123@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

## How to Get Direct Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Under **Connection string**, select **URI** (not Transaction mode)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password

## Alternative: Configure Pooler for Prisma

If you must use the pooler, add these parameters:
```
DATABASE_URL="postgresql://postgres.pasuywntzuyomkwfagep:TWEETYdolls@123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

However, the direct connection (port 5432) is recommended for Prisma.

## Verification

After updating, test the connection:
```bash
npx tsx test-prisma-models.ts
```

You should see successful model queries without prepared statement errors.

