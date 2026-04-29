import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export type ZoneCategory = { category: string; count: number }
export type ZoneData = {
  zone: string
  totalOutlets: number
  totalBrands: number
  categories: ZoneCategory[]
  topBrands: string[]
  brandsByCategory: Record<string, string[]>
}
export type ZonesResponse = {
  zones: ZoneData[]
  totalOutlets: number
  totalBrands: number
  totalZones: number
}

const EMPTY: ZonesResponse = { zones: [], totalOutlets: 0, totalBrands: 0, totalZones: 0 }

// ── Category normalization ────────────────────────────────────────────────────
// Folds the 200+ sub-categories from targeted scrapes into the 15 canonical
// display categories that match the UI filter chips.
function normalizeCategory(raw: string | null): string {
  if (!raw) return 'Other'
  const r = raw.toLowerCase()

  if (r.includes('qsr') || r === 'fast food') return 'QSR'
  if (r.includes('microbrewery') || r.includes('gastropub') || r.includes('pub') ||
      r.includes('brewery') || r === 'bar' || r.includes('cocktail bar') ||
      r.includes('lounge bar') || r.includes('rooftop bar') || r.includes('beer bar') ||
      r.includes('sports bar') || r.includes('music bar') || r.includes('rock bar') ||
      r.includes('pub & bar') || r.includes('bar/restaurant')) return 'Bar'
  if (r.includes('specialty coffee') || r.includes('coffee chain') || r.includes('tea cafe') ||
      r.includes('tea chain') || r.includes('french cafe') || r.includes('art cafe') ||
      r.includes('all-day cafe') || r.includes('south indian cafe') ||
      r.includes('café-bar') || r.includes('bakery/cafe') || r.includes('cafe/casual') ||
      r.includes('cafe-restaurant') || r === 'cafe') return 'Cafe'
  if (r.includes('bakery') || r.includes('patisserie')) return 'Bakery'
  if (r.includes('ice cream') || r.includes('dessert') || r.includes('waffle') ||
      r.includes('milkshake') || r.includes('milkshake') || r.includes('donut') ||
      r.includes('traditional indian sweets') || r.includes('indian sweets') ||
      r.includes('chocolatier') || r.includes('smoothie')) return 'Dessert'
  if (r === 'restaurant' || r.includes('dining') || r.includes('biryani') ||
      r.includes('south indian') || r.includes('north indian') || r.includes('multi-cuisine') ||
      r.includes('burmese') || r.includes('italian') || r.includes('japanese') ||
      r.includes('asian') || r.includes('korean') || r.includes('mexican') ||
      r.includes('mediterranean') || r.includes('european') || r.includes('american diner') ||
      r.includes('mughlai') || r.includes('thali') || r.includes('canteen') ||
      r.includes('pan-asian') || r.includes('live grill') || r.includes('vietnamese') ||
      r.includes('andhra')) return 'Restaurant'
  if (r.includes('spa') && !r.includes('salon')) return 'Spa'
  if (r.includes('salon') || r.includes('beauty') || r.includes('nail') ||
      r.includes('slimming') || r.includes('grooming')) return 'Salon'
  if (r.includes('gym') || r.includes('fitness') || r.includes('crossfit') ||
      r.includes('yoga') || r.includes('pilates')) return 'Gym'
  if (r.includes('pharmacy') || r.includes('medical store') || r.includes('beauty & pharmacy')) return 'Pharmacy'
  if (r.includes('supermarket') || r.includes('hypermarket') || r.includes('grocery') ||
      r.includes('fresh') && r.includes('f&b') || r === 'grocery' ||
      r.includes('neighbourhood grocery') || r.includes('convenience grocery') ||
      r.includes('premium grocery') || r.includes('organic food retail')) return 'Supermarket'
  if (r.includes('cinema') || r.includes('multiplex')) return 'Cinema'
  if (r.includes('book')) return 'Books'
  if (r.includes('electronics') || r.includes('telecom retail') ||
      r.includes('mobile & smart') || r.includes('camera')) return 'Electronics'
  if (r.includes('apparel') || r.includes('fashion') || r.includes('clothing') ||
      r.includes('wear') || r.includes('denim') || r.includes('ethnic') ||
      r.includes('lingerie') || r.includes('innerwear') || r.includes('sportswear') ||
      r.includes('saree') || r.includes('silk') || r.includes('formal') ||
      r.includes('casual apparel') || r.includes('youth casual')) return 'Apparel'
  if (r.includes('footwear') || r.includes('shoe') || r.includes('sneaker') ||
      r.includes('sandal')) return 'Footwear'
  if (r.includes('jewel') || r.includes('diamond') || r.includes('gold') && r.includes('jewel')) return 'Jewellery'
  if (r.includes('eyewear') || r.includes('optical') || r.includes('sunglasses') ||
      r.includes('prescription eyewear')) return 'Eyewear'

  return raw
}

// ── Brand quality filter ──────────────────────────────────────────────────────
const BAD_BRAND_PATTERNS = [
  /\boutcall\b/i,
  /\bout[\s-]call\b/i,
  /\bhome\s*(massage|spa|beauty|service|visit|facial|wax)/i,
  /\bat[\s-]home\b/i,
  /\bmobile\s*(spa|salon|massage|beauty)/i,
  /\bdoorstep\b/i,
]
const BAD_BRAND_NAMES = new Set([
  'iyengar bakery', 'sri iyengar bakery', 'vinayaka hot chips',
  'arun kumar', 'home delivery',
])
function isBadBrand(name: string): boolean {
  const lower = name.toLowerCase().trim()
  if (BAD_BRAND_NAMES.has(lower)) return true
  if (BAD_BRAND_PATTERNS.some(re => re.test(name))) return true
  return false
}

// ── Anchor / premium brands ───────────────────────────────────────────────────
// National chains + strong Bangalore regional players.
// These are surfaced first in brand lists — a landlord / tenant would name-drop
// any of these as proof of a zone's commercial quality.
const ANCHOR_BRANDS_LOWER = new Set([
  // QSR & Fast Food
  "mcdonald's", "mcdonalds", "kfc", "domino's", "dominos", "pizza hut",
  "burger king", "subway", "taco bell", "wendy's", "carl's jr.", "chicking",
  "wow momo", "chaayos", "chai point", "la pino'z pizza", "gopizza",
  "haldiram's", "barbeque nation", "paradise biryani", "biryani blues",
  "behrouz biryani", "box8", "faasos", "oven story", "the good bowl",
  "freshmenu", "captain egg", "bento", "auntie anne's", "cinnabon",
  "chinese wok", "a2b (adyar ananda bhavan)", "a2b", "adyar ananda bhavan",
  "hotel saravana bhavan", "saravana bhavan",
  // Cafe & Coffee
  "starbucks", "cafe coffee day", "ccd", "barista", "third wave coffee",
  "blue tokai", "matteo coffea", "dyu art cafe", "hatti kaapi",
  "dunkin'", "dunkin", "krispy kreme", "mcafe", "mccafe",
  // Bangalore restaurants & regional
  "mtr", "vidyarthi bhavan", "brahmin's coffee bar", "nagarjuna",
  "nandhini", "meghana foods", "truffles", "hotel empire", "shree sagar",
  "udupi palace", "corner house", "maiyas", "koshy's", "the fatty bao",
  "five star chicken", "dindigul thalappakatti",
  "smoke house deli", "monkey bar", "the permit room",
  "bangalore oota company", "the only place",
  // Cafes — Bangalore local legends
  "katte kulture", "matteo coffea", "dyu art cafe",
  "the hole in the wall cafe", "hole in the wall cafe",
  "chutney chang", "sunny's restaurant", "cafe max",
  // Bars & Breweries
  "toit", "byg brewski", "arbor brewing", "biere club", "windmills craftworks",
  "bengaluru brewing company", "sotally tober",
  "prost brewpub", "prost", "hammered", "plan b",
  // Bakery & Desserts
  "the sweet chariot", "theobroma", "l'opera", "daily bread",
  "belgian waffle", "belgian waffle factory", "frozen bottle", "keventers",
  "mad over donuts", "go nuts", "la folie",
  // Fitness
  "cult.fit", "cult fit", "gold's gym", "anytime fitness", "snap fitness",
  "talwalkars", "fitness first", "powerhouse gym",
  // Salon & Beauty
  "naturals", "lakme salon", "enrich salon", "enrich", "vlcc",
  "jean-claude biguine", "jcb", "green trends", "toni & guy",
  "wella", "o2 spa", "four fountains spa", "tattva spa",
  // Apparel — national
  "zara", "h&m", "mango", "westside", "lifestyle", "max fashion", "max",
  "fabindia", "manyavar", "allen solly", "van heusen", "peter england",
  "arrow", "raymond", "louis philippe", "w for woman", "w", "biba",
  "fabally", "shoppers stop", "marks & spencer", "uniqlo", "levi's", "levis",
  "lee", "wrangler", "pepe jeans", "tommy hilfiger", "calvin klein",
  "us polo", "us polo assn.", "flying machine", "pantaloons", "only",
  "vero moda", "jack & jones", "forever 21", "f21",
  // Footwear
  "bata", "nike", "adidas", "puma", "reebok", "skechers", "metro shoes",
  "woodland", "mochi", "new balance", "hush puppies", "clarks", "liberty",
  "red tape", "fila", "converse", "vans",
  // Electronics & Telecom
  "apple", "samsung", "reliance digital", "croma", "vijay sales",
  "oneplus", "mi store", "xiaomi", "lg", "sony", "bose", "jio",
  // Jewellery
  "tanishq", "malabar gold", "malabar gold & diamonds", "kalyan jewellers",
  "joyalukkas", "caratlane", "pc jeweller", "senco gold", "orra",
  "png jewellers", "grt jewellers",
  // Supermarket & Grocery
  "d-mart", "dmart", "reliance fresh", "more", "spar", "lulu hypermarket",
  "lulu", "nature's basket", "star market", "big bazaar", "hypercity",
  // Pharmacy
  "apollo pharmacy", "medplus", "wellness forever", "frank ross",
  "guardian pharmacy",
  // Cinema
  "pvr", "inox", "cinepolis", "miraj cinemas",
  // Books
  "crossword", "higginbothams", "blossom book house", "blossoms",
  // Eyewear
  "lenskart", "titan eyeplus", "specsmakers", "vision express",
])

function isAnchorBrand(name: string): boolean {
  return ANCHOR_BRANDS_LOWER.has(name.toLowerCase().trim())
}

// ── Brand-level category overrides ───────────────────────────────────────────
// Some brands get mis-tagged by Google Places (e.g., Domino's showing up as
// "cafe" or "restaurant" type). Override the DB category for known chains.
const QSR_FORCE_BRANDS_LOWER = new Set([
  "domino's", "dominos", "kfc", "mcdonald's", "mcdonalds", "pizza hut",
  "burger king", "subway", "taco bell", "wendy's", "carl's jr.", "chicking",
  "wow momo", "la pino'z pizza", "gopizza", "chinese wok", "captain egg",
  "auntie anne's", "cinnabon", "bento", "bento (japanese qsr)", "boba bhai",
  "khan saheb", "haldiram's", "haldirams", "dunkin'", "dunkin",
  "krispy kreme", "mad over donuts",
])

function resolveCategory(brandName: string, rawCategory: string | null): string {
  const bl = brandName.toLowerCase().trim()
  if (QSR_FORCE_BRANDS_LOWER.has(bl)) return 'QSR'
  return normalizeCategory(rawCategory)
}

function sortBrands(entries: [string, number][]): string[] {
  return entries
    .filter(([name]) => !isBadBrand(name))
    .sort((a, b) => {
      const aA = isAnchorBrand(a[0])
      const bA = isAnchorBrand(b[0])
      if (aA && !bA) return -1
      if (!aA && bA) return 1
      return b[1] - a[1]
    })
    .map(([name]) => name)
}

// Bounding boxes for 40 Bangalore neighborhoods.
// Ordering matters: classify() uses first-match, so prime commercial zones are
// listed first to win any border overlaps. Critical non-overlapping pairs:
//   HSR Layout (ends lng 77.638) / Bommanahalli (starts lng 77.638)
//   Arekere    (ends lng 77.618) / Hulimavu     (starts lng 77.618)
const NEIGHBORHOODS: { name: string; lat: [number, number]; lng: [number, number] }[] = [
  // ── Prime commercial hubs — highest overlap priority ──────────────────────────
  { name: 'Koramangala',      lat: [12.912, 12.958], lng: [77.598, 77.658] },
  { name: 'Indiranagar',      lat: [12.950, 13.000], lng: [77.615, 77.678] },
  { name: 'MG Road',          lat: [12.955, 12.998], lng: [77.572, 77.638] },
  { name: 'Whitefield',       lat: [12.952, 13.005], lng: [77.732, 77.802] },
  { name: 'Marathahalli',     lat: [12.932, 12.978], lng: [77.672, 77.732] },

  // ── South: Jayanagar belt (before BTM so Jayanagar gets its border cafes) ─────
  { name: 'Jayanagar',        lat: [12.912, 12.958], lng: [77.542, 77.612] },
  { name: 'Basavanagudi',     lat: [12.928, 12.972], lng: [77.540, 77.588] },
  { name: 'Langford Town',    lat: [12.938, 12.972], lng: [77.568, 77.622] },

  // ── South-East ────────────────────────────────────────────────────────────────
  { name: 'BTM Layout',       lat: [12.892, 12.938], lng: [77.568, 77.618] },
  // HSR east boundary stopped at 77.638 — Bommanahalli begins there
  { name: 'HSR Layout',       lat: [12.875, 12.932], lng: [77.595, 77.638] },
  // Bommanahalli: starts at 77.638, truly east of HSR — zero bbox containment
  { name: 'Bommanahalli',     lat: [12.892, 12.938], lng: [77.638, 77.688] },
  { name: 'Bellandur',        lat: [12.902, 12.952], lng: [77.645, 77.718] },
  { name: 'Sarjapur Road',    lat: [12.848, 12.918], lng: [77.658, 77.758] },

  // ── South: outer belt ─────────────────────────────────────────────────────────
  { name: 'Banashankari',     lat: [12.892, 12.945], lng: [77.508, 77.558] },
  { name: 'JP Nagar',         lat: [12.872, 12.928], lng: [77.538, 77.598] },
  { name: 'Vijayanagar',      lat: [12.938, 12.988], lng: [77.488, 77.548] },
  { name: 'Uttarahalli',      lat: [12.868, 12.918], lng: [77.488, 77.538] },
  { name: 'Kengeri',          lat: [12.868, 12.945], lng: [77.442, 77.502] },

  // ── Bannerghatta Road corridor — hard east/west split at lng 77.618 ───────────
  { name: 'Arekere',          lat: [12.838, 12.915], lng: [77.548, 77.618] },
  // Hulimavu starts exactly where Arekere ends — no containment, no gap
  { name: 'Hulimavu',         lat: [12.838, 12.915], lng: [77.618, 77.668] },
  { name: 'Electronic City',  lat: [12.790, 12.848], lng: [77.625, 77.718] },

  // ── Central ───────────────────────────────────────────────────────────────────
  { name: 'Shivajinagar',     lat: [12.962, 13.015], lng: [77.562, 77.618] },
  { name: 'Frazer Town',      lat: [12.965, 13.018], lng: [77.592, 77.658] },

  // ── West / North-West ─────────────────────────────────────────────────────────
  { name: 'Rajajinagar',      lat: [12.965, 13.020], lng: [77.508, 77.562] },
  { name: 'Malleshwaram',     lat: [12.972, 13.028], lng: [77.528, 77.595] },
  { name: 'Yeshwanthpur',     lat: [13.005, 13.062], lng: [77.512, 77.582] },
  { name: 'New BEL Road',     lat: [13.038, 13.090], lng: [77.508, 77.578] },
  { name: 'Peenya',           lat: [13.005, 13.075], lng: [77.462, 77.528] },

  // ── North ─────────────────────────────────────────────────────────────────────
  { name: 'RT Nagar',         lat: [12.998, 13.048], lng: [77.555, 77.618] },
  { name: 'Hebbal',           lat: [13.022, 13.082], lng: [77.540, 77.628] },
  { name: 'Sahakar Nagar',    lat: [13.038, 13.095], lng: [77.545, 77.622] },
  { name: 'Manyata',          lat: [13.025, 13.082], lng: [77.598, 77.668] },
  { name: 'Thanisandra',      lat: [13.045, 13.098], lng: [77.598, 77.672] },
  { name: 'Yelahanka',        lat: [13.075, 13.158], lng: [77.538, 77.648] },

  // ── North-East ────────────────────────────────────────────────────────────────
  { name: 'Kalyan Nagar',     lat: [12.998, 13.055], lng: [77.618, 77.678] },
  { name: 'Ramamurthynagar',  lat: [12.992, 13.055], lng: [77.642, 77.715] },
  { name: 'KR Puram',         lat: [12.975, 13.042], lng: [77.665, 77.742] },

  // ── East ──────────────────────────────────────────────────────────────────────
  { name: 'Brookefield',      lat: [12.955, 13.005], lng: [77.695, 77.762] },
  { name: 'Mahadevapura',     lat: [12.962, 13.025], lng: [77.682, 77.742] },
  { name: 'Varthur',          lat: [12.908, 12.968], lng: [77.718, 77.798] },
]

function classify(lat: number, lng: number): string | null {
  for (const n of NEIGHBORHOODS) {
    if (lat >= n.lat[0] && lat <= n.lat[1] && lng >= n.lng[0] && lng <= n.lng[1]) return n.name
  }
  return null
}

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json(EMPTY)

  const supabase = createClient(url, key)

  try {
    type Row = { category: string | null; brand_name: string; lat: number; lng: number }
    const allRows: Row[] = []
    const pageSize = 1000
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('bangalore_brand_outlets')
        .select('category, brand_name, lat, lng')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .range(from, from + pageSize - 1)

      if (error) { console.error('[brand-intelligence/zones]', error); break }
      if (!data?.length) break
      allRows.push(...(data as Row[]))
      if (data.length < pageSize) break
      from += pageSize
    }

    type ZoneAgg = { cats: Map<string, number>; brands: Map<string, number>; catBrands: Map<string, Map<string, number>> }
    const byZone = new Map<string, ZoneAgg>()
    for (const r of allRows) {
      const zone = classify(r.lat, r.lng)
      if (!zone) continue
      let z = byZone.get(zone)
      if (!z) { z = { cats: new Map(), brands: new Map(), catBrands: new Map() }; byZone.set(zone, z) }

      const cat = resolveCategory(r.brand_name, r.category)
      z.cats.set(cat, (z.cats.get(cat) ?? 0) + 1)
      z.brands.set(r.brand_name, (z.brands.get(r.brand_name) ?? 0) + 1)
      let cb = z.catBrands.get(cat)
      if (!cb) { cb = new Map(); z.catBrands.set(cat, cb) }
      cb.set(r.brand_name, (cb.get(r.brand_name) ?? 0) + 1)
    }

    const zones: ZoneData[] = Array.from(byZone.entries()).map(([zone, d]) => ({
      zone,
      totalOutlets: Array.from(d.cats.values()).reduce((s, v) => s + v, 0),
      totalBrands: d.brands.size,
      categories: Array.from(d.cats.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      topBrands: sortBrands(Array.from(d.brands.entries())).slice(0, 10),
      brandsByCategory: Object.fromEntries(
        Array.from(d.catBrands.entries()).map(([cat, bm]) => [
          cat,
          sortBrands(Array.from(bm.entries())).slice(0, 8),
        ])
      ),
    })).sort((a, b) => b.totalOutlets - a.totalOutlets)

    const allBrands = new Set(allRows.filter(r => classify(r.lat, r.lng)).map(r => r.brand_name))
    return NextResponse.json({
      zones,
      totalOutlets: zones.reduce((s, z) => s + z.totalOutlets, 0),
      totalBrands: allBrands.size,
      totalZones: zones.length,
    } satisfies ZonesResponse)
  } catch (err) {
    console.error('[brand-intelligence/zones]', err)
    return NextResponse.json(EMPTY)
  }
}
