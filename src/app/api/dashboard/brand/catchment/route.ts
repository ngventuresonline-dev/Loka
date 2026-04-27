import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export type NearbySociety = {
  id: string
  name: string
  locality: string
  zone: string | null
  distanceM: number
  totalUnits: number
  avgPriceSqft: number
  occupancyPct: number | null
  secProfile: string | null
  residentProfile: string | null
  developer: string | null
  lat: number
  lng: number
}

export type CatchmentSummary = {
  totalUnitsWithin2km: number
  avgPriceSqft: number
  dominantSecProfile: string
  societies: NearbySociety[]
}

const EARTH_R = 6371000

/** Returns haversine distance SQL fragment as a raw string (lat/lng are validated finite numbers, not user strings). */
function haversineExpr(lat: number, lng: number): string {
  return `(2 * ${EARTH_R} * asin(sqrt(sin(radians((s.latitude - ${lat}) / 2.0))^2 + cos(radians(${lat})) * cos(radians(s.latitude)) * sin(radians((s.longitude - ${lng}) / 2.0))^2)))`
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
    if (rows[0]) {
      lat = Number(rows[0].lat)
      lng = Number(rows[0].lng)
    }
  }

  if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Coordinates not available for this property' }, { status: 404 })
  }

  const distExpr = haversineExpr(lat, lng)
  // lat/lng are validated finite numbers from Number.isFinite() check above — safe for raw interpolation
  const sql = `
    SELECT
      s.id, s.name, s.locality, s.zone,
      ${distExpr}::integer AS distance_m,
      s.total_units, s.avg_price_sqft, s.occupancy_pct,
      s.sec_profile, s.resident_profile, s.developer,
      s.latitude, s.longitude
    FROM bangalore_societies s
    WHERE s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL
      AND ${distExpr} <= ${radiusM}
    ORDER BY distance_m ASC
    LIMIT 20
  `

  type SocietyRow = {
    id: string
    name: string
    locality: string
    zone: string | null
    distance_m: number
    total_units: number | null
    avg_price_sqft: number | null
    occupancy_pct: number | null
    sec_profile: string | null
    resident_profile: string | null
    developer: string | null
    latitude: number
    longitude: number
  }

  let rows: SocietyRow[] = []
  try {
    rows = (await prisma.$queryRawUnsafe(sql)) as SocietyRow[]
  } catch (e: unknown) {
    console.error('[catchment] query error', e)
  }

  const societies: NearbySociety[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    locality: r.locality,
    zone: r.zone,
    distanceM: r.distance_m,
    totalUnits: r.total_units ?? 0,
    avgPriceSqft: r.avg_price_sqft ?? 0,
    occupancyPct: r.occupancy_pct,
    secProfile: r.sec_profile,
    residentProfile: r.resident_profile,
    developer: r.developer,
    lat: Number(r.latitude),
    lng: Number(r.longitude),
  }))

  const totalUnitsWithin2km = societies.reduce((s, r) => s + r.totalUnits, 0)
  const avgPriceSqft =
    societies.length > 0
      ? Math.round(societies.reduce((s, r) => s + r.avgPriceSqft, 0) / societies.length)
      : 0

  const secCounts: Record<string, number> = {}
  for (const s of societies) {
    if (s.secProfile) secCounts[s.secProfile] = (secCounts[s.secProfile] ?? 0) + s.totalUnits
  }
  const dominantSecProfile =
    Object.entries(secCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown'

  return NextResponse.json({
    societies,
    summary: {
      totalUnitsWithin2km,
      avgPriceSqft,
      dominantSecProfile,
      societyCount: societies.length,
    } as CatchmentSummary & { societyCount: number },
    propertyId,
    lat,
    lng,
    radiusM,
  })
}
