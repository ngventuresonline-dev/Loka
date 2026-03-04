export type TransportInfo = {
  metroDistance: number | null
  metroName: string | null
  busStops: number
  mainRoadDistance: number | null
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

async function nearbySearch(params: {
  latitude: number
  longitude: number
  radius: number
  keyword?: string
  type?: string
}): Promise<
  Array<{
    name?: string
    latitude: number
    longitude: number
  }>
> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  const { latitude, longitude, radius, keyword, type } = params
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${latitude},${longitude}`)
  url.searchParams.set('radius', String(radius))
  if (type) url.searchParams.set('type', type)
  if (keyword) url.searchParams.set('keyword', keyword)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []

  const json = (await res.json()) as {
    status?: string
    results?: Array<{
      name?: string
      geometry?: { location?: { lat: number; lng: number } }
    }>
  }

  if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    console.warn('[fetch-transport] Places API status:', json.status)
    return []
  }

  const out: Array<{ name?: string; latitude: number; longitude: number }> = []
  for (const r of json.results ?? []) {
    const loc = r.geometry?.location
    if (!loc) continue
    out.push({ name: r.name, latitude: loc.lat, longitude: loc.lng })
  }
  return out
}

/**
 * Fetch metro, bus stops and main road proximity for accessibility scoring.
 */
export async function fetchTransportForLocation(params: {
  latitude: number
  longitude: number
}): Promise<TransportInfo> {
  const { latitude, longitude } = params

  let metroDistance: number | null = null
  let metroName: string | null = null
  let busStops = 0
  let mainRoadDistance: number | null = null

  // Metro within 3km
  const metros = await nearbySearch({
    latitude,
    longitude,
    radius: 3000,
    keyword: 'metro station Namma Metro',
    type: 'subway_station',
  })

  if (metros.length > 0) {
    let best = metros[0]
    let bestDist = haversineDistanceMeters(
      { lat: latitude, lng: longitude },
      { lat: best.latitude, lng: best.longitude },
    )
    for (const m of metros.slice(1)) {
      const d = haversineDistanceMeters(
        { lat: latitude, lng: longitude },
        { lat: m.latitude, lng: m.longitude },
      )
      if (d < bestDist) {
        best = m
        bestDist = d
      }
    }
    metroDistance = bestDist
    metroName = best.name ?? 'Metro station'
  }

  // Bus stops within 500m
  const bus = await nearbySearch({
    latitude,
    longitude,
    radius: 500,
    keyword: 'bus stop',
    type: 'bus_station',
  })
  busStops = bus.length

  // Main road proximity: closest major route / highway within 2km
  const roads = await nearbySearch({
    latitude,
    longitude,
    radius: 2000,
    keyword: 'main road OR highway',
    type: 'route',
  })
  if (roads.length > 0) {
    let best = roads[0]
    let bestDist = haversineDistanceMeters(
      { lat: latitude, lng: longitude },
      { lat: best.latitude, lng: best.longitude },
    )
    for (const r of roads.slice(1)) {
      const d = haversineDistanceMeters(
        { lat: latitude, lng: longitude },
        { lat: r.latitude, lng: r.longitude },
      )
      if (d < bestDist) {
        best = r
        bestDist = d
      }
    }
    mainRoadDistance = bestDist
  }

  return {
    metroDistance,
    metroName,
    busStops,
    mainRoadDistance,
  }
}

