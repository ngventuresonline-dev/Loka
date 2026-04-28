import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export type NearbyTechPark = {
  id: string
  name: string
  locality: string
  zone: string | null
  distanceM: number
  totalEmployees: number
  totalCompanies: number
  grade: string | null
  anchorTenants: string[]
  avgRentSqft: number | null
  isSez: boolean
  lat: number
  lng: number
}

export type TechParksSummary = {
  totalEmployeesWithin3km: number
  totalParksWithin3km: number
  nearestParkName: string | null
  nearestParkDistanceM: number | null
  topAnchorTenants: string[]
}

function haversineExpr(lat: number, lng: number): string {
  return `(2 * 6371000 * asin(sqrt(sin(radians((tp.latitude - ${lat}) / 2.0))^2 + cos(radians(${lat})) * cos(radians(tp.latitude)) * sin(radians((tp.longitude - ${lng}) / 2.0))^2)))`
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const propertyId = searchParams.get('propertyId')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const radiusM = Math.min(Number(searchParams.get('radius') || '3000'), 8000)

  if (!propertyId && (!latParam || !lngParam)) {
    return NextResponse.json({ error: 'propertyId or lat+lng required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

  let lat: number | null = latParam ? Number(latParam) : null
  let lng: number | null = lngParam ? Number(lngParam) : null

  if (propertyId && (lat == null || !Number.isFinite(lat))) {
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
    return NextResponse.json({ error: 'Coordinates not available for this property' }, { status: 404 })
  }

  const distExpr = haversineExpr(lat, lng)
  const sql = `
    SELECT
      tp.id, tp.name, tp.locality, tp.zone,
      ${distExpr}::integer AS distance_m,
      tp.total_employees, tp.total_companies, tp.grade,
      tp.anchor_tenants, tp.avg_rent_sqft, tp.is_sez,
      tp.latitude, tp.longitude
    FROM bangalore_tech_parks tp
    WHERE tp.latitude IS NOT NULL
      AND tp.longitude IS NOT NULL
      AND ${distExpr} <= ${radiusM}
    ORDER BY distance_m ASC
    LIMIT 30
  `

  type TechParkRow = {
    id: string
    name: string
    locality: string
    zone: string | null
    distance_m: number
    total_employees: number | null
    total_companies: number | null
    grade: string | null
    anchor_tenants: string[] | null
    avg_rent_sqft: number | null
    is_sez: boolean | null
    latitude: number
    longitude: number
  }

  let rows: TechParkRow[] = []
  try {
    rows = (await prisma.$queryRawUnsafe(sql)) as TechParkRow[]
  } catch (e: unknown) {
    console.error('[techparks] query error', e)
  }

  const parks: NearbyTechPark[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    locality: r.locality,
    zone: r.zone,
    distanceM: r.distance_m,
    totalEmployees: r.total_employees ?? 0,
    totalCompanies: r.total_companies ?? 0,
    grade: r.grade,
    anchorTenants: Array.isArray(r.anchor_tenants) ? r.anchor_tenants : [],
    avgRentSqft: r.avg_rent_sqft,
    isSez: Boolean(r.is_sez),
    lat: Number(r.latitude),
    lng: Number(r.longitude),
  }))

  const totalEmployeesWithin3km = parks.reduce((s, p) => s + p.totalEmployees, 0)
  const nearest = parks[0] ?? null

  const allTenants = parks.flatMap((p) => p.anchorTenants)
  const tenantCounts: Record<string, number> = {}
  for (const t of allTenants) if (t) tenantCounts[t] = (tenantCounts[t] ?? 0) + 1
  const topAnchorTenants = Object.entries(tenantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name)

  return NextResponse.json({
    parks,
    summary: {
      totalEmployeesWithin3km,
      totalParksWithin3km: parks.length,
      nearestParkName: nearest?.name ?? null,
      nearestParkDistanceM: nearest?.distanceM ?? null,
      topAnchorTenants,
    } satisfies TechParksSummary,
    propertyId,
    lat,
    lng,
    radiusM,
  })
}
