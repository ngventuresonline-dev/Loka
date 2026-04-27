import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export type LocalityIntelData = {
  locality: string
  zone: string | null
  distanceM: number
  // People
  daytimePop: number
  nighttimePop: number
  totalOfficeEmployees: number
  totalCompanies: number
  // F&B density
  totalRestaurants: number
  totalCafes: number
  totalQsr: number
  fAndBDensity: number
  avgDailyFootfall: number
  peakHour: string | null
  weekendMultiplier: number | null
  // Residential
  totalApartmentUnits: number
  avgRent2bhk: number | null
  avgResalePriceSqft: number | null
  // Commercial
  avgOfficRentSqft: number | null
  commercialRentGfMin: number | null
  commercialRentGfMax: number | null
  // Spend
  spendingPowerIndex: number | null
  diningOutWeekly: number | null
}

function haversineExpr(lat: number, lng: number, latCol: string, lngCol: string): string {
  return `(2 * 6371000 * asin(sqrt(sin(radians((${latCol} - ${lat}) / 2.0))^2 + cos(radians(${lat})) * cos(radians(${latCol})) * sin(radians((${lngCol} - ${lng}) / 2.0))^2)))`
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const propertyId = searchParams.get('propertyId')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')

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
    if (rows[0]) {
      lat = Number(rows[0].lat)
      lng = Number(rows[0].lng)
    }
  }

  if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Coordinates not available' }, { status: 404 })
  }

  const distExpr = haversineExpr(lat, lng, 'li.latitude', 'li.longitude')
  const sql = `
    SELECT
      li.locality, li.zone,
      ${distExpr}::integer AS distance_m,
      li.daytime_pop, li.nighttime_pop,
      li.total_office_employees, li.total_companies,
      li.total_restaurants, li.total_cafes, li.total_qsr,
      li.f_and_b_density, li.avg_daily_footfall, li.peak_hour, li.weekend_multiplier,
      li.total_apartment_units, li.avg_rent_2bhk, li.avg_resale_price_sqft,
      li.avg_office_rent_sqft, li.commercial_rent_gf_min, li.commercial_rent_gf_max,
      li.spending_power_index, li.dining_out_weekly
    FROM bangalore_locality_intel li
    WHERE li.latitude IS NOT NULL AND li.longitude IS NOT NULL
    ORDER BY distance_m ASC
    LIMIT 1
  `

  type LocalityRow = {
    locality: string; zone: string | null; distance_m: number
    daytime_pop: number | null; nighttime_pop: number | null
    total_office_employees: number | null; total_companies: number | null
    total_restaurants: number | null; total_cafes: number | null; total_qsr: number | null
    f_and_b_density: number | null; avg_daily_footfall: number | null
    peak_hour: string | null; weekend_multiplier: number | null
    total_apartment_units: number | null; avg_rent_2bhk: number | null
    avg_resale_price_sqft: number | null; avg_office_rent_sqft: number | null
    commercial_rent_gf_min: number | null; commercial_rent_gf_max: number | null
    spending_power_index: number | null; dining_out_weekly: number | null
  }

  let row: LocalityRow | null = null
  try {
    const rows = (await prisma.$queryRawUnsafe(sql)) as LocalityRow[]
    row = rows[0] ?? null
  } catch (e: unknown) {
    console.error('[locality-intel] query error', e)
  }

  if (!row) {
    return NextResponse.json({ error: 'No locality data found near this property' }, { status: 404 })
  }

  const data: LocalityIntelData = {
    locality: row.locality,
    zone: row.zone,
    distanceM: row.distance_m,
    daytimePop: row.daytime_pop ?? 0,
    nighttimePop: row.nighttime_pop ?? 0,
    totalOfficeEmployees: row.total_office_employees ?? 0,
    totalCompanies: row.total_companies ?? 0,
    totalRestaurants: row.total_restaurants ?? 0,
    totalCafes: row.total_cafes ?? 0,
    totalQsr: row.total_qsr ?? 0,
    fAndBDensity: row.f_and_b_density ?? 0,
    avgDailyFootfall: row.avg_daily_footfall ?? 0,
    peakHour: row.peak_hour,
    weekendMultiplier: row.weekend_multiplier,
    totalApartmentUnits: row.total_apartment_units ?? 0,
    avgRent2bhk: row.avg_rent_2bhk,
    avgResalePriceSqft: row.avg_resale_price_sqft,
    avgOfficRentSqft: row.avg_office_rent_sqft,
    commercialRentGfMin: row.commercial_rent_gf_min,
    commercialRentGfMax: row.commercial_rent_gf_max,
    spendingPowerIndex: row.spending_power_index,
    diningOutWeekly: row.dining_out_weekly,
  }

  return NextResponse.json({ data, propertyId, lat, lng })
}
