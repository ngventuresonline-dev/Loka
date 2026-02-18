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

/** Google Places type + optional keyword for category-specific competitor search */
function mapToPlaceTypeAndKeyword(propertyType?: string, businessType?: string): { type: string; keyword: string } {
  const raw = `${businessType || ''} ${propertyType || ''}`.toLowerCase()
  const b = (businessType || '').toLowerCase()
  const p = (propertyType || '').toLowerCase()

  // QSR / Cafe / Coffee – only show same category
  if (/\b(qsr|quick service|fast food)\b/.test(raw) || /\bcafe\b/.test(raw) || /\bcoffee\b/.test(raw) || /\bcafé\b/.test(raw)) {
    return { type: 'cafe', keyword: 'cafe coffee' }
  }
  if (/\brestaurant\b/.test(raw) || p.includes('restaurant')) {
    return { type: 'restaurant', keyword: 'restaurant' }
  }
  // Desserts / bakery / sweets – show closest category
  if (/\b(dessert|desserts|sweet|sweets|bakery|ice cream|cake)\b/.test(raw)) {
    return { type: 'bakery', keyword: 'dessert bakery sweets' }
  }
  if (/\bbar\b/.test(raw) || /\bbrew\b/.test(raw)) {
    return { type: 'bar', keyword: 'bar' }
  }
  if (/\bretail\b/.test(raw) || p.includes('retail')) {
    return { type: 'clothing_store', keyword: 'retail store' }
  }
  if (p.includes('office')) {
    return { type: 'point_of_interest', keyword: 'office' }
  }

  return { type: 'point_of_interest', keyword: '' }
}

/** Deterministic seed 0..n-1 from location + business for peak hours */
function locationSeed(lat: number, lng: number, businessType?: string): number {
  const s = `${Math.round(lat * 100)}_${Math.round(lng * 100)}_${(businessType || '').toLowerCase()}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const PEAK_HOURS_VARIANTS: string[][] = [
  ['12:00–2:30 PM', '7:00–10:00 PM'],
  ['11:00 AM–2:00 PM', '6:30–9:30 PM'],
  ['10:30 AM–1:30 PM', '5:00–8:00 PM'],
  ['1:00–3:00 PM', '8:00–10:30 PM'],
  ['10:00 AM–12:00 PM', '4:00–7:00 PM'],
]

/** Bangalore area centres (lat, lng) – used to assign area-specific demographics by nearest match */
const BANGALORE_AREAS: { key: string; lat: number; lng: number }[] = [
  { key: 'hsr layout', lat: 12.9121, lng: 77.6446 },
  { key: 'koramangala', lat: 12.9352, lng: 77.6245 },
  { key: 'indiranagar', lat: 12.9784, lng: 77.6408 },
  { key: 'jayanagar', lat: 12.925, lng: 77.5936 },
  { key: 'jp nagar', lat: 12.9063, lng: 77.5857 },
  { key: 'btm layout', lat: 12.9166, lng: 77.6101 },
  { key: 'mg road', lat: 12.975, lng: 77.6063 },
  { key: 'ub city', lat: 12.9716, lng: 77.5946 },
  { key: 'whitefield', lat: 12.9698, lng: 77.7499 },
]

type DemographicsVariant = { ageGroups: { range: string; percentage: number }[]; incomeLevel: 'low' | 'medium' | 'high' | 'mixed'; lifestyle: string[] }

/** Area-specific demographics and lifestyle – each area has its own crowd pull */
const AREA_DEMOGRAPHICS: Record<string, DemographicsVariant> = {
  'hsr layout': {
    ageGroups: [{ range: '18–24', percentage: 28 }, { range: '25–34', percentage: 42 }, { range: '35–44', percentage: 20 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'medium',
    lifestyle: ['Students', 'Office goers', 'Tech workers', 'Startup crowd', 'Unicorn Street'],
  },
  koramangala: {
    ageGroups: [{ range: '18–24', percentage: 26 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 24 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'medium',
    lifestyle: ['Young professionals', 'Office crowd', 'Cafe hoppers', 'Weekend crowd'],
  },
  indiranagar: {
    ageGroups: [{ range: '18–24', percentage: 24 }, { range: '25–34', percentage: 44 }, { range: '35–44', percentage: 22 }, { range: '45+', percentage: 10 }],
    incomeLevel: 'high',
    lifestyle: ['Young professionals', 'After-work hangouts', 'Nightlife', 'Foodies'],
  },
  jayanagar: {
    ageGroups: [{ range: '18–24', percentage: 20 }, { range: '25–34', percentage: 32 }, { range: '35–44', percentage: 28 }, { range: '45+', percentage: 20 }],
    incomeLevel: 'mixed',
    lifestyle: ['Families', 'Local shoppers', 'Residential crowd', 'Traditional retail'],
  },
  'jp nagar': {
    ageGroups: [{ range: '18–24', percentage: 22 }, { range: '25–34', percentage: 36 }, { range: '35–44', percentage: 26 }, { range: '45+', percentage: 16 }],
    incomeLevel: 'mixed',
    lifestyle: ['Families', 'Office goers', 'Local shoppers', 'Working couples'],
  },
  'btm layout': {
    ageGroups: [{ range: '18–24', percentage: 30 }, { range: '25–34', percentage: 38 }, { range: '35–44', percentage: 20 }, { range: '45+', percentage: 12 }],
    incomeLevel: 'medium',
    lifestyle: ['Students', 'Budget-conscious', 'Young professionals', 'Quick service'],
  },
  'mg road': {
    ageGroups: [{ range: '18–24', percentage: 22 }, { range: '25–34', percentage: 38 }, { range: '35–44', percentage: 26 }, { range: '45+', percentage: 14 }],
    incomeLevel: 'high',
    lifestyle: ['Office crowd', 'Premium dining', 'Corporates', 'High-end retail'],
  },
  'ub city': {
    ageGroups: [{ range: '18–24', percentage: 18 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 28 }, { range: '45+', percentage: 14 }],
    incomeLevel: 'high',
    lifestyle: ['Premium dining', 'Corporates', 'High-end retail', 'Office crowd'],
  },
  whitefield: {
    ageGroups: [{ range: '18–24', percentage: 24 }, { range: '25–34', percentage: 44 }, { range: '35–44', percentage: 24 }, { range: '45+', percentage: 8 }],
    incomeLevel: 'high',
    lifestyle: ['Tech workers', 'Office goers', 'Expats', 'Corporate crowd'],
  },
}

const DEFAULT_DEMOGRAPHICS: DemographicsVariant = {
  ageGroups: [{ range: '18–24', percentage: 24 }, { range: '25–34', percentage: 40 }, { range: '35–44', percentage: 22 }, { range: '45+', percentage: 14 }],
  incomeLevel: 'mixed',
  lifestyle: ['Young professionals', 'Office crowd', 'Local shoppers'],
}

/** Find nearest Bangalore area by lat/lng; return its demographics or default */
function getDemographicsForArea(lat: number, lng: number): DemographicsVariant {
  let nearestKey: string | null = null
  let nearestDist = Infinity
  for (const area of BANGALORE_AREAS) {
    const d = haversineDistanceMeters({ lat, lng }, { lat: area.lat, lng: area.lng })
    if (d < nearestDist) {
      nearestDist = d
      nearestKey = area.key
    }
  }
  // Use area demographics if within ~8 km of an area centre; otherwise default
  if (nearestKey != null && nearestDist < 8000) {
    return AREA_DEMOGRAPHICS[nearestKey] ?? DEFAULT_DEMOGRAPHICS
  }
  return DEFAULT_DEMOGRAPHICS
}

function buildMockResponse(lat: number, lng: number): LocationIntelligenceResponse {
  return {
    competitors: [],
    footfall: {
      dailyAverage: 0,
      peakHours: [],
      weekendBoost: 1.3,
      confidence: 'low',
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
      walkScore: 70,
      transitScore: 65,
      nearestMetro: undefined,
      nearestBusStop: undefined,
    },
    market: {
      saturationLevel: 'low',
      competitorCount: 0,
      summary: 'Enable Google Maps APIs (Places, Geocoding) for competitor and transit data.',
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: LocationIntelligenceRequest
    try {
      body = await request.json() as LocationIntelligenceRequest
    } catch (jsonError: any) {
      console.error('[LocationIntelligence API] JSON parse error:', jsonError)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      )
    }

    let { lat, lng, address, city, state, propertyType, businessType } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      // If coordinates missing, try to geocode using address + city
      const apiKey =
        process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      const locationQuery = [address, city, state].filter(Boolean).join(', ')

      if (apiKey && locationQuery) {
        try {
          const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json')
          geocodeUrl.searchParams.set('address', locationQuery)
          geocodeUrl.searchParams.set('key', apiKey)

          const geoRes = await fetch(geocodeUrl.toString(), {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })
          
          if (!geoRes.ok) {
            console.warn('[LocationIntelligence API] Geocode API returned error:', geoRes.status)
          } else {
            const geoJson = await geoRes.json()

            if (geoJson.results && geoJson.results[0]?.geometry?.location) {
              lat = geoJson.results[0].geometry.location.lat
              lng = geoJson.results[0].geometry.location.lng
            }
          }
        } catch (geocodeError: any) {
          console.warn('[LocationIntelligence API] Geocode failed:', geocodeError.message)
          // Continue without coordinates if geocoding fails
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

    // #region agent log
    const envCheck = {
      hasGoogleMapsApiKey: !!process.env.GOOGLE_MAPS_API_KEY,
      hasNextPublicGoogleMapsApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      apiKeyLength1: process.env.GOOGLE_MAPS_API_KEY?.length || 0,
      apiKeyLength2: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0,
    }
    fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:295',message:'API key environment check',data:envCheck,timestamp:Date.now(),runId:'prod-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:301',message:'API key resolved value',data:{hasApiKey:!!apiKey,apiKeyPrefix:apiKey?.substring(0,4)||'none',apiKeySuffix:apiKey?.substring(apiKey?.length-4)||'none'},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!apiKey) {
      console.warn('[LocationIntelligence API] Google Maps API key not found. Set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in environment variables.')
    }
    
    const { type: placeType, keyword: placeKeyword } = mapToPlaceTypeAndKeyword(propertyType, businessType)

    let competitors: Competitor[] = []

    if (apiKey) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
        url.searchParams.set('location', `${lat},${lng}`)
        url.searchParams.set('radius', '1000')
        url.searchParams.set('type', placeType)
        if (placeKeyword) url.searchParams.set('keyword', placeKeyword)
        url.searchParams.set('key', apiKey)

        const res = await fetch(url.toString(), {
          signal: AbortSignal.timeout(15000) // 15 second timeout
        })
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:315',message:'Places API fetch response',data:{status:res.status,statusText:res.statusText,ok:res.ok,url:url.toString().substring(0,100)},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error')
          console.warn('[LocationIntelligence API] Places API HTTP error:', res.status, errorText.substring(0, 200))
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:320',message:'Places API HTTP error',data:{status:res.status,errorText:errorText.substring(0,200)},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } else {
          const json = await res.json()

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:324',message:'Places API JSON response',data:{status:json.status,errorMessage:json.error_message||'none',resultsCount:Array.isArray(json.results)?json.results.length:0},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          // Check for Places API errors in response
          if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
            const errorMsg = json.error_message || ''
            console.error('[LocationIntelligence API] Places API error status:', json.status, errorMsg)
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:330',message:'Places API error status',data:{status:json.status,errorMessage:errorMsg},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            // If REQUEST_DENIED, INVALID_REQUEST, etc. - log error but continue to return location-based data
            if (json.status === 'REQUEST_DENIED') {
              console.error('[LocationIntelligence API] Places API access denied. Check API key restrictions, enabled APIs, and billing.')
            } else if (json.status === 'OVER_QUERY_LIMIT') {
              console.error('[LocationIntelligence API] Places API quota exceeded. Check billing and quota limits.')
            }
            // Continue - we'll still return location-based demographics/footfall even if competitors fetch failed
          } else {
            // Process results - OK or ZERO_RESULTS are both valid
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
        }
      } catch (placesError: any) {
        console.error('[LocationIntelligence API] Places API fetch failed:', placesError.message)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:375',message:'Places API fetch exception',data:{errorName:placesError.name,errorMessage:placesError.message,errorStack:placesError.stack?.substring(0,200)},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // Continue - we'll still return location-based demographics/footfall even if competitors fetch failed
      }
    }

    // Fetch nearest metro (real data) when we have API key
    let nearestMetro: { name: string; distanceMeters: number } | undefined
    let nearestBusStop: { name: string; distanceMeters: number } | undefined
    if (apiKey && typeof lat === 'number' && typeof lng === 'number') {
      try {
        const transitUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
        transitUrl.searchParams.set('location', `${lat},${lng}`)
        transitUrl.searchParams.set('radius', '2000')
        transitUrl.searchParams.set('keyword', 'metro station Namma Metro')
        transitUrl.searchParams.set('key', apiKey)
        const transitRes = await fetch(transitUrl.toString(), { signal: AbortSignal.timeout(8000) })
        if (transitRes.ok) {
          const transitJson = await transitRes.json()
          const first = transitJson.results?.[0]
          if (first?.geometry?.location && first?.name) {
            const metroLat = first.geometry.location.lat
            const metroLng = first.geometry.location.lng
            nearestMetro = {
              name: first.name,
              distanceMeters: Math.round(haversineDistanceMeters({ lat, lng }, { lat: metroLat, lng: metroLng })),
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Build response - use real data if we have API key, even if competitors is empty (ZERO_RESULTS is valid)
    let response: LocationIntelligenceResponse
    if (!apiKey) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:410',message:'Using mock response - no API key',data:{lat,lng},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // No API key - use mock response
      response = buildMockResponse(lat as number, lng as number)
      if (nearestMetro) response.accessibility.nearestMetro = nearestMetro
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:415',message:'Building real response with API key',data:{competitorCount:competitors.length,hasCompetitors:competitors.length>0},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // We have API key - use real data (even if competitors is empty, that's valid - means no competitors found)
      const competitorCount = competitors.length
      let saturation: 'low' | 'medium' | 'high' = 'medium'
      if (competitorCount <= 2) saturation = 'low'
      else if (competitorCount >= 8) saturation = 'high'

      // Category-based footfall estimate (modeled; not real sensor data – we don't have live footfall APIs)
      const isFb = ['restaurant', 'cafe', 'bar', 'bakery'].includes(placeType)
      const baseDaily = isFb ? 2800 : 1800
      const perCompetitor = isFb ? 180 : 120
      const dailyAverage = Math.round(baseDaily + competitorCount * perCompetitor)

      const seed = locationSeed(lat as number, lng as number, businessType)
      const peakVariant = PEAK_HOURS_VARIANTS[seed % PEAK_HOURS_VARIANTS.length]
      const demoVariant = getDemographicsForArea(lat as number, lng as number)

      const footfall: LocationIntelligenceResponse['footfall'] = {
        dailyAverage,
        peakHours: isFb ? peakVariant : PEAK_HOURS_VARIANTS[(seed + 1) % PEAK_HOURS_VARIANTS.length],
        weekendBoost: competitorCount >= 8 ? 1.25 : competitorCount >= 4 ? 1.35 : 1.45,
        confidence: competitorCount >= 6 ? 'high' : competitorCount >= 3 ? 'medium' : 'low',
      }

      const demographics: LocationIntelligenceResponse['demographics'] = {
        ageGroups: demoVariant.ageGroups,
        incomeLevel: demoVariant.incomeLevel,
        lifestyle: demoVariant.lifestyle,
      }

      const accessibility: LocationIntelligenceResponse['accessibility'] = {
        walkScore: 75,
        transitScore: nearestMetro ? (nearestMetro.distanceMeters < 500 ? 82 : nearestMetro.distanceMeters < 1000 ? 72 : 65) : 70,
        nearestMetro: nearestMetro ?? undefined,
        nearestBusStop: nearestBusStop ?? undefined,
      }

      const summaryMap: Record<'low' | 'medium' | 'high', string> = {
        low: `Low saturation in this category (${competitorCount} nearby). Good opportunity to establish presence.`,
        medium:
          `Moderate competition in this category (${competitorCount} nearby). Differentiate by concept and experience.`,
        high: `High saturation in this category (${competitorCount} nearby). Best for strong brands with clear differentiation.`,
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:471',message:'Returning response',data:{success:true,competitorCount:response.competitors.length,footfallDaily:response.footfall.dailyAverage,saturationLevel:response.market.saturationLevel},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error: any) {
    console.error('[LocationIntelligence] Error:', error)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'location-intelligence/route.ts:476',message:'Top-level error caught',data:{errorName:error.name,errorMessage:error.message,errorStack:error.stack?.substring(0,200)},timestamp:Date.now(),runId:'prod-debug',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch location intelligence',
      },
      { status: 500 }
    )
  }
}


