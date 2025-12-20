# Supabase Egress Optimization - Implementation Summary

## Problem
22 GB data transfer in 18 days (440% over free tier). Need immediate reduction to under 5 GB/month.

## Changes Implemented

### 1. ✅ Pagination Limits Enforced

**Admin Properties Route** (`src/app/api/admin/properties/route.ts`)
- **Before**: Default limit of 1000 records per request
- **After**: Default limit of 50, maximum enforced at 50
- **Impact**: Reduces single request egress by up to 95%

**Properties Route** (`src/app/api/properties/route.ts`)
- **Before**: Maximum limit of 100 records
- **After**: Maximum limit of 50 records
- **Impact**: Reduces single request egress by 50%

**Properties Match Route** (`src/app/api/properties/match/route.ts`)
- **Before**: Fetching up to 500 properties
- **After**: Limited to 50 properties
- **Impact**: Reduces single request egress by 90%

**Admin Matches Route** (`src/app/api/admin/matches/route.ts`)
- **Before**: Fetching ALL brands and ALL properties
- **After**: Limited to 50 brands and 50 properties
- **Impact**: Massive reduction in egress (potentially 95%+)

**Analytics Route** (`src/app/api/admin/analytics/route.ts`)
- **Before**: Fetching ALL records without limits
- **After**: Limited to last 1000 records per query
- **Impact**: Prevents unbounded growth as data increases

**Brands Routes** (`src/app/api/brands/route.ts`, `src/app/api/admin/brands/route.ts`)
- **Before**: Fetching all brands without limits
- **After**: Limited to 50 brands with pagination
- **Impact**: Reduces egress significantly

**Owner Properties Route** (`src/app/api/owner/properties/route.ts`)
- **Before**: No pagination
- **After**: Pagination with max 50 per page
- **Impact**: Prevents large responses for owners with many properties

### 2. ✅ Query Selection Optimization

All routes now use `.select()` instead of `.include()` or fetching all columns:
- Only fetch required fields
- Exclude large JSON fields when not needed
- Optimize nested relations

**Key optimizations:**
- Properties route: Only selects needed fields, excludes full description/images when not needed
- Admin routes: Minimal field selection for list views
- Match routes: Only fetch matching-relevant fields

### 3. ✅ Response Caching Implemented

Created `src/lib/api-cache.ts` with caching utilities:

**Cache Durations:**
- Property listings: 5 minutes (stale-while-revalidate: 10 minutes)
- Brand/Property matches: 10 minutes (stale-while-revalidate: 20 minutes)
- Analytics: 1 minute (stale-while-revalidate: 2 minutes)
- Stats: 1 minute (stale-while-revalidate: 2 minutes)

**Implementation:**
- Uses HTTP `Cache-Control` headers
- `s-maxage` for CDN/server caching
- `stale-while-revalidate` for better UX

**Impact**: Reduces repeated queries by serving cached responses

### 4. ✅ Query Size Logging

Added comprehensive logging to monitor egress:
- Logs endpoint, record count, and response size (KB/MB)
- Warns when responses exceed 1MB
- Helps identify future optimization opportunities

**Logging added to:**
- `/api/properties`
- `/api/properties/match`
- `/api/brands/match`
- `/api/admin/properties`
- `/api/admin/matches`
- `/api/admin/analytics`
- `/api/admin/stats`

### 5. ✅ API Route Limits

All routes now enforce maximum limits:
- **Maximum per request**: 50 records (except analytics: 1000 for time-series data)
- **Pagination**: All list endpoints support pagination
- **Total count**: Returned separately to avoid fetching all records

## Expected Impact

### Immediate Reductions:
1. **Admin Properties**: 95% reduction (1000 → 50)
2. **Properties Match**: 90% reduction (500 → 50)
3. **Admin Matches**: 95%+ reduction (unbounded → 50 brands × 50 properties)
4. **Analytics**: Prevents unbounded growth
5. **Caching**: 50-80% reduction in repeated queries

### Estimated Total Reduction:
- **Before**: ~22 GB in 18 days = ~1.22 GB/day = ~36.6 GB/month
- **After**: Estimated 5-10 GB/month (target: <5 GB/month)

## Monitoring

Check server logs for:
- `[Egress Monitor]` - Query size information
- `[Egress Warning]` - Large responses (>1MB)

## Next Steps (If Needed)

1. **Client-side caching**: Implement React Query or SWR for automatic client-side caching
2. **Database indexes**: Ensure proper indexes on filtered columns
3. **Query optimization**: Review slow queries and optimize further
4. **CDN caching**: Leverage Vercel Edge Network for static responses
5. **Rate limiting**: Add rate limits to prevent abuse

## Files Modified

1. `src/app/api/admin/properties/route.ts` - Pagination, limits, select optimization
2. `src/app/api/properties/route.ts` - Limits, select optimization, caching
3. `src/app/api/properties/match/route.ts` - Limits, select optimization, caching
4. `src/app/api/admin/matches/route.ts` - Limits, select optimization, logging
5. `src/app/api/admin/analytics/route.ts` - Limits, caching, logging
6. `src/app/api/admin/stats/route.ts` - Select optimization, caching, logging
7. `src/app/api/brands/route.ts` - Limits, select optimization
8. `src/app/api/admin/brands/route.ts` - Pagination, limits, select optimization
9. `src/app/api/brands/match/route.ts` - Caching, logging
10. `src/app/api/owner/properties/route.ts` - Pagination, limits
11. `src/lib/api-cache.ts` - **NEW** - Caching utilities and logging

## Testing Recommendations

1. Test pagination on all list endpoints
2. Verify cache headers are present in responses
3. Check logs for egress warnings
4. Monitor Supabase dashboard for egress reduction
5. Test that client-side pagination works correctly

