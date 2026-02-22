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
  }[]
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
      note: string
    }
  }
  dataSource?: {
    competitors: 'mappls' | 'google' | 'none'
    transit: 'mappls' | 'google' | 'none'
    geocoding: 'mappls' | 'google' | 'none'
  }
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

  // Prefer locality in address/title over raw city so "4th Block, Jayanagar, Bangalore" → Jayanagar, not UB City
  const allText = `${property.address || ''} ${property.city || ''} ${property.state || ''} ${(property as any).title || ''}`.toLowerCase()
  const sortedKeys = Object.keys(cityCoordinates).sort((a, b) => b.length - a.length)
  for (const cityKey of sortedKeys) {
    if (allText.includes(cityKey)) return cityCoordinates[cityKey]
  }

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

function InfoTooltip({ text, className = '' }: { text: string; className?: string }) {
  const [show, setShow] = useState(false)
  const id = useId()
  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        title={text}
        className="inline-flex items-center justify-center min-w-[18px] min-h-[18px] w-[18px] h-[18px] sm:min-w-[20px] sm:min-h-[20px] sm:w-5 sm:h-5 rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 hover:text-gray-800 active:bg-gray-500 text-[10px] sm:text-xs font-semibold cursor-help touch-manipulation"
        aria-label="More info"
        aria-describedby={show ? id : undefined}
      >
        i
      </button>
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

export function LocationIntelligence({ property, businessType }: LocationIntelligenceProps) {
  const [data, setData] = useState<LocationIntelligenceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

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
          setData(json.data)
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
  }, [coordinates?.lat, coordinates?.lng, property.address, property.city, property.state, property.propertyType, businessType])

  if (!coordinates) {
    return null
  }

  // Show insights even if Google Maps fails to load (we can still show data from API)
  const hasInsights = !!data && !error

  const newBrands = (data?.competitors ?? []).filter((c) => (c.brandType ?? 'new') === 'new')
  const popularBrands = (data?.competitors ?? []).filter((c) => c.brandType === 'popular')

  return (
    <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 w-full max-w-7xl">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,82,0,0.15),transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] sm:text-xs font-medium text-white/90 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · 1 km micro-market
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight break-words">
              Location Intelligence
            </h3>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              AI-powered competition, footfall, and accessibility insights for this site.
            </p>
          </div>
          {hasInsights && data && (
            <span
              className={`inline-flex items-center px-3 sm:px-4 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getSaturationColor(
                data.market.saturationLevel
              )}`}
            >
              {data.market.saturationLevel === 'low'
                ? 'Low Saturation'
                : data.market.saturationLevel === 'medium'
                ? 'Medium Saturation'
                : 'High Saturation'}
            </span>
          )}
        </div>
      </div>

      {/* PART 1: Map + Key Metrics (always visible) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-4 sm:gap-5">
        <div className="min-w-0 bg-white rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 overflow-hidden">
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
          <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 p-4 sm:p-5 space-y-4 relative overflow-visible min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Market Saturation</span>
                <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                  {data ? `${data.market.competitorCount} competitors` : '—'}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data?.market.saturationLevel === 'low'
                      ? 'bg-green-500'
                      : data?.market.saturationLevel === 'medium'
                      ? 'bg-yellow-400'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width:
                      data?.market.saturationLevel === 'low'
                        ? '30%'
                        : data?.market.saturationLevel === 'medium'
                        ? '65%'
                        : '95%',
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] sm:text-xs text-gray-600 break-words">
                {data?.market.summary ||
                  'We are estimating saturation and whitespace for this micro-market based on competitor density.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 sm:p-4">
                <div className="text-[11px] sm:text-xs text-gray-500 mb-1">Daily Footfall (modeled estimate)</div>
                <div className="text-base sm:text-lg font-bold text-gray-900 break-words">
                  {data ? data.footfall.dailyAverage.toLocaleString('en-IN') : '—'}
                </div>
                <div className="mt-1 text-[10px] sm:text-xs text-gray-500 break-words">
                  Weekend boost:{' '}
                  <span className="font-semibold text-gray-800">
                    {data ? `${Math.round((data.footfall.weekendBoost - 1) * 100)}%` : '—'}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 sm:p-4">
                <div className="text-[11px] sm:text-xs text-gray-500 mb-1">Peak Hours</div>
                <ul className="space-y-0.5 sm:space-y-1">
                  {data?.footfall.peakHours.map((h, idx) => (
                    <li key={idx} className="text-[11px] sm:text-xs text-gray-800 break-words">
                      {h}
                    </li>
                  )) || <li className="text-[11px] sm:text-xs text-gray-400">Loading…</li>}
                </ul>
              </div>
            </div>

            {data?.scores && (
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2 sm:px-2 sm:py-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                    <span className="truncate">Market Opportunity</span>
                    <InfoTooltip text="Untapped potential in this micro-market." className="flex-shrink-0" />
                  </div>
                  <div className="font-semibold text-gray-900 mt-0.5">{data.scores.whitespaceScore}/100</div>
                </div>
                <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2 sm:px-2 sm:py-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                    <span className="truncate">Demand vs Supply</span>
                    <InfoTooltip text="Unmet demand in this category." className="flex-shrink-0" />
                  </div>
                  <div className="font-semibold text-gray-900 mt-0.5">{data.scores.demandGapScore}/100</div>
                </div>
                <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2 sm:px-2 sm:py-1.5 min-w-0 min-[480px]:col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                    <span className="truncate">Potential Revenue</span>
                    <InfoTooltip
                      text="Estimated gross monthly revenue for a similar business."
                    className="flex-shrink-0"
                    />
                  </div>
                  <div className="font-semibold text-gray-900 mt-0.5">
                    {data.scores.revenueProjectionMonthly >= 100000
                      ? `₹${(data.scores.revenueProjectionMonthly / 100000).toFixed(1)}L/mo`
                      : `₹${(data.scores.revenueProjectionMonthly / 1000).toFixed(0)}K/mo`}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 sm:p-4 text-[11px] sm:text-xs">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-gray-500">Accessibility</span>
                <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
                  Walk {data?.accessibility.walkScore ?? '—'} · Transit{' '}
                  {data?.accessibility.transitScore ?? '—'}
                </span>
              </div>
              <div className="space-y-1 text-gray-700 break-words">
                {data?.accessibility.nearestMetro && (
                  <div>
                    <span className="font-semibold">Nearest Metro:</span>{' '}
                    {data.accessibility.nearestMetro.name} (
                    {formatDistance(data.accessibility.nearestMetro.distanceMeters)})
                  </div>
                )}
                {data?.accessibility.nearestBusStop && (
                  <div>
                    <span className="font-semibold">Nearest Bus Stop:</span>{' '}
                    {data.accessibility.nearestBusStop.name} (
                    {formatDistance(data.accessibility.nearestBusStop.distanceMeters)})
                  </div>
                )}
              </div>
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

      {/* PART 2: Competitors + Demographics (on demand) */}
      {hasInsights && data && !showDetails && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-gray-700 hover:border-[#FF5200] hover:bg-orange-50/50 hover:text-[#FF5200] transition-all"
          >
            <span className="break-words">View New Brands, Popular Brands & Demographics</span>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {hasInsights && data && showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 space-y-4">
            {newBrands.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 p-4 sm:p-5">
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
              <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 p-4 sm:p-5">
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
            {newBrands.length === 0 && popularBrands.length === 0 && data.competitors.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 p-4 sm:p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Nearby</h4>
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
              </div>
            )}
            {(!data || data.competitors.length === 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-sm text-gray-500">POI data will appear here when available (Mappls / Google).</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 p-4 sm:p-5 space-y-4">
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
          </div>
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


