/**
 * DB-only enrichment: bangalore_commercial_pockets + bangalore_locality_intel →
 * property_location_cache, properties.* fields, and location_* graph rows.
 * No Google/Mappls calls. Safe alongside existing property_intelligence / ward_demographics.
 */

import { randomUUID } from 'crypto'
import type { PrismaClient } from '@prisma/client'
import { areUsablePinCoords, geocodeAddress, getPropertyCoordinatesFromRow } from '@/lib/property-coordinates'
import { enrichFromBrandDirectory, industryKeyToBrandContext } from '@/lib/intelligence/brand-directory-enrichment'

const CACHE_TTL_DAYS = 30

function num(v: unknown, fb = 0): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fb
}

function str(v: unknown, fb = ''): string {
  if (v == null) return fb
  const s = String(v).trim()
  return s.length ? s : fb
}

function affluenceFromSpi(spi: number): string {
  if (spi >= 70) return 'High'
  if (spi >= 40) return 'Medium'
  return 'Low'
}

function saturationFromIntel(li: Record<string, unknown> | null): string {
  if (!li) return 'medium'
  const cafe = str(li.cafe_saturation).toLowerCase()
  const qsr = str(li.qsr_saturation).toLowerCase()
  const rest = str(li.restaurant_saturation).toLowerCase()
  const blob = `${cafe} ${qsr} ${rest}`
  if (blob.includes('high') || blob.includes('saturated')) return 'high'
  if (blob.includes('low')) return 'low'
  return 'medium'
}

function brandsFromPocket(pocket: Record<string, unknown>): string[] {
  const raw =
    pocket.top_brands_present ??
    pocket.topBrandsPresent ??
    pocket.anchor_brands ??
    pocket.key_brands
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw)
      if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean)
    } catch {
      if (raw.trim()) return [raw.trim()]
    }
  }
  return []
}

function competitorsFromBrands(names: string[]) {
  return names.slice(0, 24).map((name) => ({
    name,
    distanceMeters: 0,
    category: 'reference_pocket',
    branded: true,
  }))
}

export type ReferenceEnrichmentResult = {
  ok: boolean
  reason?: string
  propertyId: string
  pocketDistanceM?: number
  locationGraphId?: string
}

async function nearestPocketWithinM(
  prisma: PrismaClient,
  lat: number,
  lng: number,
  maxM: number
): Promise<{ row: Record<string, unknown>; distanceM: number } | null> {
  const rows = await prisma.$queryRaw<Array<Record<string, unknown> & { distance_m: number }>>`
    SELECT * FROM (
      SELECT *,
        (6371000 * acos(LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(lat))
        )))) AS distance_m
      FROM bangalore_commercial_pockets
      WHERE lat IS NOT NULL AND lng IS NOT NULL
    ) sub
    WHERE distance_m <= ${maxM}
    ORDER BY distance_m ASC
    LIMIT 1
  `
  const r = rows[0]
  if (!r) return null
  const d = num(r.distance_m)
  return { row: r, distanceM: d }
}

async function fetchLocalityIntel(
  prisma: PrismaClient,
  localityKey: string
): Promise<Record<string, unknown> | null> {
  const key = localityKey.trim()
  if (!key) return null
  const likePattern = `%${key.toLowerCase()}%`
  try {
    const liRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        li.locality,
        li.zone,
        li.total_apartment_units,
        li.total_office_employees,
        li.avg_daily_footfall,
        li.daytime_pop,
        li.nighttime_pop,
        li.spending_power_index,
        li.commercial_rent_gf_min,
        li.commercial_rent_gf_max,
        li.cafe_saturation,
        li.qsr_saturation,
        li.restaurant_saturation,
        li.lokazen_f_and_b_score,
        li.lokazen_cafe_score,
        li.lokazen_qsr_score,
        li.lokazen_retail_score,
        li.lokazen_salon_score
      FROM bangalore_locality_intel li
      WHERE LOWER(TRIM(li.locality)) = LOWER(${key})
         OR LOWER(li.locality) LIKE ${likePattern}
      LIMIT 1
    `
    return liRows[0] ?? null
  } catch {
    return null
  }
}

async function ensureLocationGraph(
  prisma: PrismaClient,
  params: {
    propertyId: string
    linkedLocationId: string | null
    lat: number
    lng: number
    city: string
    microMarket: string | null
    pinCode: string | null
    li: Record<string, unknown> | null
    brands: string[]
    footfall: number
  }
): Promise<string> {
  let locId = params.linkedLocationId

  if (!locId) {
    locId = randomUUID()
    const city = str(params.city, 'Bangalore')
    const mm = params.microMarket || null
    const pin = params.pinCode || null
    await prisma.$executeRaw`
      INSERT INTO locations (
        id, latitude, longitude, city, micro_market, pin_code, created_at, updated_at
      ) VALUES (
        ${locId},
        ${params.lat},
        ${params.lng},
        ${city},
        ${mm},
        ${pin},
        NOW(),
        NOW()
      )
    `
    await prisma.$executeRaw`
      UPDATE properties SET location_id = ${locId}, updated_at = NOW() WHERE id = ${params.propertyId}
    `
  }

  const li = params.li
  const daytimePop = li ? num(li.daytime_pop) : 0
  const pop500 =
    daytimePop > 0
      ? Math.max(1, Math.round(daytimePop * 0.22))
      : params.footfall > 0
        ? Math.max(1, Math.round(params.footfall * 1.2))
        : null

  await prisma.$executeRaw`
    INSERT INTO location_demographics (
      id, location_id, population_500m, household_count_500m, last_updated, created_at
    ) VALUES (
      ${randomUUID()},
      ${locId},
      ${pop500},
      ${pop500 != null ? Math.max(1, Math.round(pop500 * 0.35)) : null},
      NOW(),
      NOW()
    )
    ON CONFLICT (location_id) DO UPDATE SET
      population_500m = COALESCE(EXCLUDED.population_500m, location_demographics.population_500m),
      household_count_500m = COALESCE(EXCLUDED.household_count_500m, location_demographics.household_count_500m),
      last_updated = NOW()
  `

  const wk = Math.max(0, Math.round(params.footfall * 0.92))
  const we = Math.max(0, Math.round(params.footfall * 1.12))
  await prisma.$executeRaw`
    INSERT INTO location_mobility (
      id, location_id, avg_daily_footfall, weekday_footfall, weekend_footfall, last_updated, created_at
    ) VALUES (
      ${randomUUID()},
      ${locId},
      ${Math.round(params.footfall)},
      ${wk},
      ${we},
      NOW(),
      NOW()
    )
    ON CONFLICT (location_id) DO UPDATE SET
      avg_daily_footfall = EXCLUDED.avg_daily_footfall,
      weekday_footfall = EXCLUDED.weekday_footfall,
      weekend_footfall = EXCLUDED.weekend_footfall,
      last_updated = NOW()
  `

  const presence = { brands: params.brands, source: 'bangalore_commercial_pockets' }
  await prisma.$executeRaw`
    INSERT INTO location_commercial (
      id, location_id, competitor_brand_presence, last_updated, created_at
    ) VALUES (
      ${randomUUID()},
      ${locId},
      ${JSON.stringify(presence)}::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (location_id) DO UPDATE SET
      competitor_brand_presence = EXCLUDED.competitor_brand_presence,
      last_updated = NOW()
  `

  const cafe = li ? num(li.lokazen_cafe_score) : null
  const qsr = li ? num(li.lokazen_qsr_score) : null
  const retail = li ? num(li.lokazen_retail_score) : null
  const scoresJson = {
    retail_fit: retail || null,
    lokazen_f_and_b: li ? num(li.lokazen_f_and_b_score) : null,
    lokazen_salon: li ? num(li.lokazen_salon_score) : null,
  }

  await prisma.$executeRaw`DELETE FROM location_scores WHERE location_id = ${locId}`
  await prisma.$executeRaw`
    INSERT INTO location_scores (
      id, location_id, cafe_fit_score, qsr_fit_score, luxury_fit_score,
      scores_json, last_updated, created_at
    ) VALUES (
      ${randomUUID()},
      ${locId},
      ${cafe || null},
      ${qsr || null},
      ${null},
      ${JSON.stringify(scoresJson)}::jsonb,
      NOW(),
      NOW()
    )
  `

  return locId
}

function googleMapsPinUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

function mergeMapLinkIntoAmenities(amenities: unknown, mapLink: string): Record<string, unknown> {
  const base =
    amenities && typeof amenities === 'object' && !Array.isArray(amenities)
      ? { ...(amenities as Record<string, unknown>) }
      : {}
  base.map_link = mapLink
  return base
}

/**
 * One property: resolve coords → pocket (≤500m) → locality intel → caches + location graph.
 */
export async function runPropertyReferenceEnrichment(
  prisma: PrismaClient,
  propertyId: string,
  options?: { geocodeIfMissing?: boolean }
): Promise<ReferenceEnrichmentResult> {
  /** Default false: approval path stays DB-only (map link / stored latlng). Use true in one-off scripts. */
  const geocodeIfMissing = options?.geocodeIfMissing === true

  const prop = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      amenities: true,
      latitude: true,
      longitude: true,
      linkedLocationId: true,
    },
  })

  if (!prop) return { ok: false, reason: 'not_found', propertyId }

  let lat = prop.latitude != null ? Number(prop.latitude) : null
  let lng = prop.longitude != null ? Number(prop.longitude) : null

  if (lat == null || lng == null || !areUsablePinCoords({ lat, lng })) {
    const fromRow = getPropertyCoordinatesFromRow({
      amenities: prop.amenities,
      address: prop.address,
      city: prop.city,
      state: prop.state,
      title: prop.title,
    })
    if (fromRow && areUsablePinCoords(fromRow)) {
      lat = fromRow.lat
      lng = fromRow.lng
    }
  }

  if ((lat == null || lng == null || !areUsablePinCoords({ lat, lng })) && geocodeIfMissing) {
    const g = await geocodeAddress(prop.address, prop.city, prop.state || 'Karnataka', prop.title)
    if (g && areUsablePinCoords(g)) {
      lat = g.lat
      lng = g.lng
    }
  }

  if (lat == null || lng == null || !areUsablePinCoords({ lat, lng })) {
    return { ok: false, reason: 'no_coords', propertyId }
  }

  const mapUrl = googleMapsPinUrl(lat, lng)
  const amenitiesMerged = mergeMapLinkIntoAmenities(prop.amenities, mapUrl)

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      latitude: lat,
      longitude: lng,
      mapLink: mapUrl,
      amenities: amenitiesMerged as object,
    },
  })

  const pocketHit = await nearestPocketWithinM(prisma, lat, lng, 500)
  if (!pocketHit) {
    return { ok: false, reason: 'no_pocket_500m', propertyId }
  }

  const pocket = pocketHit.row
  const pocketLocality = str(pocket.locality)
  const pocketName = str(pocket.name)
  const tierVal = pocket.tier
  const footfall = Math.max(0, Math.round(num(pocket.avg_daily_footfall)))

  const li = await fetchLocalityIntel(prisma, pocketLocality || pocketName)
  const spi = li ? Math.round(num(li.spending_power_index, 50)) : 50
  const brands = brandsFromPocket(pocket)
  const comps = competitorsFromBrands(brands)
  const dailyFoot = li ? Math.round(num(li.avg_daily_footfall, footfall)) : footfall

  // Enrich from brand directory: real complementary brands + retail mix for this locality
  const { brandIndustry, brandCategory } = industryKeyToBrandContext('restaurant')
  const brandDirEnrichment = await enrichFromBrandDirectory({
    prisma,
    locality: pocketLocality || pocketName,
    industryKey: 'restaurant',
    brandIndustry,
    brandCategory,
  }).catch(() => ({
    complementaryBrands: [],
    retailMix: [],
    competitorBrands: [],
    localityRetailProfile: null,
  }))

  const marketSummary =
    li && pocketName
      ? `${pocketName} — ${str(li.locality, pocketLocality)}. Footfall ~${dailyFoot}/day; spending index ${spi}.`
      : pocketName
        ? `${pocketName} commercial pocket (reference data).`
        : 'Commercial pocket (reference data).'

  const overall = li
    ? Math.min(100, Math.max(40, Math.round(num(li.lokazen_f_and_b_score, spi))))
    : Math.min(100, Math.max(40, spi))

  const cacheExpiresAt = new Date(Date.now() + CACHE_TTL_DAYS * 86400000)

  const rentMin = li ? num(li.commercial_rent_gf_min) : 0
  const rentMax = li ? num(li.commercial_rent_gf_max) : 0
  const rentMid = rentMin > 0 && rentMax > 0 ? (rentMin + rentMax) / 2 : rentMin || rentMax || 0

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
      ${propertyId},
      ${overall},
      ${dailyFoot},
      ${'12-2pm, 7-10pm'},
      ${20},
      ${JSON.stringify(comps)}::jsonb,
      ${comps.length},
      ${JSON.stringify(brandDirEnrichment.complementaryBrands)}::jsonb,
      ${JSON.stringify(brandDirEnrichment.retailMix)}::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      ${saturationFromIntel(li)},
      ${marketSummary},
      ${0.5},
      ${Math.min(100, Math.max(0, 100 - comps.length * 3))},
      ${Math.min(100, Math.max(20, spi))},
      ${overall},
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      ${''},
      ${0},
      ${0},
      ${affluenceFromSpi(spi)},
      ${li ? Math.max(0, Math.round(num(li.total_apartment_units, 0) * 0.15)) : 0},
      ${rentMid},
      ${rentMin},
      ${rentMax},
      ${'area_benchmark'},
      ${pocketName || pocketLocality || 'unknown'},
      ${lat},
      ${lng},
      NOW(),
      ${cacheExpiresAt},
      ${82},
      ${'reference_join'}
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
      cache_expires_at = EXCLUDED.cache_expires_at
  `

  const footfallTier = tierVal != null ? str(tierVal) : str(pocket.footfall_tier)

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      locality: pocketLocality || null,
      microMarket: pocketName || null,
      footfallTier: footfallTier || null,
      locationScore: spi,
    },
  })

  const graphId = await ensureLocationGraph(prisma, {
    propertyId,
    linkedLocationId: prop.linkedLocationId ?? null,
    lat,
    lng,
    city: prop.city,
    microMarket: pocketName || pocketLocality,
    pinCode: prop.zipCode || null,
    li,
    brands,
    footfall: dailyFoot,
  })

  return {
    ok: true,
    propertyId,
    pocketDistanceM: pocketHit.distanceM,
    locationGraphId: graphId,
  }
}
