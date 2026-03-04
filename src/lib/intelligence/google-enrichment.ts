// @ts-nocheck
// TODO: This file references prisma.locationIntelligence / prisma.competitorIntelligence
// which are not yet in the schema. Re-enable type checking once models are added.

/**
 * Google Places enrichment for Location Intelligence
 */

import { getPrisma } from '@/lib/get-prisma'
import { haversineDistanceMeters, avg, getCompetitorTypes } from './utils'

const EARTH_RADIUS_M = 6371000

function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lng2 - lng1)
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(EARTH_RADIUS_M * c)
}

export async function enrichWithGoogleData(
  propertyId: string,
  coordinates: { latitude: number; longitude: number },
  propertyType: string
) {
  const prisma = getPrisma()
  const { latitude, longitude } = coordinates

  const enrichmentData: Record<string, unknown> = {
    microLocation: {},
    mesoLocation: {},
    competition: {},
    digitalSignals: {},
  }

  const googleKey =
    process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!googleKey) {
    throw new Error('Google Maps API key not configured')
  }

  try {
    // 1. Competitors
    const competitorTypes = getCompetitorTypes(propertyType)
    const competitors = await fetchNearbyCompetitors(
      latitude,
      longitude,
      competitorTypes,
      googleKey
    )

    const comp100 = competitors.filter((c) => c.distance <= 100)
    const comp500 = competitors.filter((c) => c.distance <= 500)
    const comp1km = competitors.filter((c) => c.distance <= 1000)

    ;(enrichmentData.competition as Record<string, unknown>) = {
      directCompetitors100m: comp100.length,
      directCompetitors500m: comp500.length,
      directCompetitors1km: comp1km.length,
      avgCompetitorRating: avg(competitors.map((c) => c.rating).filter(Boolean) as number[]),
      avgCompetitorReviews: avg(competitors.map((c) => c.reviews).filter(Boolean) as number[]),
      topCompetitors: competitors.slice(0, 10).map((c) => ({
        name: c.name,
        rating: c.rating,
        reviews: c.reviews,
        distance: c.distance,
        placeId: c.placeId,
      })),
    }

    // 2. Transport (metro, bus)
    const transport = await fetchTransportAccess(latitude, longitude, googleKey)
    ;(enrichmentData.mesoLocation as Record<string, unknown>).transport = transport

    // 3. Footfall estimate
    const footfallEstimate = await estimateFootfall(
      latitude,
      longitude,
      competitors.length,
      propertyType,
      googleKey
    )
    ;(enrichmentData as Record<string, unknown>).predictive = { footfallEstimate }

    // 4. Save LocationIntelligence
    await prisma.locationIntelligence.upsert({
      where: { propertyId },
      update: {
        competition: enrichmentData.competition as object,
        microLocation: enrichmentData.microLocation as object,
        mesoLocation: enrichmentData.mesoLocation as object,
        predictive: (enrichmentData as Record<string, unknown>).predictive as object,
        lastEnriched: new Date(),
        enrichmentStatus: 'processing',
      },
      create: {
        propertyId,
        competition: enrichmentData.competition as object,
        microLocation: enrichmentData.microLocation as object,
        mesoLocation: enrichmentData.mesoLocation as object,
        predictive: (enrichmentData as Record<string, unknown>).predictive as object,
        overallScore: 0,
        dataQuality: 0,
        enrichmentStatus: 'processing',
      },
    })

    // 5. Save CompetitorIntelligence
    await prisma.competitorIntelligence.deleteMany({ where: { propertyId } })
    for (const c of competitors.slice(0, 20)) {
      await prisma.competitorIntelligence.create({
        data: {
          propertyId,
          competitorName: c.name,
          googlePlaceId: c.placeId,
          category: propertyType,
          distance: c.distance,
          rating: c.rating ?? undefined,
          reviewCount: c.reviews ?? undefined,
          latitude: c.lat,
          longitude: c.lng,
        },
      })
    }

    return enrichmentData
  } catch (error) {
    console.error('[Google Enrichment] Failed:', error)
    await prisma.locationIntelligence.update({
      where: { propertyId },
      data: { enrichmentStatus: 'failed' },
    }).catch(() => {})
    throw error
  }
}

async function fetchNearbyCompetitors(
  lat: number,
  lng: number,
  types: string[],
  apiKey: string
) {
  const all: { name: string; lat: number; lng: number; distance: number; rating?: number; reviews?: number; placeId?: string }[] = []
  const seen = new Set<string>()

  for (const type of types) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', '1000')
    url.searchParams.set('type', type)
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
    if (!res.ok) continue

    const json = (await res.json()) as { results?: Array<{
      place_id?: string
      name?: string
      geometry?: { location?: { lat: number; lng: number } }
      rating?: number
      user_ratings_total?: number
    }> }

    for (const p of json.results || []) {
      const loc = p.geometry?.location
      if (!loc) continue
      const key = `${p.place_id || p.name}`
      if (seen.has(key)) continue
      seen.add(key)
      const distance = calcDistance(lat, lng, loc.lat, loc.lng)
      all.push({
        name: p.name || 'Unknown',
        lat: loc.lat,
        lng: loc.lng,
        distance,
        rating: p.rating,
        reviews: p.user_ratings_total,
        placeId: p.place_id,
      })
    }
  }

  all.sort((a, b) => a.distance - b.distance)
  return all
}

async function fetchTransportAccess(lat: number, lng: number, apiKey: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', '3000')
  url.searchParams.set('keyword', 'metro station Namma Metro')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
  let metroDistance: number | null = null
  let metroName: string | null = null

  if (res.ok) {
    const json = (await res.json()) as { results?: Array<{
      name?: string
      geometry?: { location?: { lat: number; lng: number } }
    }> }
    const first = json.results?.[0]
    if (first?.geometry?.location) {
      metroDistance = calcDistance(lat, lng, first.geometry.location.lat, first.geometry.location.lng)
      metroName = first.name || 'Metro Station'
    }
  }

  return {
    metroDistance,
    metroName,
    accessibilityScore: metroDistance != null
      ? metroDistance < 500 ? 90 : metroDistance < 1000 ? 75 : metroDistance < 2000 ? 60 : 40
      : 30,
  }
}

async function estimateFootfall(
  lat: number,
  lng: number,
  businessCount: number,
  propertyType: string,
  _apiKey: string
) {
  const densityScore = Math.min(businessCount * 80, 4000)
  const area = await getAreaFromCoordinates(lat, lng)
  const tierMultiplier = getAreaTierMultiplier(area)
  const typeFactors: Record<string, number> = {
    QSR: 1.2,
    Cafe: 0.85,
    restaurant: 1.0,
    retail: 0.9,
  }
  const typeFactor = typeFactors[propertyType] || 1.0
  const base = Math.round(densityScore * tierMultiplier * typeFactor)
  const peakHours = getPeakHours(propertyType)
  const weekendBoost = propertyType.toLowerCase().includes('bar') ? 60 : propertyType.toLowerCase().includes('cafe') ? 45 : 40

  return {
    dailyEstimate: base,
    rangeMin: Math.round(base * 0.8),
    rangeMax: Math.round(base * 1.2),
    weekendBoost: `${weekendBoost}%`,
    peakHours,
    confidence: businessCount > 20 ? 'Medium-High' : businessCount > 10 ? 'Medium' : 'Medium-Low',
    methodology: `Based on ${businessCount} nearby businesses in ${area}`,
  }
}

async function getAreaFromCoordinates(lat: number, lng: number): Promise<string> {
  const areas = [
    { key: 'indiranagar', lat: 12.9784, lng: 77.6408 },
    { key: 'koramangala', lat: 12.9352, lng: 77.6245 },
    { key: 'hsr layout', lat: 12.9121, lng: 77.6446 },
    { key: 'jayanagar', lat: 12.925, lng: 77.5936 },
  ]
  let nearest = areas[0]
  let minD = haversineDistanceMeters({ lat, lng }, { lat: nearest.lat, lng: nearest.lng })
  for (const a of areas.slice(1)) {
    const d = haversineDistanceMeters({ lat, lng }, { lat: a.lat, lng: a.lng })
    if (d < minD) {
      minD = d
      nearest = a
    }
  }
  return nearest.key
}

function getAreaTierMultiplier(area: string): number {
  const tier1 = ['indiranagar', 'koramangala', 'mg road', 'whitefield']
  const tier2 = ['hsr layout', 'jp nagar', 'jayanagar', 'marathahalli', 'bellandur']
  const n = area.toLowerCase()
  if (tier1.some((t) => n.includes(t))) return 2.5
  if (tier2.some((t) => n.includes(t))) return 1.8
  return 1.2
}

function getPeakHours(propertyType: string): string {
  const map: Record<string, string> = {
    Cafe: '8:00–10:30 AM, 3:00–6:00 PM',
    QSR: '12:00–3:00 PM, 6:00–10:00 PM',
    restaurant: '12:00–2:30 PM, 7:30–10:30 PM',
    retail: '11:00 AM–2:00 PM, 5:00–9:00 PM',
  }
  const k = Object.keys(map).find((x) => propertyType.toLowerCase().includes(x.toLowerCase()))
  return (k && map[k]) || '12:00–2:00 PM, 7:00–10:00 PM'
}
