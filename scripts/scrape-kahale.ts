/**
 * One-off scraper: KAHALE - Filter Kaapi Bar
 * Searches across all Bangalore macro-zones and inserts any found locations.
 *
 * Usage:
 *   npx tsx scripts/scrape-kahale.ts            ← dry run
 *   npx tsx scripts/scrape-kahale.ts --apply    ← write to DB
 */

import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: resolve(process.cwd(), '.env.local') })
dotenvConfig({ path: resolve(process.cwd(), '.env') })

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!MAPS_KEY) { console.error('❌  GOOGLE_MAPS_API_KEY not set'); process.exit(1) }
if (!SUPABASE_URL) { console.error('❌  SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_KEY) { console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const apply = process.argv.includes('--apply')

const BLR_BOUNDS = { minLat: 12.82, maxLat: 13.18, minLng: 77.45, maxLng: 77.80 }
function inBangalore(lat: number, lng: number) {
  return lat >= BLR_BOUNDS.minLat && lat <= BLR_BOUNDS.maxLat &&
         lng >= BLR_BOUNDS.minLng && lng <= BLR_BOUNDS.maxLng
}

function slugId(name: string, lat: number, lng: number): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
  return `gpl-${s}-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// Search from multiple Bangalore anchor points so we catch all outlets
const ANCHORS = [
  { lat: 12.9352, lng: 77.6245, zone: 'South' },   // Koramangala
  { lat: 12.9256, lng: 77.5934, zone: 'South' },   // Jayanagar
  { lat: 12.9078, lng: 77.5812, zone: 'South' },   // JP Nagar
  { lat: 12.9116, lng: 77.6412, zone: 'South' },   // HSR Layout
  { lat: 12.9784, lng: 77.6408, zone: 'East' },    // Indiranagar
  { lat: 12.9847, lng: 77.7357, zone: 'East' },    // Whitefield
  { lat: 12.9568, lng: 77.7011, zone: 'East' },    // Marathahalli
  { lat: 12.9745, lng: 77.6089, zone: 'Central' }, // MG Road
  { lat: 13.0034, lng: 77.5634, zone: 'North' },   // Malleshwaram
  { lat: 13.0456, lng: 77.5978, zone: 'North' },   // Hebbal
  { lat: 13.0156, lng: 77.6534, zone: 'North' },   // Banaswadi
]

async function textSearch(query: string, lat: number, lng: number) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', '5000')
  url.searchParams.set('key', MAPS_KEY)
  const res = await fetch(url.toString())
  return res.json() as Promise<{ status: string; results: Array<{
    name: string
    place_id: string
    business_status?: string
    geometry: { location: { lat: number; lng: number } }
    formatted_address: string
    rating?: number
    user_ratings_total?: number
  }> }>
}

async function main() {
  console.log(`\n☕  Kahale scraper  ${apply ? '(APPLYING)' : '(DRY RUN — pass --apply to write)'}`)

  // Load existing IDs
  const existingIds = new Set<string>()
  let from = 0
  while (true) {
    const { data, error } = await supabase.from('bangalore_brand_outlets').select('id').range(from, from + 999)
    if (error || !data?.length) break
    data.forEach((r: { id: string }) => existingIds.add(r.id))
    if (data.length < 1000) break
    from += 1000
  }

  const seen = new Set<string>()
  const toInsert: Array<Record<string, unknown>> = []

  for (const anchor of ANCHORS) {
    await sleep(200)
    const data = await textSearch('KAHALE Filter Kaapi Bar Bangalore', anchor.lat, anchor.lng)
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`API error: ${data.status}`)
      continue
    }
    for (const place of data.results) {
      if (place.business_status === 'CLOSED_PERMANENTLY') continue
      if (!/kahale/i.test(place.name)) continue

      const { lat, lng } = place.geometry.location
      if (!inBangalore(lat, lng)) continue

      const id = slugId(place.name, lat, lng)
      if (existingIds.has(id) || seen.has(id)) continue
      seen.add(id)

      const addrParts = place.formatted_address.split(',').map((s: string) => s.trim())
      const locality = addrParts.length >= 3 ? addrParts[addrParts.length - 3] : addrParts[0]

      toInsert.push({
        id,
        brand_name: 'KAHALE - Filter Kaapi Bar',
        industry: 'F&B',
        category: 'Specialty Coffee',
        type: 'Specialty Coffee',
        street_address: place.formatted_address,
        locality,
        zone: anchor.zone,
        lat,
        lng,
        is_active: true,
        data_source: 'google_places_text',
        data_confidence: (place.user_ratings_total ?? 0) > 50 ? 'high' : 'medium',
      })
    }
  }

  console.log(`\nFound ${toInsert.length} new location(s):\n`)
  toInsert.forEach(r =>
    console.log(`  ${(r.brand_name as string).padEnd(35)} ${r.locality}  (${r.lat}, ${r.lng})  ⭐ ${r.rating ?? '-'}`)
  )

  if (!apply) {
    console.log('\n⚠️   Dry run — pass --apply to insert into DB')
    return
  }

  let inserted = 0
  for (const row of toInsert) {
    const { error } = await supabase.from('bangalore_brand_outlets').insert(row)
    if (error) console.error(`  insert error: ${error.message}`)
    else inserted++
  }

  console.log(`\n✅  Inserted ${inserted} outlet(s)`)
}

main().catch(e => { console.error(e); process.exit(1) })
