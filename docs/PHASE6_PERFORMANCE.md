# Phase 6: Performance (Redis, Workers)

## Redis Caching

Location intelligence responses are cached for 1 hour to reduce Mappls/Google API calls.

**Setup (optional):**
1. Create an [Upstash Redis](https://upstash.com) database
2. Add to `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```
3. If not configured, an in-memory fallback is used (per-instance, not shared across serverless invocations)

**Cache key:** `li:{lat}:{lng}:{propertyType}:{businessType}`

## Background Workers (Bulk Enrich)

For large bulk enrich jobs (e.g. 100+ locations), use a background worker to avoid request timeouts.

**Option A: Inngest**
```bash
npm install inngest
```
1. Add `src/app/api/inngest/route.ts` with an `enrichLocations` function
2. Trigger from `/api/bulk/enrich` when `items.length > 20`
3. See [Inngest docs](https://www.inngest.com/docs)

**Option B: Vercel Cron + Queue**
- Use Vercel Cron to poll a job queue table
- Or integrate with Trigger.dev, QStash, or similar

**Current behavior:** Bulk enrich runs synchronously. For >20 items, consider splitting into batches of 10-15 per request.
