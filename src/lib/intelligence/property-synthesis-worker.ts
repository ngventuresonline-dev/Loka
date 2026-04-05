/**
 * Server-only: runs Claude synthesis and upserts property_synthesis_cache.
 * Used by cron (/api/ai/synthesize), admin warm-intel-cache, and scheduleWarmIntelCacheForProperty (e.g. on listing approval).
 */
import {
  enrichBrandLocationIntel,
  buildLocationIntelSnapshot,
  buildFallbackLocationSynthesis,
} from '@/lib/intelligence/brand-intel-enrich'
import type {
  BrandContextForIntel,
  LocationSynthesis,
  PropertyContextForIntel,
} from '@/lib/intelligence/brand-intel-enrichment.types'
import type { IndustryKey } from '@/lib/intelligence/industry-key'
import { INTEL_SYNTHESIS_MODEL } from '@/lib/claude'
import type { PrismaClient } from '@prisma/client'

export type PropertySynthesisWorkerResult =
  | { status: 'ok' }
  | { status: 'skipped_fresh' }
  | { status: 'skipped_no_location' }
  | { status: 'error'; message: string }

function safeDate(v: unknown): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isFinite(d.getTime()) ? d : null
}

/** Landmarks in DB/API may use `distance` or `distanceMeters`; snapshot expects meters for breakdown. */
function normalizeCatchmentLandmarksJson(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw
  return raw.map((item: Record<string, unknown>) => ({
    ...item,
    distanceMeters:
      item.distanceMeters != null && Number.isFinite(Number(item.distanceMeters))
        ? Number(item.distanceMeters)
        : item.distance != null && Number.isFinite(Number(item.distance))
          ? Number(item.distance)
          : 0,
  }))
}

/** Same shape as runPropertySynthesisForIndustry feeds into buildLocationIntelSnapshot. */
export function rawIntelFromLocationCacheRow(lc: Record<string, unknown>): Record<string, unknown> {
  return {
    competitors: lc.competitors,
    footfall: {
      dailyAverage: lc.daily_footfall,
      peakHours: String(lc.peak_hours || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      weekendBoost: lc.weekend_boost,
    },
    market: {
      saturationLevel: lc.saturation_level,
      competitorCount: lc.competitor_count,
      summary: lc.market_summary,
    },
    scores: {
      saturationIndex: lc.saturation_index,
      whitespaceScore: lc.whitespace_score,
      demandGapScore: lc.demand_gap_score,
    },
    marketPotentialScore: lc.overall_score,
    catchment: lc.catchment,
    catchmentLandmarks: normalizeCatchmentLandmarksJson(lc.catchment_landmarks),
    retailMix: lc.retail_mix,
    cannibalisationRisk: lc.cannibalisation_risk,
    crowdPullers: lc.crowd_pullers,
    similarMarkets: lc.similar_markets,
    populationLifestyle: {
      affluenceIndicator: lc.affluence_indicator,
      totalHouseholds: lc.total_households,
      rentPerSqft: lc.rent_per_sqft,
      marketRentLow: lc.market_rent_low,
      marketRentHigh: lc.market_rent_high,
      rentDataSource: lc.rent_data_source,
    },
    accessibility: {
      nearestMetro: lc.metro_name
        ? { name: lc.metro_name, distanceMeters: lc.metro_distance_m }
        : null,
      nearestBusStop: lc.bus_stops ? { name: 'Nearby Bus Stops', distanceMeters: 300 } : null,
    },
    nearestCommercialAreaKey: lc.nearest_area_key,
  }
}

function platformRentFromIntelSnapshot(intelSnapshot: Record<string, unknown>): {
  mid: number
  low: number
  high: number
} {
  const li = intelSnapshot.localityIntel as Record<string, unknown> | null | undefined
  const rc = intelSnapshot.rentContext as Record<string, unknown> | undefined
  const ward = intelSnapshot.ward as Record<string, unknown> | null | undefined
  const pl = intelSnapshot.populationLifestyle as Record<string, unknown> | undefined
  const midRaw = Number(
    rc?.marketMid ?? pl?.rentPerSqft ?? li?.commercialRentGFMin ?? ward?.commercialRentMin ?? 0
  )
  const lowRaw = Number(
    li?.commercialRentGFMin ?? ward?.commercialRentMin ?? rc?.marketLow ?? pl?.marketRentLow ?? 0
  )
  const highRaw = Number(
    li?.commercialRentGFMax ?? ward?.commercialRentMax ?? rc?.marketHigh ?? pl?.marketRentHigh ?? 0
  )
  const platformRent = {
    mid: Number.isFinite(midRaw) && midRaw > 0 ? Math.round(midRaw) : 135,
    low: Number.isFinite(lowRaw) && lowRaw > 0 ? Math.round(lowRaw) : 95,
    high: Number.isFinite(highRaw) && highRaw > 0 ? Math.round(highRaw) : 175,
  }
  if (platformRent.low > platformRent.high) {
    const t = platformRent.low
    platformRent.low = platformRent.high
    platformRent.high = t
  }
  return platformRent
}

/**
 * When property_synthesis_cache is empty but property_location_cache exists, still return tab narratives
 * (residents / apartments / workplaces) from the same live metrics — avoids permanent "Narrative syncing" in the UI.
 */
export function buildDeterministicLocationSynthesis(params: {
  locationRow: Record<string, unknown>
  property: PropertyContextForIntel
  industryKey: IndustryKey
}): LocationSynthesis {
  const { locationRow, property, industryKey } = params
  const rawIntel = rawIntelFromLocationCacheRow(locationRow)
  const intelSnapshot = buildLocationIntelSnapshot(rawIntel, null, undefined)
  const brand: BrandContextForIntel = {
    name: `${industryKey.charAt(0).toUpperCase()}${industryKey.slice(1)} Brand`,
    companyName: null,
    industry: industryKey,
    budgetMin: null,
    budgetMax: null,
    preferredLocations: null,
  }
  const platformRent = platformRentFromIntelSnapshot(intelSnapshot)
  return buildFallbackLocationSynthesis(brand, property, intelSnapshot, platformRent)
}

/**
 * @param cacheTtlDays — synthesis row expiry (cron uses 3; warm-cache may use 7)
 */
export async function runPropertySynthesisForIndustry(
  prisma: PrismaClient,
  params: {
    propertyId: string
    industryKey: IndustryKey
    forceRefresh?: boolean
    cacheTtlDays?: number
  }
): Promise<PropertySynthesisWorkerResult> {
  const { propertyId, industryKey, forceRefresh = false } = params
  const cacheTtlDays = params.cacheTtlDays ?? 3
  const now = new Date()

  if (!forceRefresh) {
    const existing = await prisma.$queryRaw<Array<{ cache_expires_at: Date }>>`
      SELECT cache_expires_at FROM property_synthesis_cache
      WHERE property_id = ${propertyId} AND industry_key = ${industryKey}
      LIMIT 1
    `
    const exp = safeDate(existing[0]?.cache_expires_at)
    if (existing.length > 0 && exp && exp > now) {
      return { status: 'skipped_fresh' }
    }
  }

  const locationRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT * FROM property_location_cache WHERE property_id = ${propertyId} LIMIT 1
  `
  if (!locationRows[0]) {
    return { status: 'skipped_no_location' }
  }
  const lc = locationRows[0] as Record<string, unknown>

  const propRow = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      title: true,
      address: true,
      city: true,
      propertyType: true,
      size: true,
      price: true,
      priceType: true,
    },
  })
  if (!propRow) {
    return { status: 'error', message: 'property_not_found' }
  }

  const rawIntel = rawIntelFromLocationCacheRow(lc)

  const brand: BrandContextForIntel = {
    name: `${industryKey.charAt(0).toUpperCase()}${industryKey.slice(1)} Brand`,
    companyName: null,
    industry: industryKey,
    budgetMin: null,
    budgetMax: null,
    preferredLocations: null,
  }

  const property: PropertyContextForIntel = {
    title: String(propRow.title ?? ''),
    address: String(propRow.address ?? ''),
    city: String(propRow.city ?? ''),
    propertyType: propRow.propertyType as PropertyContextForIntel['propertyType'],
    size: propRow.size != null && Number.isFinite(Number(propRow.size)) ? Number(propRow.size) : 0,
    price: Number(propRow.price),
    priceType: propRow.priceType as PropertyContextForIntel['priceType'],
  }

  const intelSnapshot = buildLocationIntelSnapshot(rawIntel, null, undefined)

  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 'error', message: 'no_anthropic_key' }
  }

  try {
    const enrichment = await enrichBrandLocationIntel({
      brand,
      property,
      intelSnapshot,
    })

    const ttlDays = Math.min(30, Math.max(1, Math.floor(cacheTtlDays)))
    const expiresAt = new Date(Date.now() + ttlDays * 86_400_000)
    const modelUsed = INTEL_SYNTHESIS_MODEL

    await prisma.$executeRaw`
      INSERT INTO property_synthesis_cache (
        property_id, industry_key, synthesis, cached_at, cache_expires_at, model_used
      )
      VALUES (
        ${propertyId},
        ${industryKey},
        ${JSON.stringify(enrichment)}::jsonb,
        NOW(),
        ${expiresAt},
        ${modelUsed}
      )
      ON CONFLICT (property_id, industry_key) DO UPDATE SET
        synthesis = EXCLUDED.synthesis,
        model_used = EXCLUDED.model_used,
        cached_at = NOW(),
        cache_expires_at = ${expiresAt}
    `

    return { status: 'ok' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'enrich_failed'
    console.error('[property-synthesis-worker]', propertyId, industryKey, e)
    return { status: 'error', message: msg }
  }
}
