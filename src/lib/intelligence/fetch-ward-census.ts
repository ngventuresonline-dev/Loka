import type { PrismaClient, WardDemographics, CensusData } from '@prisma/client'
import { findNearestWard } from './ward-lookup'
import { findNearestCensusWard } from './census-lookup'

/**
 * Nearest ward demographics (WardDemographics) + nearest census ward (CensusData) for a point.
 * Both lookups run in parallel; each may be null if no data or too far from a ward.
 */
export async function fetchWardAndCensus(
  prisma: PrismaClient,
  lat: number,
  lng: number
): Promise<{ ward: WardDemographics | null; census: CensusData | null }> {
  const coords = { latitude: lat, longitude: lng }
  const [ward, census] = await Promise.all([
    findNearestWard(prisma, coords),
    findNearestCensusWard(prisma, coords),
  ])
  return { ward, census }
}
