# Timezone Configuration Summary

## ✅ Completed Changes

### 1. Package Configuration
- ✅ Added `check-timezone` script to `package.json`
- ✅ Installed `date-fns-tz` package
- ✅ Added `TZ: 'Asia/Kolkata'` to `next.config.js` env configuration

### 2. Utility Functions
- ✅ Created `formatISTTimestamp()` function in `src/lib/utils.ts`
- ✅ Created `getISTTimestamp()` function for API routes
- ✅ Created `toISTString()` function for database storage format

### 3. API Routes Updated
- ✅ `src/app/api/sessions/log/route.ts` - Now uses IST timestamps
- ✅ `src/app/api/sessions/create/route.ts` - Now uses IST timestamps
- ✅ `src/app/api/sessions/update/route.ts` - Now uses IST timestamps

### 4. UI Components Updated
- ✅ `src/components/admin/RecentActivity.tsx` - Displays IST timestamps
- ✅ `src/app/status/page.tsx` - Uses IST for date formatting
- ✅ `src/app/admin/properties/pending/page.tsx` - Uses IST timestamps
- ✅ `src/components/admin/PropertyManagementTable.tsx` - Uses IST timestamps

### 5. Verification Script
- ✅ Created `scripts/check-timezone.ts` for timezone verification

## ⚠️ Manual Configuration Required

### 1. Environment Variable (.env.local)
**ACTION REQUIRED:** Add the following to your `.env.local` file:
```env
TZ=Asia/Kolkata
```

### 2. PostgreSQL Database Timezone
**ACTION REQUIRED:** Check and set PostgreSQL timezone:

1. Connect to your database:
```bash
psql $DATABASE_URL
```

2. Check current timezone:
```sql
SHOW timezone;
```

3. If not set to IST, update it:
```sql
-- For current session
SET timezone = 'Asia/Kolkata';

-- For the entire database (persistent)
ALTER DATABASE your_database_name SET timezone TO 'Asia/Kolkata';
```

4. Verify:
```sql
SELECT now();
-- Should show IST time
```

### 3. Server Environment
If deploying to a server (Vercel, etc.), ensure the environment variable is set:
- **Vercel:** Add `TZ=Asia/Kolkata` in Project Settings → Environment Variables
- **Other platforms:** Set `TZ=Asia/Kolkata` in your deployment environment variables

## 🧪 Testing

### Run Verification Script
```bash
npm run check-timezone
```

This will display:
- System timezone
- Current time in UTC, System, and IST
- Environment variable status
- Database connection info

### Test Timestamp Creation
1. Create a new session through the API
2. Check the stored timestamp - it should be in IST format
3. Verify UI displays show IST times

## 📝 Notes

- **Database Storage:** Timestamps are stored in IST format (yyyy-MM-dd HH:mm:ss)
- **API Responses:** All timestamps returned from session APIs are in IST
- **UI Display:** All timestamps shown to users are formatted in IST
- **Backward Compatibility:** Existing UTC timestamps will be correctly converted to IST when displayed

## 🔍 Additional Verification

To verify everything is working:

1. **Check API Response:**
   ```bash
   curl http://localhost:3000/api/sessions/create \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"test","userId":"test"}'
   ```
   Check the `entryTimestamp` in the response - should be IST.

2. **Check Database:**
   ```sql
   SELECT created_at, updated_at FROM brand_onboarding_sessions LIMIT 1;
   ```

3. **Check UI:**
   - Navigate to admin dashboard
   - Check "Recent Activity" section
   - Timestamps should show IST time

## 🚀 Next Steps

1. Add `TZ=Asia/Kolkata` to `.env.local`
2. Set PostgreSQL timezone to `Asia/Kolkata`
3. Restart your development server
4. Run `npm run check-timezone` to verify
5. Test creating a new session and verify timestamps
