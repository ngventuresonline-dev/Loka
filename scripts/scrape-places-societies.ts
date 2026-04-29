/**
 * Scrapes Google Places API to discover real residential societies / apartment
 * complexes / villa communities across Bangalore. Real-data-only — only fields
 * we can verify from Google Places are written.
 *
 * What is stored (real, from Google):
 *   name, latitude, longitude, place_id, vicinity → locality, types → zone,
 *   developer (inferred from query seed when one developer was searched)
 *
 * What is NOT stored (no reliable source in Places API):
 *   total_units, total_towers, bhk_types, avg_price_sqft, possession_year,
 *   sec_profile, occupancy_pct, amenities — left NULL until RERA / paid sources fill them.
 *
 * Usage:
 *   npx tsx scripts/scrape-places-societies.ts
 *   npx tsx scripts/scrape-places-societies.ts --dry-run
 *   npx tsx scripts/scrape-places-societies.ts --resume
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

const donePath = resolve(process.cwd(), 'scrape-societies-done.log')
const statsPath = resolve(process.cwd(), 'scrape-societies-stats.json')

// Bangalore bounding box for filtering stray results
const BLR = { latMin: 12.70, latMax: 13.45, lngMin: 77.30, lngMax: 77.95 }

function inBangalore(lat: number, lng: number): boolean {
  return lat >= BLR.latMin && lat <= BLR.latMax && lng >= BLR.lngMin && lng <= BLR.lngMax
}

function zoneFromCoords(lat: number, lng: number): string {
  if (lat > 13.02) return 'North'
  if (lat < 12.90) return 'South'
  if (lng > 77.67) return 'East'
  if (lng < 77.54) return 'West'
  return 'Central'
}

// Four wide-spread anchors — pageToken pagination compensates for fewer points.
const ANCHORS = [
  { name: 'north', lat: 13.045, lng: 77.598 },
  { name: 'east',  lat: 12.965, lng: 77.720 },
  { name: 'south', lat: 12.916, lng: 77.638 },
  { name: 'west',  lat: 12.998, lng: 77.555 },
]

// Each developer fans out across all 4 anchors. Search query is "<seed> apartments Bangalore".
// `developer` column gets populated with this name when a Places result matches the seed.
type DeveloperSeed = { name: string; query: string; developer: string | null }
const DEVELOPER_SEEDS: DeveloperSeed[] = [
  // Tier 1 — national / mega-premium
  { name: 'Brigade',             query: 'Brigade apartments Bangalore',          developer: 'Brigade' },
  { name: 'Sobha',               query: 'Sobha apartments Bangalore',            developer: 'Sobha' },
  { name: 'Prestige',            query: 'Prestige apartments Bangalore',         developer: 'Prestige' },
  { name: 'Embassy',             query: 'Embassy apartments Bangalore',          developer: 'Embassy' },
  { name: 'Salarpuria Sattva',   query: 'Salarpuria Sattva apartments Bangalore', developer: 'Salarpuria Sattva' },
  { name: 'Mantri',              query: 'Mantri apartments Bangalore',           developer: 'Mantri' },
  { name: 'Godrej Properties',   query: 'Godrej Properties Bangalore',           developer: 'Godrej Properties' },
  { name: 'Lodha',               query: 'Lodha Bangalore apartments',            developer: 'Lodha' },
  { name: 'Total Environment',   query: 'Total Environment Bangalore',           developer: 'Total Environment' },
  { name: 'Adarsh',              query: 'Adarsh apartments Bangalore',           developer: 'Adarsh' },
  { name: 'Puravankara',         query: 'Puravankara apartments Bangalore',      developer: 'Puravankara' },
  { name: 'Hiranandani',         query: 'Hiranandani Bangalore',                 developer: 'Hiranandani' },
  { name: 'House of Hiranandani', query: 'House of Hiranandani Bangalore',       developer: 'House of Hiranandani' },
  { name: 'DivyaSree',           query: 'DivyaSree apartments Bangalore',        developer: 'DivyaSree' },
  { name: 'Shapoorji Pallonji',  query: 'Shapoorji Pallonji Bangalore',          developer: 'Shapoorji Pallonji' },
  { name: 'L&T Realty',          query: 'L&T Realty apartments Bangalore',       developer: 'L&T Realty' },
  { name: 'Tata Housing',        query: 'Tata Housing Bangalore',                developer: 'Tata Housing' },
  { name: 'Tata Realty',         query: 'Tata Realty Bangalore',                 developer: 'Tata Realty' },
  { name: 'Sumadhura',           query: 'Sumadhura apartments Bangalore',        developer: 'Sumadhura' },
  { name: 'Purva',               query: 'Purva apartments Bangalore',            developer: 'Purva' },
  { name: 'Vaishnavi',           query: 'Vaishnavi developers Bangalore',        developer: 'Vaishnavi' },
  { name: 'Bhartiya City',       query: 'Bhartiya City Bangalore',               developer: 'Bhartiya City' },
  { name: 'Provident Housing',   query: 'Provident Housing Bangalore',           developer: 'Provident Housing' },
  { name: 'Mahindra Lifespaces', query: 'Mahindra Lifespaces Bangalore',         developer: 'Mahindra Lifespaces' },
  { name: 'Assetz',              query: 'Assetz apartments Bangalore',           developer: 'Assetz' },
  { name: 'Casagrand',           query: 'Casagrand apartments Bangalore',        developer: 'Casagrand' },
  { name: 'RMZ',                 query: 'RMZ residential Bangalore',             developer: 'RMZ' },
  { name: 'DLF',                 query: 'DLF apartments Bangalore',              developer: 'DLF' },
  { name: 'Birla Estates',       query: 'Birla Estates Bangalore',               developer: 'Birla Estates' },
  { name: 'Kolte-Patil',         query: 'Kolte-Patil apartments Bangalore',      developer: 'Kolte-Patil' },
  { name: 'K Raheja Corp',       query: 'K Raheja Corp Bangalore',               developer: 'K Raheja Corp' },
  { name: 'ND Developers',       query: 'ND apartments Bangalore',               developer: 'ND Developers' },
  { name: 'ETA Star',            query: 'ETA apartments Bangalore',              developer: 'ETA Star' },
  // Tier 2 — strong Bangalore presence
  { name: 'Shriram Properties',  query: 'Shriram Properties Bangalore',          developer: 'Shriram Properties' },
  { name: 'Aparna',              query: 'Aparna Constructions Bangalore',        developer: 'Aparna Constructions' },
  { name: 'Century Real Estate', query: 'Century Real Estate Bangalore',         developer: 'Century Real Estate' },
  { name: 'Concorde',            query: 'Concorde apartments Bangalore',         developer: 'Concorde' },
  { name: 'Goyal & Co',          query: 'Goyal Co apartments Bangalore',         developer: 'Goyal & Co' },
  { name: 'Jain Heights',        query: 'Jain Heights apartments Bangalore',     developer: 'Jain Heights' },
  { name: 'Mahaveer Group',      query: 'Mahaveer apartments Bangalore',         developer: 'Mahaveer Group' },
  { name: 'Nitesh Estates',      query: 'Nitesh Estates Bangalore',              developer: 'Nitesh Estates' },
  { name: 'NCC Urban',           query: 'NCC Urban Bangalore',                   developer: 'NCC Urban' },
  { name: 'SJR',                 query: 'SJR apartments Bangalore',              developer: 'SJR' },
  { name: 'SNN Builders',        query: 'SNN Builders Bangalore',                developer: 'SNN Builders' },
  { name: 'Sterling Developers', query: 'Sterling Developers apartments Bangalore', developer: 'Sterling Developers' },
  { name: 'TVS Emerald',         query: 'TVS Emerald Bangalore',                 developer: 'TVS Emerald' },
  { name: 'Valmark',             query: 'Valmark apartments Bangalore',          developer: 'Valmark' },
  { name: 'Pride Group',         query: 'Pride Group apartments Bangalore',      developer: 'Pride Group' },
  { name: 'Pacifica',            query: 'Pacifica apartments Bangalore',         developer: 'Pacifica' },
  { name: 'Krishvi',             query: 'Krishvi Bangalore',                     developer: 'Krishvi' },
  { name: 'Sattva Group',        query: 'Sattva apartments Bangalore',           developer: 'Sattva Group' },
  { name: 'Aryan Hi-Tech',       query: 'Aryan Hi-Tech Bangalore',               developer: 'Aryan Hi-Tech' },
  { name: 'Arvind SmartSpaces',  query: 'Arvind SmartSpaces Bangalore',          developer: 'Arvind SmartSpaces' },
  { name: 'Bren Corporation',    query: 'Bren Corporation Bangalore',            developer: 'Bren Corporation' },
  { name: 'Pragnya Group',       query: 'Pragnya apartments Bangalore',          developer: 'Pragnya Group' },
  { name: 'Modi Builders',       query: 'Modi Builders Bangalore',               developer: 'Modi Builders' },
  { name: 'Bhagwati',            query: 'Bhagwati apartments Bangalore',         developer: 'Bhagwati Developers' },
  { name: 'ZED Builders',        query: 'ZED apartments Bangalore',              developer: 'ZED Builders' },
  { name: 'Kalpataru',           query: 'Kalpataru apartments Bangalore',        developer: 'Kalpataru' },
  { name: 'Oberoi Realty',       query: 'Oberoi Realty Bangalore',               developer: 'Oberoi Realty' },
  { name: 'Ramky Group',         query: 'Ramky apartments Bangalore',            developer: 'Ramky Group' },
  { name: 'Skyline',             query: 'Skyline apartments Bangalore',          developer: 'Skyline Developers' },
  { name: 'Subishi',             query: 'Subishi apartments Bangalore',          developer: 'Subishi' },
  { name: 'Salarpuria',          query: 'Salarpuria apartments Bangalore',       developer: 'Salarpuria' },
  { name: 'Sare Homes',          query: 'Sare Homes Bangalore',                  developer: 'Sare Homes' },
  { name: 'Sumadhura Infracon',  query: 'Sumadhura Infracon Bangalore',          developer: 'Sumadhura Infracon' },
]

// Generic patterns — catch long-tail Tier-3 developers we haven't named.
// Run once per anchor (4 calls each). developer = NULL since unknown.
const GENERIC_PATTERNS: { name: string; query: string }[] = [
  { name: 'gated community',   query: 'gated community Bangalore' },
  { name: 'luxury apartments', query: 'luxury apartments Bangalore' },
  { name: 'villa community',   query: 'villa community Bangalore' },
  { name: 'premium apartments', query: 'premium apartments Bangalore' },
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
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=20000&key=${MAPS_KEY}`
  const res = await fetch(url)
  return res.json() as Promise<SearchResponse>
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)) }

function makeId(placeId: string): string {
  return `gp-soc-${placeId.slice(0, 24)}`
}

function localityFromAddress(vicinity?: string, address?: string): string {
  const src = vicinity || address || ''
  const parts = src.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[parts.length - 2]
  return parts[0] || 'Bangalore'
}

// Skip results that are clearly not residential
const SKIP_PATTERNS = [
  // Commercial / office / retail
  /\b(tech park|it park|business park|office complex|software park|sez|corporate)\b/i,
  /\b(restaurant|cafe|coffee|bakery|sweet|dhaba|bar|pub|club|shop|store|supermarket|mall|showroom|salon|spa|gym)\b/i,
  // Education & medical
  /\b(school|college|university|academy|coaching|hospital|clinic|diagnostic|pharmacy|dispensary|nursing home)\b/i,
  // Religious & civic
  /\b(temple|church|mosque|gurdwara|mandir|masjid|ashram)\b/i,
  // Hospitality
  /\b(hotel|resort|hostel|inn|lodge|guesthouse|pg|paying guest)\b/i,
  // Government
  /\b(sub-?registrar|registrar|revenue office|municipal|panchayat|taluk|court|police|bbmp|bescom|bwssb|post office)\b/i,
  // Banks / brokers (real estate agents pollute apartment searches)
  /\b(real estate (agent|broker|consultant)|property dealer|broker)\b/i,
]

function isLikelyResidential(name: string, types: string[], strict: boolean): boolean {
  const n = name.toLowerCase()
  if (SKIP_PATTERNS.some((re) => re.test(n))) return false
  // Hard exclude on Places types — these are NEVER residential, regardless of query
  const hardExclude = ['lodging', 'restaurant', 'cafe', 'bar', 'school', 'hospital', 'doctor', 'pharmacy',
    'grocery_or_supermarket', 'shopping_mall', 'clothing_store', 'church', 'mosque', 'hindu_temple',
    'airport', 'bus_station', 'train_station', 'subway_station', 'atm', 'bank', 'insurance_agency',
    'real_estate_agency', 'travel_agency']
  if (types.some((t) => hardExclude.includes(t))) return false
  // strict=true → require a positive residential keyword (used for generic patterns).
  // strict=false → trust the query (used for developer-named searches like "Brigade apartments Bangalore"
  //                 — Google will mostly return apartments; relax the keyword requirement so names like
  //                 "Brigade Bricklane" / "Tata Eden Court" / "Sobha Royal Pavilion" are accepted).
  if (!strict) return true
  const residentialKeywords = /apartment|apartments|residency|residences|residential|society|enclave|villa|villas|homes|towers|heights|gardens|elysium|estate|nest|park|grand|crest|woods|landmark|sanctuary|grove|haven|manor|terrace|skyline|paradise|county|elite|signature|suites|luxe|lifestyle|grandeur|crown/i
  return residentialKeywords.test(n)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏘️   Societies scraper  ${dryRun ? '(DRY RUN)' : ''}`)
  const totalSearches = (DEVELOPER_SEEDS.length + GENERIC_PATTERNS.length) * ANCHORS.length
  console.log(`   ${DEVELOPER_SEEDS.length} developers + ${GENERIC_PATTERNS.length} generic patterns × ${ANCHORS.length} anchors = ${totalSearches} searches\n`)
  console.log(`   ⚠️  Unit counts, SEC profile, prices and amenities will NOT be populated.`)
  console.log(`   Only real data from Google Places (name, coordinates, vicinity) will be stored.\n`)

  // Load existing IDs to avoid re-inserting (table was wiped pre-run, so this should be empty)
  const { data: existing } = await supabase
    .from('bangalore_societies')
    .select('id, name')

  const existingIds = new Set((existing || []).map((r: { id: string }) => r.id))
  const existingNames = new Set((existing || []).map((r: { name: string }) => r.name.toLowerCase()))

  // Resume support
  const doneSet = new Set<string>()
  if (resume && existsSync(donePath)) {
    readFileSync(donePath, 'utf8').split('\n').filter(Boolean).forEach((l) => doneSet.add(l))
  }

  let totalInserted = 0
  let totalSkipped = 0
  let totalSearchesRun = 0
  const allDiscovered: string[] = []

  // Combined queue: [developer × anchor] then [generic × anchor]
  type Job = { label: string; query: string; lat: number; lng: number; developer: string | null }
  const jobs: Job[] = []
  for (const dev of DEVELOPER_SEEDS) {
    for (const anchor of ANCHORS) {
      jobs.push({
        label: `${dev.name} @ ${anchor.name}`,
        query: dev.query,
        lat: anchor.lat,
        lng: anchor.lng,
        developer: dev.developer,
      })
    }
  }
  for (const pat of GENERIC_PATTERNS) {
    for (const anchor of ANCHORS) {
      jobs.push({
        label: `${pat.name} @ ${anchor.name}`,
        query: pat.query,
        lat: anchor.lat,
        lng: anchor.lng,
        developer: null,
      })
    }
  }

  for (const job of jobs) {
    if (doneSet.has(job.label)) { totalSearchesRun++; continue }

    process.stdout.write(`  🔍  ${job.label.padEnd(42)} `)

    let pageToken: string | undefined
    let pageCount = 0
    let batchInserted = 0

    do {
      if (pageToken) await sleep(2200) // Google requires >2s before using page token

      let data: SearchResponse
      try {
        data = await textSearch(job.query, job.lat, job.lng, pageToken)
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

      // Strict filter only for generic patterns (developer === null).
      // Developer-named searches trust the query intent.
      const strictFilter = job.developer === null

      for (const place of data.results) {
        if (place.business_status === 'CLOSED_PERMANENTLY') continue

        const { lat, lng } = place.geometry.location
        if (!inBangalore(lat, lng)) continue
        if (!isLikelyResidential(place.name, place.types, strictFilter)) { totalSkipped++; continue }

        const id = makeId(place.place_id)
        if (existingIds.has(id)) { totalSkipped++; continue }
        if (existingNames.has(place.name.toLowerCase())) { totalSkipped++; continue }

        const locality = localityFromAddress(place.vicinity, place.formatted_address)
        const zone = zoneFromCoords(lat, lng)

        if (!dryRun) {
          const { error } = await supabase.from('bangalore_societies').insert({
            id,
            name: place.name,
            locality,
            zone,
            latitude: lat,
            longitude: lng,
            developer: job.developer,
            // Real data only — leave all metadata NULL
            total_units: null,
            total_towers: null,
            floors_per_tower: null,
            bhk_types: null,
            min_area_sqft: null,
            max_area_sqft: null,
            avg_price_sqft: null,
            price_range_min: null,
            price_range_max: null,
            maintenance_sqft: null,
            possession_year: null,
            is_ready_to_move: null,
            amenities: null,
            occupancy_pct: null,
            sec_profile: null,
            resident_profile: null,
            is_active: true,
            data_source: 'google_places_text',
          })
          if (!error) {
            existingIds.add(id)
            existingNames.add(place.name.toLowerCase())
            allDiscovered.push(place.name)
            batchInserted++
            totalInserted++
          } else if (error.code !== '23505') {
            process.stdout.write(`\n    ⚠️  [${place.name}]: ${error.message}\n`)
          } else {
            totalSkipped++
          }
        } else {
          existingIds.add(id)
          existingNames.add(place.name.toLowerCase())
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
    totalSearchesRun++

    if (!dryRun) appendFileSync(donePath, job.label + '\n')
    await sleep(200)
  }

  writeFileSync(statsPath, JSON.stringify({
    totalInserted, totalSkipped, totalSearches: totalSearchesRun,
    timestamp: new Date().toISOString(),
  }, null, 2))

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`🔍  Searches run : ${totalSearchesRun}`)
  console.log(`➕  Inserted     : ${totalInserted} new societies`)
  console.log(`⏭  Skipped      : ${totalSkipped}`)
  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)
}

main().catch((e) => { console.error(e); process.exit(1) })
