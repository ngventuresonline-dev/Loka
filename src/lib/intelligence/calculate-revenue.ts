import { getIndiaCategoryProfile } from '@/lib/location-intelligence/india-benchmarks'
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

export type PropertyRoadType =
  | 'main_road'
  | 'cross_road'
  | 'lane'
  | 'highway'
  | 'unknown'
  | 'main_arterial'
  | 'high_street'

export type PropertyLocationProfile = {
  roadType: PropertyRoadType
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

  /** Commercial pocket row (bangalore_commercial_pockets) — revenue V3 */
  pocketAvgDailyFootfall?: number | null
  pocketRevenueMultiplier?: number | null
  /** Typical ground-floor commercial rent (₹/sqft/mo) from pocket when available */
  pocketRentTypical?: number | null
  pocketTier?: number | null
  pocketName?: string | null
  officeDemandPct?: number | null
  residentialDemandPct?: number | null
  officeLunchCaptureFromPocket?: number | null
}

export type RevenueCalculationInput = {
  latitude: number
  longitude: number
  propertyType?: string
  businessType?: string
  monthlyRent?: number | null
  sizeSqft?: number | null
  /** Legacy alias (e.g. enrichment) — same as sizeSqft when sizeSqft omitted */
  propertySizeSqft?: number | null
  locationProfile: PropertyLocationProfile
}

export type RevenueBreakdown = {
  officeWorkerDemand: number
  residentialDemand: number
  roadWalkIn: number
  deliveryOrders: number
  totalAddressablePool: number
  customersPerDay: number

  formatLabel: string
  covers: number
  turnsPerDay: number
  avgTicket: number
  deliveryAvgTicket: number
  deliverySharePct: number

  roadTypeModifier: PropertyLocationProfile['roadType']
  areaKey: string
  areaMultiplier: number
  pocketName: string | null
  pocketTier: number | null
  pocketRentTypical: number | null

  monthlyDineIn: number
  monthlyDelivery: number

  saturationLevel: string
  competitorCount: number
  avgCompetitorRating: number | null
  marketValidatedDemand: boolean

  spendingPowerIndex: number | null
  affluenceAdjustment: number

  accessBonuses: string[]
  floorPenalty: string | null

  rentToRevenuePct: number | null
  rentHealthStatus: 'excellent' | 'viable' | 'stretched' | 'unviable' | null
  healthyRentToRevenuePct: number
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

function mapPocketRoadType(raw: unknown): PropertyRoadType | null {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (t === 'main_arterial' || t === 'mainarterial') return 'main_arterial'
  if (t === 'high_street' || t === 'highstreet') return 'high_street'
  if (t === 'main_road' || t === 'mainroad') return 'main_road'
  if (t === 'cross_road' || t === 'crossroad') return 'cross_road'
  if (t === 'lane' || t === 'internal_lane') return 'lane'
  if (t === 'highway' || t === 'highway_facing') return 'highway'
  return null
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
  /** Row from bangalore_commercial_pockets when resolved */
  pocket?: Record<string, unknown> | null
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
    return ['awfis', 'wework', '91spring', 'cowork', 'innov8'].some((k) => n.includes(k))
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
  const pk = params.pocket ?? null

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

  if (pk?.['fnb_saturation'] != null) {
    const ps = parseSaturation(pk['fnb_saturation'])
    if (ps) {
      cafeSat = ps
      qsrSat = ps
      restaurantSat = ps
    }
  }

  let spendingPowerIndex =
    numOrNull(li?.spending_power_index) ?? ward?.spendingPowerIndex ?? null
  if (spendingPowerIndex == null && params.spendingPowerIndexFallback != null) {
    const f = params.spendingPowerIndexFallback
    if (Number.isFinite(f)) spendingPowerIndex = f
  }
  if (pk?.['spending_power_index'] != null) {
    const pspi = numOrNull(pk['spending_power_index'])
    if (pspi != null) spendingPowerIndex = pspi
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
  else {
    const pocketRoad = mapPocketRoadType(pk?.['road_type'])
    if (pocketRoad) roadType = pocketRoad
  }

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
      : pk?.['nearby_residential']
        ? (() => {
            const units = Number(pk['total_apartment_units'] ?? 0)
            return units > 0 ? units : residentialUnitsWithin1km
          })()
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
    roadType === 'highway' ||
    roadType === 'main_arterial'

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

    pocketAvgDailyFootfall: pk?.['avg_daily_footfall'] != null ? numOrNull(pk['avg_daily_footfall']) : null,
    pocketRevenueMultiplier: pk?.['revenue_multiplier'] != null ? numOrNull(pk['revenue_multiplier']) : null,
    pocketRentTypical: pk?.['rent_gf_typical'] != null ? numOrNull(pk['rent_gf_typical']) : null,
    pocketTier: pk?.['tier'] != null ? numOrNull(pk['tier']) : null,
    pocketName: pk?.['name'] != null ? String(pk['name']) : null,
    officeDemandPct: pk?.['office_demand_pct'] != null ? numOrNull(pk['office_demand_pct']) : null,
    residentialDemandPct: pk?.['residential_demand_pct'] != null ? numOrNull(pk['residential_demand_pct']) : null,
    officeLunchCaptureFromPocket:
      pk?.['office_lunch_capture_rate'] != null ? numOrNull(pk['office_lunch_capture_rate']) : null,
  }
}

export function calculateRevenueFromBenchmarks(input: RevenueCalculationInput): RevenueCalculationOutput {
  const {
    latitude,
    longitude,
    propertyType,
    businessType,
    monthlyRent,
    sizeSqft: sizeSqftIn,
    propertySizeSqft,
    locationProfile: lp,
  } = input

  const profile = getIndiaCategoryProfile(propertyType ?? '', businessType)
  const areaKey = getNearestAreaKey(latitude, longitude)
  const areaMultiplier = getAreaMultiplier(areaKey)

  const bt = `${businessType ?? ''} ${propertyType ?? ''}`.toLowerCase()

  const format = (() => {
    if (/darshini|south indian|udupi|filter coffee|idli|dosa|brahmin|tiffin/.test(bt))
      return {
        label: 'South Indian / Darshini',
        seatingDensityPerSqft: 0.067,
        turnsPerDay: 11,
        avgTicket: 110,
        deliverySharePct: 0.08,
        deliveryAvgTicket: 150,
        deliveryOrdersPerCover: 0.3,
        weekendMultiplier: 1.15,
        operatingCostPct: 0.52,
        conservativePct: 0.5,
        optimisticPct: 1.38,
        healthyRentPct: 15,
      }
    if (/brewery|taproom|bar|pub|beer|craft beer|brew/.test(bt))
      return {
        label: 'Bar / Brewery',
        seatingDensityPerSqft: 0.04,
        turnsPerDay: 2.5,
        avgTicket: 900,
        deliverySharePct: 0.05,
        deliveryAvgTicket: 1200,
        deliveryOrdersPerCover: 0.05,
        weekendMultiplier: 2.0,
        operatingCostPct: 0.62,
        conservativePct: 0.4,
        optimisticPct: 1.35,
        healthyRentPct: 12,
      }
    if (/fine dining|premium restaurant|signature|upscale|bistro/.test(bt))
      return {
        label: 'Fine Dining',
        seatingDensityPerSqft: 0.028,
        turnsPerDay: 2.0,
        avgTicket: 1800,
        deliverySharePct: 0.04,
        deliveryAvgTicket: 2200,
        deliveryOrdersPerCover: 0.05,
        weekendMultiplier: 1.6,
        operatingCostPct: 0.65,
        conservativePct: 0.42,
        optimisticPct: 1.22,
        healthyRentPct: 10,
      }
    if (/cloud kitchen|dark kitchen|ghost kitchen/.test(bt))
      return {
        label: 'Cloud Kitchen',
        seatingDensityPerSqft: 0,
        turnsPerDay: 0,
        avgTicket: 0,
        deliverySharePct: 1.0,
        deliveryAvgTicket: 350,
        deliveryOrdersPerCover: 0,
        weekendMultiplier: 1.2,
        operatingCostPct: 0.55,
        conservativePct: 0.45,
        optimisticPct: 1.35,
        healthyRentPct: 15,
      }
    if (/bakery|dessert|ice cream|waffle|donut|patisserie|mithai|sweet/.test(bt))
      return {
        label: 'Bakery / Dessert',
        seatingDensityPerSqft: 0.035,
        turnsPerDay: 5.5,
        avgTicket: 220,
        deliverySharePct: 0.25,
        deliveryAvgTicket: 280,
        deliveryOrdersPerCover: 0.4,
        weekendMultiplier: 1.55,
        operatingCostPct: 0.56,
        conservativePct: 0.5,
        optimisticPct: 1.3,
        healthyRentPct: 15,
      }
    if (/qsr|quick service|burger|fried chicken|pizza|wrap|sandwich|fast food|momo|shawarma|biryani/.test(bt))
      return {
        label: 'QSR / Fast Casual',
        seatingDensityPerSqft: 0.048,
        turnsPerDay: 6.5,
        avgTicket: 380,
        deliverySharePct: 0.45,
        deliveryAvgTicket: 420,
        deliveryOrdersPerCover: 0.9,
        weekendMultiplier: 1.35,
        operatingCostPct: 0.58,
        conservativePct: 0.5,
        optimisticPct: 1.3,
        healthyRentPct: 15,
      }
    if (/premium cafe|artisan|specialty coffee|third wave|pour over/.test(bt))
      return {
        label: 'Premium Café',
        seatingDensityPerSqft: 0.033,
        turnsPerDay: 4.0,
        avgTicket: 420,
        deliverySharePct: 0.1,
        deliveryAvgTicket: 480,
        deliveryOrdersPerCover: 0.2,
        weekendMultiplier: 1.45,
        operatingCostPct: 0.6,
        conservativePct: 0.45,
        optimisticPct: 1.25,
        healthyRentPct: 15,
      }
    if (/cafe|coffee|chai|beverage/.test(bt))
      return {
        label: 'Café / Coffee',
        seatingDensityPerSqft: 0.04,
        turnsPerDay: 5.0,
        avgTicket: 280,
        deliverySharePct: 0.18,
        deliveryAvgTicket: 320,
        deliveryOrdersPerCover: 0.35,
        weekendMultiplier: 1.4,
        operatingCostPct: 0.6,
        conservativePct: 0.5,
        optimisticPct: 1.25,
        healthyRentPct: 15,
      }
    return {
      label: 'Casual Dining / Restaurant',
      seatingDensityPerSqft: 0.038,
      turnsPerDay: 3.5,
      avgTicket: 600,
      deliverySharePct: 0.25,
      deliveryAvgTicket: 700,
      deliveryOrdersPerCover: 0.4,
      weekendMultiplier: 1.5,
      operatingCostPct: 0.6,
      conservativePct: 0.48,
      optimisticPct: 1.28,
      healthyRentPct: 15,
    }
  })()

  const effectiveSqft = Math.max(100, sizeSqftIn ?? propertySizeSqft ?? 500)
  const covers =
    format.seatingDensityPerSqft > 0
      ? Math.max(8, Math.floor(effectiveSqft * format.seatingDensityPerSqft))
      : 0

  const officeWorkers =
    lp.totalOfficeEmployees ?? (lp.officesWithin500m * 200 + lp.coworkingSpacesWithin500m * 80)
  const officeLunchShare = profile.officeLunchShare ?? 0.12
  const formatOfficeBias = /qsr|cafe|coffee|darshini|bakery/.test(format.label.toLowerCase())
    ? 1.2
    : 0.85
  const officeDemandPerDay = officeWorkers * officeLunchShare * formatOfficeBias

  const residentialUnits = lp.totalApartmentUnits ?? lp.residentialUnitsWithin1km * 1.5
  const diningFrequency = (lp.diningOutWeekly ?? 3.5) / 7
  const householdSize = 2.8
  const residentialShare = profile.residentialShare ?? 0.04
  const residentialDemandPerDay = residentialUnits * householdSize * diningFrequency * residentialShare

  const roadWalkInBase = 500
  const roadWalkIn = (() => {
    if (lp.adminDailyFootfallEstimate && lp.adminDailyFootfallEstimate > 0) {
      return lp.adminDailyFootfallEstimate
    }
    if (lp.roadType === 'main_road' || lp.roadType === 'highway' || lp.roadType === 'main_arterial') {
      return roadWalkInBase * 3.2
    }
    if (lp.roadType === 'high_street') return roadWalkInBase * 2.5
    if (lp.roadType === 'cross_road') return roadWalkInBase * 1.4
    if (lp.roadType === 'lane') return roadWalkInBase * 0.6
    return roadWalkInBase * 1.0
  })()

  const officeIntensity = lp.totalOfficeEmployees ?? lp.officesWithin500m * 200
  const deliveryDemandMultiplier =
    officeIntensity > 5000 ? 1.4 : officeIntensity > 2000 ? 1.25 : officeIntensity > 500 ? 1.1 : 1.0
  const deliveryOrders =
    covers > 0
      ? covers * format.deliveryOrdersPerCover * deliveryDemandMultiplier
      : effectiveSqft * 0.15

  const totalAddressablePool = officeDemandPerDay + residentialDemandPerDay + roadWalkIn

  let captureRate = profile.captureRate / 100

  if (lp.isCornerUnit) captureRate *= 1.18
  if (lp.isStreetFacing) captureRate *= 1.1
  if (lp.hasParking) captureRate *= 1.12
  if (lp.hasSignalNearby) captureRate *= 1.06
  if (lp.floor === 'ground') captureRate *= 1.0
  else if (lp.floor === 'basement') captureRate *= 0.75
  else if (lp.floor === 'upper') captureRate *= 0.65
  if (lp.frontageMeters != null) {
    if (lp.frontageMeters >= 20) captureRate *= 1.08
    else if (lp.frontageMeters <= 8) captureRate *= 0.92
  }

  if (lp.collegesWithin500m >= 1) captureRate *= 1.05
  if (lp.gymsClinicsWithin300m >= 2) captureRate *= 1.04

  const spi = lp.spendingPowerIndex
  const affluenceAdjustment =
    spi != null ? Math.max(0.82, Math.min(1.25, 0.75 + spi / 400)) : 1.0
  const effectiveAvgTicket = format.avgTicket * affluenceAdjustment
  const effectiveDeliveryTicket = format.deliveryAvgTicket * affluenceAdjustment

  const satKey = (() => {
    const fl = format.label.toLowerCase()
    if (/cafe|coffee/.test(fl)) return lp.cafeSaturation
    if (/qsr|fast|darshini|south indian/.test(fl)) return lp.qsrSaturation
    return lp.restaurantSaturation
  })()

  const saturationDiscount =
    satKey === 'saturated' ? 0.68 : satKey === 'high' ? 0.8 : satKey === 'medium' ? 0.9 : satKey === 'low' ? 1.1 : 0.88

  const avgRating = lp.avgCompetitorRating
  const marketValidation =
    avgRating != null
      ? avgRating >= 4.3
        ? 1.1
        : avgRating >= 4.0
          ? 1.03
          : avgRating >= 3.6
            ? 0.95
            : 0.88
      : 1.0
  const marketValidatedDemand =
    (avgRating ?? 0) >= 4.0 && (lp.totalCompetitorReviews ?? 0) > 500

  const capturedDemandPerDay =
    totalAddressablePool * captureRate * saturationDiscount * marketValidation

  const effectiveTurns =
    covers > 0
      ? Math.min(format.turnsPerDay, capturedDemandPerDay / covers)
      : format.turnsPerDay

  const dineInCustomersPerDay =
    covers > 0 ? Math.min(capturedDemandPerDay, covers * format.turnsPerDay) : 0
  const dineInRevenuePerDay = dineInCustomersPerDay * effectiveAvgTicket

  const officeHeavy = officeDemandPerDay > residentialDemandPerDay
  const weekendDineInRevenue =
    dineInRevenuePerDay * format.weekendMultiplier * (officeHeavy ? 0.65 : 1.0)

  const monthlyDineIn = dineInRevenuePerDay * 22 + weekendDineInRevenue * 8

  const monthlyDelivery = deliveryOrders * effectiveDeliveryTicket * 30

  const monthlyBeforeArea = monthlyDineIn + monthlyDelivery

  const monthlyRevenue = monthlyBeforeArea * areaMultiplier

  const conservative = Math.round(monthlyRevenue * format.conservativePct)
  const base = Math.round(monthlyRevenue * 0.8)
  const optimistic = Math.round(monthlyRevenue * format.optimisticPct)

  const fitoutCost = monthlyRent ? monthlyRent * 8 : Math.max(500000, base * 0.65)
  const netMonthlyProfit = base * (1 - format.operatingCostPct) - (monthlyRent ?? 0)
  const breakEvenMonths =
    netMonthlyProfit > 0 ? Math.max(1, Math.round(fitoutCost / netMonthlyProfit)) : null

  const rentToRevenuePct =
    monthlyRent && base > 0 ? Math.round((monthlyRent / base) * 100) : null
  const rentHealthStatus =
    rentToRevenuePct == null
      ? null
      : rentToRevenuePct <= format.healthyRentPct
        ? 'excellent'
        : rentToRevenuePct <= format.healthyRentPct + 8
          ? 'viable'
          : rentToRevenuePct <= format.healthyRentPct + 20
            ? 'stretched'
            : 'unviable'

  const breakdown: RevenueBreakdown = {
    officeWorkerDemand: Math.round(officeDemandPerDay),
    residentialDemand: Math.round(residentialDemandPerDay),
    roadWalkIn: Math.round(roadWalkIn),
    deliveryOrders: Math.round(deliveryOrders),
    totalAddressablePool: Math.round(totalAddressablePool),
    customersPerDay: Math.round(dineInCustomersPerDay),

    formatLabel: format.label,
    covers,
    turnsPerDay: covers > 0 ? Math.round(effectiveTurns * 10) / 10 : 0,
    avgTicket: Math.round(effectiveAvgTicket),
    deliveryAvgTicket: Math.round(effectiveDeliveryTicket),
    deliverySharePct: format.deliverySharePct,

    roadTypeModifier: lp.roadType,
    areaKey: areaKey ?? 'Bangalore',
    areaMultiplier,
    pocketName: null,
    pocketTier: null,
    pocketRentTypical: null,

    monthlyDineIn: Math.round(monthlyDineIn),
    monthlyDelivery: Math.round(monthlyDelivery),

    saturationLevel: satKey ?? 'unknown',
    competitorCount: lp.directCompetitorCount,
    avgCompetitorRating: lp.avgCompetitorRating,
    marketValidatedDemand,

    spendingPowerIndex: lp.spendingPowerIndex,
    affluenceAdjustment: Math.round(affluenceAdjustment * 100) / 100,

    accessBonuses: [
      lp.isCornerUnit && 'Corner unit +18%',
      lp.hasParking && 'Parking +12%',
      lp.isStreetFacing && 'Street facing +10%',
      lp.hasSignalNearby && 'Signal nearby +6%',
      lp.collegesWithin500m >= 1 && 'College footfall',
      lp.gymsClinicsWithin300m >= 2 && 'Gym/clinic catchment',
    ].filter(Boolean) as string[],
    floorPenalty:
      lp.floor === 'basement'
        ? 'Basement −25% capture'
        : lp.floor === 'upper'
          ? 'Upper floor −35% capture'
          : null,

    rentToRevenuePct,
    rentHealthStatus,
    healthyRentToRevenuePct: format.healthyRentPct,
  }

  return {
    dailyFootfall: Math.round(totalAddressablePool),
    weekendBoostPercent: Math.round((format.weekendMultiplier - 1) * 100),
    monthlyRevenueLow: conservative,
    monthlyRevenueHigh: optimistic,
    monthlyRevenueMid: base,
    breakEvenMonths,
    captureRatePercent: Math.round(captureRate * 100 * 10) / 10,
    avgTicket: Math.round(effectiveAvgTicket),
    healthyRentToRevenuePct: format.healthyRentPct,
    breakdown,
  }
}
