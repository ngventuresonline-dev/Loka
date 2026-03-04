import { getIndiaCategoryProfile, RENT_VIABILITY } from '@/lib/location-intelligence/india-benchmarks'
import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'

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

function getNearestAreaKey(lat: number, lng: number): string | null {
  let nearest: { key: string; distM: number } | null = null
  for (const area of BANGALORE_AREAS) {
    const d = haversineDistanceMeters({ lat, lng }, { lat: area.lat, lng: area.lng })
    if (!nearest || d < nearest.distM) nearest = { key: area.key, distM: d }
  }
  return nearest && nearest.distM < 8000 ? nearest.key : null
}

function getAreaMultiplier(areaKey: string | null): number {
  if (!areaKey) return 1
  const key = areaKey.toLowerCase()
  const table: Record<string, number> = {
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
  return table[key] ?? 1
}

function getTransportBoost(params: { metroDistance: number | null; busStops: number }): number {
  const { metroDistance, busStops } = params

  let boost = 1

  if (metroDistance != null) {
    if (metroDistance <= 500) boost *= 1.15
    else if (metroDistance <= 1000) boost *= 1.08
    else if (metroDistance <= 2000) boost *= 1.03
  }

  if (busStops >= 3) boost *= 1.08
  else if (busStops >= 1) boost *= 1.04

  return boost
}

function getCompetitionAdjustment(competitorCount: number): number {
  if (competitorCount <= 2) return 1.12 // under-served market
  if (competitorCount <= 5) return 1.0
  if (competitorCount <= 10) return 0.9
  return 0.8 // heavy crowding
}

export type RevenueCalculationInput = {
  latitude: number
  longitude: number
  competitorCount: number
  metroDistance: number | null
  busStops: number
  weekendBoostPercent: number
  propertyType?: string
  businessType?: string
  monthlyRent?: number | null
}

export type RevenueCalculationOutput = {
  dailyFootfall: number
  weekendBoostPercent: number
  monthlyRevenueLow: number
  monthlyRevenueHigh: number
  breakEvenMonths: number | null
  captureRatePercent: number
  avgTicket: number
  healthyRentToRevenuePct: number
}

/**
 * Revenue model based on India benchmarks + area & transport multipliers.
 * This intentionally stays transparent and simple.
 */
export function calculateRevenueFromBenchmarks(
  input: RevenueCalculationInput,
): RevenueCalculationOutput {
  const {
    latitude,
    longitude,
    competitorCount,
    metroDistance,
    busStops,
    weekendBoostPercent,
    propertyType,
    businessType,
    monthlyRent,
  } = input

  const areaKey = getNearestAreaKey(latitude, longitude)
  const areaMultiplier = getAreaMultiplier(areaKey)

  const profile = getIndiaCategoryProfile(propertyType ?? '', businessType)

  // Area density proxy: start from baseFootfall and scale with competitor presence
  const businessDensity = profile.baseFootfall + competitorCount * profile.perCompetitor

  const transportBoost = getTransportBoost({ metroDistance, busStops })
  const competitionAdjustment = getCompetitionAdjustment(competitorCount)

  const rawFootfall = businessDensity * areaMultiplier * transportBoost
  const captureRateDecimal = profile.captureRate / 100
  const customersPerDay = rawFootfall * captureRateDecimal * competitionAdjustment

  const dailyRevenue = customersPerDay * profile.avgTicket

  const weekendBoostFactor = 1 + weekendBoostPercent / 100
  const monthlyRevenue =
    dailyRevenue * 21 + dailyRevenue * weekendBoostFactor * 9 // 21 weekdays + 9 boosted days

  const monthlyRevenueLow = Math.round(monthlyRevenue * 0.7)
  const monthlyRevenueHigh = Math.round(monthlyRevenue * 1.3)

  // Operating costs: assume 60% of revenue (typical for many F&B concepts)
  const operatingCostPct = 0.6
  const midRevenue = (monthlyRevenueLow + monthlyRevenueHigh) / 2
  const operatingCosts = midRevenue * operatingCostPct
  const effectiveRent = typeof monthlyRent === 'number' && monthlyRent > 0 ? monthlyRent : 0
  const netProfit = midRevenue - operatingCosts - effectiveRent

  let breakEvenMonths: number | null = null
  if (netProfit > 0) {
    // Assume fit-out + setup ~ 8 months of rent as a simple proxy
    const capex =
      effectiveRent > 0 ? effectiveRent * 8 : Math.max(10 * 100_000, midRevenue * 0.8) // fallback
    breakEvenMonths = Math.max(1, Math.round(capex / netProfit))
  }

  const isFnb =
    /\b(restaurant|cafe|coffee|qsr|fast food|bar|brew|bakery|dessert|sweet|ice cream)\b/i.test(
      `${businessType || ''} ${propertyType || ''}`,
    )
  const healthyPct = isFnb
    ? RENT_VIABILITY.fnbHealthyRentToRevenuePct
    : RENT_VIABILITY.healthyRentToRevenuePct

  return {
    dailyFootfall: Math.round(rawFootfall),
    weekendBoostPercent,
    monthlyRevenueLow,
    monthlyRevenueHigh,
    breakEvenMonths,
    captureRatePercent: profile.captureRate,
    avgTicket: profile.avgTicket,
    healthyRentToRevenuePct: healthyPct,
  }
}

