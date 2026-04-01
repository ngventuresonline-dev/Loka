import type { PrismaClient } from '@prisma/client'
import { getPrisma } from '@/lib/get-prisma'
import { geocodeAddress, getPropertyCoordinatesFromRow } from '@/lib/property-coordinates'
import { fetchAndStoreCompetitorsForProperty } from './fetch-competitors'
import { fetchTransportForLocation } from './fetch-transport'
import { buildRevenueLocationProfile, calculateRevenueFromBenchmarks } from './calculate-revenue'
import { calculateScores } from './calculate-scores'
import { findNearestWard } from './ward-lookup'
import { findNearestCensusWard } from './census-lookup'

/** Nearest row from bangalore_commercial_pockets for pocket-level revenue inputs. */
export async function resolveCommercialPocket(
  prisma: PrismaClient,
  lat: number,
  lng: number,
  address: string,
  title: string,
): Promise<Record<string, unknown> | null> {
  try {
    const addressLower = `${address} ${title}`.toLowerCase()

    const textMatches = (await prisma.$queryRaw`
      SELECT *,
        (6371000 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(lat))
          ))
        )) AS distance_m
      FROM bangalore_commercial_pockets
      WHERE (
        LOWER(${addressLower}) LIKE '%' || LOWER(name) || '%'
        OR LOWER(${addressLower}) LIKE '%' || LOWER(locality) || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(COALESCE(key_roads, ARRAY[]::text[])) AS roads(road)
          WHERE LOWER(${addressLower}) LIKE '%' || LOWER(roads.road) || '%'
        )
        OR EXISTS (
          SELECT 1
          FROM unnest(COALESCE(landmark_anchors, ARRAY[]::text[])) AS anchors(a)
          WHERE LOWER(${addressLower}) LIKE '%' || LOWER(anchors.a) || '%'
        )
      )
      ORDER BY distance_m ASC
      LIMIT 1
    `) as Array<Record<string, unknown>>
    if (textMatches?.length > 0) return textMatches[0] ?? null

    const nearbyPockets = (await prisma.$queryRaw`
      SELECT *,
        (6371000 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(lat))
          ))
        )) AS distance_m
      FROM bangalore_commercial_pockets
      ORDER BY distance_m ASC
      LIMIT 1
    `) as Array<Record<string, unknown>>
    if (nearbyPockets?.length > 0) {
      const p = nearbyPockets[0]
      const dist = Number(p['distance_m'])
      if (Number.isFinite(dist) && dist <= 1500) return p
    }

    return null
  } catch (e) {
    console.warn('[resolveCommercialPocket] failed:', e)
    return null
  }
}

export async function enrichPropertyIntelligence(propertyId: string, businessType?: string) {
  const prisma = await getPrisma()
  if (!prisma) throw new Error('Prisma not available')

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      state: true,
      amenities: true,
      propertyType: true,
      price: true,
      priceType: true,
      size: true,
      roadTypeConfirmed: true,
      isCornerUnit: true,
      frontageWidthFt: true,
      nearbyOfficesCount: true,
      nearbyCoworkingCount: true,
      nearbyResidentialUnits: true,
      nearbyCollegesCount: true,
      nearbyGymsClinics: true,
      floorLevel: true,
      hasSignalNearby: true,
      dailyFootfallEstimate: true,
      peakHours: true,
    },
  })

  if (!property) throw new Error('Property not found')

  // Coordinates from stored map link or geocoding
  let lat: number
  let lng: number

  const fromMap = getPropertyCoordinatesFromRow({
    amenities: property.amenities,
    address: property.address,
    city: property.city,
    state: property.state,
    title: property.title ?? null,
  })

  if (fromMap) {
    lat = fromMap.lat
    lng = fromMap.lng
  } else {
    const geocoded = await geocodeAddress(property.address, property.city, property.state)
    if (!geocoded) throw new Error('Could not geocode property address')
    lat = geocoded.lat
    lng = geocoded.lng
  }

  // Nearest ward (Census 2021 + 2026 projection)
  const ward = await findNearestWard(prisma, { latitude: lat, longitude: lng })

  // Census-level detailed demographics for the nearest ward (24 Bangalore wards)
  const census = await findNearestCensusWard(prisma, { latitude: lat, longitude: lng })

  // Optional: locality-level area projections for infrastructure boost
  const area =
    ward?.locality
      ? await prisma.areaDemographics.findFirst({ where: { locality: ward.locality } })
      : null

  // Transport & competitors
  const [transport, competitorResult] = await Promise.all([
    fetchTransportForLocation({ latitude: lat, longitude: lng }),
    fetchAndStoreCompetitorsForProperty({
      propertyId,
      latitude: lat,
      longitude: lng,
      propertyType: property.propertyType,
      businessType,
    }),
  ])

  const competitorCount = competitorResult.competitorCount

  let localityIntel: Record<string, unknown> | null = null
  if (ward?.locality) {
    const localityKey = ward.locality.trim()
    const likePattern = `%${localityKey.toLowerCase()}%`
    try {
      const liRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT
          li.total_office_employees,
          li.total_apartment_units,
          li.spending_power_index,
          li.dining_out_weekly,
          li.cafe_saturation,
          li.qsr_saturation,
          li.restaurant_saturation
        FROM bangalore_locality_intel li
        WHERE LOWER(TRIM(li.locality)) = LOWER(${localityKey})
           OR LOWER(li.locality) LIKE ${likePattern}
        LIMIT 1
      `
      if (liRows?.length) localityIntel = liRows[0] ?? null
    } catch (e) {
      console.warn('[enrichment] bangalore_locality_intel:', e instanceof Error ? e.message : e)
    }
  }

  const pocket = await resolveCommercialPocket(
    prisma,
    lat,
    lng,
    property.address,
    property.title ?? '',
  )

  const priceNum = property.price != null ? Number(property.price) : null
  const sizeNum = property.size != null ? Number(property.size) : null
  const monthlyRent =
    priceNum != null
      ? property.priceType === 'yearly'
        ? priceNum / 12
        : property.priceType === 'sqft' && sizeNum
          ? priceNum * sizeNum
          : priceNum
      : null

  const locationProfile = buildRevenueLocationProfile({
    amenities: property.amenities,
    landmarks: [],
    directCompetitorCount: competitorCount,
    rawCompetitors: competitorResult.rawCompetitors,
    metroDistanceM: transport.metroDistance,
    busStops: transport.busStops,
    pocket,
    localityIntel,
    ward: ward
      ? {
          diningOutPerWeek: ward.diningOutPerWeek,
          spendingPowerIndex: ward.spendingPowerIndex ?? null,
        }
      : null,
    competitorCountForSaturationFallback: competitorCount,
    spendingPowerIndexFallback: null,
    siteVisit: {
      roadTypeConfirmed: property.roadTypeConfirmed,
      isCornerUnit: property.isCornerUnit,
      frontageWidthFt: property.frontageWidthFt,
      nearbyOfficesCount: property.nearbyOfficesCount,
      nearbyCoworkingCount: property.nearbyCoworkingCount,
      nearbyResidentialUnits: property.nearbyResidentialUnits,
      nearbyCollegesCount: property.nearbyCollegesCount,
      nearbyGymsClinics: property.nearbyGymsClinics,
      floorLevel: property.floorLevel,
      hasSignalNearby: property.hasSignalNearby,
      dailyFootfallEstimate: property.dailyFootfallEstimate,
    },
  })

  const pocketData = pocket
    ? {
        name: String(pocket['name'] ?? ''),
        tier: Number(pocket['tier']),
        revenueMultiplier: Number(pocket['revenue_multiplier']),
        rentGfTypical: Number(pocket['rent_gf_typical']),
        avgDailyFootfall: Number(pocket['avg_daily_footfall']),
        officeDemandPct: Number(pocket['office_demand_pct']),
        residentialDemandPct: Number(pocket['residential_demand_pct']),
        officeLunchCaptureRate: Number(pocket['office_lunch_capture_rate']),
        fnbSaturation: pocket['fnb_saturation'] != null ? String(pocket['fnb_saturation']) : null,
        roadType: pocket['road_type'] != null ? String(pocket['road_type']) : null,
      }
    : null

  const revenue = calculateRevenueFromBenchmarks({
    latitude: lat,
    longitude: lng,
    propertyType: property.propertyType ?? undefined,
    businessType,
    monthlyRent,
    sizeSqft: sizeNum,
    propertySizeSqft: sizeNum,
    locationProfile,
    pocketData,
  })

  const monthlyRevenueMid = revenue.monthlyRevenueMid

  // Infrastructure boost (2024–2026) – if area has new metros/malls
  const infraBoostPercent =
    area && (area.newMetroStations > 0 || area.newMalls > 0)
      ? Math.min(25, (area.newMetroStations * 5 + area.newMalls * 3))
      : 0

  // Scores — pass census data for richer demographic scoring
  const scores = calculateScores({
    dailyFootfall: revenue.dailyFootfall,
    weekendBoostPercent: revenue.weekendBoostPercent,
    competitorCount,
    competitorsTop5: competitorResult.rawCompetitors.slice(0, 5),
    transport,
    area,
    monthlyRevenueMid,
    monthlyRent,
    infrastructureBoostPercent: infraBoostPercent,
    ward,
    census,
    propertyType: property.propertyType,
  })

  const dataQuality =
    70 +
    (ward ? 10 : 0) +
    (census ? 3 : 0) +
    (area ? 5 : 0) +
    (transport.metroDistance != null ? 5 : 0) +
    (competitorCount > 0 ? 5 : 0)

  const competitorsSummary = competitorResult.competitorsJson

  const peakHoursLabel =
    (property.peakHours && String(property.peakHours).trim()) || '12–2pm, 7–10pm'

  await prisma.propertyIntelligence.upsert({
    where: { propertyId },
    create: {
      propertyId,
      overallScore: scores.overallScore,
      footfallScore: scores.footfallScore,
      revenueScore: scores.revenueScore,
      competitionScore: scores.competitionScore,
      accessScore: scores.accessScore,
      demographicScore: scores.demographicScore,
      riskScore: scores.riskScore,
      dailyFootfall: revenue.dailyFootfall,
      peakHours: peakHoursLabel.slice(0, 100),
      weekendBoost: revenue.weekendBoostPercent,
      monthlyRevenueLow: revenue.monthlyRevenueLow,
      monthlyRevenueHigh: revenue.monthlyRevenueHigh,
      breakEvenMonths: revenue.breakEvenMonths ?? 0,
      competitors: competitorsSummary as unknown as object,
      competitorCount,
      wardCode: ward?.wardCode ?? null,
      population: ward?.population2026 ?? area?.population2026 ?? 0,
      populationDensity: ward?.populationDensity ?? null,
      medianIncome: ward?.medianIncome ?? area?.medianIncome2026 ?? 0,
      age25_44Percent:
        ward != null ? ward.age25_34 + ward.age35_44 : area?.age25_44_2026 ?? 0,
      workingPopPercent: ward?.workingPopulation ?? area?.workingPop2026 ?? 0,
      metroDistance: transport.metroDistance,
      metroName: transport.metroName,
      busStops: transport.busStops,
      mainRoadDistance: transport.mainRoadDistance ?? 0,
      infrastructureBoost: infraBoostPercent,
      dataQuality: Math.min(100, Math.max(0, Math.round(dataQuality))),
    },
    update: {
      overallScore: scores.overallScore,
      footfallScore: scores.footfallScore,
      revenueScore: scores.revenueScore,
      competitionScore: scores.competitionScore,
      accessScore: scores.accessScore,
      demographicScore: scores.demographicScore,
      riskScore: scores.riskScore,
      dailyFootfall: revenue.dailyFootfall,
      peakHours: peakHoursLabel.slice(0, 100),
      weekendBoost: revenue.weekendBoostPercent,
      monthlyRevenueLow: revenue.monthlyRevenueLow,
      monthlyRevenueHigh: revenue.monthlyRevenueHigh,
      breakEvenMonths: revenue.breakEvenMonths ?? 0,
      competitors: competitorsSummary as unknown as object,
      competitorCount,
      wardCode: ward?.wardCode ?? null,
      population: ward?.population2026 ?? area?.population2026 ?? 0,
      populationDensity: ward?.populationDensity ?? null,
      medianIncome: ward?.medianIncome ?? area?.medianIncome2026 ?? 0,
      age25_44Percent:
        ward != null ? ward.age25_34 + ward.age35_44 : area?.age25_44_2026 ?? 0,
      workingPopPercent: ward?.workingPopulation ?? area?.workingPop2026 ?? 0,
      metroDistance: transport.metroDistance,
      metroName: transport.metroName,
      busStops: transport.busStops,
      mainRoadDistance: transport.mainRoadDistance ?? 0,
      infrastructureBoost: infraBoostPercent,
      dataQuality: Math.min(100, Math.max(0, Math.round(dataQuality))),
      lastUpdated: new Date(),
    },
  })

  return {
    scores,
    revenue,
    competitorCount,
    transport,
    area,
    ward,
    census,
  }
}

