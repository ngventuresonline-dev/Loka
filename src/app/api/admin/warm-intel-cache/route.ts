import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { INDUSTRY_KEYS, IndustryKey } from '@/lib/intelligence/industry-key'
import {
  geocodeAddress,
  getPropertyCoordinatesFromRow,
  getMapLinkFromAmenities,
  extractLatLngFromMapLink,
} from '@/lib/property-coordinates'
import { runPropertySynthesisForIndustry } from '@/lib/intelligence/property-synthesis-worker'

export const maxDuration = 300

const LOCATION_INTEL_TIMEOUT_MS = 20000
const INDUSTRY_PAUSE_MS = 2000

/** Richer than a generic string so mapToPlaceTypeAndKeyword / Places pick up QSR + restaurant + dessert POIs. */
function inferBusinessTypeForWarm(title: string, propertyType: string | null | undefined): string {
  const raw = `${title || ''} ${propertyType || ''}`.toLowerCase()
  if (/\b(qsr|quick service|fast food|pizza|burger|ice cream|dessert|vada|vadapav|momos|shawarma|takeaway|cloud kitchen)\b/.test(raw)) {
    return 'QSR quick service fast food pizza burger ice cream dessert restaurant cafe meal_takeaway bakery retail'
  }
  if (/\b(cafe|coffee|darshini)\b/.test(raw)) {
    return 'cafe coffee restaurant meal_takeaway retail'
  }
  if (/\b(optical|eyewear|lenskart|spectacle)\b/.test(raw)) {
    return 'optical eyewear retail'
  }
  return 'restaurant cafe retail meal_takeaway bakery qsr'
}

function safeDate(v: unknown): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isFinite(d.getTime()) ? d : null
}

/** Avoid NULL / NaN in NOT NULL columns on property_location_cache (Postgres 23502). */
function sqlFiniteNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function sqlNonEmptyText(v: unknown, fallback: string): string {
  if (v == null) return fallback
  const s = String(v).trim()
  return s.length > 0 ? s : fallback
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ ok: boolean; json: any | null; timeout: boolean }> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return { ok: false, json: null, timeout: false }
    const json = await res.json().catch(() => null)
    return { ok: true, json, timeout: false }
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'TimeoutError'
    return { ok: false, json: null, timeout }
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'lokazen-admin-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    forceRefresh?: boolean
    propertyId?: string
    industry?: IndustryKey
  }
  const forceRefresh = body.forceRefresh === true
  const targetPropertyId = body.propertyId
  const targetIndustry = body.industry

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  }

  const whereClause = targetPropertyId ? { id: targetPropertyId } : { status: 'approved' as const }
  const properties = await prisma.property.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      state: true,
      amenities: true,
      price: true,
      priceType: true,
      propertyType: true,
      size: true,
    },
  })

  const results = {
    total: 0,
    locationCached: 0,
    synthesisCached: 0,
    skipped: 0,
    errors: 0,
    timeouts: 0,
    /** First N messages so operators can see why errors/timeouts happen (Vercel logs also have stack). */
    messages: [] as string[],
  }
  const pushMsg = (m: string) => {
    if (results.messages.length < 25) results.messages.push(m.slice(0, 500))
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'https://www.lokazen.in'
  const industryPauseMs = targetPropertyId ? 0 : INDUSTRY_PAUSE_MS

  for (const property of properties) {
    results.total++
    try {
      const existingLocation = await prisma.$queryRaw<Array<{ id: string; cache_expires_at: Date }>>`
        SELECT id, cache_expires_at FROM property_location_cache
        WHERE property_id = ${property.id}
        LIMIT 1
      `
      const locationExpiry = safeDate(existingLocation[0]?.cache_expires_at)
      const locationFresh = Boolean(existingLocation.length > 0 && !forceRefresh && locationExpiry && locationExpiry > new Date())

      if (!locationFresh) {
        let lat: number | null = null
        let lng: number | null = null

        const fromRow = getPropertyCoordinatesFromRow({
          amenities: property.amenities,
          address: property.address,
          city: property.city,
          state: property.state,
          title: property.title,
        })
        if (fromRow) {
          lat = fromRow.lat
          lng = fromRow.lng
        } else {
          const mapLink = getMapLinkFromAmenities(property.amenities)
          if (mapLink) {
            const parsed = extractLatLngFromMapLink(mapLink)
            if (parsed) {
              lat = parsed.lat
              lng = parsed.lng
            }
          }
        }

        if ((lat == null || lng == null) && property.address && property.city) {
          const geocoded = await geocodeAddress(
            `${property.address}, ${property.city}, ${property.state || 'Karnataka'}`,
            '',
            '',
            property.title
          )
          if (geocoded) {
            lat = geocoded.lat
            lng = geocoded.lng
          }
        }

        if (lat != null && lng != null) {
          const intelRes = await fetchJsonWithTimeout(
            `${baseUrl}/api/location-intelligence`,
            {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat,
              lng,
              address: property.address,
              city: property.city,
              state: property.state || 'Karnataka',
              title: property.title,
              propertyType: property.propertyType,
              businessType: inferBusinessTypeForWarm(property.title ?? '', property.propertyType),
            }),
            },
            LOCATION_INTEL_TIMEOUT_MS
          )

          if (intelRes.ok) {
            const intelData = (intelRes.json || {}) as { data?: Record<string, any> } | Record<string, any>
            const d: any = (intelData as { data?: Record<string, any> }).data || intelData
            const pl = d.populationLifestyle || {}
            const metro = d.accessibility?.nearestMetro

            await prisma.$executeRaw`
              INSERT INTO property_location_cache (
                property_id, overall_score, daily_footfall, peak_hours, weekend_boost,
                competitors, competitor_count, complementary_brands, retail_mix,
                catchment, catchment_landmarks, saturation_level, market_summary,
                saturation_index, whitespace_score, demand_gap_score, market_potential_score,
                cannibalisation_risk, crowd_pullers, similar_markets,
                metro_name, metro_distance_m, bus_stops,
                affluence_indicator, total_households,
                rent_per_sqft, market_rent_low, market_rent_high, rent_data_source, nearest_area_key,
                resolved_lat, resolved_lng,
                cached_at, cache_expires_at, data_quality, source
              ) VALUES (
                ${property.id},
                ${sqlFiniteNumber(d.marketPotentialScore, 50)},
                ${sqlFiniteNumber(d.footfall?.dailyAverage, 0)},
                ${Array.isArray(d.footfall?.peakHours) ? d.footfall.peakHours.join(', ') : d.footfall?.peakHours || '12-2pm, 7-10pm'},
                ${sqlFiniteNumber(d.footfall?.weekendBoost, 20)},
                ${JSON.stringify(d.competitors || [])}::jsonb,
                ${sqlFiniteNumber(d.market?.competitorCount, 0)},
                ${JSON.stringify(d.complementaryBrands || [])}::jsonb,
                ${JSON.stringify(d.retailMix || [])}::jsonb,
                ${JSON.stringify(d.catchment || [])}::jsonb,
                ${JSON.stringify(d.catchmentLandmarks || [])}::jsonb,
                ${sqlNonEmptyText(d.market?.saturationLevel, 'medium')},
                ${d.market?.summary != null ? String(d.market.summary) : ''},
                ${sqlFiniteNumber(d.scores?.saturationIndex, 0.5)},
                ${sqlFiniteNumber(d.scores?.whitespaceScore, 50)},
                ${sqlFiniteNumber(d.scores?.demandGapScore, 50)},
                ${sqlFiniteNumber(d.marketPotentialScore, 50)},
                ${JSON.stringify(d.cannibalisationRisk || [])}::jsonb,
                ${JSON.stringify(d.crowdPullers || [])}::jsonb,
                ${JSON.stringify(d.similarMarkets || [])}::jsonb,
                ${sqlNonEmptyText(metro?.name, '')},
                ${metro?.distanceMeters != null ? sqlFiniteNumber(metro.distanceMeters, 0) : 0},
                ${d.accessibility?.nearestBusStop ? 1 : 0},
                ${sqlNonEmptyText(pl.affluenceIndicator, 'Medium')},
                ${pl.totalHouseholds != null ? sqlFiniteNumber(pl.totalHouseholds, 0) : 0},
                ${pl.rentPerSqft != null ? sqlFiniteNumber(pl.rentPerSqft, 0) : 0},
                ${pl.marketRentLow != null ? sqlFiniteNumber(pl.marketRentLow, 0) : 0},
                ${pl.marketRentHigh != null ? sqlFiniteNumber(pl.marketRentHigh, 0) : 0},
                ${sqlNonEmptyText(pl.rentDataSource, 'area_benchmark')},
                ${sqlNonEmptyText(d.nearestCommercialAreaKey, 'unknown')},
                ${lat},
                ${lng},
                NOW(),
                NOW() + INTERVAL '24 hours',
                90,
                'google_places'
              )
              ON CONFLICT (property_id) DO UPDATE SET
                overall_score = EXCLUDED.overall_score,
                daily_footfall = EXCLUDED.daily_footfall,
                peak_hours = EXCLUDED.peak_hours,
                weekend_boost = EXCLUDED.weekend_boost,
                competitors = EXCLUDED.competitors,
                competitor_count = EXCLUDED.competitor_count,
                complementary_brands = EXCLUDED.complementary_brands,
                retail_mix = EXCLUDED.retail_mix,
                catchment = EXCLUDED.catchment,
                catchment_landmarks = EXCLUDED.catchment_landmarks,
                saturation_level = EXCLUDED.saturation_level,
                market_summary = EXCLUDED.market_summary,
                saturation_index = EXCLUDED.saturation_index,
                whitespace_score = EXCLUDED.whitespace_score,
                demand_gap_score = EXCLUDED.demand_gap_score,
                market_potential_score = EXCLUDED.market_potential_score,
                cannibalisation_risk = EXCLUDED.cannibalisation_risk,
                crowd_pullers = EXCLUDED.crowd_pullers,
                similar_markets = EXCLUDED.similar_markets,
                metro_name = EXCLUDED.metro_name,
                metro_distance_m = EXCLUDED.metro_distance_m,
                bus_stops = EXCLUDED.bus_stops,
                affluence_indicator = EXCLUDED.affluence_indicator,
                total_households = EXCLUDED.total_households,
                rent_per_sqft = EXCLUDED.rent_per_sqft,
                market_rent_low = EXCLUDED.market_rent_low,
                market_rent_high = EXCLUDED.market_rent_high,
                rent_data_source = EXCLUDED.rent_data_source,
                nearest_area_key = EXCLUDED.nearest_area_key,
                resolved_lat = EXCLUDED.resolved_lat,
                resolved_lng = EXCLUDED.resolved_lng,
                data_quality = EXCLUDED.data_quality,
                source = EXCLUDED.source,
                cached_at = NOW(),
                cache_expires_at = NOW() + INTERVAL '24 hours'
            `
            results.locationCached++
          } else if (intelRes.timeout) {
            results.timeouts++
            pushMsg(`${property.id}: location-intel fetch timeout (${LOCATION_INTEL_TIMEOUT_MS}ms)`)
          } else if (!intelRes.ok) {
            pushMsg(`${property.id}: location-intelligence HTTP not ok (no body cached)`)
          }
        } else {
          pushMsg(`${property.id}: no lat/lng — skipped location refresh (add map link or address)`)
        }
      } else {
        results.skipped++
      }

      const industriesToWarm = targetIndustry ? [targetIndustry] : INDUSTRY_KEYS
      for (const industryKey of industriesToWarm) {
        const synResult = await runPropertySynthesisForIndustry(prisma, {
          propertyId: property.id,
          industryKey,
          forceRefresh,
          cacheTtlDays: 7,
        })
        if (synResult.status === 'ok') {
          results.synthesisCached++
        } else if (synResult.status === 'error') {
          results.errors++
          pushMsg(`${property.id}/${industryKey}: synthesis ${synResult.message}`)
        } else if (synResult.status === 'skipped_no_location') {
          pushMsg(`${property.id}/${industryKey}: synthesis skipped (no location cache row)`)
        }

        if (industryPauseMs > 0) {
          await new Promise((r) => setTimeout(r, industryPauseMs))
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[WarmIntelCache] Error for property ${property.id}:`, err)
      results.errors++
      pushMsg(`${property.id}: exception ${msg}`)
    }
  }

  return NextResponse.json({ success: true, results })
}
