/**
 * Derive property coordinates from map link (in amenities) or from address/title/city.
 * Used so Location Intelligence shows the correct location for each property.
 */

/** Extract lat/lng from a Google Maps URL */
export function extractLatLngFromMapLink(mapLink: string | null | undefined): { lat: number; lng: number } | null {
  if (!mapLink || typeof mapLink !== 'string') return null
  const s = mapLink.trim()
  const atMatch = s.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  const placeMatch = s.match(/\/place\/[^/]+\/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) }
  const qMatch = s.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  return null
}

/** Get map_link from amenities (stored as JSON: { features: [], map_link: "..." } or legacy array) */
export function getMapLinkFromAmenities(amenities: unknown): string | null {
  if (!amenities) return null
  if (typeof amenities === 'object' && !Array.isArray(amenities) && amenities !== null) {
    const mapLink = (amenities as Record<string, unknown>).map_link
    return typeof mapLink === 'string' ? mapLink : null
  }
  return null
}

/** Get coordinates for a raw property: from map_link in amenities, or null */
export function getPropertyCoordinatesFromRow(row: {
  amenities?: unknown
  address?: string | null
  city?: string | null
  state?: string | null
  title?: string | null
}): { lat: number; lng: number; mapLink: string | null } | null {
  const mapLink = getMapLinkFromAmenities(row.amenities)
  const coords = extractLatLngFromMapLink(mapLink)
  if (coords) return { ...coords, mapLink: mapLink || null }
  return null
}

/** Geocode address + city + state (and optional title) via Google Geocoding API. Returns lat/lng or null. */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  title?: string | null
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null
  const query = [address, city, state].filter(Boolean).join(', ')
  if (!query.trim()) return null
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('address', query)
    url.searchParams.set('key', apiKey)
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const json = await res.json()
    const loc = json.results?.[0]?.geometry?.location
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng }
    }
  } catch {
    // ignore
  }
  return null
}
