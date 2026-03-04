/**
 * Master 2026 enrichment – projects Census 2021 to 2026
 */

import { getPrisma } from '@/lib/get-prisma'
import { geocodeAddress } from '@/lib/property-coordinates'
import { getPropertyCoordinatesFromRow } from '@/lib/property-coordinates'
import { findNearestCensusWard } from './census-lookup'
import { project2026Demographics } from './projectors/2026-projector'
import { project2026Economics } from './projectors/economic-projector'
import { project2026Lifestyle } from './projectors/lifestyle-projector'
import { calculateInfrastructureImpact } from './infrastructure-impact'

export interface Projections2026 {
  demographics: {
    totalPopulation: number
    medianIncome: number
    workingPopulation: number
    projectionSource: string
    confidence: number
    [k: string]: unknown
  }
  economics: Record<string, number>
  lifestyle: Record<string, number | string>
  infrastructure: {
    metroImpact: number
    roadImpact: number
    commercialImpact: number
    overallBoost: number
    footfallBoost: number
    rentPressure: number
    competitionIncrease: number
    timeline: string
    confidence: number
  } | null
  highlights: {
    populationGrowth: string
    incomeGrowth: string
    footfallBoost: number
    marketHeat: string
  }
  baselineYear: number
  projectionYear: number
  confidence: number
  lastUpdated: string
}

function calculateMarketHeat(
  economics: Record<string, number>,
  infrastructure: { footfallBoost: number } | null,
  avgRent2026?: number,
  avgRent2021?: number
): string {
  let score = 0
  const inc15 = economics.incomeAbove15L ?? 0
  if (inc15 > 50) score += 30
  else if (inc15 > 35) score += 20

  if (avgRent2026 != null && avgRent2021 != null && avgRent2021 > 0) {
    const rentRatio = avgRent2026 / avgRent2021
    if (rentRatio > 1.4) score += 25
    else if (rentRatio > 1.25) score += 15
  }

  score += infrastructure?.footfallBoost ?? 0

  const newBiz = economics.newBusinessDensity2026 ?? 0
  const bizBase = economics.businessCount ?? 1
  if (newBiz > bizBase * 1.3) score += 20

  if (score >= 70) return 'Very Hot 🔥🔥🔥'
  if (score >= 50) return 'Hot 🔥🔥'
  if (score >= 30) return 'Warm 🔥'
  return 'Stable 📊'
}

export async function enrich2026Projections(propertyId: string): Promise<Projections2026 | null> {
  const prisma = await getPrisma()
  if (!prisma) return null

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { address: true, city: true, state: true, amenities: true },
  })
  if (!property) return null

  const coords = getPropertyCoordinatesFromRow({
    amenities: property.amenities,
    address: property.address,
    city: property.city,
    state: property.state,
    title: null,
  })
  let lat: number
  let lng: number
  if (coords) {
    lat = coords.lat
    lng = coords.lng
  } else {
    const geocoded = await geocodeAddress(property.address, property.city, property.state)
    if (!geocoded) return null
    lat = geocoded.lat
    lng = geocoded.lng
  }

  const ward = await findNearestCensusWard(prisma, { latitude: lat, longitude: lng })
  if (!ward) return null

  const wardId = ward.wardId as string
  const area = (ward.wardName as string) ?? 'Unknown'

  const census2021 = {
    totalPopulation: (ward.totalPopulation ?? 0) as number,
    age18_24: (ward.age18_24 ?? 0) as number,
    age25_34: (ward.age25_34 ?? 0) as number,
    age35_44: (ward.age35_44 ?? 0) as number,
    age45_54: (ward.age45_54 ?? 0) as number,
    age55_64: (ward.age55_64 ?? 0) as number,
    age65Plus: (ward.age65Plus ?? 0) as number,
    medianIncome: (ward.medianIncome ?? 0) as number,
    workingPopulation: (ward.workingPopPercent ?? 0) as number,
  }

  const base2021Economic = {
    incomeAbove15L: (ward.incomeAbove15L ?? 25) as number,
    income10to15L: (ward.income10to15L ?? 15) as number,
    income6to10L: (ward.income6to10L ?? 25) as number,
    vehicleOwnership: (ward.vehicleOwnership ?? 0.4) as number,
    avgRent: 50000,
    propertyPrice: 8000,
    businessCount: 50,
    chainPercent: 30,
    digitalPayment: 60,
    onlineOrdering: 40,
  }

  const base2021Lifestyle = {
    diningOutPerWeek: (ward.diningOutFreq ?? 2.5) as number,
    deliveryUsage: 45,
    gymMembership: (ward.gymMembershipRate ?? 15) as number,
    organicPreference: 20,
    experientialDining: 30,
  }

  const demographics2026 = await project2026Demographics(wardId, census2021, area)
  const economics2026 = await project2026Economics(wardId, area, base2021Economic, area)
  const lifestyle2026 = await project2026Lifestyle(wardId, base2021Lifestyle, area)
  const infrastructure = await calculateInfrastructureImpact(
    { latitude: lat, longitude: lng },
    wardId,
    area
  )

  const popGrowth =
    census2021.totalPopulation > 0
      ? (((demographics2026.totalPopulation / census2021.totalPopulation) - 1) * 100).toFixed(1)
      : '0'
  const incomeGrowth =
    census2021.medianIncome > 0
      ? (((demographics2026.medianIncome / census2021.medianIncome) - 1) * 100).toFixed(1)
      : '0'

  const projections2026: Projections2026 = {
    demographics: {
      ...demographics2026,
      projectionSource: demographics2026.projectionSource,
      confidence: demographics2026.confidence,
    },
    economics: economics2026,
    lifestyle: lifestyle2026,
    infrastructure,
    highlights: {
      populationGrowth: `+${popGrowth}%`,
      incomeGrowth: `+${incomeGrowth}%`,
      footfallBoost: infrastructure?.footfallBoost ?? 0,
      marketHeat: calculateMarketHeat(
        economics2026,
        infrastructure,
        economics2026.avgRent2026,
        base2021Economic.avgRent
      ),
    },
    baselineYear: 2021,
    projectionYear: 2026,
    confidence: demographics2026.confidence,
    lastUpdated: new Date().toISOString(),
  }

  const existing = await prisma.locationIntelligence.findUnique({
    where: { propertyId },
  })
  const currentPredictive = (existing?.predictive ?? {}) as Record<string, unknown>
  const merged = {
    ...currentPredictive,
    projections2026,
    methodology: '5-year CAGR projection from Census 2021',
  }

  await prisma.locationIntelligence.upsert({
    where: { propertyId },
    update: { predictive: merged, lastEnriched: new Date() },
    create: {
      propertyId,
      predictive: merged,
      enrichmentStatus: 'completed',
    },
  })

  return projections2026
}
