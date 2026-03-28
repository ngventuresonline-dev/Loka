import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { toIndustryKey } from '@/lib/intelligence/industry-key'

export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  const industry = request.nextUrl.searchParams.get('industry') || 'restaurant'
  const industryKey = toIndustryKey(industry)

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  }

  const [locationRows, synthesisRows] = await Promise.all([
    prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM property_location_cache
      WHERE property_id = ${propertyId}
      LIMIT 1
    `,
    prisma.$queryRaw<Array<{ synthesis: unknown; cached_at: Date }>>`
      SELECT synthesis, cached_at FROM property_synthesis_cache
      WHERE property_id = ${propertyId} AND industry_key = ${industryKey}
      LIMIT 1
    `,
  ])

  const location = locationRows[0] || null
  const synthesis = synthesisRows[0]?.synthesis || null

  if (!location) {
    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.lokazen.in'
    fetch(`${origin}/api/admin/warm-intel-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${process.env.ADMIN_SECRET || 'lokazen-admin-secret'}`,
      },
      body: JSON.stringify({ propertyId, forceRefresh: false }),
    }).catch(() => {})

    return NextResponse.json(
      {
        cached: false,
        message: 'Intelligence being computed — please wait a moment and retry',
      },
      { status: 202 }
    )
  }

  return NextResponse.json(
    {
      cached: true,
      cachedAt: location.cached_at ?? null,
      cacheExpiresAt: location.cache_expires_at ?? null,
      industryKey,
      synthesisAvailable: !!synthesis,
      intel: {
        overallScore: location.overall_score,
        totalFootfall: location.daily_footfall,
        peakHours: location.peak_hours,
        weekendBoost: location.weekend_boost,
        competitors: location.competitors,
        complementaryBrands: location.complementary_brands,
        retailMix: location.retail_mix,
        catchment: location.catchment,
        catchmentLandmarks: location.catchment_landmarks,
        numberOfStores: location.competitor_count,
        marketSaturation: location.saturation_level,
        growthTrend: location.whitespace_score,
        spendingCapacity: location.demand_gap_score,
        retailIndex: location.saturation_index,
        cannibalisationRisk: location.cannibalisation_risk,
        crowdPullers: location.crowd_pullers,
        similarMarkets: location.similar_markets,
        metroName: location.metro_name,
        metroDistance: location.metro_distance_m,
        busStops: location.bus_stops,
        affluenceIndicator: location.affluence_indicator,
        totalHouseholds: location.total_households,
        coords:
          typeof location.resolved_lat === 'number' && typeof location.resolved_lng === 'number'
            ? { lat: location.resolved_lat, lng: location.resolved_lng }
            : null,
        nearestAreaKey: location.nearest_area_key,
        rentContext: {
          marketMid: location.rent_per_sqft,
          marketLow: location.market_rent_low,
          marketHigh: location.market_rent_high,
          source: location.rent_data_source,
        },
      },
      synthesis,
    },
    {
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' },
    }
  )
}
