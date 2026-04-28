/**
 * Scrapes Google Places API to discover real tech parks, IT parks, and office complexes
 * across Bangalore. Uses Text Search (not AI/manual data) to find real locations.
 *
 * What is stored (real, from Google):
 *   name, latitude, longitude, place_id, vicinity → locality, types → zone
 *
 * What is NOT stored (no reliable source in Places API):
 *   total_employees, total_companies, avg_rent_sqft, anchor_tenants, is_sez, grade
 *   — these are left NULL so the dashboard shows no number rather than a fake one.
 *
 * Usage:
 *   npx tsx scripts/scrape-places-tech-parks.ts
 *   npx tsx scripts/scrape-places-tech-parks.ts --dry-run
 *   npx tsx scripts/scrape-places-tech-parks.ts --resume
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

const donePath = resolve(process.cwd(), 'scrape-techparks-done.log')
const statsPath = resolve(process.cwd(), 'scrape-techparks-stats.json')

// Bangalore bounding box for filtering stray results
const BLR = { latMin: 12.70, latMax: 13.45, lngMin: 77.30, lngMax: 77.95 }

function inBangalore(lat: number, lng: number): boolean {
  return lat >= BLR.latMin && lat <= BLR.latMax && lng >= BLR.lngMin && lng <= BLR.lngMax
}

// ── Zone from coordinates ─────────────────────────────────────────────────────
function zoneFromCoords(lat: number, lng: number): string {
  if (lat > 13.02) return 'North'
  if (lat < 12.90) return 'South'
  if (lng > 77.67) return 'East'
  if (lng < 77.54) return 'West'
  return 'Central'
}

// ── Text Search queries ────────────────────────────────────────────────────────
// Each is a {query, location} pair. Location biases the search but doesn't restrict it.
// We cover different areas of Bangalore to get good pagination spread.
const SEARCH_QUERIES: Array<{ label: string; query: string; lat: number; lng: number }> = [
  // Generic park types — city-wide
  { label: 'tech park south',      query: 'tech park Bangalore',               lat: 12.9352, lng: 77.6245 },
  { label: 'it park south',        query: 'IT park Bangalore',                 lat: 12.9352, lng: 77.6245 },
  { label: 'software park blr',    query: 'software park Bangalore',           lat: 12.9716, lng: 77.5946 },
  { label: 'business park blr',    query: 'business park Bangalore',           lat: 12.9716, lng: 77.5946 },
  { label: 'sez blr',              query: 'SEZ special economic zone Bangalore', lat: 12.9716, lng: 77.5946 },
  { label: 'office complex south', query: 'office complex Bangalore south',    lat: 12.9116, lng: 77.6412 },
  { label: 'corporate campus blr', query: 'corporate campus Bangalore',        lat: 12.9352, lng: 77.6245 },
  { label: 'tech hub east',        query: 'technology hub Whitefield Bangalore', lat: 12.9847, lng: 77.7357 },
  { label: 'tech park east',       query: 'tech park Whitefield',              lat: 12.9847, lng: 77.7357 },
  { label: 'it park east',         query: 'IT park Whitefield Bangalore',      lat: 12.9847, lng: 77.7357 },
  { label: 'it park north',        query: 'IT park Hebbal Bangalore',          lat: 13.0456, lng: 77.5978 },
  { label: 'tech park north',      query: 'tech park north Bangalore',         lat: 13.0456, lng: 77.6112 },
  { label: 'office complex ec',    query: 'office complex Electronic City Bangalore', lat: 12.8452, lng: 77.6602 },
  { label: 'tech park ec',         query: 'tech park Electronic City',         lat: 12.8452, lng: 77.6602 },
  // Named parks / well-known clusters
  { label: 'bagmane tech park',    query: 'Bagmane Tech Park Bangalore',       lat: 12.9584, lng: 77.6501 },
  { label: 'manyata tech park',    query: 'Manyata Tech Park Bangalore',       lat: 13.0456, lng: 77.6112 },
  { label: 'embassy tech village', query: 'Embassy Tech Village Bangalore',    lat: 12.9279, lng: 77.6878 },
  { label: 'rmz ecoworld',         query: 'RMZ Ecoworld Bangalore',            lat: 12.9279, lng: 77.6878 },
  { label: 'ecospace',             query: 'Ecospace Business Park Bangalore',  lat: 12.9279, lng: 77.6878 },
  { label: 'itpl',                 query: 'International Tech Park Whitefield', lat: 12.9847, lng: 77.7357 },
  { label: 'prestige tech park',   query: 'Prestige Tech Park Bangalore',      lat: 12.9847, lng: 77.7034 },
  { label: 'cessna business park', query: 'Cessna Business Park Bangalore',    lat: 12.9279, lng: 77.6878 },
  { label: 'global tech park',     query: 'Global Tech Park Bangalore',        lat: 12.9847, lng: 77.7357 },
  { label: 'salarpuria tech park', query: 'Salarpuria Tech Park Bangalore',    lat: 12.9847, lng: 77.7034 },
  { label: 'vrr tech park',        query: 'VRR Tech Park Bangalore',           lat: 12.9116, lng: 77.6745 },
  { label: 'divyasree tech park',  query: 'Divyasree Tech Park Bangalore',     lat: 12.9279, lng: 77.6878 },
  { label: 'kiadb aerospace park', query: 'KIADB IT park Bangalore',           lat: 12.9716, lng: 77.5946 },
  { label: 'outer ring road it',   query: 'IT office park Outer Ring Road Bangalore', lat: 12.9556, lng: 77.7056 },
  { label: 'sarjapur office',      query: 'office complex Sarjapur Road Bangalore', lat: 12.9116, lng: 77.6745 },
  { label: 'hsr office cluster',   query: 'office complex HSR Layout Bangalore', lat: 12.9116, lng: 77.6412 },
  { label: 'koramangala office',   query: 'office complex Koramangala Bangalore', lat: 12.9352, lng: 77.6245 },
  { label: 'indiranagar office',   query: 'office Indiranagar Bangalore',      lat: 12.9784, lng: 77.6408 },
]

// ── Google Places Text Search ────────────────────────────────────────────────
type PlaceResult = {
  place_id: string
  name: string
  vicinity?: string
  formatted_address?: string
  types: string[]
  geometry: { location: { lat: number; lng: number } }
  rating?: number
  user_ratings_total?: number
  business_status?: string
}

type SearchResponse = {
  status: string
  results: PlaceResult[]
  next_page_token?: string
  error_message?: string
}

async function textSearch(query: string, lat: number, lng: number, pageToken?: string): Promise<SearchResponse> {
  const url = pageToken
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(pageToken)}&key=${MAPS_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=30000&key=${MAPS_KEY}`
  const res = await fetch(url)
  return res.json() as Promise<SearchResponse>
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)) }

function makeId(placeId: string): string {
  return `gp-tp-${placeId.slice(0, 24)}`
}

function localityFromAddress(vicinity?: string, address?: string): string {
  const src = vicinity || address || ''
  const parts = src.split(',').map((p) => p.trim()).filter(Boolean)
  // return the second-to-last part (city is last), which is usually the locality
  if (parts.length >= 2) return parts[parts.length - 2]
  return parts[0] || 'Bangalore'
}

// Skip results that are clearly not tech/office environments
const SKIP_PATTERNS = [
  // Residential / hospitality
  /\b(hotel|resort|hostel|inn|lodge|guesthouse|pg|paying guest|apartment|flat|society|residenc|villa)\b/i,
  // Food & retail
  /\b(restaurant|cafe|coffee|bakery|sweet|dhaba|bar|pub|club|shop|store|supermarket|mall|showroom|salon|spa|gym)\b/i,
  // Education & medical
  /\b(school|college|university|academy|coaching|hospital|clinic|diagnostic|pharmacy|dispensary|nursing home)\b/i,
  // Religious & civic
  /\b(temple|church|mosque|gurdwara|mandir|masjid|ashram)\b/i,
  // Government non-tech offices
  /\b(sub-?registrar|registrar|revenue office|municipal|panchayat|taluk|court|police|bbmp|bescom|bwssb|post office|india post|lic of india|government of|bruhat bengaluru)\b/i,
  // Banks & finance (not fintech HQs)
  /\b(sbi|hdfc bank|icici bank|axis bank|canara bank|union bank|bank of |atm|insurance agency)\b/i,
]

function isLikelyOfficeOrPark(name: string, types: string[]): boolean {
  const n = name.toLowerCase()
  if (SKIP_PATTERNS.some((re) => re.test(n))) return false
  // Google types that definitely mean non-office
  const hardExclude = ['lodging', 'restaurant', 'cafe', 'bar', 'school', 'hospital', 'doctor', 'pharmacy',
    'grocery_or_supermarket', 'shopping_mall', 'clothing_store', 'church', 'mosque', 'hindu_temple',
    'airport', 'bus_station', 'train_station', 'subway_station', 'atm', 'bank', 'insurance_agency']
  if (types.some((t) => hardExclude.includes(t))) return false
  // Must have at least some indicator it's an office or park
  const nameHasOfficeWord = /park|campus|office|tower|hub|centre|center|complex|tech|it\s|sez|building|plaza|cowork|bhive|indiqube|awfis|315work|regus|wework|springboard/i.test(n)
  return nameHasOfficeWord
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏢  Tech parks scraper  ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`   ${SEARCH_QUERIES.length} queries to run\n`)
  console.log(`   ⚠️  Employee counts, company counts, and rental data will NOT be populated.`)
  console.log(`   Only real data from Google Places (name, coordinates, vicinity) will be stored.\n`)

  // Load existing place IDs to avoid re-inserting
  const { data: existing } = await supabase
    .from('bangalore_tech_parks')
    .select('id')

  const existingIds = new Set((existing || []).map((r: { id: string }) => r.id))

  // Also load place_ids we've stored (id starts with 'gp-tp-')
  // to avoid duplicate places with slightly different IDs
  const { data: gpRows } = await supabase
    .from('bangalore_tech_parks')
    .select('id, name, latitude, longitude')
    .like('id', 'gp-tp-%')

  const gpNames = new Set((gpRows || []).map((r: { name: string }) => r.name.toLowerCase()))

  // Resume support
  const doneSet = new Set<string>()
  if (resume && existsSync(donePath)) {
    readFileSync(donePath, 'utf8').split('\n').filter(Boolean).forEach((l) => doneSet.add(l))
  }

  let totalInserted = 0, totalSkipped = 0, totalSearches = 0
  const allDiscovered: string[] = []

  for (const sq of SEARCH_QUERIES) {
    if (doneSet.has(sq.label)) { totalSearches++; continue }

    process.stdout.write(`  🔍  ${sq.label.padEnd(28)} `)

    let pageToken: string | undefined
    let pageCount = 0
    let batchInserted = 0

    do {
      if (pageToken) await sleep(2200) // Google requires >2s before using page token

      let data: SearchResponse
      try {
        data = await textSearch(sq.query, sq.lat, sq.lng, pageToken)
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

        const { lat, lng } = place.geometry.location
        if (!inBangalore(lat, lng)) continue
        if (!isLikelyOfficeOrPark(place.name, place.types)) { totalSkipped++; continue }

        const id = makeId(place.place_id)
        if (existingIds.has(id)) { totalSkipped++; continue }
        if (gpNames.has(place.name.toLowerCase())) { totalSkipped++; continue }

        const locality = localityFromAddress(place.vicinity, place.formatted_address)
        const zone = zoneFromCoords(lat, lng)

        if (!dryRun) {
          const { error } = await supabase.from('bangalore_tech_parks').insert({
            id,
            name: place.name,
            locality,
            zone,
            latitude: lat,
            longitude: lng,
            // Real data only — leave employee/company counts NULL
            total_employees: null,
            total_companies: null,
            grade: null,
            anchor_tenants: [],
            avg_rent_sqft: null,
            is_sez: false,
          })
          if (!error) {
            existingIds.add(id)
            gpNames.add(place.name.toLowerCase())
            allDiscovered.push(place.name)
            batchInserted++
            totalInserted++
          } else if (error.code !== '23505') {
            // 23505 = unique violation, expected for dupes — only log unexpected errors
            process.stdout.write(`\n    ⚠️  [${place.name}]: ${error.message}\n`)
          } else {
            totalSkipped++
          }
        } else {
          existingIds.add(id)
          gpNames.add(place.name.toLowerCase())
          allDiscovered.push(place.name)
          batchInserted++
          totalInserted++
        }
      }

      pageToken = data.next_page_token
      pageCount++
      await sleep(150)
    } while (pageToken && pageCount < 3) // max 3 pages = 60 results per text search

    console.log(`+${batchInserted}`)
    totalSearches++

    if (!dryRun) appendFileSync(donePath, sq.label + '\n')
    await sleep(200)
  }

  // Save stats
  writeFileSync(statsPath, JSON.stringify({ totalInserted, totalSkipped, totalSearches, timestamp: new Date().toISOString() }, null, 2))

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`🔍  Searches run : ${totalSearches}`)
  console.log(`➕  Inserted     : ${totalInserted} new tech parks / office complexes`)
  console.log(`⏭  Skipped      : ${totalSkipped}`)
  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)

  if (allDiscovered.length > 0) {
    console.log(`\n📋  Discovered:`)
    allDiscovered.forEach((n) => console.log(`    • ${n}`))
  }

  console.log(`\n💡  Next: review the ${totalInserted} new entries in bangalore_tech_parks.`)
  console.log(`   Optionally run scripts/geocode-tech-parks.ts to verify/correct coordinates.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
