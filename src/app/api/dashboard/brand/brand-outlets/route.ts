import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export type NearbyBrandOutlet = {
  id: string
  brandName: string
  industry: string | null
  type: string | null
  category: string | null
  locality: string | null
  zone: string | null
  mallName: string | null
  format: string | null
  isFlagship: boolean
  distanceM: number
  lat: number
  lng: number
}

function haversineExpr(lat: number, lng: number): string {
  return `(2 * 6371000 * asin(sqrt(sin(radians((bo.lat - ${lat}) / 2.0))^2 + cos(radians(${lat})) * cos(radians(bo.lat)) * sin(radians((bo.lng - ${lng}) / 2.0))^2)))`
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const propertyId = searchParams.get('propertyId')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const radiusM = Math.min(Number(searchParams.get('radius') || '1500'), 5000)

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
      bo.id, bo.brand_name, bo.industry, bo.type, bo.category,
      bo.locality, bo.zone, bo.mall_name, bo.format, bo.is_flagship,
      ${distExpr}::integer AS distance_m,
      bo.lat, bo.lng
    FROM bangalore_brand_outlets bo
    WHERE bo.lat IS NOT NULL AND bo.lng IS NOT NULL
      AND (bo.is_active IS NULL OR bo.is_active = true)
      AND ${distExpr} <= ${radiusM}
    ORDER BY distance_m ASC
    LIMIT 50
  `

  type OutletRow = {
    id: string; brand_name: string; industry: string | null; type: string | null
    category: string | null; locality: string | null; zone: string | null
    mall_name: string | null; format: string | null; is_flagship: boolean | null
    distance_m: number; lat: number; lng: number
  }

  let rows: OutletRow[] = []
  try {
    rows = (await prisma.$queryRawUnsafe(sql)) as OutletRow[]
  } catch (e: unknown) {
    console.error('[brand-outlets] query error', e)
  }

  const outlets: NearbyBrandOutlet[] = rows.map((r) => ({
    id: r.id,
    brandName: r.brand_name,
    industry: r.industry,
    type: r.type,
    category: r.category,
    locality: r.locality,
    zone: r.zone,
    mallName: r.mall_name,
    format: r.format,
    isFlagship: Boolean(r.is_flagship),
    distanceM: r.distance_m,
    lat: Number(r.lat),
    lng: Number(r.lng),
  }))

  const byCategory: Record<string, number> = {}
  for (const o of outlets) {
    const k = o.category ?? o.industry ?? 'Other'
    byCategory[k] = (byCategory[k] ?? 0) + 1
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    outlets,
    summary: {
      totalWithinRadius: outlets.length,
      topCategories,
      flagshipCount: outlets.filter((o) => o.isFlagship).length,
    },
    propertyId,
    lat,
    lng,
    radiusM,
  })
}
