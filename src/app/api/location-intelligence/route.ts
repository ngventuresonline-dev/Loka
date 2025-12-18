import { NextRequest, NextResponse } from 'next/server'

type LocationIntelligenceRequest = {
  lat?: number
  lng?: number
  address?: string
  city?: string
  state?: string
  propertyType?: string
  businessType?: string
}

type Competitor = {
  name: string
  lat: number
  lng: number
  distanceMeters: number
  rating?: number
  userRatingsTotal?: number
  address?: string
}

type LocationIntelligenceResponse = {
  competitors: Competitor[]
  footfall: {
    dailyAverage: number
    peakHours: string[]
    weekendBoost: number
    confidence: 'low' | 'medium' | 'high'
  }
  demographics: {
    ageGroups: { range: string; percentage: number }[]
    incomeLevel: 'low' | 'medium' | 'high' | 'mixed'
    lifestyle: string[]
  }
  accessibility: {
    walkScore: number
    transitScore: number
    nearestMetro?: { name: string; distanceMeters: number }
    nearestBusStop?: { name: string; distanceMeters: number }
  }
  market: {
    saturationLevel: 'low' | 'medium' | 'high'
    competitorCount: number
    summary: string
  }
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
  return EARTH_RADIUS_M * c
}

function mapToPlaceType(propertyType?: string, businessType?: string): string {
  const normalizedBusiness = (businessType || '').toLowerCase()
  const normalizedProperty = (propertyType || '').toLowerCase()

  if (normalizedBusiness.includes('qsr') || normalizedBusiness.includes('cafe') || normalizedBusiness.includes('café')) {
    return 'restaurant'
  }
  if (normalizedBusiness.includes('bar') || normalizedBusiness.includes('brew')) {
    return 'bar'
  }
  if (normalizedBusiness.includes('retail')) {
    return 'clothing_store'
  }

  if (normalizedProperty.includes('restaurant')) return 'restaurant'
  if (normalizedProperty.includes('retail')) return 'store'
  if (normalizedProperty.includes('office')) return 'point_of_interest'

  return 'point_of_interest'
}

function buildMockResponse(lat: number, lng: number): LocationIntelligenceResponse {
  // Simple mock data tuned for F&B / retail in urban Bangalore-like context
  const competitors: Competitor[] = [
    {
      name: 'Popular Cafe & Co.',
      lat: lat + 0.001,
      lng: lng + 0.001,
      distanceMeters: 160,
      rating: 4.4,
      userRatingsTotal: 220,
      address: 'High Street, Nearby Market',
    },
    {
      name: 'Neighbourhood QSR',
      lat: lat - 0.0012,
      lng: lng + 0.0007,
      distanceMeters: 210,
      rating: 4.1,
      userRatingsTotal: 180,
      address: 'Main Road Junction',
    },
    {
      name: 'Local Bistro',
      lat: lat + 0.0006,
      lng: lng - 0.0011,
      distanceMeters: 190,
      rating: 4.0,
      userRatingsTotal: 95,
      address: 'Corner Plot Opp. Park',
    },
  ]

  return {
    competitors,
    footfall: {
      dailyAverage: 5200,
      peakHours: ['12:00–2:30 PM', '7:00–10:30 PM'],
      weekendBoost: 1.4,
      confidence: 'medium',
    },
    demographics: {
      ageGroups: [
        { range: '18–24', percentage: 22 },
        { range: '25–34', percentage: 38 },
        { range: '35–44', percentage: 24 },
        { range: '45+', percentage: 16 },
      ],
      incomeLevel: 'mixed',
      lifestyle: ['Young professionals', 'Working couples', 'Students', 'Early families'],
    },
    accessibility: {
      walkScore: 82,
      transitScore: 76,
      nearestMetro: { name: 'Nearby Metro Station', distanceMeters: 650 },
      nearestBusStop: { name: 'High Street Bus Stop', distanceMeters: 180 },
    },
    market: {
      saturationLevel: 'medium',
      competitorCount: competitors.length,
      summary:
        'Good opportunity with a healthy mix of established brands and independents. Focus on differentiation and strong brand positioning.',
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LocationIntelligenceRequest
    let { lat, lng, address, city, state, propertyType, businessType } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      // If coordinates missing, try to geocode using address + city
      const apiKey =
        process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      const locationQuery = [address, city, state].filter(Boolean).join(', ')

      if (apiKey && locationQuery) {
        const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json')
        geocodeUrl.searchParams.set('address', locationQuery)
        geocodeUrl.searchParams.set('key', apiKey)

        const geoRes = await fetch(geocodeUrl.toString())
        const geoJson = await geoRes.json()

        if (geoJson.results && geoJson.results[0]?.geometry?.location) {
          lat = geoJson.results[0].geometry.location.lat
          lng = geoJson.results[0].geometry.location.lng
        }
      }
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Latitude and longitude are required or must be derivable from address.',
        },
        { status: 400 }
      )
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const placeType = mapToPlaceType(propertyType, businessType)

    let competitors: Competitor[] = []

    if (apiKey) {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
      url.searchParams.set('location', `${lat},${lng}`)
      url.searchParams.set('radius', '1000')
      url.searchParams.set('type', placeType)
      url.searchParams.set('key', apiKey)

      const res = await fetch(url.toString())
      const json = await res.json()

      if (Array.isArray(json.results)) {
        competitors = json.results.map((place: any) => {
          const compLat = place.geometry?.location?.lat
          const compLng = place.geometry?.location?.lng

          const hasCoords =
            typeof compLat === 'number' && typeof compLng === 'number'

          const distanceMeters = hasCoords
            ? haversineDistanceMeters({ lat: lat as number, lng: lng as number }, { lat: compLat, lng: compLng })
            : Number.NaN

          return {
            name: place.name,
            lat: compLat ?? 0,
            lng: compLng ?? 0,
            distanceMeters: distanceMeters,
            rating: typeof place.rating === 'number' ? place.rating : undefined,
            userRatingsTotal:
              typeof place.user_ratings_total === 'number'
                ? place.user_ratings_total
                : undefined,
            address: place.vicinity || place.formatted_address,
          } as Competitor
        })

        // Filter out entries without coordinates
        competitors = competitors.filter(
          (c) => Number.isFinite(c.distanceMeters) && c.distanceMeters >= 0
        )

        // Sort competitors by distance
        competitors.sort((a, b) => a.distanceMeters - b.distanceMeters)
      }
    }

    // If Google API not configured or returned nothing, fall back to mock
    let response: LocationIntelligenceResponse
    if (!apiKey || competitors.length === 0) {
      response = buildMockResponse(lat as number, lng as number)
    } else {
      const competitorCount = competitors.length
      let saturation: 'low' | 'medium' | 'high' = 'medium'

      if (competitorCount <= 3) saturation = 'low'
      else if (competitorCount >= 10) saturation = 'high'

      const footfall: LocationIntelligenceResponse['footfall'] = {
        dailyAverage: 3000 + competitorCount * 250,
        peakHours: ['12:00–2:30 PM', '7:00–10:00 PM'],
        weekendBoost: competitorCount >= 10 ? 1.3 : competitorCount >= 5 ? 1.4 : 1.5,
        confidence: competitorCount >= 8 ? 'high' : competitorCount >= 4 ? 'medium' : 'low',
      }

      const demographics: LocationIntelligenceResponse['demographics'] = {
        ageGroups: [
          { range: '18–24', percentage: 24 },
          { range: '25–34', percentage: 40 },
          { range: '35–44', percentage: 22 },
          { range: '45+', percentage: 14 },
        ],
        incomeLevel: 'mixed',
        lifestyle: ['Young professionals', 'Office crowd', 'After-work hangouts'],
      }

      const accessibility: LocationIntelligenceResponse['accessibility'] = {
        walkScore: 75,
        transitScore: 72,
        nearestMetro: { name: 'Nearest Metro (approx.)', distanceMeters: 800 },
        nearestBusStop: { name: 'Nearest Bus Stop (approx.)', distanceMeters: 250 },
      }

      const summaryMap: Record<'low' | 'medium' | 'high', string> = {
        low: 'Excellent whitespace for a new entrant. Strong opportunity to establish a flagship outlet.',
        medium:
          'Balanced competition. Focus on concept, experience, and brand to stand out in this micro-market.',
        high: 'Highly saturated pocket. Works best for strong brands with clear differentiation and loyal demand.',
      }

      response = {
        competitors,
        footfall,
        demographics,
        accessibility,
        market: {
          saturationLevel: saturation,
          competitorCount,
          summary: summaryMap[saturation],
        },
      }
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error: any) {
    console.error('[LocationIntelligence] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch location intelligence',
      },
      { status: 500 }
    )
  }
}


