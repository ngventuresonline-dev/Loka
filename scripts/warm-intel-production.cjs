/**
 * Refresh intelligence cache on production (or any URL).
 *
 * Requires ../.env.local with ADMIN_SECRET matching the target deployment.
 *
 * Usage:
 *   node scripts/warm-intel-production.cjs
 *
 * Env:
 *   WARM_URL            default https://www.lokazen.in
 *   WARM_PROPERTY_ID    optional — single listing id (cuid)
 *   WARM_TIMEOUT_MS     default 240000
 *   FULL_WARM=1         also run Claude synthesis per industry (slow; omit for bulk)
 *
 * Default body uses locationOnly: true so bulk refresh fits Vercel maxDuration.
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
const timeoutMs = Number(process.env.WARM_TIMEOUT_MS || 240000)

const body = {
  forceRefresh: true,
  locationOnly,
  ...(propertyId ? { propertyId } : {}),
}

console.log('POST', `${base}/api/admin/warm-intel-cache`, { locationOnly, propertyId: propertyId || '(all approved)' })

fetch(`${base}/api/admin/warm-intel-cache`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(timeoutMs),
})
  .then(async (res) => {
    const text = await res.text()
    console.log('HTTP', res.status)
    try {
      const j = JSON.parse(text)
      console.log(JSON.stringify(j, null, 2).slice(0, 16000))
    } catch {
      console.log(text.slice(0, 4000))
    }
    if (!res.ok) process.exit(1)
  })
  .catch((e) => {
    console.error(e.message || e)
    process.exit(1)
  })
