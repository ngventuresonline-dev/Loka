# Admin Properties Dashboard - Diagnostic Guide

## Root Cause Analysis Steps

### Step 1: Test Database Connection
Open in browser: `http://localhost:3000/api/admin/debug`

This will show:
- ✅ Prisma client availability
- ✅ Database connection status
- ✅ Total property count in database
- ✅ Sample properties (first 5)
- ✅ Test of exact admin API query

**Expected Result:**
```json
{
  "summary": {
    "allChecksPassed": true,
    "totalChecks": 5,
    "passedChecks": 5
  },
  "checks": {
    "propertyCount": {
      "status": "OK",
      "count": 10  // <-- This should be > 0 if properties exist
    }
  }
}
```

**If count is 0:** Properties aren't being saved to database. Check property creation flow.

**If checks fail:** Database connection issue. Check `.env` and database credentials.

---

### Step 2: Test Admin API Directly
Open in browser: `http://localhost:3000/api/admin/properties?userEmail=admin@ngventures.com&limit=1000`

**Expected Result:**
```json
{
  "success": true,
  "properties": [...],
  "total": 10,
  "page": 1,
  "limit": 1000,
  "totalPages": 1
}
```

**If you see error:** Check browser console and server logs for details.

**If properties array is empty but total > 0:** Filter issue in query.

**If 401/403:** Authentication issue (shouldn't happen with admin email).

**If 500:** Check server logs for database error.

---

### Step 3: Check Browser Console
Open admin properties page: `http://localhost:3000/admin/properties`

Look for these logs:
- `[Properties] 🔍 Fetching from: ...` - Shows the URL being called
- `[Properties] 📡 Response: ...` - Shows response status and length
- `[Properties] ✅ API Response: ...` - Shows parsed data
- `[Properties] ❌ API error: ...` - Shows error details

**If you see empty error `{}`:** Response body is empty or invalid JSON.

**If you see 401/403:** Frontend not sending admin email correctly.

---

### Step 4: Check Server Logs
Look for these in your terminal where Next.js is running:

```
[Admin properties] ✅ Admin access granted
[Admin properties] 🔍 Fetching properties with filters: ...
[Admin properties] ✅ Database connected
[Admin properties] 📊 Total properties in database: 10
[Admin properties] ✅ Fetched 10 properties from database
[Admin properties] ✅ Returning 10 properties (total in DB: 10)
```

**If you see "Database has ZERO properties":** Properties aren't being saved.

**If you see database error:** Check Prisma connection and schema.

---

## Common Issues & Fixes

### Issue 1: "No properties found" but database has properties
**Cause:** Frontend filter is too restrictive or API query has wrong filters.

**Fix:** 
1. Check `statusFilter` in frontend - should be 'all' to see everything
2. Check API `where` clause - should be empty `{}` for all properties
3. Check browser console for actual API response

### Issue 2: Empty error object `{}`
**Cause:** API returning empty response or non-JSON.

**Fix:**
1. Check server logs for errors
2. Test API directly in browser
3. Check if API route is actually being hit (check logs)

### Issue 3: 401 Unauthorized
**Cause:** Admin email not being sent or auth check failing.

**Fix:**
1. Verify frontend sends `userEmail=admin@ngventures.com`
2. Check API route accepts admin email bypass
3. Check browser console for actual URL being called

### Issue 4: Database connection failed
**Cause:** Prisma client not initialized or wrong credentials.

**Fix:**
1. Check `.env` file has `DATABASE_URL`
2. Run `npx prisma generate`
3. Test with diagnostic endpoint

---

## Quick Test Commands

```bash
# Test if Prisma can connect
npx prisma db pull

# Check database directly (if you have psql)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM properties;"

# Test API with curl
curl "http://localhost:3000/api/admin/properties?userEmail=admin@ngventures.com&limit=1000"
```

---

## Files to Check

1. **API Route:** `src/app/api/admin/properties/route.ts`
   - Should export `GET` function
   - Should accept `userEmail` param
   - Should return `{ success, properties, total }`

2. **Frontend Page:** `src/app/admin/properties/page.tsx`
   - Should call `/api/admin/properties` with `userEmail`
   - Should parse response and set state
   - Should handle errors gracefully

3. **Prisma Schema:** `prisma/schema.prisma`
   - Should have `Property` model
   - Should have `owner` relation

4. **Database:** Check if `properties` table exists and has rows

---

## Next Steps After Diagnosis

1. **If database is empty:** Fix property creation flow
2. **If API returns empty:** Fix query filters
3. **If frontend shows empty:** Fix state management or filters
4. **If auth fails:** Fix authentication bypass logic

