/**
 * Derive property coordinates from map link (in amenities) or from address/title/city.
 * Used so Location Intelligence shows the correct location for each property.
 */

/** Extract a neighbourhood from listing titles like "Prime Space | Kalyan Nagar". */
export function extractLocalityFromTitle(title?: string | null): string | null {
  if (!title?.trim()) return null
  const parts = title
    .split(/[|–—]/)
    .map((p) => p.trim())
    .filter(Boolean)
  const marketing =
    /^(prime|premium|commercial|property|retail|space|limited|units|for\s+sale|for\s+lease|new\s+launch)\b/i
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]
    if (!marketing.test(p) && p.length >= 3) return p
  }
  return parts[parts.length - 1] ?? null
}

/**
 * Ordered geocode queries: locality-aware first to avoid ambiguous streets (e.g. "7th Main"
 * exists in both Banashankari and Kalyan Nagar).
 */
export function buildGeocodeQueryCandidates(
  address: string,
  city: string,
  state: string,
  title?: string | null
): string[] {
  const loc = extractLocalityFromTitle(title)
  const cityNorm = (city || 'Bengaluru').trim()
  const stateNorm = (state || 'Karnataka').trim()
  const addr = (address || '').trim()
  const tail = `${cityNorm}, ${stateNorm}, India`
  const out: string[] = []
  if (addr.length > 5 && cityNorm) {
    out.push(`${addr}, ${cityNorm}, ${stateNorm}, India`)
  }
  const firstLocWord = loc?.toLowerCase().split(/\s+/).filter(Boolean)[0] ?? ''
  const addrHasLoc = Boolean(loc && addr && firstLocWord && addr.toLowerCase().includes(firstLocWord))

  if (loc && addr && !addrHasLoc) {
    out.push(`${addr}, ${loc}, ${tail}`)
  }
  if (loc && addr) {
    out.push(`${loc}, ${addr}, ${tail}`)
  }
  if (loc) {
    out.push(`${loc}, ${tail}`)
  }
  if (addr) {
    out.push(`${addr}, ${tail}`)
  }
  return [...new Set(out.filter((q) => q.length > 8))]
}

/** Last-resort centroids for Bengaluru localities when APIs return the wrong ward. */
function bangaloreLocalityCentroid(title: string, address: string): { lat: number; lng: number } | null {
  const blob = `${title} ${address}`.toLowerCase()
  const hits: Array<{ re: RegExp; lat: number; lng: number }> = [
    {
      re: /sarjapur\s+junction|ambalipura|kasavanahalli|wipro\s*sarjapur|la\s*milano/i,
      lat: 12.9185,
      lng: 77.6775,
    },
    { re: /kalyan\s*nagar|hrbr\b|560043/, lat: 13.022, lng: 77.647 },
    { re: /kammanahalli|560084/, lat: 13.009, lng: 77.648 },
    { re: /hbr\s*layout|560085/, lat: 13.033, lng: 77.637 },
    { re: /banashankari|banashankari\s*stage|560070/, lat: 12.9254, lng: 77.5468 },
    { re: /jayanagar|560041/, lat: 12.925, lng: 77.5936 },
    { re: /koramangala|560095/, lat: 12.9352, lng: 77.6245 },
    { re: /indiranagar|560038/, lat: 12.9784, lng: 77.6408 },
  ]
  for (const h of hits) {
    if (h.re.test(blob)) return { lat: h.lat, lng: h.lng }
  }
  return null
}

/** Sync fallback for map pins when geocoding is skipped (e.g. brand matches list). */
export function getListingHeuristicCoords(
  title: string,
  address: string
): { lat: number; lng: number } | null {
  return bangaloreLocalityCentroid(title, address)
}

async function geocodeSingleQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  const { mapplsGeocode } = await import('./mappls-api')
  const { isMapplsConfigured } = await import('./mappls-config')

  if (isMapplsConfigured()) {
    const c = await mapplsGeocode(query)
    if (c) return c
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!googleKey) return null
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('address', query)
    url.searchParams.set('region', 'in')
    url.searchParams.set('key', googleKey)
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

/** Extract lat/lng from a maps URL (Google Maps, MapMyIndia, etc.) */
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

/**
 * Get coordinates for a raw property: from map_link in amenities, or null.
 * Listing `amenities.map_link` (Google Maps URL with @lat,lng) gives the most accurate
 * brand-dashboard map center; without it, geocoding may fall back to neighbourhood/city level.
 */
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

/**
 * Geocode address + city + state. Uses title (e.g. "| Kalyan Nagar") for disambiguation.
 * Mappls first, then Google with region=IN, then known Bengaluru locality centroids.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  title?: string | null
): Promise<{ lat: number; lng: number } | null> {
  const queries = buildGeocodeQueryCandidates(address, city, state, title)
  if (queries.length === 0) {
    const fb = bangaloreLocalityCentroid(title || '', address)
    return fb
  }

  const suspectedAnchor = bangaloreLocalityCentroid(title || '', address)
  for (const query of queries) {
    const coords = await geocodeSingleQuery(query)
    if (!coords) continue
    if (suspectedAnchor) {
      const d = haversineKm(coords.lat, coords.lng, suspectedAnchor.lat, suspectedAnchor.lng)
      if (d > 3.5) continue
    }
    return coords
  }

  return bangaloreLocalityCentroid(title || '', address)
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
