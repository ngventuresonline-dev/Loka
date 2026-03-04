/**
 * Find nearest CensusData ward by coordinates.
 * Returns rich demographic data: literacy, education, lifestyle, vehicle ownership, etc.
 * Used to enrich property intelligence with deeper demographics at enrichment time.
 */

import type { PrismaClient, CensusData } from '@prisma/client'

const EARTH_RADIUS_M = 6371000

function haversineDistanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return EARTH_RADIUS_M * c
}

/**
 * Find the nearest CensusData ward (24 Bangalore wards) for a given lat/lng.
 * Returns null if no wards exist or nearest is > 10km away.
 */
export async function findNearestCensusWard(
  prisma: PrismaClient,
  coords: { latitude: number; longitude: number },
): Promise<CensusData | null> {
  let wards: CensusData[]
  try {
    wards = await prisma.censusData.findMany()
  } catch {
    return null
  }
  if (!wards.length) return null

  let best: { ward: CensusData; dist: number } | null = null
  for (const ward of wards) {
    if (ward.latitude == null || ward.longitude == null) continue
    const dist = haversineDistanceMeters(
      { lat: coords.latitude, lng: coords.longitude },
      { lat: ward.latitude, lng: ward.longitude },
    )
    if (!best || dist < best.dist) {
      best = { ward, dist }
    }
  }

  if (!best || best.dist > 10_000) return null
  return best.ward
}
