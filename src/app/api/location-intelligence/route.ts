import { NextRequest, NextResponse } from 'next/server'

// Note: This is POST so revalidate doesn't apply, but Redis cache is already wired
export const maxDuration = 30 // Allow 30s for Google Places calls

import { mapplsNearby, mapplsNearbyTransit, mapToMapplsNearbyParams } from '@/lib/mappls-api'
import { isMapplsConfigured } from '@/lib/mappls-config'
import {
  computeSaturationIndex,
  computeDemandGapScore,
  computeWhitespaceScore,
  estimateMonthlyRevenue,
} from '@/lib/location-intelligence/scoring'
import {
  getIndiaCategoryProfile,
  RENT_VIABILITY,
} from '@/lib/location-intelligence/india-benchmarks'
import { cacheGet, cacheSet, locationIntelCacheKey } from '@/lib/redis'
import { classifyBrand } from '@/lib/location-intelligence/brand-classifier'
import { getPrisma } from '@/lib/get-prisma'
import { findNearestCensusWard } from '@/lib/intelligence/census-lookup'
import { censusToDemographics } from '@/lib/intelligence/census-to-demographics'
import { project2026Demographics } from '@/lib/intelligence/projectors/2026-projector'
import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'
import {
  computeCatchment,
  computeRetailMix,
  computeMarketPotentialScore,
  findSimilarMarkets,
  computeCannibalisationRisk,
} from '@/lib/location-intelligence/geoiq-features'
import { buildPopulationRentContext } from '@/lib/location-intelligence/location-rent-context'
import { geocodeAddress } from '@/lib/property-coordinates'

type LocationIntelligenceRequest = {
  lat?: number
  lng?: number
  address?: string
  city?: string
  state?: string
  /** Listing title — used to disambiguate geocode (e.g. "| Kalyan Nagar" vs generic "7th Main") */
  title?: string
  propertyType?: string
  businessType?: string
  monthlyRent?: number
  sizeSqft?: number
}

type Competitor = {
  name: string
  lat: number
  lng: number
  distanceMeters: number
  rating?: number
  userRatingsTotal?: number
  address?: string
  brandType?: 'popular' | 'new'
  /** Inferred category for retail mix / competitor tab (optical, cafe, qsr, …). */
  placeCategory?: string
}

type LocationIntelligenceResponse = {
  competitors: Competitor[]
  footfall: {
    dailyAverage: number
    peakHours: string[]
    weekendBoost: number
    confidence: 'low' | 'medium' | 'high'
    /** Hourly pattern (modeled) for chart. Estimated until GeoIQ. */
    hourlyPattern?: number[]
  }
  demographics: {
    ageGroups: { range: string; percentage: number }[]
    incomeLevel: 'low' | 'medium' | 'high' | 'mixed'
    lifestyle: string[]
  }
  accessibility: {
    walkScore: number
    transitScore: number
    nearestMetro?: { name: string; distanceMeters: number }
    nearestBusStop?: { name: string; distanceMeters: number }
  }
  market: {
    saturationLevel: 'low' | 'medium' | 'high'
    competitorCount: number
    summary: string
    saturationIndex?: number
    whitespaceScore?: number
    demandGapScore?: number
  }
  scores?: {
    saturationIndex: number
    whitespaceScore: number
    demandGapScore: number
    revenueProjectionMonthly: number
    revenueInputs?: {
      dailyFootfall: number
      captureRatePercent: number
      avgTicketSize: number
      areaMultiplier?: number
      category?: string
      note: string
    }
    rentViability?: {
      monthlyRent: number
      revenueProjection: number
      rentAsPctOfRevenue: number
      viable: boolean
      /** India benchmark: rent ≤ this % of revenue is considered healthy */
      benchmarkHealthyPct?: number
    }
  }
  dataSource?: {
    competitors: 'mappls' | 'google' | 'none' | 'mixed'
    transit: 'mappls' | 'google' | 'none'
    geocoding: 'mappls' | 'google' | 'none'
  }
  /** GeoIQ-style: catchment (where shoppers come from) */
  catchment?: Array<{ pincode: string; name: string; sharePct: number; distanceM: number; areaType?: string }>
  /** Apartments, tech parks, corporate clusters — for catchment list + heatmap density */
  catchmentLandmarks?: Array<{
    name: string
    kind: 'residential' | 'tech_park' | 'corporate'
    lat: number
    lng: number
    distanceMeters: number
  }>
  /** Crowd pullers: malls, offices, hospitals that drive traffic */
  crowdPullers?: Array<{ name: string; category: string; distanceMeters: number; footfallTag?: string }>
  /** Retail mix by category: branded vs non-branded */
  retailMix?: Array<{ category: string; branded: number; nonBranded: number; total: number }>
  /** Market potential 0–100 (saturation + demographics + accessibility) */
  marketPotentialScore?: number
  /** Similar areas with comparable profile */
  similarMarkets?: Array<{ area: string; score: number; distanceM: number }>
  /** Population & lifestyle from Census when available */
  populationLifestyle?: {
    totalHouseholds?: number
    affluenceIndicator?: string
    rentPerSqft?: number
    marketRentLow?: number
    marketRentHigh?: number
    listingRentPerSqft?: number
    rentDataSource?: 'listing' | 'area_benchmark'
    benchmarkNote?: string
    dataSource?: string
  }
  /** 2026 projections from enriched census (project2026Demographics) */
  projections2026?: {
    totalHouseholds: number
    affluenceIndicator: string
    populationGrowth: string
    incomeGrowth: string
    projectionSource: string
  }
  /** Cannibalisation risk: same-brand outlets nearby (estimated) */
  cannibalisationRisk?: Array<{
    brand: string
    outletCount: number
    nearestSameBrandDistanceM: number
    cannibalisationPct: number
  }>
  /** Bangalore micro-market key used for rent benchmarks (see location-rent-context) */
  nearestCommercialAreaKey?: string
}

const EARTH_RADIUS_M = 6371000

function haversineDistanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return EARTH_RADIUS_M * c
}

/** Nearby Search `type` must be a supported Places type — `store` is not valid and yields INVALID_REQUEST. */
const VALID_NEARBY_TYPES = new Set([
  'restaurant',
  'cafe',
  'meal_takeaway',
  'bakery',
  'bar',
  'pharmacy',
  'beauty_salon',
  'gym',
  'electronics_store',
  'jewelry_store',
  'clothing_store',
  'supermarket',
  'shopping_mall',
  'lodging',
  'hospital',
  'doctor',
  'dentist',
  'furniture_store',
  'hardware_store',
  'home_goods_store',
  'shoe_store',
  'book_store',
  'convenience_store',
  'department_store',
  'florist',
  'liquor_store',
  'pet_store',
  'point_of_interest',
  'establishment',
])

type GoogleNearbyPlace = {
  name?: string
  geometry?: { location?: { lat?: number; lng?: number } }
  rating?: number
  user_ratings_total?: number
  vicinity?: string
  formatted_address?: string
  types?: string[]
}

async function fetchGoogleNearbyPlaces(
  lat: number,
  lng: number,
  googleApiKey: string,
  opts: { keyword: string; type?: string },
  radiusMeters = 2000
): Promise<GoogleNearbyPlace[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', String(radiusMeters))
  if (opts.keyword) url.searchParams.set('keyword', opts.keyword)
  if (opts.type && VALID_NEARBY_TYPES.has(opts.type)) url.searchParams.set('type', opts.type)
  url.searchParams.set('key', googleApiKey)
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
  if (!res.ok) return []
  const json = await res.json()
  if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    if (json.status === 'INVALID_REQUEST') {
      console.warn('[LocationIntelligence API] Places INVALID_REQUEST:', json.error_message || '')
    }
    return []
  }
  return Array.isArray(json.results) ? json.results : []
}

function inferPlaceCategory(
  placeName: string,
  googleTypes: string[] | undefined,
  searchPlaceType: string,
  businessType?: string
): string {
  const n = placeName.toLowerCase()
  const bt = (businessType || '').toLowerCase()
  if (/\b(eye|optical|optician|lenskart|spectacles|eyewear|vision)\b/.test(n) || /\b(eye|optical|eyewear|optician|lens)\b/.test(bt)) {
    return 'optical'
  }
  if (googleTypes?.includes('pharmacy')) return 'pharmacy'
  if (googleTypes?.includes('jewelry_store')) return 'retail'
  if (googleTypes?.includes('beauty_salon')) return 'salon'
  if (googleTypes?.includes('gym')) return 'gym'
  const st = searchPlaceType || 'point_of_interest'
  if (st === 'cafe') return 'cafe'
  if (st === 'meal_takeaway') return 'qsr'
  if (st === 'restaurant') return 'restaurant'
  if (st === 'bakery') return 'bakery'
  if (st === 'bar') return 'bar'
  if (st === 'pharmacy') return 'pharmacy'
  if (st === 'clothing_store' || st === 'electronics_store' || st === 'supermarket' || st === 'shopping_mall') return 'retail'
  if (st === 'jewelry_store') return 'retail'
  if (st === 'beauty_salon') return 'salon'
  if (st === 'gym') return 'gym'
  if (/\b(cafe|coffee|chaayos|starbucks)\b/.test(n)) return 'cafe'
  return 'other'
}

function mergeDedupeCompetitors(a: Competitor[], b: Competitor[]): Competitor[] {
  const seen = new Set<string>()
  const out: Competitor[] = []
  for (const c of [...a, ...b]) {
    const key = `${String(c.name).toLowerCase()}|${Number(c.lat).toFixed(5)}|${Number(c.lng).toFixed(5)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  out.sort((x, y) => x.distanceMeters - y.distanceMeters)
  return out
}

async function fetchCatchmentLandmarks(
  lat: number,
  lng: number,
  googleApiKey: string
): Promise<
  Array<{
    name: string
    kind: 'residential' | 'tech_park' | 'corporate'
    lat: number
    lng: number
    distanceMeters: number
  }>
> {
  const queries: { keyword: string; kind: 'residential' | 'tech_park' | 'corporate' }[] = [
    { keyword: 'apartment society residential complex gated community', kind: 'residential' },
    { keyword: 'IT park technology park tech campus software park', kind: 'tech_park' },
    { keyword: 'corporate tower business park SEZ office campus', kind: 'corporate' },
  ]
  const out: Array<{
    name: string
    kind: 'residential' | 'tech_park' | 'corporate'
    lat: number
    lng: number
    distanceMeters: number
  }> = []
  const seen = new Set<string>()
  for (const q of queries) {
    const results = await fetchGoogleNearbyPlaces(lat, lng, googleApiKey, { keyword: q.keyword, type: 'point_of_interest' }, 3500)
    for (const place of results.slice(0, 8)) {
      const plat = place.geometry?.location?.lat
      const plng = place.geometry?.location?.lng
      const placeName = typeof place.name === 'string' ? place.name : String(place.name ?? '')
      if (typeof plat !== 'number' || typeof plng !== 'number') continue
      const key = `${placeName}|${plat}|${plng}`
      if (seen.has(key)) continue
      seen.add(key)
      const distanceMeters = Math.round(haversineDistanceMeters({ lat, lng }, { lat: plat, lng: plng }))
      out.push({ name: placeName, kind: q.kind, lat: plat, lng: plng, distanceMeters })
    }
  }
  return out.sort((x, y) => x.distanceMeters - y.distanceMeters).slice(0, 20)
}

/** Google Places: type + keyword. When Cafe/QSR, returns multiple so we fetch both. */
function mapToPlaceTypeAndKeyword(propertyType?: string, businessType?: string): { type: string; keyword: string }[] {
  const raw = `${businessType || ''} ${propertyType || ''}`.toLowerCase()
  const p = (propertyType || '').toLowerCase()

  // Eyewear / Optical
  if (/\b(eye|eyewear|optical|optician|spectacles|glasses|lenses|vision)\b/.test(raw)) {
    return [{ type: '', keyword: 'optician optical eyewear Lenskart spectacles glasses' }]
  }
  // Jewelry
  if (/\b(jewel|jewellery|jewelry|gold|diamond|ornament)\b/.test(raw)) {
    return [{ type: 'jewelry_store', keyword: 'jewellery jewelry gold diamond' }]
  }
  // Pharmacy / Medical
  if (/\b(pharma|pharmacy|medical|medicine|health|clinic|diagnostic)\b/.test(raw)) {
    return [{ type: 'pharmacy', keyword: 'pharmacy medical store' }]
  }
  // Salon / Beauty
  if (/\b(salon|beauty|spa|hair|nail|grooming|barber|makeup)\b/.test(raw)) {
    return [{ type: 'beauty_salon', keyword: 'salon beauty spa hair' }]
  }
  // Gym / Fitness
  if (/\b(gym|fitness|yoga|pilates|crossfit|sport|workout)\b/.test(raw)) {
    return [{ type: 'gym', keyword: 'gym fitness yoga' }]
  }
  // Electronics
  if (/\b(electronics|mobile|phone|laptop|computer|gadget|tech store)\b/.test(raw)) {
    return [{ type: 'electronics_store', keyword: 'electronics mobile phone laptop' }]
  }
  // Supermarket / Grocery
  if (/\b(super ?market|grocery|kirana|provision|hypermarket)\b/.test(raw)) {
    return [{ type: 'supermarket', keyword: 'supermarket grocery' }]
  }
  // Fashion / Apparel / Footwear
  if (/\b(fashion|apparel|clothing|footwear|shoes|shoe|garment|kurta|saree|wear)\b/.test(raw)) {
    return [{ type: 'clothing_store', keyword: 'clothing fashion apparel shoes footwear' }]
  }
  // Cafe / Coffee
  if (/\bcafe\b|\bcoffee\b|\bcafé\b/.test(raw)) {
    return [
      { type: 'cafe', keyword: 'cafe coffee' },
      { type: 'meal_takeaway', keyword: 'fast food burger pizza' },
    ]
  }
  // QSR / Fast Food
  if (/\b(qsr|quick service|fast food|burger|pizza|biryani|momos|shawarma)\b/.test(raw)) {
    return [{ type: 'meal_takeaway', keyword: 'fast food burger pizza shawarma biryani qsr' }]
  }
  // Full-service restaurant
  if (/\brestaurant\b|\bdining\b|\bfine dining\b/.test(raw) || p.includes('restaurant')) {
    return [{ type: 'restaurant', keyword: 'restaurant dining' }]
  }
  // Bakery / Dessert
  if (/\b(dessert|bakery|sweet|ice cream|cake|patisserie)\b/.test(raw)) {
    return [{ type: 'bakery', keyword: 'dessert bakery sweets' }]
  }
  // Bar / Brewery / Nightlife
  if (/\bbar\b|\bbrew\b|\bpub\b|\bnightclub\b/.test(raw)) {
    return [{ type: 'bar', keyword: 'bar pub brewery' }]
  }
  // Generic retail fallback
  if (/\bretail\b/.test(raw) || p.includes('retail')) {
    return [{ type: 'clothing_store', keyword: 'retail shopping store mall fashion' }]
  }

  return [{ type: 'point_of_interest', keyword: businessType || 'retail store' }]
}

/** Deterministic seed from location + business + competitor count for varied peak hours */
function locationSeed(lat: number, lng: number, businessType?: string, competitorCount?: number): number {
  const s = `${lat.toFixed(4)}_${lng.toFixed(4)}_${(businessType || '').toLowerCase()}_${competitorCount ?? 0}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const PEAK_HOURS_VARIANTS: string[][] = [
  ['12:00–2:30 PM', '7:00–10:00 PM'],
  ['11:00 AM–2:00 PM', '6:30–9:30 PM'],
  ['10:30 AM–1:30 PM', '5:00–8:00 PM'],
  ['1:00–3:00 PM', '8:00–10:30 PM'],
  ['10:00 AM–12:00 PM', '4:00–7:00 PM'],
  ['11:30 AM–1:00 PM', '6:00–9:00 PM'],
  ['12:30–3:00 PM', '7:30–10:30 PM'],
  ['10:00 AM–2:00 PM', '5:30–8:30 PM'],
]

/** Area-specific footfall multipliers – premium F&B vs high-density vs residential */
const AREA_FOOTFALL_MULTIPLIER: Record<string, number> = {
  indiranagar: 1.35,
  'mg road': 1.4,
  'ub city': 1.5,
  whitefield: 1.25,
  koramangala: 1.15,
  'hsr layout': 1.1,
  'btm layout': 1.05,
  jayanagar: 0.85,
  'jp nagar': 0.88,
  marathahalli: 1.1,
  mahadevapura: 1.2,
  brookfield: 1.15,
  kaikondrahalli: 1.05,
  'richmond town': 1.3,
  'aecs layout': 1.08,
  'st marks road': 1.35,
  bellandur: 1.15,
  'electronic city': 1.0,
  'sarjapur road': 1.05,
  banashankari: 0.88,
  malleswaram: 0.9,
  rajajinagar: 0.88,
  'brigade road': 1.3,
  'cunningham road': 1.25,
}

/** Area × category performance: some areas over/under-perform for certain categories. 1 = baseline. */
function getAreaCategoryModifier(areaKey: string | null, placeType: string, businessType?: string): number {
  if (!areaKey) return 1
  const raw = `${businessType || ''} ${placeType}`.toLowerCase()
  const isQSR = /\b(qsr|quick service|fast food)\b/.test(raw)
  const isCafe = /\b(cafe|coffee)\b/.test(raw)
  if (isQSR && (areaKey === 'btm layout' || areaKey === 'hsr layout' || areaKey === 'marathahalli')) return 1.15
  if (isCafe && (areaKey === 'indiranagar' || areaKey === 'mg road' || areaKey === 'koramangala' || areaKey === 'richmond town' || areaKey === 'st marks road')) return 1.1
  if (isQSR && (areaKey === 'jayanagar' || areaKey === 'jp nagar' || areaKey === 'banashankari')) return 0.92
  return 1
}

type DemographicsVariant = { ageGroups: { range: string; percentage: number }[]; incomeLevel: 'low' | 'medium' | 'high' | 'mixed'; lifestyle: string[] }

/** Area-specific demographics and lifestyle – each area has its own crowd pull */
const AREA_DEMOGRAPHICS: Record<string, DemographicsVariant> = {
  'hsr layout': {
    ageGroups: [{ range: '18–24', percentage: 28 }, { range: '25–34', percentage: 42 }, { range: '35–44', percentage: 20 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'medium',
    lifestyle: ['Students', 'Office goers', 'Tech workers', 'Startup crowd', 'Unicorn Street'],
  },
  koramangala: {
    ageGroups: [{ range: '18–24', percentage: 26 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 24 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'medium',
    lifestyle: ['Young professionals', 'Office crowd', 'Cafe hoppers', 'Weekend crowd'],
  },
  indiranagar: {
    ageGroups: [{ range: '18–24', percentage: 24 }, { range: '25–34', percentage: 44 }, { range: '35–44', percentage: 22 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'high',
    lifestyle: ['Young professionals', 'After-work hangouts', 'Nightlife', 'Foodies'],
  },
  jayanagar: {
    ageGroups: [{ range: '18–24', percentage: 20 }, { range: '25–34', percentage: 32 }, { range: '35–44', percentage: 28 }, { range: '45+', percentage: 20 }],
    incomeLevel: 'mixed',
    lifestyle: ['Families', 'Local shoppers', 'Residential crowd', 'Traditional retail'],
  },
  'jp nagar': {
    ageGroups: [{ range: '18–24', percentage: 22 }, { range: '25–34', percentage: 36 }, { range: '35–44', percentage: 26 }, { range: '45+', percentage: 16 }],
    incomeLevel: 'mixed',
    lifestyle: ['Families', 'Office goers', 'Local shoppers', 'Working couples'],
  },
  'btm layout': {
    ageGroups: [{ range: '18–24', percentage: 30 }, { range: '25–34', percentage: 38 }, { range: '35–44', percentage: 20 }, { range: '45+', percentage: 12 }],
    incomeLevel: 'medium',
    lifestyle: ['Students', 'Budget-conscious', 'Young professionals', 'Quick service'],
  },
  'mg road': {
    ageGroups: [{ range: '18–24', percentage: 22 }, { range: '25–34', percentage: 38 }, { range: '35–44', percentage: 26 }, { range: '45+', percentage: 14 }],
    incomeLevel: 'high',
    lifestyle: ['Office crowd', 'Premium dining', 'Corporates', 'High-end retail'],
  },
  'ub city': {
    ageGroups: [{ range: '18–24', percentage: 18 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 28 }, { range: '45+', percentage: 14 }],
    incomeLevel: 'high',
    lifestyle: ['Premium dining', 'Corporates', 'High-end retail', 'Office crowd'],
  },
  whitefield: {
    ageGroups: [{ range: '18–24', percentage: 24 }, { range: '25–34', percentage: 44 }, { range: '35–44', percentage: 24 }, { range: '45+', percentage: 8 }],
    incomeLevel: 'high',
    lifestyle: ['Tech workers', 'Office goers', 'Expats', 'Corporate crowd'],
  },
  marathahalli: {
    ageGroups: [{ range: '18–24', percentage: 26 }, { range: '25–34', percentage: 42 }, { range: '35–44', percentage: 22 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'medium',
    lifestyle: ['Tech workers', 'Office crowd', 'Young professionals'],
  },
  mahadevapura: {
    ageGroups: [{ range: '18–24', percentage: 25 }, { range: '25–34', percentage: 44 }, { range: '35–44', percentage: 22 }, { range: '45+', percentage: 9 }],
    incomeLevel: 'high',
    lifestyle: ['Tech workers', 'Corporate crowd', 'Office goers'],
  },
  brookfield: {
    ageGroups: [{ range: '18–24', percentage: 24 }, { range: '25–34', percentage: 42 }, { range: '35–44', percentage: 24 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'medium',
    lifestyle: ['Office crowd', 'Young professionals', 'Tech workers'],
  },
  kaikondrahalli: {
    ageGroups: [{ range: '18–24', percentage: 26 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 24 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'medium',
    lifestyle: ['Office goers', 'Young professionals', 'Families'],
  },
  'richmond town': {
    ageGroups: [{ range: '18–24', percentage: 22 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 26 }, { range: '45+', percentage: 12 }],
    incomeLevel: 'high',
    lifestyle: ['Office crowd', 'Premium retail', 'Corporates'],
  },
  'aecs layout': {
    ageGroups: [{ range: '18–24', percentage: 25 }, { range: '25–34', percentage: 42 }, { range: '35–44', percentage: 24 }, { range: '45+', percentage: 9 }],
    incomeLevel: 'medium',
    lifestyle: ['Tech workers', 'Office goers', 'Young professionals'],
  },
  'st marks road': {
    ageGroups: [{ range: '18–24', percentage: 22 }, { range: '25–34', percentage: 38 }, { range: '35–44', percentage: 26 }, { range: '45+', percentage: 14 }],
    incomeLevel: 'high',
    lifestyle: ['Office crowd', 'Premium dining', 'High-end retail'],
  },
}

const DEFAULT_DEMOGRAPHICS: DemographicsVariant = {
  ageGroups: [{ range: '18–24', percentage: 24 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 22 }, { range: '45+', percentage: 14 }],
  incomeLevel: 'mixed',
  lifestyle: ['Young professionals', 'Office crowd', 'Local shoppers'],
}

/** Modeled hourly footfall (24 values, 0–23). Estimated until GeoIQ. */
function buildModeledHourlyPattern(isFb: boolean, dailyAvg: number): number[] {
  const pattern = [
    0.02, 0.01, 0.01, 0.01, 0.01, 0.02, 0.04, 0.06, 0.08, 0.09, 0.1, 0.11,
    0.12, 0.11, 0.08, 0.06, 0.05, 0.06, 0.08, 0.09, 0.1, 0.08, 0.05, 0.03,
  ]
  const sum = pattern.reduce((a, b) => a + b, 0)
  return pattern.map((p) => Math.round((p / sum) * dailyAvg))
}

/** Find nearest Bangalore area key and distance */
function getNearestAreaKey(lat: number, lng: number): { key: string; distM: number } | null {
  let nearest: { key: string; distM: number } | null = null
  for (const area of BANGALORE_AREAS) {
    const d = haversineDistanceMeters({ lat, lng }, { lat: area.lat, lng: area.lng })
    if (!nearest || d < nearest.distM) nearest = { key: area.key, distM: d }
  }
  return nearest && nearest.distM < 8000 ? nearest : null
}

/** Find nearest Bangalore area by lat/lng; return its demographics or default (fallback when CensusData empty) */
function getDemographicsForArea(lat: number, lng: number): DemographicsVariant {
  const nearest = getNearestAreaKey(lat, lng)
  if (nearest) return AREA_DEMOGRAPHICS[nearest.key] ?? DEFAULT_DEMOGRAPHICS
  return DEFAULT_DEMOGRAPHICS
}

/** Get demographics: prefer CensusData when available, else AREA_DEMOGRAPHICS fallback */
async function getDemographicsForLocation(lat: number, lng: number): Promise<DemographicsVariant> {
  const prisma = await getPrisma()
  if (prisma) {
    const ward = await findNearestCensusWard(prisma, { latitude: lat, longitude: lng })
    if (ward) return censusToDemographics(ward)
  }
  return getDemographicsForArea(lat, lng)
}

function buildMockResponse(lat: number, lng: number): LocationIntelligenceResponse {
  return {
    competitors: [],
    footfall: {
      dailyAverage: 0,
      peakHours: [],
      weekendBoost: 1.3,
      confidence: 'low',
    },
    demographics: {
      ageGroups: [
        { range: '18–24', percentage: 22 },
        { range: '25–34', percentage: 38 },
        { range: '35–44', percentage: 24 },
        { range: '45+', percentage: 16 },
      ],
      incomeLevel: 'mixed',
      lifestyle: ['Young professionals', 'Working couples', 'Students', 'Early families'],
    },
    accessibility: {
      walkScore: 70,
      transitScore: 65,
      nearestMetro: undefined,
      nearestBusStop: undefined,
    },
    market: {
      saturationLevel: 'low',
      competitorCount: 0,
      summary: 'Enable Google Places API for competitor and transit data (Mappls handles geocoding when configured).',
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: LocationIntelligenceRequest
    try {
      body = (await request.json()) as LocationIntelligenceRequest
    } catch (jsonError: any) {
      console.error('[LocationIntelligence API] JSON parse error:', jsonError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    if (!body || typeof body !== 'object') body = {} as LocationIntelligenceRequest

    let {
      lat,
      lng,
      address,
      city,
      state,
      title,
      propertyType,
      businessType,
      monthlyRent: rawRent,
      sizeSqft: rawSize,
    } = body
    const monthlyRent = typeof rawRent === 'number' && Number.isFinite(rawRent) && rawRent > 0 ? rawRent : undefined
    const sizeSqft = typeof rawSize === 'number' && Number.isFinite(rawSize) ? rawSize : undefined

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      const locationQuery = [address, city, state].filter(Boolean).join(', ')
      if (locationQuery.trim()) {
        const coords = await geocodeAddress(address || '', city || '', state || '', title)
        if (coords) {
          lat = coords.lat
          lng = coords.lng
        }
      }
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Latitude and longitude are required or must be derivable from address.',
        },
        { status: 400 }
      )
    }

    // Phase 6: Redis cache (by location + category only; rentViability recomputed per request)
    let cached: LocationIntelligenceResponse | null = null
    try {
      const cacheKey = locationIntelCacheKey(lat, lng, propertyType, businessType, { monthlyRent, sizeSqft })
      cached = await cacheGet<LocationIntelligenceResponse>(cacheKey)
      if (cached) {
        if (typeof monthlyRent === 'number' && monthlyRent > 0 && cached.scores?.revenueProjectionMonthly) {
          const rev = cached.scores.revenueProjectionMonthly
          const rentPct = (monthlyRent / rev) * 100
          const placeTypes = mapToPlaceTypeAndKeyword(propertyType, businessType)
          const primaryPlaceType = placeTypes[0]?.type ?? 'point_of_interest'
          const isFbCache = ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway'].includes(primaryPlaceType)
          const healthyPctCache = isFbCache ? RENT_VIABILITY.fnbHealthyRentToRevenuePct : RENT_VIABILITY.healthyRentToRevenuePct
          cached.scores.rentViability = {
            monthlyRent,
            revenueProjection: rev,
            rentAsPctOfRevenue: Math.round(rentPct),
            viable: monthlyRent <= rev * (healthyPctCache / 100),
            benchmarkHealthyPct: healthyPctCache,
          }
        }
        return NextResponse.json({
          success: true,
          data: { ...cached, coordinates: { lat, lng } },
        })
      }
    } catch (cacheErr: any) {
      console.warn('[LocationIntelligence API] Cache read failed:', cacheErr?.message)
    }

    // Priority: Use server-side env var first (more reliable for API routes)
    // Fallback to NEXT_PUBLIC_* for compatibility
    const googleApiKey =
      process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const hasMappls = isMapplsConfigured()

    if (!googleApiKey && !hasMappls) {
      const errorMsg =
        'Configure at least one: MAPPLS_REST_API_KEY (India POI) or GOOGLE_MAPS_API_KEY (Places API).'
      console.error('[LocationIntelligence API]', errorMsg)

      if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
        return NextResponse.json(
          {
            success: false,
            error: errorMsg,
            details: 'Location intelligence requires Mappls or Google Places API.',
          },
          { status: 503 }
        )
      }
      console.warn('[LocationIntelligence API]', errorMsg)
    }
    
    const placeTypes = mapToPlaceTypeAndKeyword(propertyType, businessType)
    const primaryPlaceType = placeTypes[0]?.type ?? 'point_of_interest'
    const mapplsParams = mapToMapplsNearbyParams(propertyType, businessType)

    let competitors: Competitor[] = []
    let competitorsSource: 'mappls' | 'google' | 'none' | 'mixed' = 'none'

    // Phase 2: Mappls first for competitors (India-native POI), fallback to Google
    const isCafeQSR = placeTypes.length >= 2
    if (isMapplsConfigured() && typeof lat === 'number' && typeof lng === 'number') {
      try {
        if (isCafeQSR) {
          const [cafeResults, qsrResults] = await Promise.all([
            mapplsNearby(lat, lng, { keywords: 'coffee;cafe', categoryCode: 'FODCOF' }, { radius: 1000, limit: 15 }),
            mapplsNearby(lat, lng, { keywords: 'fast food;burger;pizza;shawarma;biryani;momos', categoryCode: 'FODCOF' }, { radius: 1000, limit: 15 }),
          ])
          const seen = new Set<string>()
          for (const m of cafeResults) {
            const k = `${m.name}|${m.lat}|${m.lng}`
            if (seen.has(k)) continue
            seen.add(k)
            competitors.push({
              name: m.name,
              lat: m.lat,
              lng: m.lng,
              distanceMeters: m.distanceMeters,
              address: m.address,
              brandType: classifyBrand(m.name),
              placeCategory: 'cafe',
            })
          }
          for (const m of qsrResults) {
            const k = `${m.name}|${m.lat}|${m.lng}`
            if (seen.has(k)) continue
            seen.add(k)
            competitors.push({
              name: m.name,
              lat: m.lat,
              lng: m.lng,
              distanceMeters: m.distanceMeters,
              address: m.address,
              brandType: classifyBrand(m.name),
              placeCategory: 'qsr',
            })
          }
          competitors.sort((a, b) => a.distanceMeters - b.distanceMeters)
          if (competitors.length > 0) competitorsSource = 'mappls'
        } else {
          const mapplsResults = await mapplsNearby(
            lat,
            lng,
            { keywords: mapplsParams.keywords, categoryCode: mapplsParams.categoryCode },
            { radius: 1000, limit: 20 }
          )
          if (mapplsResults.length > 0) {
            competitors = mapplsResults.map((m) => ({
              name: m.name,
              lat: m.lat,
              lng: m.lng,
              distanceMeters: m.distanceMeters,
              address: m.address,
              brandType: classifyBrand(m.name),
              placeCategory: inferPlaceCategory(m.name, undefined, primaryPlaceType, businessType),
            }))
            competitorsSource = 'mappls'
          }
        }
      } catch (e: any) {
        console.warn('[LocationIntelligence API] Mappls Nearby failed:', e?.message)
      }
    }

    const hadMapplsCompetitors = competitors.length > 0 && competitorsSource === 'mappls'

    if (googleApiKey && typeof lat === 'number' && typeof lng === 'number') {
      try {
        const googleAdds: Competitor[] = []
        const searchRadius = 2000
        for (const { type: placeType, keyword: placeKeyword } of placeTypes) {
          const gType = placeType && VALID_NEARBY_TYPES.has(placeType) ? placeType : undefined
          const results = await fetchGoogleNearbyPlaces(lat, lng, googleApiKey, { keyword: placeKeyword, type: gType }, searchRadius)
          for (const place of results) {
            const compLat = place.geometry?.location?.lat
            const compLng = place.geometry?.location?.lng
            const placeName = typeof place.name === 'string' ? place.name : String(place.name ?? 'Unknown')
            const hasCoords = typeof compLat === 'number' && typeof compLng === 'number'
            const distanceMeters = hasCoords
              ? haversineDistanceMeters({ lat: lat as number, lng: lng as number }, { lat: compLat, lng: compLng })
              : Number.NaN
            const urt = typeof place.user_ratings_total === 'number' ? place.user_ratings_total : undefined
            const placeCategory = inferPlaceCategory(placeName, place.types, placeType || 'point_of_interest', businessType)
            googleAdds.push({
              name: placeName,
              lat: compLat ?? 0,
              lng: compLng ?? 0,
              distanceMeters,
              rating: typeof place.rating === 'number' ? place.rating : undefined,
              userRatingsTotal: urt,
              address: place.vicinity || place.formatted_address,
              brandType: classifyBrand(placeName, urt),
              placeCategory,
            })
          }
        }

        const beforeCount = competitors.length
        competitors = mergeDedupeCompetitors(competitors, googleAdds)
        competitors = competitors.filter((c) => Number.isFinite(c.distanceMeters) && c.distanceMeters >= 0)

        if (googleAdds.length > 0) {
          if (hadMapplsCompetitors && beforeCount > 0) competitorsSource = 'mixed'
          else if (!hadMapplsCompetitors) competitorsSource = 'google'
        }
      } catch (placesError: any) {
        console.error('[LocationIntelligence API] Places API fetch failed:', placesError.message)
      }
    }

    // Fetch nearest metro: Mappls first, fallback to Google
    let nearestMetro: { name: string; distanceMeters: number } | undefined
    let nearestBusStop: { name: string; distanceMeters: number } | undefined
    let transitSource: 'mappls' | 'google' | 'none' = 'none'

    if (typeof lat === 'number' && typeof lng === 'number') {
      if (isMapplsConfigured()) {
        try {
          const mapplsMetro = await mapplsNearbyTransit(lat, lng, 'metro station Namma Metro')
          if (mapplsMetro) {
            nearestMetro = { name: mapplsMetro.name, distanceMeters: mapplsMetro.distanceMeters }
            transitSource = 'mappls'
          }
        } catch {
          // ignore
        }
      }
      if (!nearestMetro && googleApiKey) {
        try {
          const transitUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
          transitUrl.searchParams.set('location', `${lat},${lng}`)
          transitUrl.searchParams.set('radius', '2000')
          transitUrl.searchParams.set('keyword', 'metro station Namma Metro')
          transitUrl.searchParams.set('key', googleApiKey)
          const transitRes = await fetch(transitUrl.toString(), { signal: AbortSignal.timeout(8000) })
          if (transitRes.ok) {
            const transitJson = await transitRes.json()
            const first = transitJson.results?.[0]
            if (first?.geometry?.location && first?.name) {
              const metroLat = first.geometry.location.lat
              const metroLng = first.geometry.location.lng
              nearestMetro = {
                name: first.name,
                distanceMeters: Math.round(haversineDistanceMeters({ lat, lng }, { lat: metroLat, lng: metroLng })),
              }
              transitSource = 'google'
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // Crowd pullers: malls, offices, hospitals (Mappls)
    let crowdPullers: Array<{ name: string; category: string; distanceMeters: number; footfallTag?: string }> = []
    if (isMapplsConfigured() && typeof lat === 'number' && typeof lng === 'number') {
      try {
        const [malls, offices, hospitals] = await Promise.all([
          mapplsNearby(lat, lng, { keywords: 'mall;shopping center;orion;forum;mantri' }, { radius: 2000, limit: 5 }),
          mapplsNearby(lat, lng, { keywords: 'office;corporate;IT park' }, { radius: 2000, limit: 5 }),
          mapplsNearby(lat, lng, { keywords: 'hospital;medical' }, { radius: 2000, limit: 3 }),
        ])
        for (const m of malls) {
          crowdPullers.push({ name: m.name, category: 'Mall', distanceMeters: m.distanceMeters, footfallTag: 'High footfall' })
        }
        for (const o of offices.slice(0, 3)) {
          crowdPullers.push({ name: o.name, category: 'Office', distanceMeters: o.distanceMeters, footfallTag: 'Working population' })
        }
        for (const h of hospitals) {
          crowdPullers.push({ name: h.name, category: 'Hospital', distanceMeters: h.distanceMeters })
        }
        crowdPullers.sort((a, b) => a.distanceMeters - b.distanceMeters)
      } catch {
        // ignore
      }
    }

    let catchmentLandmarks: LocationIntelligenceResponse['catchmentLandmarks'] = undefined
    if (googleApiKey && typeof lat === 'number' && typeof lng === 'number') {
      try {
        catchmentLandmarks = await fetchCatchmentLandmarks(lat, lng, googleApiKey)
      } catch {
        catchmentLandmarks = undefined
      }
    }

    // Build response - use real data when we have Mappls or Google; mock only when neither
    let response: LocationIntelligenceResponse
    if (!googleApiKey && !hasMappls) {
      // No API key - use mock response (should only happen in development after warning)
      response = buildMockResponse(lat as number, lng as number)
      if (nearestMetro) response.accessibility.nearestMetro = nearestMetro
    } else {
      // We have API key - use real data (even if competitors is empty, that's valid - means no competitors found)
      const competitorCount = competitors.length
      let saturation: 'low' | 'medium' | 'high' = 'medium'
      if (competitorCount <= 2) saturation = 'low'
      else if (competitorCount >= 8) saturation = 'high'

      // Category-specific + area-specific footfall (India benchmarks; real data needs GeoIQ API)
      const category = getIndiaCategoryProfile(primaryPlaceType, businessType)
      const nearestArea = getNearestAreaKey(lat as number, lng as number)
      const areaMultiplier = nearestArea ? (AREA_FOOTFALL_MULTIPLIER[nearestArea.key] ?? 1) : 1
      const rawFootfall = category.baseFootfall + competitorCount * category.perCompetitor
      const dailyAverage = Math.round(rawFootfall * areaMultiplier)

      const seed = locationSeed(lat as number, lng as number, businessType, competitorCount)
      const peakVariant = PEAK_HOURS_VARIANTS[seed % PEAK_HOURS_VARIANTS.length]
      const demoVariant = await getDemographicsForLocation(lat as number, lng as number)

      const isFb = ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway'].includes(primaryPlaceType)
      const peakH = isFb ? peakVariant : PEAK_HOURS_VARIANTS[(seed + 1) % PEAK_HOURS_VARIANTS.length]
      const hourlyPattern = buildModeledHourlyPattern(isFb, dailyAverage)
      const footfall: LocationIntelligenceResponse['footfall'] = {
        dailyAverage,
        peakHours: peakH,
        weekendBoost: competitorCount >= 8 ? 1.25 : competitorCount >= 4 ? 1.35 : 1.45,
        confidence: competitorCount >= 6 ? 'high' : competitorCount >= 3 ? 'medium' : 'low',
        hourlyPattern,
      }

      const demographics: LocationIntelligenceResponse['demographics'] = {
        ageGroups: demoVariant.ageGroups,
        incomeLevel: demoVariant.incomeLevel,
        lifestyle: demoVariant.lifestyle,
      }

      const accessibility: LocationIntelligenceResponse['accessibility'] = {
        walkScore: 75,
        transitScore: nearestMetro ? (nearestMetro.distanceMeters < 500 ? 82 : nearestMetro.distanceMeters < 1000 ? 72 : 65) : 70,
        nearestMetro: nearestMetro ?? undefined,
        nearestBusStop: nearestBusStop ?? undefined,
      }

      const summaryMap: Record<'low' | 'medium' | 'high', string> = {
        low: `Low saturation in this category (${competitorCount} nearby). Good opportunity to establish presence.`,
        medium:
          `Moderate competition in this category (${competitorCount} nearby). Differentiate by concept and experience.`,
        high: `High saturation in this category (${competitorCount} nearby). Best for strong brands with clear differentiation.`,
      }

      // Phase 4: Scoring engine integration
      const populationDensity = 5000 + dailyAverage * 0.3
      const saturationIdx = computeSaturationIndex(competitorCount, populationDensity)
      const inverseSaturation = Math.max(0, 100 - saturationIdx)
      const populationWeighted = Math.min(100, (dailyAverage / 100) * 2)
      const categorySupplyScore = Math.max(0, 100 - saturationIdx)
      const demandGap = computeDemandGapScore(populationWeighted, categorySupplyScore)
      const footfallScore = Math.min(100, Math.round((dailyAverage / 5000) * 100))
      const whitespaceScore = computeWhitespaceScore(demandGap, inverseSaturation, footfallScore)
      let revenueProjection = estimateMonthlyRevenue(
        dailyAverage,
        category.captureRate,
        category.avgTicket
      )
      const areaCatMod = getAreaCategoryModifier(nearestArea?.key ?? null, primaryPlaceType, businessType)
      revenueProjection = Math.round(revenueProjection * areaCatMod)
      const healthyPct = isFb ? RENT_VIABILITY.fnbHealthyRentToRevenuePct : RENT_VIABILITY.healthyRentToRevenuePct
      const rentViability =
        typeof monthlyRent === 'number' && monthlyRent > 0 && revenueProjection > 0
          ? (() => {
              const rentPct = (monthlyRent / revenueProjection) * 100
              return {
                monthlyRent,
                revenueProjection,
                rentAsPctOfRevenue: Math.round(rentPct),
                viable: monthlyRent <= revenueProjection * (healthyPct / 100),
                benchmarkHealthyPct: healthyPct,
              }
            })()
          : undefined

      const transitScoreNum = nearestMetro
        ? nearestMetro.distanceMeters < 500 ? 82 : nearestMetro.distanceMeters < 1000 ? 72 : 65
        : 70
      const demoStrength = demoVariant.incomeLevel === 'high' ? 85 : demoVariant.incomeLevel === 'medium' ? 65 : 45
      const marketPotentialScore = computeMarketPotentialScore({
        saturationIndex: saturationIdx,
        whitespaceScore,
        demandGapScore: demandGap,
        transitScore: transitScoreNum,
        demographicStrength: demoStrength,
        revenueProjection,
        competitorCount,
      })

      const rentCtx = buildPopulationRentContext({
        nearestAreaKey: nearestArea?.key ?? null,
        propertyType,
        monthlyRent,
        sizeSqft,
      })

      const prismaForWard = await getPrisma()
      const wardForPop = prismaForWard ? await findNearestCensusWard(prismaForWard, { latitude: lat, longitude: lng }) : null
      const pop = wardForPop?.totalPopulation as number | undefined
      const hhSize = wardForPop?.avgHouseholdSize as number | undefined
      const inc15 = wardForPop?.incomeAbove15L as number | undefined

      // 2026 enrichment: project demographics when Census ward available
      let projections2026: { totalHouseholds: number; affluenceIndicator: string; populationGrowth: string; incomeGrowth: string; projectionSource: string } | undefined
      let populationLifestyle: LocationIntelligenceResponse['populationLifestyle']

      if (wardForPop) {
        const wardId = (wardForPop as { wardId?: string }).wardId as string | undefined
        const wardName = (wardForPop as { wardName?: string }).wardName as string | undefined
        try {
          if (wardId && pop != null && pop > 0) {
            const projected = await project2026Demographics(wardId, {
              totalPopulation: Number(pop),
              age18_24: Number((wardForPop as { age18_24?: number }).age18_24 ?? 22),
              age25_34: Number((wardForPop as { age25_34?: number }).age25_34 ?? 38),
              age35_44: Number((wardForPop as { age35_44?: number }).age35_44 ?? 24),
              age45_54: Number((wardForPop as { age45_54?: number }).age45_54 ?? 10),
              age55_64: Number((wardForPop as { age55_64?: number }).age55_64 ?? 3),
              age65Plus: Number((wardForPop as { age65Plus?: number }).age65Plus ?? 1),
              medianIncome: Number((wardForPop as { medianIncome?: number }).medianIncome ?? 900000),
              workingPopulation: Number((wardForPop as { workingPopPercent?: number }).workingPopPercent ?? 65),
            }, wardName)
            const hhSizeNum = hhSize != null && hhSize > 0 ? Number(hhSize) : 3
            const totalHouseholds2026 = Math.round(projected.totalPopulation / hhSizeNum)
            const popGrowth = pop > 0 ? (((projected.totalPopulation / pop) - 1) * 100).toFixed(1) : '0'
            const med2021 = Number((wardForPop as { medianIncome?: number }).medianIncome ?? 900000)
            const incGrowth = med2021 > 0 ? (((projected.medianIncome / med2021) - 1) * 100).toFixed(1) : '0'
            projections2026 = {
              totalHouseholds: totalHouseholds2026,
              affluenceIndicator: projected.medianIncome >= 1500000 ? 'High' : projected.medianIncome >= 1200000 ? 'Medium' : 'Moderate',
              populationGrowth: `+${popGrowth}%`,
              incomeGrowth: `+${incGrowth}%`,
              projectionSource: projected.projectionSource,
            }
            populationLifestyle = {
              totalHouseholds: totalHouseholds2026,
              affluenceIndicator: projections2026.affluenceIndicator,
              rentPerSqft: rentCtx.rentPerSqft,
              marketRentLow: rentCtx.marketRentLow,
              marketRentHigh: rentCtx.marketRentHigh,
              listingRentPerSqft: rentCtx.listingRentPerSqft,
              rentDataSource: rentCtx.rentDataSource,
              benchmarkNote: `2026 projection: ${projections2026.populationGrowth} pop, ${projections2026.incomeGrowth} income (Census base). ${rentCtx.benchmarkNote}`,
              dataSource: 'Estimated' as const,
            }
          }
        } catch (projErr: any) {
          console.warn('[LocationIntelligence] 2026 projection failed, using 2021:', projErr?.message)
        }
        if (!populationLifestyle) {
          populationLifestyle = {
            totalHouseholds: pop != null && hhSize != null && hhSize > 0 ? Math.round(pop / hhSize) : undefined,
            affluenceIndicator: inc15 != null && inc15 >= 25 ? 'High' : inc15 != null && inc15 >= 15 ? 'Medium' : 'Moderate',
            rentPerSqft: rentCtx.rentPerSqft,
            marketRentLow: rentCtx.marketRentLow,
            marketRentHigh: rentCtx.marketRentHigh,
            listingRentPerSqft: rentCtx.listingRentPerSqft,
            rentDataSource: rentCtx.rentDataSource,
            benchmarkNote: rentCtx.benchmarkNote,
            dataSource: 'Estimated' as const,
          }
        }
      }

      if (!populationLifestyle) {
        populationLifestyle = {
          rentPerSqft: rentCtx.rentPerSqft,
          marketRentLow: rentCtx.marketRentLow,
          marketRentHigh: rentCtx.marketRentHigh,
          listingRentPerSqft: rentCtx.listingRentPerSqft,
          rentDataSource: rentCtx.rentDataSource,
          benchmarkNote: rentCtx.benchmarkNote,
          dataSource: 'Area benchmark',
        }
      }

      const cannCategoryLabel = (businessType || '').split(/[,;]/)[0]?.trim().slice(0, 48) || 'Trade area'

      response = {
        competitors,
        footfall,
        demographics,
        accessibility,
        market: {
          saturationLevel: saturation,
          competitorCount,
          summary: summaryMap[saturation],
          saturationIndex: saturationIdx,
          whitespaceScore,
          demandGapScore: demandGap,
        },
        scores: {
          saturationIndex: saturationIdx,
          whitespaceScore,
          demandGapScore: demandGap,
          revenueProjectionMonthly: revenueProjection,
          rentViability,
          revenueInputs: {
            dailyFootfall: dailyAverage,
            captureRatePercent: category.captureRate,
            avgTicketSize: category.avgTicket,
            areaMultiplier: nearestArea ? AREA_FOOTFALL_MULTIPLIER[nearestArea.key] : 1,
            category: primaryPlaceType,
            note: 'India F&B benchmarks applied. Integrate GeoIQ for real footfall & demographics.',
          },
        },
        dataSource: {
          competitors: competitorsSource,
          transit: transitSource,
          geocoding: hasMappls ? 'mappls' : googleApiKey ? 'google' : 'none',
        },
        catchment: computeCatchment(lat, lng),
        catchmentLandmarks: catchmentLandmarks && catchmentLandmarks.length > 0 ? catchmentLandmarks : undefined,
        crowdPullers: crowdPullers.length > 0 ? crowdPullers : undefined,
        retailMix: competitors.length > 0 ? computeRetailMix(competitors) : undefined,
        marketPotentialScore,
        similarMarkets: findSimilarMarkets(lat, lng, 5),
        populationLifestyle,
        projections2026: projections2026 ?? undefined,
        cannibalisationRisk:
          competitors.length > 0
            ? computeCannibalisationRisk(
                competitors.map((c) => ({
                  name: c.name,
                  lat: c.lat,
                  lng: c.lng,
                  distanceMeters: c.distanceMeters,
                })),
                cannCategoryLabel
              )
            : undefined,
        nearestCommercialAreaKey: nearestArea?.key,
      }
    }

    try {
      const cacheKey = locationIntelCacheKey(lat, lng, propertyType, businessType, { monthlyRent, sizeSqft })
      await cacheSet(cacheKey, response)
    } catch (cacheErr: any) {
      console.warn('[LocationIntelligence API] Cache write failed:', cacheErr?.message)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        coordinates: { lat, lng },
      },
    })
  } catch (error: any) {
    console.error('[LocationIntelligence] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch location intelligence',
      },
      { status: 500 }
    )
  }
}


