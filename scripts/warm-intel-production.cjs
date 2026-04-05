/**
 * Refresh intelligence cache on production (or any URL).
 *
 * Requires ../.env.local with ADMIN_SECRET matching the target deployment.
 * Copy the value from Vercel Production → ADMIN_SECRET (must match exactly).
 *
 * Usage:
 *   node scripts/warm-intel-production.cjs
 *
 * Env:
 *   WARM_URL             default https://www.lokazen.in
 *   WARM_PROPERTY_ID     optional — single listing id (cuid); skips chunking
 *   WARM_CHUNK           default 10 — properties per request (bulk; ~20s intel cap each)
 *   WARM_MAX_ROUNDS      default 40 — safety cap on chunk iterations
 *   WARM_TIMEOUT_MS      default 280000 per HTTP request (15 listings × ~20s intel cap)
 *   FULL_WARM=1          also run Claude synthesis per industry (slow; single-property recommended)
 *
 * Default: locationOnly + chunked bulk so each request stays under Vercel maxDuration.
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), quiet: true })

const secret = (process.env.ADMIN_SECRET || '').trim()
if (!secret) {
  console.error('Missing ADMIN_SECRET in .env.local')
  process.exit(1)
}

const base = (process.env.WARM_URL || 'https://www.lokazen.in').replace(/\/$/, '')
const propertyId = process.env.WARM_PROPERTY_ID?.trim() || undefined
const fullWarm = process.env.FULL_WARM === '1'
const locationOnly = !fullWarm
const timeoutMs = Number(process.env.WARM_TIMEOUT_MS || 280000)
const chunk = Number(process.env.WARM_CHUNK || 10)
const maxRounds = Number(process.env.WARM_MAX_ROUNDS || 40)

async function oneRequest(body) {
  const res = await fetch(`${base}/api/admin/warm-intel-cache`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text.slice(0, 2000) }
  }
  return { res, json }
}

async function main() {
  if (propertyId) {
    const body = { forceRefresh: true, locationOnly, propertyId }
    console.log('POST (single property)', body)
    const { res, json } = await oneRequest(body)
    console.log('HTTP', res.status)
    console.log(JSON.stringify(json, null, 2).slice(0, 16000))
    if (!res.ok) process.exit(1)
    return
  }

  let skip = 0
  for (let round = 1; round <= maxRounds; round++) {
    const body = { forceRefresh: true, locationOnly, limit: chunk, skip }
    console.log(`POST chunk ${round} (skip=${skip}, limit=${chunk})`)
    const { res, json } = await oneRequest(body)
    console.log('HTTP', res.status)
    console.log(JSON.stringify(json, null, 2).slice(0, 12000))
    if (!res.ok) process.exit(1)
    const total = json.results?.total ?? 0
    if (total < chunk) {
      console.log('Done (last page smaller than chunk).')
      break
    }
    skip += chunk
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
