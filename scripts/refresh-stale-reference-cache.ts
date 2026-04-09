/**
 * Step 5 — Refresh expired property_location_cache rows via the internal API.
 *
 * Run weekly from cron (GitHub Actions, Supabase scheduled function, etc.):
 *   INTEL_WARM_BASE_URL=https://www.lokazen.in \
 *   ADMIN_SECRET=... \
 *   npx tsx scripts/refresh-stale-reference-cache.ts
 *
 * Optional: --limit=40
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

const base = (
  process.env.INTEL_WARM_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'
).replace(/\/$/, '')
const secret =
  process.env.ADMIN_SECRET?.trim() ||
  process.env.INTEL_ADMIN_SECRET?.trim() ||
  'lokazen-admin-secret'

const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limitParsed = limitArg ? parseInt(limitArg.split('=')[1] || '', 10) : NaN
const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 40

async function main() {
  const res = await fetch(`${base}/api/internal/refresh-stale-reference-cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ limit }),
  })
  const text = await res.text()
  console.log(res.status, text)
  if (!res.ok) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
