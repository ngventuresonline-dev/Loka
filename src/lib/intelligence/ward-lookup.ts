import type { PrismaClient, WardDemographics } from '@prisma/client'

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

export async function findNearestWard(
  prisma: PrismaClient,
  coords: { latitude: number; longitude: number },
): Promise<WardDemographics | null> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'src/lib/intelligence/ward-lookup.ts:24',
      message: 'findNearestWard called',
      data: {
        hasWardDemographics: typeof (prisma as any).wardDemographics !== 'undefined',
        wardDemographicsType: typeof (prisma as any).wardDemographics,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion agent log

  const wards = await prisma.wardDemographics.findMany()
  if (!wards.length) return null

  let best: { ward: WardDemographics; dist: number } | null = null
  for (const ward of wards) {
    const dist = haversineDistanceMeters(
      { lat: coords.latitude, lng: coords.longitude },
      { lat: ward.latitude, lng: ward.longitude },
    )
    if (!best || dist < best.dist) {
      best = { ward, dist }
    }
  }

  // Ignore wards that are clearly far away (e.g. > 10km)
  if (!best || best.dist > 10_000) return null
  return best.ward
}

