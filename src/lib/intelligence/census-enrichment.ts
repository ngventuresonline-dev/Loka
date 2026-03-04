/**
 * Census data enrichment for Location Intelligence
 * Returns structured demographics from nearest census ward.
 * Persistence is handled by the main enrichment pipeline (enrichment.ts).
 */

import { getPrisma } from '@/lib/get-prisma'
import { findNearestCensusWard } from './census-lookup'

export async function enrichWithCensusData(
  _propertyId: string,
  coordinates: { latitude: number; longitude: number }
) {
  const prisma = await getPrisma()
  if (!prisma) return null

  const ward = await findNearestCensusWard(prisma, coordinates)
  if (!ward) return null

  const demo = {
    totalPopulation: ward.totalPopulation,
    populationDensity: ward.populationDensity,
    ageDistribution: {
      age0_17: ward.age0_17,
      age18_24: ward.age18_24,
      age25_34: ward.age25_34,
      age35_44: ward.age35_44,
      age45_54: ward.age45_54,
      age55_64: ward.age55_64,
      age65Plus: ward.age65Plus,
    },
    medianAge: ward.medianAge,
    householdSize: ward.avgHouseholdSize,
    literacyRate: ward.literacyRate,
    education: {
      graduate: ward.graduatePercent,
      postGraduate: ward.postGradPercent,
    },
    employment: { workingPopulation: ward.workingPopPercent },
    income: {
      median: ward.medianIncome,
      under3L: ward.incomeUnder3L,
      range3to6L: ward.income3to6L,
      range6to10L: ward.income6to10L,
      range10to15L: ward.income10to15L,
      above15L: ward.incomeAbove15L,
    },
    lifestyle: {
      vegetarian: ward.vegetarianPercent,
      gymMembership: ward.gymMembershipRate,
      diningOutFrequency: ward.diningOutFreq,
    },
  }

  return demo
}
