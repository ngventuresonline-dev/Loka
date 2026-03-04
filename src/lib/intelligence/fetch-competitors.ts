// @ts-nocheck
import { getPrisma } from '@/lib/get-prisma'

export type RawCompetitor = {
  name: string
  category: string
  distance: number
  rating?: number
  reviewCount?: number
  priceLevel?: number
  latitude: number
  longitude: number
}

function mapToPlaceTypes(propertyType?: string, businessType?: string): { type: string; keyword?: string; category: string }[] {
  const raw = `${businessType || ''} ${propertyType || ''}`.toLowerCase()

  const isQsr =
    /\b(qsr|quick service|fast food|burger|pizza|shawarma|biryani|momo|rolls?)\b/.test(raw) ||
    /\bdelivery\b/.test(raw)
  const isCafe = /\b(cafe|coffee|chai|tea)\b/.test(raw)
  const isRestaurant = /\brestaurant\b/.test(raw)
  const isBar = /\b(bar|pub|brew)\b/.test(raw)
  const isBakery = /\b(bakery|dessert|sweet|sweets|ice cream|cake)\b/.test(raw)

  if (isCafe && isQsr) {
    return [
      { type: 'cafe', keyword: 'cafe coffee', category: 'Cafe' },
      {
        type: 'meal_takeaway',
        keyword: 'fast food burger pizza shawarma biryani momos',
        category: 'QSR',
      },
    ]
  }

  if (isCafe) return [{ type: 'cafe', keyword: 'cafe coffee', category: 'Cafe' }]
  if (isQsr)
    return [
      {
        type: 'meal_takeaway',
        keyword: 'fast food burger pizza shawarma biryani momos',
        category: 'QSR',
      },
    ]
  if (isRestaurant) return [{ type: 'restaurant', keyword: 'restaurant', category: 'Restaurant' }]
  if (isBar) return [{ type: 'bar', keyword: 'bar pub brew', category: 'Bar' }]
  if (isBakery)
    return [
      {
        type: 'bakery',
        keyword: 'bakery dessert sweets ice cream cake',
        category: 'Bakery',
      },
    ]

  // Generic commercial competitors
  return [{ type: 'point_of_interest', keyword: 'shop store restaurant cafe', category: 'Other' }]
}

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
  return Math.round(EARTH_RADIUS_M * c)
}

/**
 * Fetch competitors around a point using Google Places.
 * Returns up to 40 POIs within 1km, de-duplicated across types.
 */
export async function fetchCompetitorsFromGooglePlaces(params: {
  latitude: number
  longitude: number
  propertyType?: string
  businessType?: string
}): Promise<RawCompetitor[]> {
  const { latitude, longitude, propertyType, businessType } = params

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  const placeTypes = mapToPlaceTypes(propertyType, businessType)
  const seen = new Set<string>()
  const all: RawCompetitor[] = []

  for (const { type, keyword, category } of placeTypes) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${latitude},${longitude}`)
    url.searchParams.set('radius', '1000')
    url.searchParams.set('type', type)
    if (keyword) url.searchParams.set('keyword', keyword)
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12_000) })
    if (!res.ok) continue

    const json = (await res.json()) as {
      status?: string
      results?: Array<{
        place_id?: string
        name?: string
        geometry?: { location?: { lat: number; lng: number } }
        rating?: number
        user_ratings_total?: number
        price_level?: number
        types?: string[]
      }>
    }

    if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      // Log in server logs but continue gracefully
      console.warn('[fetch-competitors] Places API status:', json.status)
      continue
    }

    for (const place of json.results ?? []) {
      const loc = place.geometry?.location
      if (!loc) continue

      const key = place.place_id || `${place.name}-${loc.lat}-${loc.lng}`
      if (!key || seen.has(key)) continue
      seen.add(key)

      const distance = haversineDistanceMeters(
        { lat: latitude, lng: longitude },
        { lat: loc.lat, lng: loc.lng }
      )

      // Only keep within 1km
      if (!Number.isFinite(distance) || distance < 0 || distance > 1000) continue

      const typeLabels = place.types ?? []
      const resolvedCategory =
        category ||
        (typeLabels.includes('cafe')
          ? 'Cafe'
          : typeLabels.includes('restaurant')
          ? 'Restaurant'
          : typeLabels.includes('bar')
          ? 'Bar'
          : typeLabels.includes('bakery')
          ? 'Bakery'
          : 'Other')

      all.push({
        name: place.name || 'Unknown',
        category: resolvedCategory,
        distance,
        rating: typeof place.rating === 'number' ? place.rating : undefined,
        reviewCount:
          typeof place.user_ratings_total === 'number' ? place.user_ratings_total : undefined,
        priceLevel: typeof place.price_level === 'number' ? place.price_level : undefined,
        latitude: loc.lat,
        longitude: loc.lng,
      })
    }
  }

  all.sort((a, b) => a.distance - b.distance)
  return all.slice(0, 40)
}

/**
 * Persist competitors for a property and return summary for PropertyIntelligence.
 */
export async function fetchAndStoreCompetitorsForProperty(params: {
  propertyId: string
  latitude: number
  longitude: number
  propertyType?: string
  businessType?: string
}) {
  const { propertyId, latitude, longitude, propertyType, businessType } = params
  const prisma = await getPrisma()

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      runId: 'pre-fix',
      hypothesisId: 'H3',
      location: 'src/lib/intelligence/fetch-competitors.ts:186',
      message: 'fetchAndStoreCompetitorsForProperty prisma snapshot',
      data: {
        hasCompetitorModel: !!prisma && typeof (prisma as any).competitor !== 'undefined',
        competitorType: prisma ? typeof (prisma as any).competitor : 'no-prisma',
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion agent log

  const raw = await fetchCompetitorsFromGooglePlaces({
    latitude,
    longitude,
    propertyType,
    businessType,
  })

  // Replace existing competitor rows for this property
  await prisma.competitor.deleteMany({ where: { propertyId } })

  if (raw.length > 0) {
    const topForTable = raw.slice(0, 20)
    await prisma.competitor.createMany({
      data: topForTable.map((c) => ({
        propertyId,
        name: c.name,
        category: c.category,
        distance: c.distance,
        rating: c.rating ?? null,
        reviewCount: c.reviewCount ?? null,
        priceLevel: c.priceLevel ?? null,
        latitude: c.latitude,
        longitude: c.longitude,
      })),
      skipDuplicates: true,
    })
  }

  const topForSummary = raw.slice(0, 5).map((c) => ({
    name: c.name,
    distance: c.distance,
    rating: c.rating,
    priceLevel: c.priceLevel,
  }))

  return {
    competitorsJson: topForSummary,
    competitorCount: raw.length,
    rawCompetitors: raw,
  }
}

