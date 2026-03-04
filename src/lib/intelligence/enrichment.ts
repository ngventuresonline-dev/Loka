import { getPrisma } from '@/lib/get-prisma'
import { geocodeAddress, getPropertyCoordinatesFromRow } from '@/lib/property-coordinates'
import { fetchAndStoreCompetitorsForProperty } from './fetch-competitors'
import { fetchTransportForLocation } from './fetch-transport'
import { calculateRevenueFromBenchmarks } from './calculate-revenue'
import { calculateScores } from './calculate-scores'
import { findNearestWard } from './ward-lookup'
import { findNearestCensusWard } from './census-lookup'

export async function enrichPropertyIntelligence(propertyId: string) {
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
    }),
  ])

  const competitorCount = competitorResult.competitorCount

  // Revenue model
  const weekendBoostPercent = 35
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

  const revenue = calculateRevenueFromBenchmarks({
    latitude: lat,
    longitude: lng,
    competitorCount,
    metroDistance: transport.metroDistance,
    busStops: transport.busStops,
    weekendBoostPercent,
    propertyType: property.propertyType,
    monthlyRent,
  })

  const monthlyRevenueMid = Math.round((revenue.monthlyRevenueLow + revenue.monthlyRevenueHigh) / 2)

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
      peakHours: '12–2pm, 7–10pm',
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
      peakHours: '12–2pm, 7–10pm',
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

