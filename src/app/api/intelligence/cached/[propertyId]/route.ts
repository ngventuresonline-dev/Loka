import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { toIndustryKey } from '@/lib/intelligence/industry-key'
import { scheduleWarmIntelCacheForProperty } from '@/lib/intelligence/trigger-warm-intel-cache'

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
    prisma.$queryRaw<
      Array<{ synthesis: unknown; cached_at: Date; industry_key: string; synthesis_fallback: boolean }>
    >`
      SELECT synthesis, cached_at, industry_key,
        (industry_key <> ${industryKey}) AS synthesis_fallback
      FROM property_synthesis_cache
      WHERE property_id = ${propertyId}
        AND (cache_expires_at IS NULL OR cache_expires_at > NOW())
      ORDER BY
        CASE industry_key
          WHEN ${industryKey} THEN 0
          WHEN 'restaurant' THEN 1
          WHEN 'cafe' THEN 2
          WHEN 'qsr' THEN 3
          WHEN 'retail' THEN 4
          WHEN 'salon' THEN 5
          WHEN 'bakery' THEN 6
          WHEN 'brewery' THEN 7
          WHEN 'wellness' THEN 8
          ELSE 99
        END,
        cached_at DESC
      LIMIT 1
    `,
  ])

  const location = locationRows[0] || null
  const synRow = synthesisRows[0]
  const synthesis = synRow?.synthesis || null
  const synthesisResolvedKey = synRow?.industry_key ?? null
  const synthesisIsFallback = Boolean(synRow?.synthesis_fallback)

  if (!location) {
    scheduleWarmIntelCacheForProperty(propertyId, { forceRefresh: false, industry: industryKey })

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
      synthesisResolvedKey,
      synthesisIsFallback,
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
