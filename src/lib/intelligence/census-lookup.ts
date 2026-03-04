/**
 * Find nearest CensusData ward by coordinates.
 * Used by /api/location-intelligence and census-enrichment.
 */

import { haversineDistanceMeters } from './utils'

export interface CensusWardRecord {
  latitude: number | null
  longitude: number | null
  [k: string]: unknown
}

/**
 * Find the nearest CensusData ward to given coordinates.
 * Returns null if no wards with lat/lng exist or Prisma fails.
 */
export async function findNearestCensusWard(
  prisma: { censusData?: { findMany: () => Promise<CensusWardRecord[]> } } | null,
  coordinates: { latitude: number; longitude: number }
): Promise<CensusWardRecord | null> {
  if (!prisma?.censusData) return null
  let wards: CensusWardRecord[]
  try {
    wards = await prisma.censusData.findMany()
  } catch {
    return null
  }
  const withCoords = wards.filter((w) => w.latitude != null && w.longitude != null)
  if (!withCoords.length) return null

  let nearest = withCoords[0]
  let minDist = Infinity
  for (const w of withCoords) {
    const lat = w.latitude as number
    const lng = w.longitude as number
    const d = haversineDistanceMeters(
      { lat: coordinates.latitude, lng: coordinates.longitude },
      { lat, lng }
    )
    if (d < minDist) {
      minDist = d
      nearest = w
    }
  }
  return nearest
}
