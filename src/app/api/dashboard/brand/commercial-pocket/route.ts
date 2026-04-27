import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export type CommercialPocketData = {
  id: string
  name: string
  locality: string
  zone: string | null
  distanceM: number
  tier: number | null
  roadType: string | null
  commercialDensity: string | null
  // Footfall
  avgDailyFootfall: number
  peakFootfallWeekday: number | null
  peakFootfallWeekend: number | null
  peakHours: string | null
  footfallSource: string | null
  // Rent
  rentGfMin: number | null
  rentGfMax: number | null
  rentGfTypical: number | null
  rentUpperFloorTypical: number | null
  // Demand split
  officeDemandPct: number | null
  residentialDemandPct: number | null
  transitDemandPct: number | null
  leisureDemandPct: number | null
  // Economics
  spendingPowerIndex: number | null
  avgTicketMultiplier: number | null
  revenueMultiplier: number | null
  officeLunchCaptureRate: number | null
  residentialCaptureRate: number | null
  // F&B
  fnbSaturation: string | null
  cafeCountEstimate: number | null
  qsrCountEstimate: number | null
  restaurantCountEstimate: number | null
  retailSaturation: string | null
  // Context
  topBrandsPresent: string[]
  nearbyOfficesMajor: string[]
  nearbyResidential: string[]
  transitAccess: string | null
  parkingAvailability: string | null
  dataConfidence: string | null
}

function haversineExpr(lat: number, lng: number): string {
  return `(2 * 6371000 * asin(sqrt(sin(radians((cp.lat - ${lat}) / 2.0))^2 + cos(radians(${lat})) * cos(radians(cp.lat)) * sin(radians((cp.lng - ${lng}) / 2.0))^2)))`
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const propertyId = searchParams.get('propertyId')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const radiusM = Math.min(Number(searchParams.get('radius') || '2000'), 5000)

  if (!propertyId && (!latParam || !lngParam)) {
    return NextResponse.json({ error: 'propertyId or lat+lng required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

  let lat: number | null = latParam ? Number(latParam) : null
  let lng: number | null = lngParam ? Number(lngParam) : null

  if (propertyId && (lat == null || !Number.isFinite(lat))) {
    const rows = await prisma.$queryRaw<Array<{ lat: number; lng: number }>>`
      SELECT lat, lng FROM property_location_cache
      WHERE property_id = ${propertyId} AND lat IS NOT NULL AND lng IS NOT NULL
      LIMIT 1
    `.catch(() => [])
    if (rows[0]) { lat = Number(rows[0].lat); lng = Number(rows[0].lng) }
  }

  if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Coordinates not available' }, { status: 404 })
  }

  const distExpr = haversineExpr(lat, lng)
  const sql = `
    SELECT
      cp.id, cp.name, cp.locality, cp.zone,
      ${distExpr}::integer AS distance_m,
      cp.tier, cp.road_type, cp.commercial_density,
      cp.avg_daily_footfall, cp.peak_footfall_weekday, cp.peak_footfall_weekend, cp.peak_hours, cp.footfall_source,
      cp.rent_gf_min, cp.rent_gf_max, cp.rent_gf_typical, cp.rent_upper_floor_typical,
      cp.office_demand_pct, cp.residential_demand_pct, cp.transit_demand_pct, cp.leisure_demand_pct,
      cp.spending_power_index, cp.avg_ticket_multiplier, cp.revenue_multiplier,
      cp.office_lunch_capture_rate, cp.residential_capture_rate,
      cp.fnb_saturation, cp.cafe_count_estimate, cp.qsr_count_estimate, cp.restaurant_count_estimate,
      cp.retail_saturation, cp.top_brands_present, cp.nearby_offices_major, cp.nearby_residential,
      cp.transit_access, cp.parking_availability, cp.data_confidence
    FROM bangalore_commercial_pockets cp
    WHERE cp.lat IS NOT NULL AND cp.lng IS NOT NULL
      AND ${distExpr} <= ${radiusM}
    ORDER BY distance_m ASC
    LIMIT 3
  `

  type PocketRow = {
    id: string; name: string; locality: string; zone: string | null; distance_m: number
    tier: number | null; road_type: string | null; commercial_density: string | null
    avg_daily_footfall: number | null; peak_footfall_weekday: number | null
    peak_footfall_weekend: number | null; peak_hours: string | null; footfall_source: string | null
    rent_gf_min: number | null; rent_gf_max: number | null; rent_gf_typical: number | null
    rent_upper_floor_typical: number | null
    office_demand_pct: number | null; residential_demand_pct: number | null
    transit_demand_pct: number | null; leisure_demand_pct: number | null
    spending_power_index: number | null; avg_ticket_multiplier: string | null
    revenue_multiplier: string | null; office_lunch_capture_rate: string | null
    residential_capture_rate: string | null
    fnb_saturation: string | null; cafe_count_estimate: number | null
    qsr_count_estimate: number | null; restaurant_count_estimate: number | null
    retail_saturation: string | null; top_brands_present: string[] | null
    nearby_offices_major: string[] | null; nearby_residential: string[] | null
    transit_access: string | null; parking_availability: string | null; data_confidence: string | null
  }

  let rows: PocketRow[] = []
  try {
    rows = (await prisma.$queryRawUnsafe(sql)) as PocketRow[]
  } catch (e: unknown) {
    console.error('[commercial-pocket] query error', e)
  }

  const pockets: CommercialPocketData[] = rows.map((r) => ({
    id: r.id, name: r.name, locality: r.locality, zone: r.zone, distanceM: r.distance_m,
    tier: r.tier, roadType: r.road_type, commercialDensity: r.commercial_density,
    avgDailyFootfall: r.avg_daily_footfall ?? 0,
    peakFootfallWeekday: r.peak_footfall_weekday,
    peakFootfallWeekend: r.peak_footfall_weekend,
    peakHours: r.peak_hours, footfallSource: r.footfall_source,
    rentGfMin: r.rent_gf_min, rentGfMax: r.rent_gf_max, rentGfTypical: r.rent_gf_typical,
    rentUpperFloorTypical: r.rent_upper_floor_typical,
    officeDemandPct: r.office_demand_pct, residentialDemandPct: r.residential_demand_pct,
    transitDemandPct: r.transit_demand_pct, leisureDemandPct: r.leisure_demand_pct,
    spendingPowerIndex: r.spending_power_index,
    avgTicketMultiplier: r.avg_ticket_multiplier != null ? Number(r.avg_ticket_multiplier) : null,
    revenueMultiplier: r.revenue_multiplier != null ? Number(r.revenue_multiplier) : null,
    officeLunchCaptureRate: r.office_lunch_capture_rate != null ? Number(r.office_lunch_capture_rate) : null,
    residentialCaptureRate: r.residential_capture_rate != null ? Number(r.residential_capture_rate) : null,
    fnbSaturation: r.fnb_saturation, cafeCountEstimate: r.cafe_count_estimate,
    qsrCountEstimate: r.qsr_count_estimate, restaurantCountEstimate: r.restaurant_count_estimate,
    retailSaturation: r.retail_saturation,
    topBrandsPresent: Array.isArray(r.top_brands_present) ? r.top_brands_present : [],
    nearbyOfficesMajor: Array.isArray(r.nearby_offices_major) ? r.nearby_offices_major : [],
    nearbyResidential: Array.isArray(r.nearby_residential) ? r.nearby_residential : [],
    transitAccess: r.transit_access, parkingAvailability: r.parking_availability,
    dataConfidence: r.data_confidence,
  }))

  return NextResponse.json({ pockets, nearest: pockets[0] ?? null, propertyId, lat, lng, radiusM })
}
