import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export type NearbyRetailZone = {
  id: string
  name: string
  zoneType: string | null
  locality: string | null
  zone: string | null
  distanceM: number
  totalRetailSqft: number | null
  totalStores: number | null
  anchorBrands: string[]
  foodCourts: number | null
  restaurantsCount: number | null
  cafesCount: number | null
  qsrCount: number | null
  avgFootfallWeekday: number | null
  avgFootfallWeekend: number | null
  peakHours: string | null
  avgTicketSize: number | null
  parkingCapacity: number | null
  metroConnected: boolean | null
  mallGrade: string | null
  keyFAndB: string[]
  vacancyPct: number | null
  avgRentSqft: number | null
}

function haversineExpr(lat: number, lng: number) {
  return `(2 * 6371000 * asin(sqrt(sin(radians((latitude - ${lat}) / 2.0))^2 + cos(radians(${lat})) * cos(radians(latitude) ) * sin(radians((longitude - ${lng}) / 2.0))^2)))`
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const propertyId = searchParams.get('propertyId')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const radiusParam = searchParams.get('radius')

  if (!propertyId && (!latParam || !lngParam)) {
    return NextResponse.json({ error: 'propertyId or lat+lng required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

  let lat: number | null = latParam ? Number(latParam) : null
  let lng: number | null = lngParam ? Number(lngParam) : null

  if (propertyId && (!lat || !Number.isFinite(lat))) {
    // Prefer properties.lat/lng (extracted from map_link) — more accurate than cache centroid
    const propRows = await prisma.$queryRaw<Array<{ lat: number; lng: number }>>`
      SELECT lat, lng FROM properties
      WHERE id = ${propertyId} AND lat IS NOT NULL AND lng IS NOT NULL
      LIMIT 1
    `.catch(() => [])
    if (propRows[0]) {
      lat = Number(propRows[0].lat)
      lng = Number(propRows[0].lng)
    } else {
      const cacheRows = await prisma.$queryRaw<Array<{ lat: number; lng: number }>>`
        SELECT resolved_lat AS lat, resolved_lng AS lng FROM property_location_cache
        WHERE property_id = ${propertyId} AND resolved_lat IS NOT NULL AND resolved_lng IS NOT NULL
        LIMIT 1
      `.catch(() => [])
      if (cacheRows[0]) {
        lat = Number(cacheRows[0].lat)
        lng = Number(cacheRows[0].lng)
      }
    }
  }

  if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Coordinates not available' }, { status: 404 })
  }

  const radiusM = Math.min(Number(radiusParam) || 3000, 8000)
  const distExpr = haversineExpr(lat, lng)

  const sql = `
    SELECT
      id, name, zone_type, locality, zone,
      ${distExpr}::integer AS distance_m,
      total_retail_sqft, total_stores,
      anchor_brands, food_courts, restaurants_count, cafes_count, qsr_count,
      avg_footfall_weekday, avg_footfall_weekend, peak_hours,
      avg_ticket_size, parking_capacity, metro_connected, mall_grade,
      key_f_and_b, vacancy_pct, avg_rent_sqft
    FROM bangalore_retail_zones
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND ${distExpr} <= ${radiusM}
    ORDER BY distance_m ASC
    LIMIT 10
  `

  type Row = {
    id: string; name: string; zone_type: string | null; locality: string | null; zone: string | null
    distance_m: number; total_retail_sqft: number | null; total_stores: number | null
    anchor_brands: string[] | null; food_courts: number | null; restaurants_count: number | null
    cafes_count: number | null; qsr_count: number | null; avg_footfall_weekday: number | null
    avg_footfall_weekend: number | null; peak_hours: string | null; avg_ticket_size: number | null
    parking_capacity: number | null; metro_connected: boolean | null; mall_grade: string | null
    key_f_and_b: string[] | null; vacancy_pct: number | null; avg_rent_sqft: number | null
  }

  let rows: Row[] = []
  try {
    rows = (await prisma.$queryRawUnsafe(sql)) as Row[]
  } catch (e: unknown) {
    console.error('[retail-zones] query error', e)
  }

  const zones: NearbyRetailZone[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    zoneType: r.zone_type,
    locality: r.locality,
    zone: r.zone,
    distanceM: r.distance_m,
    totalRetailSqft: r.total_retail_sqft,
    totalStores: r.total_stores,
    anchorBrands: Array.isArray(r.anchor_brands) ? r.anchor_brands : [],
    foodCourts: r.food_courts,
    restaurantsCount: r.restaurants_count,
    cafesCount: r.cafes_count,
    qsrCount: r.qsr_count,
    avgFootfallWeekday: r.avg_footfall_weekday,
    avgFootfallWeekend: r.avg_footfall_weekend,
    peakHours: r.peak_hours,
    avgTicketSize: r.avg_ticket_size,
    parkingCapacity: r.parking_capacity,
    metroConnected: r.metro_connected,
    mallGrade: r.mall_grade,
    keyFAndB: Array.isArray(r.key_f_and_b) ? r.key_f_and_b : [],
    vacancyPct: r.vacancy_pct,
    avgRentSqft: r.avg_rent_sqft,
  }))

  return NextResponse.json({ zones, propertyId, lat, lng, radiusM })
}
