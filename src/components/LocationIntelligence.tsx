'use client'

import { useEffect, useMemo, useState } from 'react'
import { GoogleMap, Marker, Circle, useLoadScript } from '@react-google-maps/api'
import type { Property } from '@/types/workflow'
import { motion } from 'framer-motion'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'

type LocationIntelligenceData = {
  competitors: {
    name: string
    lat: number
    lng: number
    distanceMeters: number
    rating?: number
    userRatingsTotal?: number
    address?: string
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
  koramangala: { lat: 12.9352, lng: 77.6245 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  whitefield: { lat: 12.9698, lng: 77.7499 },
  'hsr layout': { lat: 12.9121, lng: 77.6446 },
}

function getApproxCoords(property: Property): { lat: number; lng: number } | null {
  if ((property as any).latitude && (property as any).longitude) {
    return {
      lat: Number((property as any).latitude),
      lng: Number((property as any).longitude),
    }
  }

  if (property.coordinates) {
    return property.coordinates
  }

  const key = property.city?.toLowerCase?.() || ''
  if (cityCoordinates[key]) return cityCoordinates[key]

  // Try to derive from address keywords
  const allText = `${property.address || ''} ${property.city || ''}`.toLowerCase()
  for (const [cityKey, coords] of Object.entries(cityCoordinates)) {
    if (allText.includes(cityKey)) return coords
  }

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

  useEffect(() => {
    const fetchData = async () => {
      if (!coordinates) {
        setError('No location data available for this property.')
        return
      }

      try {
        setLoading(true)
        setError(null)

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
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          console.error('[LocationIntelligence] API error:', body)
          setError('Unable to load location intelligence right now.')
          return
        }

        const json = await response.json()
        setData(json.data)
      } catch (err) {
        console.error('[LocationIntelligence] Fetch failed:', err)
        setError('Unable to load location intelligence right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [coordinates, property.address, property.city, property.state, property.propertyType, businessType])

  if (!coordinates) {
    return null
  }

  return (
    <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 break-words leading-tight">Location Intelligence</h3>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl break-words mt-1 leading-relaxed">
            AI view of competition, footfall, and accessibility within a 1 km micro-market around this site.
          </p>
        </div>
        {data && (
          <span
            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getSaturationColor(
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

      {/* PART 1: Map + Key Metrics (always visible) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                AI
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Competition Map · 1 km Radius</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 truncate">
              Lat {coordinates.lat.toFixed(4)}, Lng {coordinates.lng.toFixed(4)}
            </span>
          </div>

          <div className="h-64 sm:h-72 md:h-80 lg:h-72">
            {!isLoaded && !loadError && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-600">Loading map…</p>
                </div>
              </div>
            )}
            {loadError && (
              <div className="flex flex-col items-center justify-center h-full px-3 sm:px-4 text-center text-xs sm:text-sm text-gray-600 break-words">
                <div className="mb-2">Map could not be loaded.</div>
                {!getGoogleMapsApiKey() && (
                  <div className="text-[#FF5200] font-semibold">
                    Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
                  </div>
                )}
                {getGoogleMapsApiKey() && (
                  <div>Please check your Google Maps API key configuration and billing settings.</div>
                )}
              </div>
            )}
            {isLoaded && !loadError && (
              <GoogleMap
                mapContainerStyle={{ ...containerStyle, height: '100%' }}
                center={coordinates}
                zoom={16}
                options={{
                  ...DEFAULT_MAP_OPTIONS,
                  styles: [],
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
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 space-y-3 sm:space-4">
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

          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-2 sm:p-3">
              <div className="text-[11px] sm:text-xs text-gray-500 mb-1">Daily Footfall (est.)</div>
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
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-2 sm:p-3">
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

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-2 sm:p-3 text-[11px] sm:text-xs">
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
      </div>

      {/* PART 2: Competitors + Demographics (on demand) */}
      {data && !showDetails && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm text-gray-700 hover:border-[#FF5200] hover:text-[#FF5200] transition-colors"
          >
            <span className="break-words">View detailed competitors & demographics</span>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {data && showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Top Nearby Competitors</h4>
              <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                Within 1 km · Showing {Math.min(data.competitors.length || 0, 5)} of{' '}
                {data.competitors.length || 0}
              </span>
            </div>
            {(!data || data.competitors.length === 0) && (
              <p className="text-[11px] sm:text-xs text-gray-500 break-words">
                Competitor information will appear here as soon as Google Places data is available for
                this micro-market.
              </p>
            )}
            <ul className="divide-y divide-gray-100">
              {data.competitors.slice(0, 5).map((c, idx) => (
                <li key={idx} className="py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                    {c.address && (
                      <div className="text-[10px] sm:text-xs text-gray-500 truncate">{c.address}</div>
                    )}
                  </div>
                  <div className="text-right text-[10px] sm:text-xs text-gray-600 flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span>{formatDistance(c.distanceMeters)}</span>
                    {c.rating && (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-yellow-400 text-white text-[8px] sm:text-[9px] font-bold">
                          ★
                        </span>
                        <span className="whitespace-nowrap">
                          {c.rating.toFixed(1)}
                          {c.userRatingsTotal !== undefined && ` · ${c.userRatingsTotal}`}
                        </span>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Demographics (est.)</h4>
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
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">Lifestyle Snapshot</h4>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {data.demographics.lifestyle.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] sm:text-[11px] text-gray-700 break-words"
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
          Analyzing this micro-market using AI and Google Maps signals…
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


