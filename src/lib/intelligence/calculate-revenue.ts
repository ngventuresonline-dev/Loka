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

/** Admin / site-visit inputs (DB columns) merged over inferred signals. */
export type SiteVisitPropertyFields = {
  roadTypeConfirmed?: string | null
  isCornerUnit?: boolean | null
  frontageWidthFt?: number | null
  nearbyOfficesCount?: number | null
  nearbyCoworkingCount?: number | null
  nearbyResidentialUnits?: number | null
  nearbyCollegesCount?: number | null
  nearbyGymsClinics?: number | null
  floorLevel?: string | null
  hasSignalNearby?: boolean | null
  dailyFootfallEstimate?: number | null
}

export type PropertyLocationProfile = {
  roadType: 'main_road' | 'cross_road' | 'lane' | 'highway' | 'unknown'
  isCornerUnit: boolean
  hasParking: boolean
  isStreetFacing: boolean
  floor: 'ground' | 'basement' | 'upper' | 'unknown'
  frontageMeters: number | null

  /** Traffic signal within ~100m — slight impulse / visibility lift for walk-in pool. */
  hasSignalNearby: boolean
  /** Site-visit daily footfall estimate; floors modelled addressable pool when set. */
  adminDailyFootfallEstimate: number | null

  officesWithin500m: number
  coworkingSpacesWithin500m: number
  residentialUnitsWithin1km: number
  gymsClinicsWithin300m: number
  collegesWithin500m: number

  totalOfficeEmployees: number | null
  totalApartmentUnits: number | null
  diningOutWeekly: number | null
  spendingPowerIndex: number | null
  cafeSaturation: 'low' | 'medium' | 'high' | 'saturated' | null
  qsrSaturation: 'low' | 'medium' | 'high' | 'saturated' | null
  restaurantSaturation: 'low' | 'medium' | 'high' | 'saturated' | null

  directCompetitorCount: number
  avgCompetitorRating: number | null
  totalCompetitorReviews: number | null

  metroDistanceM: number | null
  busStops: number
}

export type RevenueCalculationInput = {
  latitude: number
  longitude: number
  propertyType?: string
  businessType?: string
  monthlyRent?: number | null
  locationProfile: PropertyLocationProfile
}

export type RevenueBreakdown = {
  officeWorkerDemand: number
  residentialDemand: number
  roadWalkIn: number
  totalAddressablePool: number
  customersPerDay: number
  avgTicket: number
  roadTypeModifier: PropertyLocationProfile['roadType']
  saturationLevel: string
  accessBonuses: string[]
}

export type RevenueCalculationOutput = {
  dailyFootfall: number
  weekendBoostPercent: number
  monthlyRevenueLow: number
  monthlyRevenueHigh: number
  monthlyRevenueMid: number
  breakEvenMonths: number | null
  captureRatePercent: number
  avgTicket: number
  healthyRentToRevenuePct: number
  breakdown: RevenueBreakdown
}

function normalizeAmenityTags(amenities: unknown): string[] {
  if (Array.isArray(amenities)) return amenities.map((a) => String(a).toLowerCase())
  if (
    amenities &&
    typeof amenities === 'object' &&
    Array.isArray((amenities as { features?: unknown }).features)
  ) {
    return ((amenities as { features: unknown[] }).features).map((a) => String(a).toLowerCase())
  }
  return []
}

function parseSaturation(v: unknown): 'low' | 'medium' | 'high' | 'saturated' | null {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
  if (s === 'low' || s === 'medium' || s === 'high' || s === 'saturated') return s
  return null
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export function inferSaturationFromCompetitorCount(
  count: number,
): 'low' | 'medium' | 'high' | 'saturated' {
  if (count <= 2) return 'low'
  if (count <= 5) return 'medium'
  if (count <= 10) return 'high'
  return 'saturated'
}

function mapSiteVisitRoadType(raw: string | null | undefined): PropertyLocationProfile['roadType'] | null {
  const t = (raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (t === 'main_road' || t === 'mainroad') return 'main_road'
  if (t === 'cross_road' || t === 'crossroad') return 'cross_road'
  if (t === 'lane' || t === 'internal_lane') return 'lane'
  if (t === 'highway' || t === 'highway_facing') return 'highway'
  if (raw && /main/i.test(raw) && /road/i.test(raw)) return 'main_road'
  if (raw && /cross/i.test(raw)) return 'cross_road'
  if (raw && /highway/i.test(raw)) return 'highway'
  if (raw && /lane|internal/i.test(raw)) return 'lane'
  return null
}

function mapSiteVisitFloor(raw: string | null | undefined): PropertyLocationProfile['floor'] | null {
  const t = (raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (!t || t === 'ground') return 'ground'
  if (t === 'basement') return 'basement'
  if (
    t === 'first_floor' ||
    t === '1st_floor' ||
    t === '1st' ||
    t.includes('first') ||
    t === 'upper' ||
    t === '2nd_floor_plus' ||
    t.includes('2nd') ||
    t.includes('upper')
  ) {
    return 'upper'
  }
  return null
}

/**
 * Shared construction for enrichment + brand dashboard from landmarks, DB rows, and listing amenities.
 */
export function buildRevenueLocationProfile(params: {
  amenities: unknown
  landmarks: Array<{ name: string; kind: string; distance?: number; distanceMeters?: number }>
  directCompetitorCount: number
  rawCompetitors: Array<{ rating?: number; reviewCount?: number }>
  metroDistanceM: number | null
  busStops: number
  localityIntel?: Record<string, unknown> | null
  ward?: { diningOutPerWeek?: number | null; spendingPowerIndex?: number | null } | null
  /** When DB saturation columns are empty, infer from nearby competitor count (dashboard / lean paths). */
  competitorCountForSaturationFallback?: number | null
  /** When ward + locality SPI missing (e.g. brand dashboard), use affluence proxy 0–100. */
  spendingPowerIndexFallback?: number | null
  /** Admin site-visit fields — override inferred amenities / landmark proxies. */
  siteVisit?: SiteVisitPropertyFields | null
}): PropertyLocationProfile {
  const amenityTags = normalizeAmenityTags(params.amenities)
  const landmarks = params.landmarks.map((l) => ({
    name: l.name,
    kind: String(l.kind || ''),
    d: Number(l.distance ?? l.distanceMeters ?? 999999),
  }))

  const within = (d: number, max: number) => d <= max
  const lm500 = landmarks.filter((l) => within(l.d, 500))
  const lm1000 = landmarks.filter((l) => within(l.d, 1000))
  const lm300 = landmarks.filter((l) => within(l.d, 300))

  const officesWithin500m = lm500.filter(
    (l) => l.kind === 'corporate' || l.kind === 'tech_park',
  ).length
  const coworkingSpacesWithin500m = lm500.filter((l) => {
    const n = (l.name || '').toLowerCase()
    return (
      n.includes('cowork') ||
      n.includes('awfis') ||
      n.includes('wework') ||
      n.includes('91spring')
    )
  }).length
  const residentialUnitsWithin1km = lm1000.filter((l) => l.kind === 'residential').length * 150

  const gymsClinicsWithin300m = lm300.filter((l) => {
    const n = (l.name || '').toLowerCase()
    return (
      l.kind === 'gym' ||
      n.includes('gym') ||
      n.includes('clinic') ||
      n.includes('hospital') ||
      n.includes('fitness')
    )
  }).length

  const collegesWithin500m = lm500.filter((l) => l.kind === 'college').length

  const li = params.localityIntel || null
  const ward = params.ward || null

  let cafeSat = parseSaturation(li?.cafe_saturation)
  let qsrSat = parseSaturation(li?.qsr_saturation)
  let restaurantSat = parseSaturation(li?.restaurant_saturation)
  if (
    cafeSat == null &&
    qsrSat == null &&
    restaurantSat == null &&
    params.competitorCountForSaturationFallback != null &&
    Number.isFinite(params.competitorCountForSaturationFallback)
  ) {
    const s = inferSaturationFromCompetitorCount(
      Math.max(0, Math.round(params.competitorCountForSaturationFallback)),
    )
    cafeSat = s
    qsrSat = s
    restaurantSat = s
  }

  let spendingPowerIndex =
    numOrNull(li?.spending_power_index) ?? ward?.spendingPowerIndex ?? null
  if (spendingPowerIndex == null && params.spendingPowerIndexFallback != null) {
    const f = params.spendingPowerIndexFallback
    if (Number.isFinite(f)) spendingPowerIndex = f
  }

  let roadType: PropertyLocationProfile['roadType'] =
    amenityTags.some((t) => t.includes('highway') || t.includes('high way'))
      ? 'highway'
      : amenityTags.some((t) => t.includes('main road') || t.includes('main road facing'))
        ? 'main_road'
        : amenityTags.some((t) => t.includes('cross road') || t === 'cross')
          ? 'cross_road'
          : amenityTags.some((t) => t.includes('lane') || t.includes('internal'))
            ? 'lane'
            : 'unknown'

  let floor: PropertyLocationProfile['floor'] = amenityTags.some((t) => t.includes('ground floor'))
    ? 'ground'
    : amenityTags.some((t) => t.includes('basement'))
      ? 'basement'
      : amenityTags.some((t) => t.includes('floor') && !t.includes('ground'))
        ? 'upper'
        : 'unknown'

  const sv = params.siteVisit
  const confirmedRoad = sv ? mapSiteVisitRoadType(sv.roadTypeConfirmed) : null
  if (confirmedRoad) roadType = confirmedRoad

  const confirmedFloor = sv ? mapSiteVisitFloor(sv.floorLevel) : null
  if (confirmedFloor) floor = confirmedFloor

  let isCornerUnit = amenityTags.some((t) => t.includes('corner unit') || t.includes('corner'))
  if (sv?.isCornerUnit === true) isCornerUnit = true
  if (sv?.isCornerUnit === false) isCornerUnit = false

  let frontageMeters: number | null = null
  if (sv?.frontageWidthFt != null && Number.isFinite(sv.frontageWidthFt) && sv.frontageWidthFt > 0) {
    frontageMeters = sv.frontageWidthFt * 0.3048
  }

  const officesFinal =
    sv?.nearbyOfficesCount != null && Number.isFinite(sv.nearbyOfficesCount)
      ? Math.max(0, Math.round(sv.nearbyOfficesCount))
      : officesWithin500m
  const coworkFinal =
    sv?.nearbyCoworkingCount != null && Number.isFinite(sv.nearbyCoworkingCount)
      ? Math.max(0, Math.round(sv.nearbyCoworkingCount))
      : coworkingSpacesWithin500m
  const residentialFinal =
    sv?.nearbyResidentialUnits != null && Number.isFinite(sv.nearbyResidentialUnits)
      ? Math.max(0, Math.round(sv.nearbyResidentialUnits))
      : residentialUnitsWithin1km
  const collegesFinal =
    sv?.nearbyCollegesCount != null && Number.isFinite(sv.nearbyCollegesCount)
      ? Math.max(0, Math.round(sv.nearbyCollegesCount))
      : collegesWithin500m
  const gymsFinal =
    sv?.nearbyGymsClinics != null && Number.isFinite(sv.nearbyGymsClinics)
      ? Math.max(0, Math.round(sv.nearbyGymsClinics))
      : gymsClinicsWithin300m

  const hasSignalNearby = Boolean(sv?.hasSignalNearby)
  const adminDailyFootfallEstimate =
    sv?.dailyFootfallEstimate != null &&
    Number.isFinite(sv.dailyFootfallEstimate) &&
    sv.dailyFootfallEstimate > 0
      ? Math.round(sv.dailyFootfallEstimate)
      : null

  const rawComps = params.rawCompetitors
  const ratings = rawComps.map((c) => c.rating).filter((r): r is number => typeof r === 'number' && r > 0)
  const avgCompetitorRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
  const totalCompetitorReviews = rawComps.reduce((s, c) => s + (c.reviewCount ?? 0), 0)

  const isStreetFacing =
    amenityTags.some((t) => t.includes('street facing') || t.includes('main road')) ||
    roadType === 'main_road' ||
    roadType === 'highway'

  return {
    roadType,
    isCornerUnit,
    hasParking: amenityTags.some((t) => t.includes('parking')),
    isStreetFacing,
    floor,
    frontageMeters,

    hasSignalNearby,
    adminDailyFootfallEstimate,

    officesWithin500m: officesFinal,
    coworkingSpacesWithin500m: coworkFinal,
    residentialUnitsWithin1km: residentialFinal,
    gymsClinicsWithin300m: gymsFinal,
    collegesWithin500m: collegesFinal,

    totalOfficeEmployees: numOrNull(li?.total_office_employees),
    totalApartmentUnits: numOrNull(li?.total_apartment_units),
    diningOutWeekly: numOrNull(li?.dining_out_weekly) ?? ward?.diningOutPerWeek ?? null,
    spendingPowerIndex,
    cafeSaturation: cafeSat,
    qsrSaturation: qsrSat,
    restaurantSaturation: restaurantSat,

    directCompetitorCount: params.directCompetitorCount,
    avgCompetitorRating,
    totalCompetitorReviews: totalCompetitorReviews > 0 ? totalCompetitorReviews : null,

    metroDistanceM: params.metroDistanceM,
    busStops: params.busStops,
  }
}

export function calculateRevenueFromBenchmarks(input: RevenueCalculationInput): RevenueCalculationOutput {
  const { latitude, longitude, propertyType, businessType, monthlyRent, locationProfile: lp } = input

  const profile = getIndiaCategoryProfile(propertyType ?? '', businessType)
  const areaKey = getNearestAreaKey(latitude, longitude)
  const areaMultiplier = getAreaMultiplier(areaKey)

  const officeLunchShare = profile.officeLunchShare ?? 0.12
  const residentialShare = profile.residentialShare ?? 0.04

  const officeWorkers =
    lp.totalOfficeEmployees ?? (lp.officesWithin500m * 200 + lp.coworkingSpacesWithin500m * 80)
  const officeDemandPerDay = officeWorkers * officeLunchShare

  const residentialUnits = lp.totalApartmentUnits ?? lp.residentialUnitsWithin1km * 1.5
  const avgHouseholdSize = 2.8
  const diningFrequency = (lp.diningOutWeekly ?? 3.5) / 7
  const residentialDemandPerDay =
    residentialUnits * avgHouseholdSize * diningFrequency * residentialShare

  const roadWalkIn = (() => {
    const base = 500
    if (lp.roadType === 'main_road' || lp.roadType === 'highway') return base * 3.2
    if (lp.roadType === 'cross_road') return base * 1.4
    if (lp.roadType === 'lane') return base * 0.6
    return base * 1.0
  })()

  let totalAddressableDemand = officeDemandPerDay + residentialDemandPerDay + roadWalkIn
  if (lp.hasSignalNearby) totalAddressableDemand *= 1.06
  if (lp.adminDailyFootfallEstimate != null && lp.adminDailyFootfallEstimate > 0) {
    totalAddressableDemand = Math.max(totalAddressableDemand, lp.adminDailyFootfallEstimate)
  }

  let captureRate = profile.captureRate / 100

  if (lp.isCornerUnit) captureRate *= 1.18
  if (lp.isStreetFacing) captureRate *= 1.1
  if (lp.hasParking) captureRate *= 1.12
  if (lp.floor === 'ground') captureRate *= 1.0
  else if (lp.floor === 'basement') captureRate *= 0.75
  else if (lp.floor === 'upper') captureRate *= 0.65
  if (lp.frontageMeters != null && lp.frontageMeters >= 20) captureRate *= 1.08
  else if (lp.frontageMeters != null && lp.frontageMeters <= 10) captureRate *= 0.92

  if (lp.spendingPowerIndex != null) {
    if (lp.spendingPowerIndex >= 85) captureRate *= 1.15
    else if (lp.spendingPowerIndex <= 45) captureRate *= 0.88
  }

  const bt = `${businessType ?? ''} ${propertyType ?? ''}`.toLowerCase()
  const saturationKey = (() => {
    if (/\bcafe\b|\bcoffee\b/.test(bt)) return lp.cafeSaturation
    if (/\bqsr\b|\bfast food\b/.test(bt)) return lp.qsrSaturation
    return lp.restaurantSaturation
  })()

  const saturationDiscount =
    saturationKey === 'saturated'
      ? 0.7
      : saturationKey === 'high'
        ? 0.82
        : saturationKey === 'medium'
          ? 0.92
          : saturationKey === 'low'
            ? 1.08
            : 0.9

  const marketValidation = lp.avgCompetitorRating
    ? lp.avgCompetitorRating >= 4.2
      ? 1.08
      : lp.avgCompetitorRating >= 3.8
        ? 1.0
        : 0.92
    : 1.0

  const avgTicketRaw =
    profile.avgTicket * (lp.spendingPowerIndex != null ? 0.7 + lp.spendingPowerIndex / 333 : 1)
  const avgTicket = avgTicketRaw

  const customersPerDay =
    totalAddressableDemand * captureRate * saturationDiscount * marketValidation

  const weekdayRevenue = customersPerDay * avgTicket
  const weekendMultiplier =
    officeDemandPerDay > residentialDemandPerDay ? 0.85 : 1.45

  const monthlyRevenueBeforeArea =
    weekdayRevenue * 22 + weekdayRevenue * weekendMultiplier * 8
  const monthlyRevenue = monthlyRevenueBeforeArea * areaMultiplier

  const conservative = Math.round(monthlyRevenue * 0.55)
  const base = Math.round(monthlyRevenue * 0.8)
  const optimistic = Math.round(monthlyRevenue * 1.15)

  const fitoutCapex = monthlyRent ? monthlyRent * 8 : Math.max(500000, base * 0.8)
  const operatingCosts = base * 0.58
  const netMonthlyProfit = base - operatingCosts - (monthlyRent ?? 0)
  const breakEvenMonths =
    netMonthlyProfit > 0 ? Math.max(1, Math.round(fitoutCapex / netMonthlyProfit)) : null

  const isFnb = /\b(restaurant|cafe|coffee|qsr|fast food|bar|brew|bakery|dessert)\b/i.test(
    `${businessType ?? ''} ${propertyType ?? ''}`,
  )
  const healthyRentToRevenuePct = isFnb ? RENT_VIABILITY.fnbHealthyRentToRevenuePct : RENT_VIABILITY.healthyRentToRevenuePct

  const accessBonuses = [
    lp.isCornerUnit ? 'Corner unit +18%' : null,
    lp.hasParking ? 'Parking +12%' : null,
    lp.isStreetFacing ? 'Street facing +10%' : null,
    lp.hasSignalNearby ? 'Signal nearby +6% walk-in' : null,
    lp.floor === 'ground' ? 'Ground floor' : null,
    lp.floor === 'basement' ? 'Basement -25%' : null,
  ].filter(Boolean) as string[]

  const breakdown: RevenueBreakdown = {
    officeWorkerDemand: Math.round(officeDemandPerDay),
    residentialDemand: Math.round(residentialDemandPerDay),
    roadWalkIn: Math.round(roadWalkIn),
    totalAddressablePool: Math.round(totalAddressableDemand),
    customersPerDay: Math.round(customersPerDay),
    avgTicket: Math.round(avgTicket),
    roadTypeModifier: lp.roadType,
    saturationLevel: saturationKey ?? 'unknown',
    accessBonuses,
  }

  return {
    dailyFootfall: Math.round(totalAddressableDemand),
    weekendBoostPercent: Math.round((weekendMultiplier - 1) * 100),
    monthlyRevenueLow: conservative,
    monthlyRevenueHigh: optimistic,
    monthlyRevenueMid: base,
    breakEvenMonths,
    captureRatePercent: Math.round(captureRate * 100 * 10) / 10,
    avgTicket: Math.round(avgTicket),
    healthyRentToRevenuePct,
    breakdown,
  }
}
