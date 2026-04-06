/**
 * GeoIQ-style location intelligence features.
 * Uses CensusData, Mappls, Google, india-benchmarks – no GeoIQ/Placer API.
 */

import { BANGALORE_AREAS, BANGALORE_PINCODES } from './bangalore-areas'
import { POPULAR_BRAND_PATTERNS } from './brand-classifier'

const EARTH_RADIUS_M = 6371000

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Nearest Bangalore macro area for labels, office-mix priors, and cache repair (≤ maxDistM). */
export function getNearestBangaloreArea(
  lat: number,
  lng: number,
  maxDistM = 8000
): { key: string; distM: number } | null {
  let nearest: { key: string; distM: number } | null = null
  for (const area of BANGALORE_AREAS) {
    const d = Math.round(haversineMeters({ lat, lng }, { lat: area.lat, lng: area.lng }))
    if (!nearest || d < nearest.distM) nearest = { key: area.key, distM: d }
  }
  return nearest && nearest.distM <= maxDistM ? nearest : null
}

/** Known office / coworking anchors — merged when Google returns thin results (e.g. HSR + IndiQube). */
const NAMED_WORKSPACE_SEEDS: Array<{
  name: string
  lat: number
  lng: number
  kind: 'tech_park' | 'corporate'
  maxIncludeM: number
}> = [
  { name: 'IndiQube — HSR / 24th Main corridor', lat: 12.9127, lng: 77.6419, kind: 'corporate', maxIncludeM: 2200 },
  { name: 'RMZ Eco World', lat: 12.9384, lng: 77.6972, kind: 'tech_park', maxIncludeM: 3500 },
  { name: 'Embassy Tech Village', lat: 12.938, lng: 77.684, kind: 'tech_park', maxIncludeM: 3500 },
  { name: 'Manyata Tech Park', lat: 13.045, lng: 77.625, kind: 'tech_park', maxIncludeM: 4000 },
  { name: 'Bagmane Tech Park', lat: 12.985, lng: 77.663, kind: 'tech_park', maxIncludeM: 3500 },
  { name: 'Global Village Tech Park', lat: 12.902, lng: 77.499, kind: 'tech_park', maxIncludeM: 4000 },
]

export function appendWorkplaceLandmarkSeeds<
  T extends { name: string; kind: string; lat: number; lng: number; distanceMeters: number },
>(lat: number, lng: number, existing: T[]): T[] {
  const seen = new Set(existing.map((e) => e.name.toLowerCase()))
  const out = [...existing]
  for (const p of NAMED_WORKSPACE_SEEDS) {
    const distanceMeters = Math.round(haversineMeters({ lat, lng }, { lat: p.lat, lng: p.lng }))
    if (distanceMeters > p.maxIncludeM) continue
    const key = p.name.toLowerCase()
    if (seen.has(key)) continue
    if ([...seen].some((s) => s.includes('indiqube') && key.includes('indiqube'))) continue
    seen.add(key)
    out.push({
      name: p.name,
      kind: p.kind,
      lat: p.lat,
      lng: p.lng,
      distanceMeters,
    } as T)
  }
  return out.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 24)
}

/** Catchment proxy: nearby micro-areas with share % by distance inverse (default 4 km for fuller HSR/ORR coverage). */
export function computeCatchment(
  lat: number,
  lng: number,
  maxDistKm = 4
): Array<{ pincode: string; name: string; sharePct: number; distanceM: number; areaType: string }> {
  const maxM = maxDistKm * 1000
  const point = { lat, lng }
  const withDist = BANGALORE_PINCODES.map((p) => ({
    ...p,
    distanceM: Math.round(haversineMeters(point, { lat: p.lat, lng: p.lng })),
  }))
    .filter((p) => p.distanceM <= maxM)
    .map((p) => ({ ...p, invDist: 1 / Math.max(p.distanceM, 100) }))

  const totalInv = withDist.reduce((s, p) => s + p.invDist, 0)
  if (totalInv <= 0) return []

  return withDist
    .map((p) => ({
      pincode: p.pincode,
      name: p.name,
      sharePct: Math.round((p.invDist / totalInv) * 100),
      distanceM: p.distanceM,
      areaType: p.areaType || 'mixed',
    }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 10)
}

/** Categories for retail mix (from POI names/types). */
const RETAIL_CATEGORIES = ['restaurant', 'cafe', 'qsr', 'optical', 'retail', 'bakery', 'bar', 'pharmacy', 'salon', 'other'] as const

function categorizePlace(name: string, placeCategory?: string): (typeof RETAIL_CATEGORIES)[number] {
  const n = name.toLowerCase()
  const pc = (placeCategory || '').toLowerCase()
  if (pc === 'optical' || /\b(optician|optical|eyewear|spectacles|lenskart|eye\s*plus|vision)\b/.test(n)) return 'optical'
  if (pc === 'pharmacy' || /\b(pharmacy|medical store|apollo)\b/.test(n)) return 'pharmacy'
  if (pc === 'salon' || pc === 'beauty_salon' || /\b(salon|spa|hair cut)\b/.test(n)) return 'salon'
  if (placeCategory === 'cafe' || /\b(cafe|coffee|ccd|starbucks|chaayos|barista)\b/.test(n)) return 'cafe'
  if (placeCategory === 'qsr' || /\b(burger|pizza|shawarma|biryani|momo|kfc|mcdonald|domino)\b/.test(n)) return 'qsr'
  if (/\brestaurant\b|\b(dining|fine dining)\b/.test(n) || placeCategory === 'restaurant') return 'restaurant'
  if (/\b(bar|pub|brew)\b/.test(n)) return 'bar'
  if (/\b(bakery|dessert|sweet|cake|ice cream)\b/.test(n)) return 'bakery'
  if (/\b(store|shop|retail|clothing|fashion|electronics)\b/.test(n)) return 'retail'
  return 'other'
}

function isBranded(name: string): boolean {
  const n = name.toLowerCase()
  return POPULAR_BRAND_PATTERNS.some((p) => n.includes(p)) || /\b(lenskart|titan eye|specsmakers)\b/.test(n)
}

export interface RetailMixItem {
  category: string
  branded: number
  nonBranded: number
  total: number
}

/** Retail mix from competitor POIs: category counts, branded vs non-branded. */
export function computeRetailMix(
  competitors: Array<{
    name: string
    placeCategory?: string
    brandType?: 'popular' | 'new'
    userRatingsTotal?: number
  }>
): RetailMixItem[] {
  const byCat: Record<string, { branded: number; nonBranded: number }> = {}
  for (const c of competitors) {
    const cat = categorizePlace(c.name, c.placeCategory)
    if (!byCat[cat]) byCat[cat] = { branded: 0, nonBranded: 0 }
    const ur = c.userRatingsTotal ?? 0
    const chain = c.brandType === 'popular' || isBranded(c.name) || ur >= 200
    if (chain) byCat[cat].branded++
    else byCat[cat].nonBranded++
  }
  return Object.entries(byCat)
    .filter(([, v]) => v.branded + v.nonBranded > 0)
    .map(([category, v]) => ({
      category,
      branded: v.branded,
      nonBranded: v.nonBranded,
      total: v.branded + v.nonBranded,
    }))
    .sort((a, b) => b.total - a.total)
}

/** Market potential score 0–100 from saturation, demographics, accessibility. */
export function computeMarketPotentialScore(params: {
  saturationIndex: number
  whitespaceScore: number
  demandGapScore: number
  transitScore: number
  demographicStrength: number
  revenueProjection: number
  competitorCount: number
}): number {
  const {
    saturationIndex,
    whitespaceScore,
    demandGapScore,
    transitScore,
    demographicStrength,
    revenueProjection,
    competitorCount,
  } = params
  let score = 0
  score += Math.max(0, 100 - saturationIndex) * 0.25
  score += Math.min(100, whitespaceScore) * 0.2
  score += Math.min(100, demandGapScore) * 0.2
  score += Math.min(100, transitScore) * 0.15
  score += Math.min(100, demographicStrength) * 0.1
  if (revenueProjection > 0) score += Math.min(20, Math.log10(revenueProjection / 1000) * 5) * 0.05
  if (competitorCount <= 3) score += 5
  else if (competitorCount <= 6) score += 2
  return Math.round(Math.min(100, Math.max(0, score)))
}

/** Find similar markets (areas with similar profile). Simple distance + area key match. */
export function findSimilarMarkets(
  lat: number,
  lng: number,
  limit = 5
): Array<{ area: string; score: number; distanceM: number }> {
  const point = { lat, lng }
  const scored = BANGALORE_AREAS.map((a) => ({
    area: a.key,
    distanceM: Math.round(haversineMeters(point, { lat: a.lat, lng: a.lng })),
  }))
    .filter((a) => a.distanceM > 500)
    .map((a) => ({
      ...a,
      score: Math.round(100 - Math.min(100, (a.distanceM / 8000) * 30)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
  return scored
}

/** Extract brand key from place name for grouping same-brand outlets. */
function extractBrandKey(name: string): string | null {
  const n = name.toLowerCase()
  for (const p of POPULAR_BRAND_PATTERNS) {
    if (n.includes(p.toLowerCase())) return p
  }
  return null
}

const TOKEN_STOP = new Set([
  'the', 'near', 'opp', 'opposite', 'store', 'shop', 'and', 'at', 'in', 'no', 'road', 'main', 'cross', 'layout', 'block',
])

/** First significant word — groups "Lenskart - Whitefield" + "Lenskart Brookefield". */
function tokenClusterKey(name: string): string | null {
  const parts = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !TOKEN_STOP.has(w))
  if (parts.length === 0) return null
  return parts[0]
}

/** Distance-based cannibalisation %: <500m High, 500–1k Medium, 1–2k Low, >2k Minimal */
function distanceToCannibalisationPct(distanceM: number): number {
  if (distanceM < 500) return Math.round(75 - (distanceM / 500) * 25)
  if (distanceM < 1000) return Math.round(50 - ((distanceM - 500) / 500) * 20)
  if (distanceM < 2000) return Math.round(30 - ((distanceM - 1000) / 1000) * 20)
  return Math.max(5, Math.round(10 - (distanceM - 2000) / 1000))
}

export interface CannibalisationRiskItem {
  brand: string
  outletCount: number
  nearestSameBrandDistanceM: number
  cannibalisationPct: number
}

/** Cannibalisation proxy: known chains + first-token clusters + category crowding. */
export function computeCannibalisationRisk(
  competitors: Array<{ name: string; lat: number; lng: number; distanceMeters: number }>,
  categoryLabel = 'Same category'
): CannibalisationRiskItem[] {
  const result: CannibalisationRiskItem[] = []
  const usedDisplay = new Set<string>()

  const byBrand = new Map<string, Array<{ name: string; lat: number; lng: number }>>()
  for (const c of competitors) {
    const brand = extractBrandKey(c.name)
    if (!brand) continue
    if (!byBrand.has(brand)) byBrand.set(brand, [])
    byBrand.get(brand)!.push({ name: c.name, lat: c.lat, lng: c.lng })
  }
  for (const [brand, outlets] of byBrand) {
    if (outlets.length < 2) continue
    let minDist = Infinity
    for (let i = 0; i < outlets.length; i++) {
      for (let j = i + 1; j < outlets.length; j++) {
        const d = haversineMeters(outlets[i], outlets[j])
        if (d < minDist) minDist = d
      }
    }
    if (!Number.isFinite(minDist)) continue
    const display = brand.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    usedDisplay.add(display.toLowerCase())
    result.push({
      brand: display,
      outletCount: outlets.length,
      nearestSameBrandDistanceM: Math.round(minDist),
      cannibalisationPct: distanceToCannibalisationPct(minDist),
    })
  }

  const byToken = new Map<string, Array<{ name: string; lat: number; lng: number }>>()
  for (const c of competitors) {
    const token = tokenClusterKey(c.name)
    if (!token || token.length < 3) continue
    if (extractBrandKey(c.name)) continue
    if (!byToken.has(token)) byToken.set(token, [])
    byToken.get(token)!.push({ name: c.name, lat: c.lat, lng: c.lng })
  }
  for (const [token, outlets] of byToken) {
    if (outlets.length < 2) continue
    let minDist = Infinity
    for (let i = 0; i < outlets.length; i++) {
      for (let j = i + 1; j < outlets.length; j++) {
        const d = haversineMeters(outlets[i], outlets[j])
        if (d < minDist) minDist = d
      }
    }
    if (!Number.isFinite(minDist) || minDist > 2000) continue
    const display = token.charAt(0).toUpperCase() + token.slice(1)
    if (usedDisplay.has(display.toLowerCase())) continue
    usedDisplay.add(display.toLowerCase())
    result.push({
      brand: `${display} (${outlets.length} outlets)`,
      outletCount: outlets.length,
      nearestSameBrandDistanceM: Math.round(minDist),
      cannibalisationPct: distanceToCannibalisationPct(minDist),
    })
  }

  const inCatchment = competitors.filter((c) => c.distanceMeters <= 1200)
  if (inCatchment.length >= 4 && result.length === 0) {
    result.push({
      brand: `${categoryLabel} crowding`,
      outletCount: inCatchment.length,
      nearestSameBrandDistanceM: 400,
      cannibalisationPct: Math.min(78, 35 + inCatchment.length * 5),
    })
  }

  return result.sort((a, b) => b.cannibalisationPct - a.cannibalisationPct)
}
