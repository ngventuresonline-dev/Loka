'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { GoogleMap, Marker, Circle, useLoadScript } from '@react-google-maps/api'
import type { Property } from '@/types/workflow'
import { motion } from 'framer-motion'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'

type LocationIntelligenceData = {
  competitors: {
    name: string
    lat: number
    lng: number
    distanceMeters: number
    rating?: number
    userRatingsTotal?: number
    address?: string
    brandType?: 'popular' | 'new'
    placeCategory?: 'cafe' | 'qsr'
  }[]
  footfall: {
    dailyAverage: number
    peakHours: string[]
    weekendBoost: number
    confidence: 'low' | 'medium' | 'high'
    hourlyPattern?: number[]
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
    saturationIndex?: number
    whitespaceScore?: number
    demandGapScore?: number
  }
  scores?: {
    saturationIndex: number
    whitespaceScore: number
    demandGapScore: number
    revenueProjectionMonthly: number
    revenueInputs?: {
      dailyFootfall: number
      captureRatePercent: number
      avgTicketSize: number
      areaMultiplier?: number
      category?: string
      note: string
    }
    rentViability?: {
      monthlyRent: number
      revenueProjection: number
      rentAsPctOfRevenue: number
      viable: boolean
      benchmarkHealthyPct?: number
    }
  }
  dataSource?: {
    competitors: 'mappls' | 'google' | 'none'
    transit: 'mappls' | 'google' | 'none'
    geocoding: 'mappls' | 'google' | 'none'
  }
  catchment?: Array<{ pincode: string; name: string; sharePct: number; distanceM: number }>
  crowdPullers?: Array<{ name: string; category: string; distanceMeters: number; footfallTag?: string }>
  retailMix?: Array<{ category: string; branded: number; nonBranded: number; total: number }>
  marketPotentialScore?: number
  similarMarkets?: Array<{ area: string; score: number; distanceM: number }>
  populationLifestyle?: {
    totalHouseholds?: number
    affluenceIndicator?: string
    rentPerSqft?: number
    benchmarkNote?: string
    dataSource?: string
  }
  cannibalisationRisk?: Array<{
    brand: string
    outletCount: number
    nearestSameBrandDistanceM: number
    cannibalisationPct: number
  }>
}

interface LocationIntelligenceProps {
  property: Property
  businessType?: string
}

const containerStyle = {
  width: '100%',
  height: '100%',
}

const radiusMeters = 1000

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  jayanagar: { lat: 12.925, lng: 77.5936 },
  'jayanagar 4th block': { lat: 12.925, lng: 77.5936 },
  koramangala: { lat: 12.9352, lng: 77.6245 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  whitefield: { lat: 12.9698, lng: 77.7499 },
  'hsr layout': { lat: 12.9121, lng: 77.6446 },
  'ub city': { lat: 12.9716, lng: 77.5946 },
  'mg road': { lat: 12.975, lng: 77.6063 },
  'btm layout': { lat: 12.9166, lng: 77.6101 },
  'jp nagar': { lat: 12.9063, lng: 77.5857 },
}

function getApproxCoords(property: Property): { lat: number; lng: number } | null {
  if ((property as any).latitude != null && (property as any).longitude != null) {
    return {
      lat: Number((property as any).latitude),
      lng: Number((property as any).longitude),
    }
  }

  if (property.coordinates) {
    return property.coordinates
  }

  // Prefer locality that appears earliest in address (avoids HSR property matching Koramangala when both appear)
  const allText = `${property.address || ''} ${property.city || ''} ${property.state || ''} ${(property as any).title || ''}`.toLowerCase()
  let bestKey: string | null = null
  let bestIndex = Infinity
  for (const cityKey of Object.keys(cityCoordinates)) {
    const idx = allText.indexOf(cityKey)
    if (idx >= 0 && idx < bestIndex) {
      bestIndex = idx
      bestKey = cityKey
    }
  }
  if (bestKey) return cityCoordinates[bestKey]

  // Fallback: city name only (e.g. "Bangalore" → city center)
  const key = property.city?.toLowerCase?.().trim() || ''
  if (cityCoordinates[key]) return cityCoordinates[key]

  return null
}

function formatDistance(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function getSaturationColor(level: 'low' | 'medium' | 'high') {
  if (level === 'low') return 'bg-green-100 text-green-800 border-green-300'
  if (level === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

function InfoTooltip({ text, className = '', asChild }: { text: string; className?: string; asChild?: boolean }) {
  const [show, setShow] = useState(false)
  const id = useId()
  const triggerProps = {
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); setShow((s) => !s) },
    onFocus: () => setShow(true),
    onBlur: () => setShow(false),
    title: text,
    'aria-label': 'More info',
    'aria-describedby': show ? id : undefined,
  }
  const triggerClass = 'inline-flex items-center justify-center min-w-[18px] min-h-[18px] w-[18px] h-[18px] sm:min-w-[20px] sm:min-h-[20px] sm:w-5 sm:h-5 rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 hover:text-gray-800 active:bg-gray-500 text-[10px] sm:text-xs font-semibold cursor-help touch-manipulation'
  return (
    <span className={`relative inline-flex ${className}`}>
      {asChild ? (
        <span role="button" tabIndex={0} {...triggerProps} className={triggerClass} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShow((s) => !s) } }}>i</span>
      ) : (
        <button
          type="button"
          {...triggerProps}
          className={triggerClass}
        >
          i
        </button>
      )}
      {show && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-[100] px-3 py-2 text-[11px] sm:text-xs text-gray-100 bg-gray-900 rounded-lg shadow-xl max-w-[260px] sm:max-w-[280px] whitespace-normal pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  )
}

/** Heuristic: classify competitor as cafe vs qsr when API doesn't provide placeCategory. */
function competitorCategoryFromName(name: string): 'cafe' | 'qsr' | 'other' {
  const n = name.toLowerCase()
  if (/\b(starbucks|cafe|coffee|ccd|barista|third wave|chaayos|chai point|costa|blue tokai|filter coffee|espresso)\b/.test(n)) return 'cafe'
  if (/\b(mcdonald|mcd|kfc|pizza|domino|subway|burger|faasos|wow momo|haldiram|bikanervala|jumbo king|aladdin|mpc|qsr|fast food)\b/.test(n)) return 'qsr'
  if (/\b(shawarma|shwarma|biryani|rolls?|momos?|wraps?|kebab|tikka|wok|dosa|idli|uttapam|paratha|chaat|vada|samosa)\b/.test(n)) return 'qsr'
  if (/\b(box8|behrouz|leon grill|empire|saravana|sagar ratna)\b/.test(n)) return 'qsr'
  return 'other'
}

function getCompetitorCategory(c: { name: string; placeCategory?: 'cafe' | 'qsr' }): 'cafe' | 'qsr' | 'other' {
  if (c.placeCategory) return c.placeCategory
  return competitorCategoryFromName(c.name)
}

export function LocationIntelligence({ property, businessType }: LocationIntelligenceProps) {
  const [data, setData] = useState<LocationIntelligenceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [revenueExpanded, setRevenueExpanded] = useState(false)
  const [competitorFilter, setCompetitorFilter] = useState<'all' | 'cafe' | 'qsr'>('all')
  const [compareExpanded, setCompareExpanded] = useState(false)
  const [compareLat, setCompareLat] = useState('')
  const [compareLng, setCompareLng] = useState('')
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareData, setCompareData] = useState<{
    locationA: LocationIntelligenceData
    locationB: LocationIntelligenceData
    labelA: string
    labelB: string
  } | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)

  const coordinates = useMemo(() => getApproxCoords(property), [property])

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  // Debug logging for map loading state
  useEffect(() => {
    const apiKey = getGoogleMapsApiKey()
    console.log('[LocationIntelligence] Map state:', {
      isLoaded,
      loadError: loadError?.message || null,
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'Missing',
      googleMapsAvailable: typeof window !== 'undefined' && window.google && window.google.maps ? 'Yes' : 'No',
    })
    
    // Check if script loaded but API failed
    if (isLoaded && !loadError && typeof window !== 'undefined' && (!window.google || !window.google.maps)) {
      console.error('[LocationIntelligence] Script loaded but Google Maps API not available. Check API key restrictions and enabled APIs.')
      setError('Google Maps API not available. Please check API key configuration and domain restrictions.')
    }
    
    // Check for load errors
    if (loadError) {
      console.error('[LocationIntelligence] Google Maps load error:', loadError)
      setError(`Google Maps failed to load: ${loadError.message || 'Check API key and domain restrictions'}`)
    }
  }, [isLoaded, loadError])

  useEffect(() => {
    // AbortController to cancel previous requests
    const abortController = new AbortController()
    let mounted = true

    const fetchData = async () => {
      if (!coordinates) {
        if (mounted) {
          setError('No location data available for this property.')
        }
        return
      }

      // Debounce to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 300))

      // Check if component is still mounted and not aborted
      if (!mounted || abortController.signal.aborted) {
        return
      }

      try {
        if (mounted) {
          setLoading(true)
          setError(null)
        }

        const rawPrice = property.price != null ? Number(property.price) : NaN
        const monthlyRent = !Number.isFinite(rawPrice)
          ? undefined
          : property.priceType === 'yearly'
            ? rawPrice / 12
            : property.priceType === 'sqft' && property.size
              ? rawPrice * Number(property.size)
              : rawPrice

        const response = await fetch('/api/location-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: coordinates.lat,
            lng: coordinates.lng,
            address: property.address,
            city: property.city,
            state: property.state,
            propertyType: property.propertyType,
            businessType,
            monthlyRent: monthlyRent != null && monthlyRent > 0 ? Math.round(monthlyRent) : undefined,
            sizeSqft: property.size != null ? Number(property.size) : undefined,
          }),
          signal: abortController.signal,
        })

        // Check if request was aborted
        if (abortController.signal.aborted || !mounted) {
          return
        }

        if (!response.ok) {
          let errorMessage = 'Unable to load location intelligence right now.'
          try {
            const body = await response.json()
            if (body?.error) {
              errorMessage = body.error
            }
            console.error('[LocationIntelligence] API error:', body)
          } catch (parseError) {
            console.error('[LocationIntelligence] API error (non-JSON response):', response.status, response.statusText)
          }
          if (mounted) {
            setError(errorMessage)
            setLoading(false)
          }
          return
        }

        const json = await response.json()
        if (mounted && !abortController.signal.aborted) {
          const payload = json?.data ?? json
          const isValid = payload?.market && typeof payload.market === 'object'
          setData(isValid ? payload : null)
          if (json?.success && !isValid) {
            setError('Location data could not be parsed. Please try again.')
          }
          setLoading(false)
        }
      } catch (err: any) {
        // Don't set error if request was aborted (component unmounted or new request started)
        if (err.name === 'AbortError' || abortController.signal.aborted || !mounted) {
          return
        }

        // Handle network errors gracefully
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          console.warn('[LocationIntelligence] Network error - connection may have changed or server unavailable')
          if (mounted) {
            setError('Unable to load location intelligence. Please check your connection and try again.')
          }
        } else {
          console.error('[LocationIntelligence] Fetch failed:', err)
          if (mounted) {
            setError('Unable to load location intelligence right now.')
          }
        }
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Cleanup function to abort request if component unmounts or dependencies change
    return () => {
      mounted = false
      abortController.abort()
    }
  }, [coordinates?.lat, coordinates?.lng, property.address, property.city, property.state, property.propertyType, property.price, property.priceType, property.size, businessType])

  const runCompare = async () => {
    if (!coordinates) return
    const lat = parseFloat(compareLat)
    const lng = parseFloat(compareLng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCompareError('Enter valid lat (-90 to 90) and lng (-180 to 180)')
      return
    }
    setCompareError(null)
    setCompareLoading(true)
    try {
      const res = await fetch('/api/location-intelligence/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: [
            { lat: coordinates.lat, lng: coordinates.lng, label: property.address || property.title },
            { lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` },
          ],
          propertyType: property.propertyType,
          businessType,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCompareError(json?.error || 'Comparison failed')
        return
      }
      setCompareData(json.comparison)
    } catch (e: unknown) {
      setCompareError((e as Error)?.message || 'Comparison failed')
    } finally {
      setCompareLoading(false)
    }
  }

  if (!coordinates) {
    return null
  }

  // Show insights even if Google Maps fails to load (we can still show data from API)
  const hasInsights = !!data && !error

  const isCafeQSR = /cafe|qsr|coffee|fast food|quick service/i.test(businessType || '')
  const allCompetitors = data?.competitors ?? []
  const filterCompetitors = (list: typeof allCompetitors) => {
    if (competitorFilter === 'all') return list
    return list.filter((c) => getCompetitorCategory(c) === competitorFilter)
  }
  const newBrands = filterCompetitors(allCompetitors).filter((c) => (c.brandType ?? 'new') === 'new')
  const popularBrands = filterCompetitors(allCompetitors).filter((c) => c.brandType === 'popular')
  const unfilteredNew = allCompetitors.filter((c) => (c.brandType ?? 'new') === 'new')
  const unfilteredPopular = allCompetitors.filter((c) => c.brandType === 'popular')

  const opportunityScore = data?.scores ? Math.round(
    (data.scores.whitespaceScore + data.scores.demandGapScore) / 2
  ) : null

  return (
    <div className="mt-6 sm:mt-8 space-y-4 lg:space-y-5 w-full max-w-7xl">
      {/* Hero + score – compact on desktop */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-5 sm:p-6 lg:py-5 lg:px-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)]">
        <div className="absolute top-0 right-0 w-48 h-48 lg:w-56 lg:h-56 bg-gradient-to-bl from-[#FF5200]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 lg:gap-6">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1.5 text-[10px] sm:text-xs font-medium text-white/95 mb-3 tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              1 KM MICRO-MARKET · LIVE
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight break-words">
              Location Intelligence
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              Should you open here? Competition, footfall, and revenue potential at a glance.
            </p>
          </div>
          {hasInsights && opportunityScore != null && (
            <div className="flex flex-col items-center sm:items-end flex-shrink-0">
              <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Opportunity Score
              </div>
              <div className="inline-flex items-baseline gap-0.5 whitespace-nowrap" aria-label={`Opportunity score ${opportunityScore} out of 100`}>
                <span className="text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums bg-gradient-to-br from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
                  {opportunityScore}
                </span>
                <span className="text-lg sm:text-xl text-slate-400 font-medium">/100</span>
              </div>
            </div>
          )}
          {hasInsights && data && opportunityScore == null && (
            <span
              className={`inline-flex items-center px-4 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap flex-shrink-0 ${getSaturationColor(
                data.market.saturationLevel
              )}`}
            >
              {data.market.saturationLevel === 'low' ? 'Low Saturation' : data.market.saturationLevel === 'medium' ? 'Medium' : 'High Saturation'}
            </span>
          )}
        </div>
      </div>

      {/* Map + metrics – tighter grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,360px)] xl:grid-cols-[minmax(0,1.4fr)_380px] gap-4 lg:gap-5">
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                AI
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Competition Map · 1 km Radius</span>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
              {hasInsights && data?.dataSource && (
                <span className="text-[9px] sm:text-[10px] text-gray-400 whitespace-nowrap">
                  {data.dataSource.competitors === 'mappls' ? (
                    <span title="India-native POI data from Mappls">India POI: Mappls</span>
                  ) : data.dataSource.competitors === 'google' ? (
                    'POI: Google'
                  ) : (
                    'POI: —'
                  )}{' '}
                  · Map: Google
                </span>
              )}
              <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                Lat {coordinates.lat.toFixed(4)}, Lng {coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64 md:h-72 lg:h-[320px] min-h-[220px]">
            {!isLoaded && !loadError && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-600">Loading map…</p>
                </div>
              </div>
            )}
            {loadError && (
              <div className="relative flex items-center justify-center h-full px-4 sm:px-6 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/5 to-[#FFB199]/15 blur-sm" />
                <div className="absolute inset-4 sm:inset-6 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.22)]" />
                <div className="relative z-10 max-w-sm mx-auto px-4 py-6">
                  <div className="flex items-center justify-center mb-4">
                    <LokazenNodesLoader size="md" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 leading-tight">
                    Google Maps Error
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
                    {loadError.message || 'Failed to load Google Maps'}
                  </p>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 text-left">
                      <strong>Debug Info:</strong>
                      <br />
                      API Key: {getGoogleMapsApiKey() ? 'Set' : 'Missing'}
                      <br />
                      Error: {loadError.message || 'Unknown error'}
                      <br />
                      <br />
                      <strong>Common fixes:</strong>
                      <br />
                      1. Restart dev server after adding API key
                      <br />
                      2. Check API key restrictions in Google Cloud Console
                      <br />
                      3. Enable: Maps JavaScript API, Geocoding API, Places API
                      <br />
                      4. Ensure billing is enabled
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-xs sm:text-sm text-gray-100 shadow-[0_10px_25px_rgba(15,23,42,0.45)] mt-4">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AI Location Engine · Live</span>
                  </div>
                </div>
              </div>
            )}
            {isLoaded && !loadError && (
              typeof window !== 'undefined' && window.google && window.google.maps ? (
                <div className="relative h-full overflow-hidden">
                <GoogleMap
                  mapContainerStyle={{ ...containerStyle, height: '100%' }}
                  center={coordinates}
                  zoom={16}
                  options={{
                    ...DEFAULT_MAP_OPTIONS,
                    styles: [],
                    disableDefaultUI: true,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    gestureHandling: 'greedy',
                  }}
                  onLoad={() => {
                    // Map loaded successfully
                  }}
                >
                {/* Radius circle */}
                <Circle
                  center={coordinates}
                  radius={radiusMeters}
                  options={{
                    strokeColor: '#FF5200',
                    strokeOpacity: 0.6,
                    strokeWeight: 1.5,
                    fillColor: '#FF5200',
                    fillOpacity: 0.08,
                  }}
                />

                {/* Property marker */}
                <Marker
                  position={coordinates}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#E4002B',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                />

                {/* Competitor markers */}
                {data?.competitors?.map((c, idx) => (
                  <Marker
                    key={idx}
                    position={{ lat: c.lat, lng: c.lng }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 6,
                      fillColor: '#F97316',
                      fillOpacity: 0.9,
                      strokeColor: '#ffffff',
                      strokeWeight: 1,
                    }}
                  />
                ))}
              </GoogleMap>
                {!hasInsights && loading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none bg-white/60">
                  <div className="relative flex items-center justify-center h-full px-4 sm:px-6 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/5 to-[#FFB199]/15 blur-sm" />
                    <div className="absolute inset-4 sm:inset-6 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.22)]" />
                    <div className="relative z-10 max-w-sm mx-auto px-4 py-6">
                      <div className="flex items-center justify-center mb-4">
                        <LokazenNodesLoader size="md" />
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 leading-tight">
                        Analyzing micro-market…
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                        Loading location signals and competitor data.
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-xs sm:text-sm text-gray-100 shadow-[0_10px_25px_rgba(15,23,42,0.45)]">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>AI Location Engine · Live</span>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
              ) : (
                <div className="flex items-center justify-center h-full px-4 text-center">
                  <div className="text-sm text-gray-600">
                    Google Maps API not available. Check browser console for details.
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {hasInsights ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-4 sm:p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] min-w-0">
            {/* Revenue & viability – primary CTA, expandable breakdown */}
            {data?.scores && (
              <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 lg:p-5 text-white">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setRevenueExpanded((e) => !e)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevenueExpanded((x) => !x) } }}
                  className="w-full text-left focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Potential Revenue</span>
                    <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <InfoTooltip asChild text="Estimated gross monthly revenue. Click to see breakdown. Integrate GeoIQ for real footfall data." className="flex-shrink-0 [&_span]:bg-white/20 [&_span]:text-white [&_span:hover]:bg-white/30 [&_button]:bg-white/20 [&_button]:text-white [&_button:hover]:bg-white/30" />
                      <span className="text-slate-400 text-xs">{revenueExpanded ? '▼' : '▶'}</span>
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                    {data.scores.revenueProjectionMonthly >= 100000
                      ? `₹${(data.scores.revenueProjectionMonthly / 100000).toFixed(1)}L`
                      : `₹${(data.scores.revenueProjectionMonthly / 1000).toFixed(0)}K`}
                    <span className="text-slate-400 text-base font-normal">/mo</span>
                  </div>
                  {data.scores.rentViability && (
                    <div className={`mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${data.scores.rentViability.viable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-200'}`}>
                      {data.scores.rentViability.viable ? (
                        <>Rent {data.scores.rentViability.rentAsPctOfRevenue}% of revenue · Viable</>
                      ) : (
                        <>Rent {data.scores.rentViability.rentAsPctOfRevenue}% of revenue · Review</>
                      )}
                      {data.scores.rentViability.benchmarkHealthyPct != null && (
                        <span className="text-slate-500 font-normal">(benchmark ≤{data.scores.rentViability.benchmarkHealthyPct}%)</span>
                      )}
                    </div>
                  )}
                </div>
                {revenueExpanded && data.scores.revenueInputs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/20 space-y-1.5 text-xs text-slate-300"
                  >
                    <div>Footfall: {data.scores.revenueInputs.dailyFootfall?.toLocaleString()}/day</div>
                    <div>Capture: ~{data.scores.revenueInputs.captureRatePercent}% · Ticket: ₹{data.scores.revenueInputs.avgTicketSize}</div>
                    {data.scores.revenueInputs.areaMultiplier != null && (
                      <div>Area multiplier: {data.scores.revenueInputs.areaMultiplier}x</div>
                    )}
                    <div className="text-slate-400 italic pt-1">{data.scores.revenueInputs.note}</div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Compact metric grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Footfall</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {data ? data.footfall.dailyAverage.toLocaleString('en-IN') : '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">daily est.</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Competitors</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{data?.market.competitorCount ?? '—'}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">1 km radius</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Peak</div>
                <div className="text-sm font-semibold text-slate-900 leading-snug">
                  {data?.footfall.peakHours[0] ?? '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {data ? `+${Math.round((data.footfall.weekendBoost - 1) * 100)}% weekends` : ''}
                </div>
              </div>
            </div>

            {/* Saturation bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Market Saturation</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  data?.market.saturationLevel === 'low' ? 'bg-emerald-100 text-emerald-700' :
                  data?.market.saturationLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {data?.market.saturationLevel ?? '—'}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data?.market.saturationLevel === 'low' ? 'bg-emerald-500' :
                    data?.market.saturationLevel === 'medium' ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: data?.market.saturationLevel === 'low' ? '28%' : data?.market.saturationLevel === 'medium' ? '60%' : '92%' }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-600">{data?.market.summary}</p>
            </div>

            {/* Accessibility */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Accessibility</span>
                <span className="text-[11px] text-slate-500">
                  Walk {data?.accessibility.walkScore ?? '—'} · Transit {data?.accessibility.transitScore ?? '—'}
                </span>
              </div>
              {(data?.accessibility.nearestMetro || data?.accessibility.nearestBusStop) && (
                <div className="space-y-1 text-[11px] text-slate-600">
                  {data.accessibility.nearestMetro && (
                    <div>Metro: {data.accessibility.nearestMetro.name} ({formatDistance(data.accessibility.nearestMetro.distanceMeters)})</div>
                  )}
                  {data.accessibility.nearestBusStop && (
                    <div>Bus: {data.accessibility.nearestBusStop.name} ({formatDistance(data.accessibility.nearestBusStop.distanceMeters)})</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 flex items-center justify-center text-center overflow-hidden relative min-h-[200px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/6 via-[#E4002B]/4 to-[#FFB199]/10 blur-sm" />
            <div className="absolute inset-3 sm:inset-4 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-2xl shadow-[0_18px_45px_rgba(15,23,42,0.25)]" />
            <div className="relative z-10 max-w-sm mx-auto px-4 py-4 space-y-3">
              <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-gray-900 text-xs sm:text-sm text-gray-100 shadow-[0_10px_25px_rgba(15,23,42,0.5)] font-medium">
                Smart Footfall &amp; Demographic Model
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
                Location Signals Will Unlock Soon
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                We&apos;re calibrating footfall, peak-hour, and demographic models for this micro-market. Rich insights will appear here once live data is connected.
              </p>
            </div>
          </div>
        )}
      </div>

      {hasInsights && data && !showDetails && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-[#FF5200]/60 hover:bg-gradient-to-r hover:from-[#FF5200]/5 hover:to-[#E4002B]/5 hover:text-slate-900 transition-all"
          >
            <span>Competitors & Demographics</span>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-[#FF5200] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {hasInsights && data && showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Cafe/QSR filter when applicable */}
          {isCafeQSR && (unfilteredNew.length > 0 || unfilteredPopular.length > 0) && (
            <div className="lg:col-span-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Filter competitors:</span>
              {(['all', 'cafe', 'qsr'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCompetitorFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    competitorFilter === f
                      ? 'bg-[#FF5200] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'cafe' ? 'Cafes' : 'QSR'}
                </button>
              ))}
            </div>
          )}
          <div className="lg:col-span-2 space-y-4">
            {newBrands.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    New Brands
                  </h4>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                    {newBrands.length} emerging
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 mb-3">Discover newer establishments in this micro-market.</p>
                <ul className="divide-y divide-gray-100">
                  {newBrands.slice(0, 6).map((c, idx) => (
                    <li key={`new-${idx}`} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                        {c.address && (
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">{c.address}</div>
                        )}
                      </div>
                      {c.rating != null && (
                        <span className="inline-flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-medium">
                          ★ {c.rating.toFixed(1)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {popularBrands.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-400" />
                    Popular Brands
                  </h4>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                    {popularBrands.length} known chains
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 mb-3">Established brands already in this area.</p>
                <ul className="divide-y divide-gray-100">
                  {popularBrands.slice(0, 4).map((c, idx) => (
                    <li key={`pop-${idx}`} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                        {c.address && (
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">{c.address}</div>
                        )}
                      </div>
                      {c.rating != null && (
                        <span className="inline-flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                          ★ {c.rating.toFixed(1)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {newBrands.length === 0 && popularBrands.length === 0 && (competitorFilter !== 'all' ? allCompetitors.length > 0 : data.competitors.length > 0) && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {competitorFilter !== 'all' ? `No ${competitorFilter === 'cafe' ? 'cafes' : 'QSR'} in this micro-market` : 'Nearby'}
                </h4>
                {competitorFilter !== 'all' ? (
                  <p className="text-xs text-slate-600">Try &quot;All&quot; to see all competitors.</p>
                ) : (
                <ul className="divide-y divide-gray-100">
                  {data.competitors.slice(0, 6).map((c, idx) => (
                    <li key={idx} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                        {c.address && <div className="text-[11px] text-gray-500 truncate mt-0.5">{c.address}</div>}
                      </div>
                      {c.rating != null && (
                        <span className="inline-flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-medium">
                          ★ {c.rating.toFixed(1)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                )}
              </div>
            )}
            {(!data || data.competitors.length === 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-sm text-gray-500">POI data will appear here when available (Mappls / Google).</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Demographics (est.)</h4>
              <div className="space-y-1.5">
                {data.demographics.ageGroups.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-12 sm:w-14 text-[10px] sm:text-[11px] text-gray-500 flex-shrink-0">{g.range}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${g.percentage}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="h-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full"
                      />
                    </div>
                    <span className="w-8 sm:w-10 text-right text-[10px] sm:text-[11px] text-gray-600 flex-shrink-0">
                      {g.percentage}%
                    </span>
                  </div>
                )) || <p className="text-[11px] sm:text-xs text-gray-500">Loading demographic profile…</p>}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Lifestyle Snapshot</h4>
              <div className="flex flex-wrap gap-2">
                {data.demographics.lifestyle.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-gray-700"
                  >
                    {tag}
                  </span>
                )) || (
                  <span className="text-[11px] sm:text-xs text-gray-500 break-words">
                    Lifestyle segments will appear here once we connect live audience data.
                  </span>
                )}
              </div>
            </div>

            {/* Population & lifestyle (Census) */}
            {data.populationLifestyle && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Population & Affluence</h4>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  {data.populationLifestyle.totalHouseholds != null && (
                    <div>Households: ~{data.populationLifestyle.totalHouseholds.toLocaleString()}</div>
                  )}
                  {data.populationLifestyle.affluenceIndicator && (
                    <div>Affluence: {data.populationLifestyle.affluenceIndicator}</div>
                  )}
                  {data.populationLifestyle.rentPerSqft != null && (
                    <div>Rent/sqft: ~₹{data.populationLifestyle.rentPerSqft}</div>
                  )}
                  {data.populationLifestyle.benchmarkNote && (
                    <div className="text-slate-500 italic">{data.populationLifestyle.benchmarkNote}</div>
                  )}
                </div>
              </div>
            )}

            {/* Catchment */}
            {data.catchment && data.catchment.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Where shoppers come from</h4>
                <p className="text-[11px] text-slate-500 mb-2">Catchment by pincode (estimated)</p>
                <div className="space-y-1.5">
                  {data.catchment.slice(0, 5).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{c.name} ({c.pincode})</span>
                      <span className="font-medium text-slate-900">{c.sharePct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Retail mix */}
            {data.retailMix && data.retailMix.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Retail Mix</h4>
                <p className="text-[11px] text-slate-500 mb-2">Branded vs non-branded (1 km)</p>
                <div className="space-y-2">
                  {data.retailMix.map((r, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="capitalize text-slate-700">{r.category}</span>
                        <span className="text-slate-500">{r.total} total</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        {r.branded > 0 && (
                          <div
                            className="bg-[#FF5200] h-full"
                            style={{ width: `${(r.branded / r.total) * 100}%` }}
                          />
                        )}
                        {r.nonBranded > 0 && (
                          <div
                            className="bg-slate-300 h-full"
                            style={{ width: `${(r.nonBranded / r.total) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crowd pullers */}
            {data.crowdPullers && data.crowdPullers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Crowd pullers</h4>
                <ul className="space-y-1.5">
                  {data.crowdPullers.slice(0, 5).map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate">{p.name}</span>
                      <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {p.footfallTag && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px]">
                            {p.footfallTag}
                          </span>
                        )}
                        <span className="text-slate-500">{formatDistance(p.distanceMeters)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Similar markets */}
            {data.similarMarkets && data.similarMarkets.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Similar markets</h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.similarMarkets.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600"
                    >
                      {s.area.replace(/\b\w/g, (c) => c.toUpperCase())} ({s.score})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cannibalisation risk */}
            {data.cannibalisationRisk && data.cannibalisationRisk.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Risk: Cannibalisation</h4>
                <p className="text-[11px] text-slate-500 mb-2">Same-brand outlets nearby (estimated)</p>
                <ul className="space-y-1.5">
                  {data.cannibalisationRisk.map((r, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{r.brand} ({r.outletCount} outlets)</span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500">{formatDistance(r.nearestSameBrandDistanceM)}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-medium ${
                            r.cannibalisationPct >= 50 ? 'bg-amber-100 text-amber-800' : r.cannibalisationPct >= 25 ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.cannibalisationPct}% risk
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footfall trends (hourly) */}
      {hasInsights && data?.footfall?.hourlyPattern && data.footfall.hourlyPattern.length >= 24 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Footfall trends (estimated)</h4>
          <p className="text-[11px] text-slate-500 mb-4">Hourly pattern · Modeled until real data available</p>
          <div className="flex items-end gap-0.5 h-24">
            {data.footfall.hourlyPattern.slice(0, 24).map((v, h) => {
              const maxVal = Math.max(...data.footfall.hourlyPattern!)
              const pct = maxVal > 0 ? (v / maxVal) * 100 : 0
              return (
                <div
                  key={h}
                  className="flex-1 min-w-[8px] rounded-t bg-gradient-to-t from-[#FF5200] to-[#E4002B] opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${Math.max(4, pct)}%` }}
                  title={`${h}:00 – ${v} est.`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>12am</span>
          </div>
        </div>
      )}

      {/* Market potential score (when different from opportunity) */}
      {hasInsights && data?.marketPotentialScore != null && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Market potential</span>
            <span className="text-2xl font-bold text-[#FF5200]">{data.marketPotentialScore}/100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Saturation + demographics + accessibility</p>
        </div>
      )}

      {/* Location comparison (Vs) */}
      {hasInsights && coordinates && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
          <button
            type="button"
            onClick={() => {
              setCompareExpanded(!compareExpanded)
              if (compareExpanded) {
                setCompareData(null)
                setCompareError(null)
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-[#FF5200] transition-colors"
          >
            <span className="inline-flex items-center gap-1">Vs</span>
            Compare with another location
          </button>
          {compareExpanded && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="12.9716"
                    value={compareLat}
                    onChange={(e) => setCompareLat(e.target.value)}
                    className="w-28 px-2 py-1.5 rounded border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="77.5946"
                    value={compareLng}
                    onChange={(e) => setCompareLng(e.target.value)}
                    className="w-28 px-2 py-1.5 rounded border border-slate-200 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={runCompare}
                  disabled={compareLoading}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {compareLoading ? 'Comparing…' : 'Compare'}
                </button>
              </div>
              {compareError && <p className="text-xs text-red-500">{compareError}</p>}
              {compareData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <h5 className="text-xs font-semibold text-slate-700 mb-3 truncate" title={compareData.labelA}>
                      {compareData.labelA}
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div>Competitors: {compareData.locationA.market?.competitorCount ?? 0}</div>
                      <div>Footfall: ~{compareData.locationA.footfall?.dailyAverage ?? 0}/day</div>
                      <div>Market score: {compareData.locationA.marketPotentialScore ?? '—'}/100</div>
                      <div>Income: {compareData.locationA.demographics?.incomeLevel ?? '—'}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <h5 className="text-xs font-semibold text-slate-700 mb-3 truncate" title={compareData.labelB}>
                      {compareData.labelB}
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div>Competitors: {compareData.locationB.market?.competitorCount ?? 0}</div>
                      <div>Footfall: ~{compareData.locationB.footfall?.dailyAverage ?? 0}/day</div>
                      <div>Market score: {compareData.locationB.marketPotentialScore ?? '—'}/100</div>
                      <div>Income: {compareData.locationB.demographics?.incomeLevel ?? '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading && (
        <p className="text-[11px] sm:text-xs text-gray-500 break-words">
          Analyzing this micro-market using AI and location data…
        </p>
      )}
      {error && (
        <p className="text-[11px] sm:text-xs text-red-500 break-words">
          {error}
        </p>
      )}
    </div>
  )
}

export default LocationIntelligence


