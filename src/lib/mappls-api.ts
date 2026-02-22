/**
 * Mappls (MapMyIndia) REST API helpers
 * Geocoding + Nearby POI - India-native data for location intelligence
 * Google = map display only
 */

import { getMapplsRestApiKey } from './mappls-config'

const MAPPLS_SEARCH_BASE = 'https://search.mappls.com/search'

/** Map property/business type to Mappls Nearby keywords */
export function mapToMapplsNearbyParams(propertyType?: string, businessType?: string): {
  keywords: string
  categoryCode?: string
} {
  const raw = `${businessType || ''} ${propertyType || ''}`.toLowerCase()
  const p = (propertyType || '').toLowerCase()

  if (/\b(qsr|cafe|coffee)\b/.test(raw)) return { keywords: 'coffee;cafe', categoryCode: 'FODCOF' }
  if (/\brestaurant\b/.test(raw) || p.includes('restaurant')) return { keywords: 'restaurant', categoryCode: 'FODCOF' }
  if (/\b(bakery|dessert|sweet)\b/.test(raw)) return { keywords: 'bakery;dessert' }
  if (/\bbar\b/.test(raw)) return { keywords: 'bar;pub', categoryCode: 'FODCOF' }
  if (/\bretail\b/.test(raw) || p.includes('retail')) return { keywords: 'retail;store' }
  if (p.includes('office')) return { keywords: 'office' }
  if (/\bgym|fitness\b/.test(raw)) return { keywords: 'gym;fitness' }
  if (/\bsalon|spa\b/.test(raw)) return { keywords: 'salon;spa' }
  if (/\bpharmacy|healthcare\b/.test(raw)) return { keywords: 'pharmacy;hospital' }

  return { keywords: 'shop;store' }
}

/** Geocode address to lat/lng. Returns null if not configured or fails. */
export async function mapplsGeocode(
  address: string,
  options?: { bias?: 1 | 0 | -1 }
): Promise<{ lat: number; lng: number } | null> {
  const token = getMapplsRestApiKey()
  if (!token || !address?.trim()) return null

  try {
    const url = new URL(`${MAPPLS_SEARCH_BASE}/address/geocode`)
    url.searchParams.set('address', address.trim())
    url.searchParams.set('access_token', token)
    if (options?.bias !== undefined) url.searchParams.set('bias', String(options.bias))

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
    if (!res.ok && res.status !== 204) return null
    if (res.status === 204) return null // No results

    const json = await res.json()

    // copResults can be single object or array
    const first = Array.isArray(json.copResults) ? json.copResults[0] : json.copResults
    if (!first) return null

    const lat = first.latitude ?? first.lat
    const lng = first.longitude ?? first.lng ?? first.lon
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng }
    }

    // Some responses include geometry
    const geom = first.geometry
    if (geom?.location?.lat != null && geom?.location?.lng != null) {
      return { lat: geom.location.lat, lng: geom.location.lng }
    }

    // eLoc-only: would need Place Details to resolve - skip for now
    return null
  } catch {
    return null
  }
}

export type MapplsNearbyItem = {
  name: string
  address?: string
  lat: number
  lng: number
  distanceMeters: number
}

/** Nearby POI search via Mappls. Returns competitors with coords when available. */
export async function mapplsNearby(
  lat: number,
  lng: number,
  params: { keywords: string; categoryCode?: string },
  options?: { radius?: number; limit?: number }
): Promise<MapplsNearbyItem[]> {
  const token = getMapplsRestApiKey()
  if (!token) return []

  const radius = options?.radius ?? 1000
  const limit = options?.limit ?? 20

  try {
    const url = new URL(`${MAPPLS_SEARCH_BASE}/places/nearby/json`)
    url.searchParams.set('refLocation', `${lat},${lng}`)
    url.searchParams.set('keywords', params.keywords)
    url.searchParams.set('radius', String(radius))
    url.searchParams.set('pageSize', String(limit))
    url.searchParams.set('sortBy', 'dist:asc')
    url.searchParams.set('access_token', token)
    if (params.categoryCode) url.searchParams.set('filter', `categoryCode:${params.categoryCode}`)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return []

    const json = await res.json()
    const items = json.suggestedLocations ?? []
    if (!Array.isArray(items)) return []

    const EARTH_RADIUS_M = 6371000
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const dLat = toRad(b.lat - a.lat)
      const dLng = toRad(b.lng - a.lng)
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
      return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
    }

    const center = { lat, lng }
    const out: MapplsNearbyItem[] = []

    for (const p of items) {
      const pl = p.latitude ?? p.lat
      const pg = p.longitude ?? p.lng ?? p.lon
      const hasCoords = typeof pl === 'number' && typeof pg === 'number'

      if (!hasCoords) continue

      const dist = typeof p.distance === 'number'
        ? p.distance
        : haversine(center, { lat: pl, lng: pg })

      out.push({
        name: p.placeName ?? p.name ?? 'Unknown',
        address: p.placeAddress ?? p.formattedAddress ?? p.address,
        lat: pl,
        lng: pg,
        distanceMeters: Math.round(dist),
      })
    }

    return out
  } catch {
    return []
  }
}

/** Search metro/transit via Mappls Nearby */
export async function mapplsNearbyTransit(
  lat: number,
  lng: number,
  keyword: string = 'metro station'
): Promise<{ name: string; lat: number; lng: number; distanceMeters: number } | null> {
  const token = getMapplsRestApiKey()
  if (!token) return null

  try {
    const url = new URL(`${MAPPLS_SEARCH_BASE}/places/nearby/json`)
    url.searchParams.set('refLocation', `${lat},${lng}`)
    url.searchParams.set('keywords', keyword)
    url.searchParams.set('radius', '3000')
    url.searchParams.set('pageSize', '1')
    url.searchParams.set('sortBy', 'dist:asc')
    url.searchParams.set('access_token', token)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const json = await res.json()
    const first = json.suggestedLocations?.[0]
    if (!first) return null

    const plat = first.latitude ?? first.lat
    const plng = first.longitude ?? first.lng ?? first.lon
    if (typeof plat !== 'number' || typeof plng !== 'number') return null

    const dist = typeof first.distance === 'number'
      ? first.distance
      : Math.round(
          6371000 *
            2 *
            Math.asin(
              Math.sqrt(
                Math.sin(((lat - plat) * Math.PI) / 360) ** 2 +
                  Math.cos((lat * Math.PI) / 180) *
                    Math.cos((plat * Math.PI) / 180) *
                    Math.sin(((lng - plng) * Math.PI) / 360) ** 2
              )
            )
        )

    return {
      name: first.placeName ?? first.name ?? 'Metro Station',
      lat: plat,
      lng: plng,
      distanceMeters: Math.round(dist),
    }
  } catch {
    return null
  }
}
