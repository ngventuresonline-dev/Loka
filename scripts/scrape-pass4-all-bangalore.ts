/**
 * Pass 4 — Tiered full-Bangalore brand scrape.
 *
 * TIER 1 — Prime commercial zones (anchor brands, high density):
 *   15 place types × 3 pages × 950m radius — full inventory
 *   ~25 corridors → ~1,125 searches
 *
 * TIER 2 — Active neighbourhoods (solid commercial strip, good brands):
 *   9 place types × 2 pages × 850m radius — category coverage
 *   ~28 corridors → ~504 searches
 *
 * TIER 3 — Emerging / fringe (pacing + brand presence only):
 *   5 place types × 1 page × 750m radius — just enough to know what's there
 *   ~22 corridors → ~110 searches
 *
 * Total searches : ~1,739  (vs ~3,600 if flat)
 * Estimated cost : ~$55–65 (vs ~$115 flat)
 * Estimated time : ~2 hours
 *
 * Usage:
 *   npx tsx scripts/scrape-pass4-all-bangalore.ts
 *   npx tsx scripts/scrape-pass4-all-bangalore.ts --dry-run
 *   npx tsx scripts/scrape-pass4-all-bangalore.ts --resume
 *
 * Env: GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { resolve } from 'path'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: resolve(process.cwd(), '.env.local') })
dotenvConfig({ path: resolve(process.cwd(), '.env') })

const MAPS_KEY    = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const SUPABASE_URL= process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY= process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!MAPS_KEY)    { console.error('❌  GOOGLE_MAPS_API_KEY not set'); process.exit(1) }
if (!SUPABASE_URL){ console.error('❌  SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_KEY){ console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const dryRun   = process.argv.includes('--dry-run')
const resume   = process.argv.includes('--resume')

const donePath  = resolve(process.cwd(), 'scrape-pass4-done.log')
const statsPath = resolve(process.cwd(), 'scrape-pass4-stats.json')

// ── Place-type lists by tier ──────────────────────────────────────────────────

// Tier 1: every vertical — restaurants, all retail, wellness, entertainment
const TYPES_FULL = [
  'restaurant', 'cafe', 'bar', 'bakery',
  'clothing_store', 'shoe_store', 'jewelry_store', 'electronics_store', 'supermarket', 'book_store',
  'gym', 'beauty_salon', 'spa', 'pharmacy',
  'movie_theater',
]

// Tier 2: core F&B + key retail + wellness (no bar, no cinema, no book store)
const TYPES_CORE = [
  'restaurant', 'cafe', 'bakery',
  'clothing_store', 'shoe_store', 'electronics_store', 'supermarket',
  'gym', 'beauty_salon', 'pharmacy',
]

// Tier 3: pacing only — F&B presence + pharmacy + gym (enough to show what exists)
const TYPES_LIGHT = [
  'restaurant', 'cafe',
  'clothing_store', 'supermarket',
  'pharmacy',
]

// ── Corridors by tier ─────────────────────────────────────────────────────────
//
// Tier 1 = anchor brand zones, high street density, premium demand
// Tier 2 = established residential-commercial strips with good brands
// Tier 3 = emerging / outer areas — pacing & brand presence only

type Corridor = { name: string; lat: number; lng: number; zone: string }

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — Prime (full scrape, 950m, 3 pages)
// These are the areas where Loka's clients want space AND competitors are dense.
// Scraping here needs to be exhaustive.
// ─────────────────────────────────────────────────────────────────────────────
const TIER1: Corridor[] = [
  // Central premium belt
  { name: 'Frazer Town',              lat: 12.9912, lng: 77.6201, zone: 'Central' },
  { name: 'Shivajinagar Commercial',  lat: 12.9856, lng: 77.5989, zone: 'Central' },
  { name: 'Langford Town',            lat: 12.9534, lng: 77.6001, zone: 'Central' },
  { name: 'Domlur Layout',            lat: 12.9623, lng: 77.6378, zone: 'East' },
  { name: 'Old Airport Rd Ext',       lat: 12.9678, lng: 77.6534, zone: 'East' },
  { name: 'HAL 3rd Stage',            lat: 12.9634, lng: 77.6578, zone: 'East' },

  // East tech + high-street belt
  { name: 'Mahadevapura Main',        lat: 12.9901, lng: 77.7001, zone: 'East' },
  { name: 'Whitefield Main Road',     lat: 12.9701, lng: 77.7512, zone: 'East' },
  { name: 'Varthur Main Road',        lat: 12.9412, lng: 77.7445, zone: 'East' },
  { name: 'AECS Layout Kundalahalli', lat: 12.9734, lng: 77.7023, zone: 'East' },
  { name: 'KR Puram Station Road',    lat: 13.0078, lng: 77.6945, zone: 'East' },

  // North premium (embassy/tech park adjacents)
  { name: 'Kalyan Nagar Main',        lat: 13.0267, lng: 77.6412, zone: 'North' },
  { name: 'Thanisandra Main Rd',      lat: 13.0678, lng: 77.6267, zone: 'North' },
  { name: 'RT Nagar Main',            lat: 13.0212, lng: 77.5923, zone: 'North' },
  { name: 'Sadashivanagar',           lat: 13.0123, lng: 77.5823, zone: 'North' },

  // South high street
  { name: 'Jayanagar 8th Block',      lat: 12.9312, lng: 77.5823, zone: 'South' },
  { name: 'Jayanagar 9th Block',      lat: 12.9234, lng: 77.5756, zone: 'South' },
  { name: 'Basavanagudi Gandhi Bazaar',lat: 12.9445, lng: 77.5734, zone: 'South' },
  { name: 'VV Puram',                 lat: 12.9523, lng: 77.5801, zone: 'South' },
  { name: 'Silk Board Junction',      lat: 12.9178, lng: 77.6223, zone: 'South' },
  { name: 'Bommanahalli',             lat: 12.9089, lng: 77.6423, zone: 'South' },
  { name: 'Arekere Bannerghatta',     lat: 12.8856, lng: 77.6001, zone: 'South' },
  { name: 'Hulimavu',                 lat: 12.8867, lng: 77.6145, zone: 'South' },

  // West prime
  { name: 'Vijayanagar Main Circle',  lat: 12.9623, lng: 77.5312, zone: 'West' },
  { name: 'Rajajinagar Ext / BDA',    lat: 12.9934, lng: 77.5489, zone: 'West' },
]

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — Active (core scrape, 850m, 2 pages)
// Good residential-commercial mix. Brands are present; we need category data
// but not every permutation.
// ─────────────────────────────────────────────────────────────────────────────
const TIER2: Corridor[] = [
  // North-West / West
  { name: 'Basaveshwaranagar',        lat: 12.9801, lng: 77.5289, zone: 'West' },
  { name: 'Nandini Layout',           lat: 12.9934, lng: 77.5423, zone: 'West' },
  { name: 'Chandra Layout',           lat: 12.9712, lng: 77.5201, zone: 'West' },
  { name: 'Magadi Road',              lat: 12.9812, lng: 77.5401, zone: 'West' },
  { name: 'Seshadripuram',            lat: 13.0023, lng: 77.5723, zone: 'Central' },
  { name: 'Cox Town',                 lat: 12.9934, lng: 77.6245, zone: 'Central' },

  // North / North-East
  { name: 'Ganganagar',               lat: 13.0334, lng: 77.5789, zone: 'North' },
  { name: 'Mathikere',                lat: 13.0389, lng: 77.5667, zone: 'North' },
  { name: 'Dollar Colony',            lat: 13.0123, lng: 77.5534, zone: 'North' },
  { name: 'Sahakara Nagar Commercial',lat: 13.0634, lng: 77.5923, zone: 'North' },
  { name: 'HBR Layout',               lat: 13.0312, lng: 77.6312, zone: 'North' },
  { name: 'Ramamurthynagar Main',     lat: 13.0234, lng: 77.6678, zone: 'North' },
  { name: 'Banaswadi Main Road',      lat: 13.0089, lng: 77.6534, zone: 'North' },
  { name: 'Nagawara Junction',        lat: 13.0456, lng: 77.6312, zone: 'North' },

  // South
  { name: 'Banashankari 2nd Stage',   lat: 12.9312, lng: 77.5512, zone: 'South' },
  { name: 'Banashankari 3rd Stage',   lat: 12.9156, lng: 77.5423, zone: 'South' },
  { name: 'Kumaraswamy Layout',       lat: 12.9023, lng: 77.5601, zone: 'South' },
  { name: 'Padmanabhanagar',          lat: 12.9134, lng: 77.5623, zone: 'South' },
  { name: 'Girinagar',                lat: 12.9356, lng: 77.5534, zone: 'South' },
  { name: 'RV Road / Chamarajpet',    lat: 12.9567, lng: 77.5645, zone: 'South' },
  { name: 'Hongasandra',              lat: 12.8934, lng: 77.6223, zone: 'South' },

  // East secondary
  { name: 'Hoodi Junction',           lat: 12.9945, lng: 77.7134, zone: 'East' },
  { name: 'Thubarahalli',             lat: 12.9812, lng: 77.7156, zone: 'East' },
  { name: 'Carmelram',                lat: 12.9134, lng: 77.7112, zone: 'East' },
  { name: 'Panathur',                 lat: 12.9356, lng: 77.7178, zone: 'East' },
  { name: 'Murugeshpalya',            lat: 12.9712, lng: 77.6612, zone: 'East' },

  // South-East
  { name: 'Parappana Agrahara',       lat: 12.8712, lng: 77.6312, zone: 'South' },
  { name: 'Singasandra',              lat: 12.8934, lng: 77.6512, zone: 'South' },
  { name: 'Electronic City Phase 2',  lat: 12.8278, lng: 77.6612, zone: 'South' },
]

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3 — Emerging / fringe (light pass, 750m, 1 page)
// We just need to know what brands exist and their rough pacing.
// No deep inventory needed. These areas aren't prime demand today.
// ─────────────────────────────────────────────────────────────────────────────
const TIER3: Corridor[] = [
  // Far West / peripheral
  { name: 'Nagarabhavi Main',         lat: 12.9523, lng: 77.4934, zone: 'West' },
  { name: 'Kengeri Satellite Town',   lat: 12.9156, lng: 77.4867, zone: 'West' },
  { name: 'RR Nagar / Bichnahalli',   lat: 12.9234, lng: 77.5023, zone: 'West' },
  { name: 'Peenya 2nd Stage',         lat: 13.0234, lng: 77.5178, zone: 'North' },
  { name: 'Jalahalli Cross',          lat: 13.0412, lng: 77.5312, zone: 'North' },
  { name: 'Dasarahalli Main',         lat: 13.0534, lng: 77.5012, zone: 'North' },

  // Far North
  { name: 'Jakkur Cross',             lat: 13.0789, lng: 77.5934, zone: 'North' },
  { name: 'New BEL Rd Commercial',    lat: 13.0523, lng: 77.5567, zone: 'North' },

  // Far South
  { name: 'Uttarahalli Main Road',    lat: 12.9012, lng: 77.5289, zone: 'South' },
  { name: 'Konanakunte',              lat: 12.8923, lng: 77.5512, zone: 'South' },
  { name: 'Gottigere',               lat: 12.8634, lng: 77.5934, zone: 'South' },
  { name: 'Begur',                    lat: 12.8812, lng: 77.6134, zone: 'South' },
  { name: 'Kanakapura Rd Phase 2',    lat: 12.8601, lng: 77.5645, zone: 'South' },

  // Far East / peripheral
  { name: 'Sarjapur Town Center',     lat: 12.8834, lng: 77.7834, zone: 'South' },
  { name: 'Gunjur',                   lat: 12.9067, lng: 77.7267, zone: 'East' },
  { name: 'Nallurhalli',              lat: 12.9634, lng: 77.7234, zone: 'East' },
  { name: 'Kadugodi Main',            lat: 12.9956, lng: 77.7534, zone: 'East' },
  { name: 'Hoskote Town',             lat: 13.0712, lng: 77.7978, zone: 'East' },
]

// ── Branded pharmacy whitelist ────────────────────────────────────────────────
const PHARMACY_BRANDS = [
  /apollo\s*pharmacy/i, /medplus/i, /wellness\s*(forever|pharmacy)/i,
  /frank\s*ross/i, /guardian\s*pharmacy/i, /netmeds/i, /pharmeasy/i,
  /1mg/i, /health\s*&\s*glow/i, /health\s*and\s*glow/i, /tata\s*1mg/i,
  /cipla\s*health/i, /sasta\s*sundar/i,
]
function isBrandedPharmacy(name: string) {
  return PHARMACY_BRANDS.some(re => re.test(name))
}

// ── Non-retail skip list ──────────────────────────────────────────────────────
const NON_RETAIL = [
  /\bcredit\s*card\b/i, /\binsurance\b/i, /\bbank\b/i, /\batm\b/i,
  /\bhospital\b/i, /\bclinic\b/i, /\bdiagnostic\b/i, /\blab\b/i,
  /\bschool\b/i, /\bcollege\b/i, /\buniversity\b/i, /\bacademy\b/i,
  /\btemple\b/i, /\bchurch\b/i, /\bmosque\b/i, /\bgurdwara\b/i,
  /\boffice\b/i, /\btechpark\b/i, /\bco-?work/i,
  /\bservice\s*cent(re|er)\b/i, /\bworkshop\b/i, /\bgarage\b/i,
  // Home / outcall services — not physical retail outlets
  /\boutcall\b/i, /\bout[\s-]call\b/i,
  /\bhome\s*(massage|spa|beauty|facial|wax|service|visit|call)\b/i,
  /\bat[\s-]home\b/i,
  /\bmobile\s*(spa|salon|massage|beauty|grooming)\b/i,
  /\bdoorstep\b/i,
]
const EXCLUDED_TYPES = [
  'school','hospital','doctor','lodging','airport','transit_station',
  'atm','bank','insurance_agency','real_estate_agency','lawyer','accounting',
]
function isNonRetail(name: string, types: string[]) {
  if (NON_RETAIL.some(re => re.test(name))) return true
  return types.some(t => EXCLUDED_TYPES.includes(t))
}

// ── Google type → industry / category ────────────────────────────────────────
function mapTypes(googleTypes: string[]): { industry: string; category: string } {
  if (googleTypes.includes('restaurant'))      return { industry: 'F&B',           category: 'Restaurant' }
  if (googleTypes.includes('cafe'))            return { industry: 'F&B',           category: 'Cafe' }
  if (googleTypes.includes('bar'))             return { industry: 'F&B',           category: 'Bar' }
  if (googleTypes.includes('bakery'))          return { industry: 'F&B',           category: 'Bakery' }
  if (googleTypes.includes('clothing_store'))  return { industry: 'Retail',        category: 'Apparel' }
  if (googleTypes.includes('shoe_store'))      return { industry: 'Retail',        category: 'Footwear' }
  if (googleTypes.includes('jewelry_store'))   return { industry: 'Retail',        category: 'Jewellery' }
  if (googleTypes.includes('electronics_store')) return { industry: 'Retail',      category: 'Electronics' }
  if (googleTypes.includes('supermarket'))     return { industry: 'Retail',        category: 'Supermarket' }
  if (googleTypes.includes('book_store'))      return { industry: 'Retail',        category: 'Books' }
  if (googleTypes.includes('gym'))             return { industry: 'Wellness',      category: 'Gym' }
  if (googleTypes.includes('beauty_salon'))    return { industry: 'Wellness',      category: 'Salon' }
  if (googleTypes.includes('spa'))             return { industry: 'Wellness',      category: 'Spa' }
  if (googleTypes.includes('pharmacy'))        return { industry: 'Wellness',      category: 'Pharmacy' }
  if (googleTypes.includes('movie_theater'))   return { industry: 'Entertainment', category: 'Cinema' }
  return { industry: 'Retail', category: 'Other' }
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PlaceResult = {
  place_id: string; name: string; vicinity: string; types: string[]
  geometry: { location: { lat: number; lng: number } }
  rating?: number; user_ratings_total?: number; business_status?: string
}
type NearbyResponse = {
  status: string; results: PlaceResult[]; next_page_token?: string; error_message?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function nearbySearch(lat: number, lng: number, type: string, radius: number, pageToken?: string): Promise<NearbyResponse> {
  const url = pageToken
    ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${MAPS_KEY}`
    : `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${MAPS_KEY}`
  const res = await fetch(url)
  return res.json() as Promise<NearbyResponse>
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function slugId(name: string, lat: number, lng: number) {
  const s = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
  return `gpl-${s}-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`
}

// ── Scrape one corridor+type combination ─────────────────────────────────────
async function scrapeOne(
  corridor: Corridor,
  type: string,
  radius: number,
  maxPages: number,
  existingIds: Set<string>,
  doneSet: Set<string>,
  totalInserted: { n: number },
  totalSkipped: { n: number },
  discovered: string[],
): Promise<void> {
  const key = `${corridor.name}::${type}`
  if (doneSet.has(key)) return

  process.stdout.write(`  🗺  ${corridor.name.padEnd(32)} [${type.padEnd(18)}] `)

  let pageToken: string | undefined
  let pageCount = 0
  let batchInserted = 0

  do {
    if (pageToken) await sleep(2100)

    let data: NearbyResponse
    try {
      data = await nearbySearch(corridor.lat, corridor.lng, type, radius, pageToken)
    } catch (e) { console.log(`fetch error: ${e}`); break }

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
      if (existingIds.has(id)) { totalSkipped.n++; continue }
      if (place.types.includes('pharmacy') && !isBrandedPharmacy(place.name)) { totalSkipped.n++; continue }
      if (isNonRetail(place.name, place.types)) { totalSkipped.n++; continue }
      const generic = ['unnamed', 'unknown', 'shop no', 'stall no', 'unit no']
      if (generic.some(w => place.name.toLowerCase().startsWith(w))) { totalSkipped.n++; continue }

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
          data_source: 'google_places_pass4',
          data_confidence: (place.user_ratings_total ?? 0) > 50 ? 'high' : 'medium',
        })
        if (error && error.code !== '23505') {
          process.stdout.write(`\n    ⚠️  [${place.name}]: ${error.message}\n`)
        } else if (!error) {
          existingIds.add(id); discovered.push(place.name); batchInserted++; totalInserted.n++
        }
      } else {
        existingIds.add(id); discovered.push(place.name); batchInserted++; totalInserted.n++
      }
    }

    pageToken = data.next_page_token
    pageCount++
    await sleep(100)
  } while (pageToken && pageCount < maxPages)

  console.log(`+${batchInserted}`)
  if (!dryRun) appendFileSync(donePath, key + '\n')
  await sleep(80)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const t1Count = TIER1.length * TYPES_FULL.length
  const t2Count = TIER2.length * TYPES_CORE.length
  const t3Count = TIER3.length * TYPES_LIGHT.length
  const total   = t1Count + t2Count + t3Count

  console.log(`\n🔍  Pass 4 — Tiered Bangalore scrape  ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`   Tier 1 [Prime]   : ${TIER1.length} corridors × ${TYPES_FULL.length} types × 3p × 950m = ${t1Count} searches`)
  console.log(`   Tier 2 [Active]  : ${TIER2.length} corridors × ${TYPES_CORE.length} types × 2p × 850m = ${t2Count} searches`)
  console.log(`   Tier 3 [Fringe]  : ${TIER3.length} corridors × ${TYPES_LIGHT.length} types × 1p × 750m = ${t3Count} searches`)
  console.log(`   Total searches   : ~${total} (est. cost $${(total * 0.032 * 0.5).toFixed(0)}–$${(total * 0.032).toFixed(0)})\n`)

  const { data: existing } = await supabase.from('bangalore_brand_outlets').select('id')
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  console.log(`   ${existingIds.size} outlets already in DB\n`)

  const doneSet = new Set<string>()
  if (resume && existsSync(donePath)) {
    readFileSync(donePath, 'utf8').split('\n').filter(Boolean).forEach(l => doneSet.add(l))
    console.log(`   Resuming — ${doneSet.size} searches already done\n`)
  }

  const totalInserted = { n: 0 }, totalSkipped = { n: 0 }
  const discovered: string[] = []

  // ── Tier 1 — full ──────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(64)}\n  🏆  TIER 1 — Prime zones (full inventory)\n${'─'.repeat(64)}`)
  for (const c of TIER1) {
    for (const type of TYPES_FULL) {
      await scrapeOne(c, type, 950, 3, existingIds, doneSet, totalInserted, totalSkipped, discovered)
    }
  }

  // ── Tier 2 — core ──────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(64)}\n  🔵  TIER 2 — Active zones (core categories)\n${'─'.repeat(64)}`)
  for (const c of TIER2) {
    for (const type of TYPES_CORE) {
      await scrapeOne(c, type, 850, 2, existingIds, doneSet, totalInserted, totalSkipped, discovered)
    }
  }

  // ── Tier 3 — light ─────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(64)}\n  ⚪  TIER 3 — Fringe zones (pacing only)\n${'─'.repeat(64)}`)
  for (const c of TIER3) {
    for (const type of TYPES_LIGHT) {
      await scrapeOne(c, type, 750, 1, existingIds, doneSet, totalInserted, totalSkipped, discovered)
    }
  }

  const stats = {
    totalInserted: totalInserted.n, totalSkipped: totalSkipped.n,
    tier1Corridors: TIER1.length, tier2Corridors: TIER2.length, tier3Corridors: TIER3.length,
    timestamp: new Date().toISOString(),
  }
  writeFileSync(statsPath, JSON.stringify(stats, null, 2))

  console.log(`\n${'─'.repeat(64)}`)
  console.log(`➕  Inserted      : ${totalInserted.n} new outlets`)
  console.log(`⏭  Skipped       : ${totalSkipped.n} (duplicates / non-retail)`)
  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)

  if (discovered.length > 0) {
    console.log(`\n📋  Sample (${discovered.length} total):`)
    discovered.slice(0, 30).forEach(n => console.log(`    • ${n}`))
    if (discovered.length > 30) console.log(`    … and ${discovered.length - 30} more`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
