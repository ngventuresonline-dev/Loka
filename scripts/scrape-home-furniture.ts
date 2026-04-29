/**
 * Targeted scrape: premium Home & Furniture brands missing from the DB.
 * Pulls each brand across 11 Bangalore anchor points via Google Places
 * Text Search and inserts new outlets.
 *
 * No paints / bath fixtures / mass-market mattress brands per user spec —
 * only furniture chains, premium experience centres, and premium mattress
 * (The Sleep Company / Wakefit / Sleepwell / King Koil) level and above.
 *
 * Usage:
 *   npx tsx scripts/scrape-home-furniture.ts            ← dry run
 *   npx tsx scripts/scrape-home-furniture.ts --apply    ← write to DB
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

type Brand = { query: string; canonical: string; pattern: RegExp; category: string }
const BRANDS: Brand[] = [
  // Premium furniture rental
  { query: 'Furlenco furniture rental Bangalore',          canonical: 'Furlenco',           pattern: /furlenco/i,             category: 'Furniture' },
  { query: 'RentoMojo Bangalore',                          canonical: 'RentoMojo',          pattern: /rentomojo/i,            category: 'Furniture' },
  // Furniture chains / experience centres
  { query: 'IKEA Bangalore',                               canonical: 'IKEA',               pattern: /^ikea\b/i,              category: 'Furniture' },
  { query: 'Pepperfry Studio Bangalore',                   canonical: 'Pepperfry',          pattern: /pepperfry/i,            category: 'Furniture' },
  { query: 'Urban Ladder Studio Bangalore',                canonical: 'Urban Ladder',       pattern: /urban\s*ladder/i,       category: 'Furniture' },
  { query: 'HomeStop store Bangalore',                     canonical: 'HomeStop',           pattern: /home\s*stop|^homestop/i, category: 'Furniture' },
  { query: 'Home Centre Bangalore',                        canonical: 'Home Centre',        pattern: /home\s*centre|^homecentre/i, category: 'Furniture' },
  { query: 'Godrej Interio Bangalore',                     canonical: 'Godrej Interio',     pattern: /godrej\s*interio/i,     category: 'Furniture' },
  { query: 'Nilkamal Furniture Bangalore',                 canonical: 'Nilkamal',           pattern: /^nilkamal\b/i,          category: 'Furniture' },
  { query: 'Stanley Lifestyles Bangalore',                 canonical: 'Stanley Lifestyles', pattern: /stanley\s*lifestyles?/i, category: 'Furniture' },
  { query: 'Durian Furniture Bangalore',                   canonical: 'Durian',             pattern: /^durian\b/i,            category: 'Furniture' },
  { query: 'Damro Furniture Bangalore',                    canonical: 'Damro',              pattern: /^damro\b/i,             category: 'Furniture' },
  { query: 'Style Spa Furniture Bangalore',                canonical: 'Style Spa',          pattern: /style\s*spa/i,          category: 'Furniture' },
  { query: '@Home by Nilkamal Bangalore',                  canonical: '@Home',              pattern: /^@?home\b/i,            category: 'Furniture' },
  { query: 'Evok Furniture Bangalore',                     canonical: 'Evok',               pattern: /^evok\b/i,              category: 'Furniture' },
  { query: 'Fabindia Home Bangalore',                      canonical: 'Fabindia Home',      pattern: /fabindia\s*home/i,      category: 'Furniture' },
  // Premium mattress (Sleep Company / Wakefit / Sleepwell / King Koil only)
  { query: 'The Sleep Company experience centre Bangalore', canonical: 'The Sleep Company', pattern: /the\s*sleep\s*company/i, category: 'Mattress' },
  { query: 'Wakefit experience centre Bangalore',           canonical: 'Wakefit',          pattern: /^wakefit\b/i,           category: 'Mattress' },
  { query: 'Sleepwell World Bangalore',                     canonical: 'Sleepwell',        pattern: /^sleepwell\b/i,         category: 'Mattress' },
  { query: 'King Koil mattress Bangalore',                  canonical: 'King Koil',        pattern: /king\s*koil/i,          category: 'Mattress' },
]

async function textSearch(query: string, lat: number, lng: number) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', '6000')
  url.searchParams.set('key', MAPS_KEY)
  const res = await fetch(url.toString())
  return res.json() as Promise<{ status: string; results: Array<{
    name: string
    place_id: string
    business_status?: string
    geometry: { location: { lat: number; lng: number } }
    formatted_address: string
    user_ratings_total?: number
  }> }>
}

async function main() {
  console.log(`\n🛋️   Home & Furniture scraper  ${apply ? '(APPLYING)' : '(DRY RUN — pass --apply to write)'}`)
  console.log(`   ${BRANDS.length} brands × ${ANCHORS.length} anchors = ${BRANDS.length * ANCHORS.length} searches\n`)

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
  console.log(`   Existing outlets in DB: ${existingIds.size}\n`)

  const seen = new Set<string>()
  const toInsert: Array<Record<string, unknown>> = []

  for (const brand of BRANDS) {
    let brandFound = 0
    process.stdout.write(`  🔍 ${brand.canonical.padEnd(28)} `)
    for (const anchor of ANCHORS) {
      await sleep(200)
      const data = await textSearch(brand.query, anchor.lat, anchor.lng)
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        process.stdout.write(`!`)
        continue
      }
      for (const place of data.results) {
        if (place.business_status === 'CLOSED_PERMANENTLY') continue
        if (!brand.pattern.test(place.name)) continue

        const { lat, lng } = place.geometry.location
        if (!inBangalore(lat, lng)) continue

        const id = slugId(place.name, lat, lng)
        if (existingIds.has(id) || seen.has(id)) continue
        seen.add(id)
        brandFound++

        const addrParts = place.formatted_address.split(',').map((s: string) => s.trim())
        const locality = addrParts.length >= 3 ? addrParts[addrParts.length - 3] : addrParts[0]

        toInsert.push({
          id,
          brand_name: brand.canonical,
          industry: 'Retail',
          category: brand.category,
          type: brand.category,
          street_address: place.formatted_address,
          locality,
          zone: anchor.zone,
          lat,
          lng,
          is_active: true,
          data_source: 'google_places_text',
          data_confidence: (place.user_ratings_total ?? 0) > 30 ? 'high' : 'medium',
        })
      }
    }
    console.log(` → ${brandFound} new`)
  }

  console.log(`\nTotal new outlets to insert: ${toInsert.length}`)

  if (!apply) {
    console.log('\n⚠️   Dry run — pass --apply to insert into DB')
    if (toInsert.length) {
      console.log('\nSample (first 12):')
      toInsert.slice(0, 12).forEach(r =>
        console.log(`  ${(r.brand_name as string).padEnd(28)} ${r.locality}  (${r.lat}, ${r.lng})`)
      )
    }
    return
  }

  let inserted = 0
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100)
    const { error } = await supabase.from('bangalore_brand_outlets').insert(batch)
    if (error) console.error(`  insert error (batch ${i}): ${error.message}`)
    else inserted += batch.length
  }

  console.log(`\n✅  Inserted ${inserted} outlet(s)`)
}

main().catch(e => { console.error(e); process.exit(1) })
