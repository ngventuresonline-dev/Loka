/**
 * Scrapes Google Places API to discover brand outlets across Bangalore.
 * Uses Nearby Search across 30 commercial corridors × 15 place types.
 * Deduplicates by place_id. Inserts new rows into bangalore_brand_outlets.
 *
 * Estimated cost: ~700–1,000 Nearby Search requests × $0.032 ≈ $25–32
 * Estimated time: ~15–20 minutes (2s page-token delay enforced by Google)
 *
 * Usage:
 *   npx tsx scripts/scrape-places-outlets.ts
 *   npx tsx scripts/scrape-places-outlets.ts --dry-run
 *   npx tsx scripts/scrape-places-outlets.ts --resume   (skip already-done corridor+type combos)
 *
 * Env: GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { resolve } from 'path'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
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
const dryRun = process.argv.includes('--dry-run')
const resume = process.argv.includes('--resume')

const donePath = resolve(process.cwd(), 'scrape-places-done.log')
const statsPath = resolve(process.cwd(), 'scrape-places-stats.json')

// ── Bangalore commercial corridors ────────────────────────────────────────────
const CORRIDORS = [
  // Core South / East
  { name: 'Koramangala 5th Block',    lat: 12.9352, lng: 77.6245, zone: 'South' },
  { name: 'Koramangala 1st Block',    lat: 12.9279, lng: 77.6271, zone: 'South' },
  { name: 'Koramangala 80ft Road',    lat: 12.9409, lng: 77.6197, zone: 'South' },
  { name: 'Indiranagar 100ft Road',   lat: 12.9784, lng: 77.6408, zone: 'East' },
  { name: 'Indiranagar 12th Main',    lat: 12.9712, lng: 77.6401, zone: 'East' },
  { name: 'HSR Layout 27th Main',     lat: 12.9116, lng: 77.6412, zone: 'South' },
  { name: 'BTM Layout 2nd Stage',     lat: 12.9178, lng: 77.6134, zone: 'South' },
  { name: 'JP Nagar 4th Phase',       lat: 12.9078, lng: 77.5812, zone: 'South' },
  { name: 'Jayanagar 4th Block',      lat: 12.9256, lng: 77.5934, zone: 'South' },
  { name: 'Bannerghatta Road',        lat: 12.8934, lng: 77.5978, zone: 'South' },
  // Central
  { name: 'MG Road / Brigade Road',   lat: 12.9745, lng: 77.6089, zone: 'Central' },
  { name: 'Church Street',            lat: 12.9712, lng: 77.6056, zone: 'Central' },
  { name: 'UB City / Vittal Mallya',  lat: 12.9712, lng: 77.5967, zone: 'Central' },
  { name: 'Richmond Road',            lat: 12.9623, lng: 77.6078, zone: 'Central' },
  { name: 'Cunningham Road',          lat: 12.9845, lng: 77.5923, zone: 'Central' },
  { name: 'Old Airport Road',         lat: 12.9601, lng: 77.6412, zone: 'Central' },
  // North
  { name: 'Malleshwaram 8th Cross',   lat: 13.0034, lng: 77.5634, zone: 'North' },
  { name: 'Rajajinagar',              lat: 12.9923, lng: 77.5534, zone: 'North' },
  { name: 'Hebbal',                   lat: 13.0456, lng: 77.5978, zone: 'North' },
  { name: 'Manyata / Nagawara',       lat: 13.0456, lng: 77.6112, zone: 'North' },
  { name: 'Yelahanka',                lat: 13.1012, lng: 77.5934, zone: 'North' },
  { name: 'Banaswadi / Kammanahalli', lat: 13.0156, lng: 77.6534, zone: 'North' },
  // East / Whitefield
  { name: 'Whitefield ITPL',          lat: 12.9847, lng: 77.7357, zone: 'East' },
  { name: 'Marathahalli Bridge',      lat: 12.9568, lng: 77.7011, zone: 'East' },
  { name: 'Kadubeesanahalli / ORR',   lat: 12.9556, lng: 77.7056, zone: 'East' },
  { name: 'Brookefield',              lat: 12.9834, lng: 77.7034, zone: 'East' },
  { name: 'Bellandur / Sarjapur ORR', lat: 12.9279, lng: 77.6878, zone: 'East' },
  { name: 'Sarjapur Road South',      lat: 12.9116, lng: 77.6745, zone: 'East' },
  // South Far
  { name: 'Electronic City Phase 1',  lat: 12.8452, lng: 77.6602, zone: 'South' },
  { name: 'Kanakapura Road',          lat: 12.8934, lng: 77.5645, zone: 'South' },
]

// ── Place types to search ─────────────────────────────────────────────────────
const PLACE_TYPES = [
  'restaurant',
  'cafe',
  'bar',
  'clothing_store',
  'shoe_store',
  'jewelry_store',
  'electronics_store',
  'supermarket',
  'gym',
  'beauty_salon',
  'spa',
  'pharmacy',
  'bakery',
  'book_store',
  'movie_theater',
]

// ── Google type → our industry/category mapping ───────────────────────────────
function mapTypes(googleTypes: string[]): { industry: string; category: string } {
  if (googleTypes.includes('restaurant')) return { industry: 'F&B', category: 'Restaurant' }
  if (googleTypes.includes('cafe')) return { industry: 'F&B', category: 'Cafe' }
  if (googleTypes.includes('bar')) return { industry: 'F&B', category: 'Bar' }
  if (googleTypes.includes('bakery')) return { industry: 'F&B', category: 'Bakery' }
  if (googleTypes.includes('clothing_store')) return { industry: 'Retail', category: 'Apparel' }
  if (googleTypes.includes('shoe_store')) return { industry: 'Retail', category: 'Footwear' }
  if (googleTypes.includes('jewelry_store')) return { industry: 'Retail', category: 'Jewellery' }
  if (googleTypes.includes('electronics_store')) return { industry: 'Retail', category: 'Electronics' }
  if (googleTypes.includes('supermarket')) return { industry: 'Retail', category: 'Grocery' }
  if (googleTypes.includes('book_store')) return { industry: 'Retail', category: 'Books' }
  if (googleTypes.includes('gym')) return { industry: 'Wellness', category: 'Gym' }
  if (googleTypes.includes('beauty_salon')) return { industry: 'Wellness', category: 'Salon' }
  if (googleTypes.includes('spa')) return { industry: 'Wellness', category: 'Spa' }
  if (googleTypes.includes('pharmacy')) return { industry: 'Services', category: 'Pharmacy' }
  if (googleTypes.includes('movie_theater')) return { industry: 'Entertainment', category: 'Cinema' }
  return { industry: 'Retail', category: 'Other' }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
type PlaceResult = {
  place_id: string
  name: string
  vicinity: string
  types: string[]
  geometry: { location: { lat: number; lng: number } }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  business_status?: string
}

type NearbyResponse = {
  status: string
  results: PlaceResult[]
  next_page_token?: string
  error_message?: string
}

async function nearbySearch(lat: number, lng: number, type: string, pageToken?: string): Promise<NearbyResponse> {
  let url = pageToken
    ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${MAPS_KEY}`
    : `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=800&type=${type}&key=${MAPS_KEY}`

  const res = await fetch(url)
  return res.json() as Promise<NearbyResponse>
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

function slugId(name: string, lat: number, lng: number): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
  return `gpl-${s}-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍  Places scraper  ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`   ${CORRIDORS.length} corridors × ${PLACE_TYPES.length} types = ${CORRIDORS.length * PLACE_TYPES.length} searches\n`)

  // Load existing place_ids and names to avoid duplicates
  const { data: existing } = await supabase
    .from('bangalore_brand_outlets')
    .select('id, brand_name, lat, lng')

  const existingIds = new Set((existing || []).map((r: { id: string }) => r.id))
  const existingNames = new Set((existing || []).map((r: { brand_name: string }) => r.brand_name.toLowerCase()))

  // Resume support
  const doneSet = new Set<string>()
  if (resume && existsSync(donePath)) {
    readFileSync(donePath, 'utf8').split('\n').filter(Boolean).forEach((l) => doneSet.add(l))
  }

  let totalInserted = 0, totalSkipped = 0, totalSearches = 0
  const allDiscovered: string[] = []

  for (const corridor of CORRIDORS) {
    for (const type of PLACE_TYPES) {
      const key = `${corridor.name}::${type}`
      if (doneSet.has(key)) { totalSearches++; continue }

      process.stdout.write(`  🗺  ${corridor.name.padEnd(30)} [${type.padEnd(18)}] `)

      let pageToken: string | undefined
      let pageCount = 0
      let corridorInserted = 0

      do {
        if (pageToken) await sleep(2100) // Google requires 2s before using page token

        let data: NearbyResponse
        try {
          data = await nearbySearch(corridor.lat, corridor.lng, type, pageToken)
        } catch (e) {
          console.log(`fetch error: ${e}`)
          break
        }

        if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
          console.error(`\n❌  API blocked: ${data.status} — ${data.error_message}`)
          process.exit(1)
        }

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.log(`status: ${data.status}`)
          break
        }

        for (const place of data.results) {
          if (place.business_status === 'CLOSED_PERMANENTLY') continue

          const id = slugId(place.name, place.geometry.location.lat, place.geometry.location.lng)

          if (existingIds.has(id)) { totalSkipped++; continue }

          // Skip very generic non-branded places
          const skipWords = ['unnamed', 'shop', 'store', 'outlet', 'market', 'hospital', 'clinic', 'atm', 'bank branch']
          if (skipWords.some((w) => place.name.toLowerCase().includes(w) && place.name.length < 15)) {
            totalSkipped++; continue
          }

          const { industry, category } = mapTypes(place.types)
          const locality = place.vicinity?.split(',').pop()?.trim() ?? corridor.name

          if (!dryRun) {
            const { error } = await supabase.from('bangalore_brand_outlets').insert({
              id,
              brand_name: place.name,
              industry,
              category,
              street_address: place.vicinity,
              locality,
              zone: corridor.zone,
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
              is_active: true,
              data_source: 'google_places',
              data_confidence: place.user_ratings_total && place.user_ratings_total > 50 ? 'high' : 'medium',
            })
            if (!error) {
              existingIds.add(id)
              allDiscovered.push(place.name)
              corridorInserted++
              totalInserted++
            } else {
              process.stdout.write(`\n    ⚠️  insert error [${place.name}]: ${error.message} (code:${error.code})\n`)
            }
          } else {
            existingIds.add(id) // prevent dry-run duplicates
            allDiscovered.push(place.name)
            corridorInserted++
            totalInserted++
          }
        }

        pageToken = data.next_page_token
        pageCount++
        await sleep(150)
      } while (pageToken && pageCount < 3) // max 3 pages = 60 results per search

      console.log(`+${corridorInserted}`)
      totalSearches++

      if (!dryRun) appendFileSync(donePath, key + '\n')
      await sleep(100)
    }
  }

  // Save stats
  const stats = { totalInserted, totalSkipped, totalSearches, timestamp: new Date().toISOString() }
  writeFileSync(statsPath, JSON.stringify(stats, null, 2))

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`🔍  Searches run : ${totalSearches}`)
  console.log(`➕  Inserted     : ${totalInserted} new outlets`)
  console.log(`⏭  Skipped      : ${totalSkipped} (already existed)`)

  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)

  // Show sample of what was found
  if (allDiscovered.length > 0) {
    console.log(`\n📋  Sample discovered:`)
    allDiscovered.slice(0, 20).forEach((n) => console.log(`    • ${n}`))
    if (allDiscovered.length > 20) console.log(`    ... and ${allDiscovered.length - 20} more`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
