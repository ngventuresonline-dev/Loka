'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'
import { encodePropertyId } from '@/lib/property-slug'
import { GoogleMap, Marker, HeatmapLayer, useLoadScript, InfoWindow } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type BrandInfo = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  companyName?: string | null
  industry?: string | null
  preferredLocations?: string[] | null
  budgetMin?: number | null
  budgetMax?: number | null
  minSize?: number | null
  maxSize?: number | null
}

type Stats = {
  totalViews: number
  totalSaved: number
  totalInquiries: number
  pendingInquiries: number
}

type PropertyView = {
  id: string
  propertyId: string
  viewedAt: string
  property: {
    title: string
    address: string
    city: string
    price: number
    priceType: string
    size: number
    propertyType: string
    images?: string[]
    status: string
  }
}

type SavedProperty = {
  id: string
  savedAt: string
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    priceType: string
    size: number
    propertyType: string
    images?: string[]
    status?: string
  }
}

type Inquiry = {
  id: string
  message: string
  status: string
  createdAt: string
  property: {
    id: string
    title: string
    address: string
    city: string
    images?: string[]
    price: number
    priceType: string
  }
  owner?: { id: string; name: string; email: string }
}

type DashboardData = {
  brand: BrandInfo | null
  stats: Stats
  recentViews: PropertyView[]
  savedProperties: SavedProperty[]
  inquiries: Inquiry[]
}

type MatchedProperty = {
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    priceType: string
    size: number
    propertyType: string
    images?: unknown
    amenities?: unknown
    status: string
  }
  bfiScore: number
  breakdown: { budgetFit: number; sizeFit: number; locationFit: number }
  coords: { lat: number; lng: number } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, priceType: string) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
  switch (priceType) {
    case 'monthly': return `${formatted}/mo`
    case 'yearly': return `${formatted}/yr`
    case 'sqft': return `${formatted}/sqft`
    default: return formatted
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    responded: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

function getFootfallData(city: string) {
  const PEAK_HOURS = [12, 13, 18, 19, 20]
  const base = ['indiranagar', 'koramangala', 'mg road', 'brigade road', 'church street'].some(
    (a) => city.toLowerCase().includes(a)
  )
    ? 1800
    : ['whitefield', 'hsr', 'jayanagar', 'jp nagar'].some((a) => city.toLowerCase().includes(a))
    ? 1200
    : 800

  return Array.from({ length: 18 }, (_, i) => {
    const h = i + 6
    const mult = PEAK_HOURS.includes(h)
      ? 1.8
      : h < 10
      ? 0.5
      : h < 12
      ? 1.1
      : h < 16
      ? 1.3
      : h < 18
      ? 1.0
      : 0.7
    return {
      hour: h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`,
      value: Math.round(base * mult),
      peak: PEAK_HOURS.includes(h),
    }
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className={`rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col items-center text-center ${accent}`}>
      <div className="mb-1">{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function PropertyCard({
  image,
  title,
  address,
  price,
  priceType,
  size,
  badge,
  badgeClass,
  href,
  meta,
}: {
  image?: string
  title: string
  address: string
  price: number
  priceType: string
  size: number
  badge?: string
  badgeClass?: string
  href: string
  meta?: string
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="relative h-36 bg-gray-100 flex-shrink-0">
        {image ? (
          <Image src={image} alt={title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
            <svg className="w-9 h-9 text-[#FF5200]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        {badge && (
          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-0.5 line-clamp-1 group-hover:text-[#FF5200] transition-colors">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{address}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-bold text-[#FF5200]">{formatPrice(price, priceType)}</span>
          <span className="text-xs text-gray-400">{size.toLocaleString()} sqft</span>
        </div>
        {meta && <p className="text-[11px] text-gray-400 mt-1">{meta}</p>}
      </div>
    </Link>
  )
}

function EmptyState({ message, cta, ctaHref }: { message: string; cta?: string; ctaHref?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg hover:shadow-md transition-all"
        >
          {cta}
        </Link>
      )}
    </div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={`w-4 h-4 ${filled ? 'text-[#FF5200]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.172c.969 0 1.371 1.24.588 1.81l-3.376 2.454a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.953 2.874c-.784.57-1.838-.197-1.539-1.118l1.285-3.967a1 1 0 00-.364-1.118L2.053 9.394c-.783-.57-.38-1.81.588-1.81h4.172a1 1 0 00.95-.69L9.049 2.927z" />
    </svg>
  )
}

// ─── Map inner content (shared between mobile + desktop) ──────────────────────

function MapMarkers({
  isLoaded,
  matches,
  activePropertyId,
  hoveredPropertyId,
  activeInfoWindowId,
  onMarkerClick,
  onInfoClose,
}: {
  isLoaded: boolean
  matches: MatchedProperty[]
  activePropertyId: string | null
  hoveredPropertyId: string | null
  activeInfoWindowId: string | null
  onMarkerClick: (id: string) => void
  onInfoClose: () => void
}) {
  if (!isLoaded) return null
  return (
    <>
      {matches.map((m) => {
        if (!m.coords) return null
        return (
          <Marker
            key={m.property.id}
            position={m.coords}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale:
                activePropertyId === m.property.id
                  ? 28
                  : hoveredPropertyId === m.property.id
                  ? 26
                  : 22,
              fillColor: '#FF5200',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: activePropertyId === m.property.id ? 3 : 2,
            }}
            label={{
              text: String(m.bfiScore),
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11px',
            }}
            onClick={() => onMarkerClick(m.property.id)}
          />
        )
      })}
      {matches.map((m) => {
        if (!m.coords || activeInfoWindowId !== m.property.id) return null
        return (
          <InfoWindow
            key={`iw-${m.property.id}`}
            position={m.coords}
            onCloseClick={onInfoClose}
          >
            <div className="p-2 min-w-[200px]">
              <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{m.property.title}</p>
              <p className="text-xs text-gray-500 mb-2">{m.property.address}, {m.property.city}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#FF5200]">
                  {formatPrice(m.property.price, m.property.priceType)}
                </span>
                <span className="bg-[#FF5200] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {m.bfiScore} BFI
                </span>
              </div>
              <a
                href={`/properties/${encodePropertyId(m.property.id)}`}
                className="block text-center text-xs font-semibold text-white bg-[#FF5200] rounded-lg py-1.5 hover:bg-orange-600"
              >
                View Details →
              </a>
            </div>
          </InfoWindow>
        )
      })}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BrandDashboardPage() {
  const router = useRouter()

  // Existing state
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'matched' | 'overview' | 'saved' | 'inquiries' | 'insights'>('matched')

  // Match + map state
  const [matches, setMatches] = useState<MatchedProperty[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null)
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<string | null>(null)
  const [mapMode, setMapMode] = useState<'pins' | 'heatmap' | 'satellite'>('pins')
  const [insightsPropertyId, setInsightsPropertyId] = useState<string | null>(null)

  // Google Maps loader (must be top-level)
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  // Auth + data fetch
  useEffect(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('brandId') : null
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('brandName') : null

    if (!storedId) {
      router.replace('/dashboard/brand/login')
      return
    }

    setBrandId(storedId)
    if (storedName) setBrandName(storedName)
    fetchDashboard(storedId)
    fetchMatches(storedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchDashboard = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/brand?brandId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.brand?.name) setBrandName(json.brand.name)
      }
    } catch (err) {
      console.error('[Brand Dashboard] Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/brand/matches?brandId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const json = await res.json()
        setMatches(json.matches || [])
      }
    } finally {
      setMatchesLoading(false)
    }
  }

  // Auto-fit map to matched properties
  useEffect(() => {
    if (!mapRef || matches.length === 0) return
    const coordMatches = matches.filter((m) => m.coords)
    if (coordMatches.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    coordMatches.forEach((m) => bounds.extend(m.coords!))
    mapRef.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })
  }, [mapRef, matches])

  // Pan to hovered property
  useEffect(() => {
    if (!mapRef || !hoveredPropertyId) return
    const match = matches.find((m) => m.property.id === hoveredPropertyId)
    if (match?.coords) mapRef.panTo({ lat: match.coords.lat, lng: match.coords.lng })
  }, [hoveredPropertyId, mapRef, matches])

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen relative">
        <DynamicBackground />
        <Navbar />
        <div className="relative z-10 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = data?.stats ?? { totalViews: 0, totalSaved: 0, totalInquiries: 0, pendingInquiries: 0 }
  const brand = data?.brand ?? null
  const recentViews = data?.recentViews ?? []
  const savedProperties = data?.savedProperties ?? []
  const inquiries = data?.inquiries ?? []

  const selected = insightsPropertyId ? matches.find((m) => m.property.id === insightsPropertyId) : null
  const footfallData = selected ? getFootfallData(selected.property.city) : []

  const handleMarkerClick = (id: string) => {
    setActivePropertyId(id)
    setActiveInfoWindowId(id)
    setInsightsPropertyId(id)
  }

  const mapMarkersProps = {
    isLoaded,
    matches,
    activePropertyId,
    hoveredPropertyId,
    activeInfoWindowId,
    onMarkerClick: handleMarkerClick,
    onInfoClose: () => setActiveInfoWindowId(null),
  }

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <Navbar />

      <div
        className="relative z-10 pt-16 flex"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {/* ── LEFT PANEL ── */}
        <div className="w-full lg:w-[420px] flex-shrink-0 overflow-y-auto bg-white/80 backdrop-blur-sm border-r border-gray-200">
          <div className="p-4 lg:p-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5 tracking-wide">Welcome back,</p>
                <h1 className="text-xl font-bold text-gray-900 mb-0.5 leading-snug">
                  {brandName || brand?.companyName || 'Brand Dashboard'}
                </h1>
                <p className="text-xs text-gray-500">
                  {brand?.industry ? `${brand.industry} · ` : ''}
                  {brand?.phone || brand?.email || ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/properties/results"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg hover:shadow-md transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Spaces
                </Link>
                <Link
                  href="/onboarding/brand"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:border-[#FF5200] hover:text-[#FF5200] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Prefs
                </Link>
              </div>
            </div>

            {/* Requirements Strip */}
            {brand && (brand.budgetMin || brand.preferredLocations) && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                <p className="text-[10px] font-semibold text-[#FF5200] uppercase tracking-wide mb-1.5">Your Requirements</p>
                <div className="flex flex-wrap gap-1.5">
                  {brand.budgetMin && brand.budgetMax && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-orange-200 text-[11px] text-gray-700 font-medium">
                      ₹{brand.budgetMin.toLocaleString('en-IN')} – ₹{brand.budgetMax.toLocaleString('en-IN')}/mo
                    </span>
                  )}
                  {brand.minSize && brand.maxSize && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-orange-200 text-[11px] text-gray-700 font-medium">
                      {brand.minSize.toLocaleString()}–{brand.maxSize.toLocaleString()} sqft
                    </span>
                  )}
                  {Array.isArray(brand.preferredLocations) &&
                    brand.preferredLocations.map((loc: string) => (
                      <span key={loc} className="px-2.5 py-0.5 rounded-full bg-white border border-orange-200 text-[11px] text-gray-700 font-medium">
                        {loc}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Mobile Map Strip */}
            <div className="lg:hidden mb-4 rounded-xl overflow-hidden border border-gray-100" style={{ height: '280px' }}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerClassName="w-full h-full"
                  center={{ lat: 12.9716, lng: 77.5946 }}
                  zoom={11}
                  options={{ ...DEFAULT_MAP_OPTIONS, zoomControl: false, streetViewControl: false, fullscreenControl: false }}
                >
                  <MapMarkers {...mapMarkersProps} />
                  {isLoaded && mapMode === 'heatmap' && (
                    <HeatmapLayer
                      data={matches
                        .filter((m) => m.coords)
                        .map((m) => new google.maps.LatLng(m.coords!.lat, m.coords!.lng))}
                      options={{ radius: 40, gradient: ['rgba(255,255,255,0)', '#FFB899', '#FF5200', '#E4002B'] }}
                    />
                  )}
                </GoogleMap>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Stats (5 cards) */}
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
              <StatCard
                label="Matches"
                value={matches.length}
                accent="bg-orange-50"
                icon={
                  <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Viewed"
                value={stats.totalViews}
                accent="bg-blue-50"
                icon={
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
              <StatCard
                label="Saved"
                value={stats.totalSaved}
                accent="bg-pink-50"
                icon={
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Inquiries"
                value={stats.totalInquiries}
                accent="bg-purple-50"
                icon={
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                }
              />
              <StatCard
                label="Pending"
                value={stats.pendingInquiries}
                accent="bg-orange-50"
                icon={
                  <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex gap-0 text-xs overflow-x-auto">
                {(
                  [
                    { key: 'matched', label: `Matched (${matches.length})` },
                    { key: 'overview', label: `Views (${recentViews.length})` },
                    { key: 'saved', label: `Saved (${savedProperties.length})` },
                    { key: 'inquiries', label: `Inquiries (${inquiries.length})` },
                    { key: 'insights', label: 'Insights' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`whitespace-nowrap px-3 py-2 border-b-2 font-medium transition-colors ${
                      activeTab === key
                        ? 'border-[#FF5200] text-[#FF5200] font-semibold'
                        : key === 'insights' && !insightsPropertyId
                        ? 'border-transparent text-gray-400 cursor-default'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    title={key === 'insights' && !insightsPropertyId ? 'Click a matched property to see insights' : undefined}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* ── Tab: Matched ── */}
            {activeTab === 'matched' && (
              <>
                {matchesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />
                    ))}
                  </div>
                ) : matches.length === 0 ? (
                  <EmptyState
                    message="No matches found yet. Update your preferences to get matched."
                    cta="Update Preferences"
                    ctaHref="/onboarding/brand"
                  />
                ) : (
                  <div>
                    {matches.map((m) => {
                      const imgSrc = Array.isArray(m.property.images)
                        ? (m.property.images as string[])[0]
                        : undefined
                      return (
                        <div
                          key={m.property.id}
                          onClick={() => {
                            setActivePropertyId(m.property.id)
                            setInsightsPropertyId(m.property.id)
                          }}
                          onMouseEnter={() => {
                            setHoveredPropertyId(m.property.id)
                          }}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          className={`rounded-xl border transition-all cursor-pointer p-3 flex gap-3 mb-2 ${
                            activePropertyId === m.property.id
                              ? 'border-[#FF5200] bg-orange-50 shadow-md'
                              : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-sm'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-50 to-red-50">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={m.property.title}
                                width={72}
                                height={72}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-[#FF5200]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Row 1: title + BFI */}
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
                                {m.property.title}
                              </p>
                              <span className="flex-shrink-0 bg-[#FF5200] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[36px] text-center">
                                {m.bfiScore}
                              </span>
                            </div>

                            {/* Row 2: address */}
                            <p className="text-xs text-gray-500 mb-1.5 truncate">
                              {m.property.address}, {m.property.city}
                            </p>

                            {/* Row 3: chips */}
                            <div className="flex gap-1 flex-wrap mb-1.5">
                              <span className="bg-gray-100 text-gray-600 text-[10px] rounded-full px-2 py-0.5">
                                {m.property.size.toLocaleString()} sqft
                              </span>
                              <span className="bg-gray-100 text-gray-600 text-[10px] rounded-full px-2 py-0.5">
                                {formatPrice(m.property.price, m.property.priceType)}
                              </span>
                              <span className="bg-gray-100 text-gray-600 text-[10px] rounded-full px-2 py-0.5 capitalize">
                                {m.property.propertyType}
                              </span>
                            </div>

                            {/* Row 4: match highlights */}
                            <div className="flex gap-1 flex-wrap mb-1.5">
                              {m.breakdown.locationFit >= 80 && (
                                <span className="bg-green-50 text-green-700 text-[10px] rounded-full px-2 py-0.5">
                                  ✓ Preferred Area
                                </span>
                              )}
                              {m.breakdown.budgetFit >= 80 && (
                                <span className="bg-green-50 text-green-700 text-[10px] rounded-full px-2 py-0.5">
                                  ✓ Budget Match
                                </span>
                              )}
                              {m.breakdown.budgetFit < 60 && (
                                <span className="bg-yellow-50 text-yellow-700 text-[10px] rounded-full px-2 py-0.5">
                                  ⚠ Above Budget
                                </span>
                              )}
                              {m.breakdown.locationFit < 60 && (
                                <span className="bg-gray-100 text-gray-500 text-[10px] rounded-full px-2 py-0.5">
                                  ~ Area Nearby
                                </span>
                              )}
                            </div>

                            {/* Row 5: actions */}
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/properties/${encodePropertyId(m.property.id)}`}
                                className="text-[11px] text-[#FF5200] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Details →
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setInsightsPropertyId(m.property.id)
                                  setActiveTab('insights')
                                }}
                                className="text-[11px] text-gray-500 hover:text-[#FF5200]"
                              >
                                Insights
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Recent Views ── */}
            {activeTab === 'overview' && (
              <>
                {recentViews.length === 0 ? (
                  <EmptyState message="You haven't viewed any properties yet." cta="Browse Spaces" ctaHref="/properties/results" />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {recentViews.map((v) => (
                      <PropertyCard
                        key={v.id}
                        href={`/properties/${encodePropertyId(v.propertyId)}`}
                        image={Array.isArray(v.property.images) ? v.property.images[0] : undefined}
                        title={v.property.title}
                        address={`${v.property.address}, ${v.property.city}`}
                        price={v.property.price}
                        priceType={v.property.priceType}
                        size={v.property.size}
                        badge={v.property.status === 'approved' ? 'Live' : v.property.status === 'rejected' ? 'Unavailable' : 'Pending'}
                        badgeClass={statusBadge(v.property.status)}
                        meta={`Viewed ${formatDate(v.viewedAt)}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Saved Spaces ── */}
            {activeTab === 'saved' && (
              <>
                {savedProperties.length === 0 ? (
                  <EmptyState
                    message="You haven't saved any properties yet."
                    cta="Browse Spaces"
                    ctaHref="/properties/results"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {savedProperties.map((sp) => (
                      <PropertyCard
                        key={sp.id}
                        href={`/properties/${encodePropertyId(sp.property.id)}`}
                        image={Array.isArray(sp.property.images) ? (sp.property.images as string[])[0] : undefined}
                        title={sp.property.title}
                        address={`${sp.property.address}, ${sp.property.city}`}
                        price={Number(sp.property.price)}
                        priceType={sp.property.priceType}
                        size={sp.property.size}
                        badge={sp.property.status === 'approved' ? 'Live' : sp.property.status === 'rejected' ? 'Unavailable' : 'Pending'}
                        badgeClass={statusBadge(sp.property.status || 'pending')}
                        meta={`Saved ${formatDate(sp.savedAt)}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Inquiries ── */}
            {activeTab === 'inquiries' && (
              <>
                {inquiries.length === 0 ? (
                  <EmptyState
                    message="You haven't sent any inquiries yet."
                    cta="Browse Spaces"
                    ctaHref="/properties/results"
                  />
                ) : (
                  <div className="space-y-3">
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-3">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {Array.isArray(inq.property.images) && inq.property.images[0] ? (
                              <Image
                                src={inq.property.images[0]}
                                alt={inq.property.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
                                <svg className="w-6 h-6 text-[#FF5200]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <Link
                                href={`/properties/${encodePropertyId(inq.property.id)}`}
                                className="font-semibold text-gray-900 text-xs hover:text-[#FF5200] transition-colors truncate"
                              >
                                {inq.property.title}
                              </Link>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${statusBadge(inq.status)}`}>
                                {inq.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-1 truncate">
                              {inq.property.address}, {inq.property.city}
                            </p>
                            <p className="text-xs text-gray-700 line-clamp-2 mb-1">{inq.message}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400">
                              <span>{formatDate(inq.createdAt)}</span>
                              {inq.owner && <span>Owner: {inq.owner.name}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Insights ── */}
            {activeTab === 'insights' && (
              <>
                {!selected ? (
                  <div className="py-12 text-center">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Click a matched property card to see its location intelligence.</p>
                    <button
                      onClick={() => setActiveTab('matched')}
                      className="mt-3 text-xs text-[#FF5200] hover:underline"
                    >
                      ← Back to Matches
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Section A: Score Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-xl p-4 mb-4">
                      <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-1">{selected.property.title}</h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon key={i} filled={i < Math.round(selected.bfiScore / 20)} />
                          ))}
                        </div>
                        <span className="text-2xl font-bold text-[#FF5200]">{selected.bfiScore}</span>
                        <span className="text-gray-500 text-sm">/ 100</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.breakdown.locationFit >= 80 && (
                          <span className="bg-green-100 text-green-700 text-[10px] rounded-full px-2 py-0.5 font-medium">↑ high location match</span>
                        )}
                        {selected.breakdown.budgetFit >= 80 && (
                          <span className="bg-green-100 text-green-700 text-[10px] rounded-full px-2 py-0.5 font-medium">↑ high budget fit</span>
                        )}
                        {selected.breakdown.sizeFit >= 80 && (
                          <span className="bg-green-100 text-green-700 text-[10px] rounded-full px-2 py-0.5 font-medium">↑ good size match</span>
                        )}
                        {selected.breakdown.budgetFit < 60 && (
                          <span className="bg-red-100 text-red-700 text-[10px] rounded-full px-2 py-0.5 font-medium">↓ above budget</span>
                        )}
                        {selected.breakdown.locationFit < 60 && (
                          <span className="bg-gray-100 text-gray-500 text-[10px] rounded-full px-2 py-0.5 font-medium">~ area nearby</span>
                        )}
                        <span className="bg-blue-50 text-blue-700 text-[10px] rounded-full px-2 py-0.5 font-medium">medium competitor presence</span>
                      </div>
                    </div>

                    {/* Section B: BFI Breakdown */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
                      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Match Breakdown</h4>
                      {[
                        { label: 'Location Fit', value: selected.breakdown.locationFit },
                        { label: 'Budget Fit', value: selected.breakdown.budgetFit },
                        { label: 'Size Fit', value: selected.breakdown.sizeFit },
                      ].map(({ label, value }) => (
                        <div key={label} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{label}</span>
                            <span className="font-semibold text-gray-900">{value}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FF5200] rounded-full transition-all duration-500"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Section C: Property Details */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
                      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Property Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Area</p>
                          <p className="font-bold text-gray-900 text-sm">{selected.property.size.toLocaleString()} sqft</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Rent</p>
                          <p className="font-bold text-gray-900 text-sm">{formatPrice(selected.property.price, selected.property.priceType)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Type</p>
                          <p className="font-bold text-gray-900 text-sm capitalize">{selected.property.propertyType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">City</p>
                          <p className="font-bold text-gray-900 text-sm">{selected.property.city}</p>
                        </div>
                      </div>
                    </div>

                    {/* Section D: Footfall Chart */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Estimated Footfall Trend</h4>
                        <span className="bg-orange-100 text-[#FF5200] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">BETA</span>
                      </div>
                      <div style={{ height: '160px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={footfallData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={2} />
                            <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f3f4f6' }}
                              formatter={(val: number) => [`${val.toLocaleString()} people`, 'Footfall']}
                            />
                            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                              {footfallData.map((entry, index) => (
                                <Cell key={index} fill={entry.peak ? '#FF5200' : '#FFB899'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Peak hours highlighted in orange. Based on area type estimate.</p>
                    </div>

                    {/* Section E: CTAs */}
                    <div className="flex gap-2 mt-2">
                      <Link
                        href={`/properties/${encodePropertyId(selected.property.id)}`}
                        className="flex-1 text-center py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-xl"
                      >
                        View Full Details
                      </Link>
                      <Link
                        href={`/properties/${encodePropertyId(selected.property.id)}#inquire`}
                        className="flex-1 text-center py-2 text-sm font-semibold text-[#FF5200] border border-[#FF5200] rounded-xl"
                      >
                        Enquire Now
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer CTA */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF5200] font-medium hover:underline"
                >
                  Chat on WhatsApp
                </a>
              </p>
              <Link href="/filter/brand" className="text-xs font-medium text-gray-600 hover:text-[#FF5200] transition-colors">
                Refine search criteria →
              </Link>
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL — MAP ── */}
        <div className="hidden lg:flex flex-1 relative bg-gray-100">
          {isLoaded ? (
            <GoogleMap
              mapContainerClassName="w-full h-full"
              center={{ lat: 12.9716, lng: 77.5946 }}
              zoom={12}
              options={{ ...DEFAULT_MAP_OPTIONS, zoomControl: true }}
              onLoad={(map) => setMapRef(map)}
            >
              <MapMarkers {...mapMarkersProps} />
              {isLoaded && mapMode === 'heatmap' && (
                <HeatmapLayer
                  data={matches
                    .filter((m) => m.coords)
                    .map((m) => new google.maps.LatLng(m.coords!.lat, m.coords!.lng))}
                  options={{ radius: 40, gradient: ['rgba(255,255,255,0)', '#FFB899', '#FF5200', '#E4002B'] }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Map controls — top right */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur rounded-xl shadow-md p-1.5 flex flex-col gap-1">
            {(['pins', 'heatmap', 'satellite'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setMapMode(mode)
                  if (mapRef) mapRef.setMapTypeId(mode === 'satellite' ? 'satellite' : 'roadmap')
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                  mapMode === mode ? 'bg-[#FF5200] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {mode === 'pins' ? '📍 Pins' : mode === 'heatmap' ? '🌡 Heatmap' : '🛰 Satellite'}
              </button>
            ))}
          </div>

          {/* Map legend — bottom left */}
          <div className="absolute bottom-4 left-3 z-10 bg-white/95 backdrop-blur rounded-xl shadow-md px-3 py-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#FF5200] flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">85</span>
            </div>
            <span className="text-xs text-gray-700 font-medium">{matches.length} Matched Properties</span>
          </div>

          {/* No-location notice */}
          {!matchesLoading && matches.length > 0 && matches.filter((m) => m.coords).length === 0 && (
            <div className="absolute bottom-14 left-3 z-10 bg-white/95 backdrop-blur rounded-xl shadow-md px-3 py-2">
              <p className="text-xs text-gray-500">No map coordinates available for matched properties.</p>
            </div>
          )}

          {/* brandId debug info removed in production */}
          {!brandId && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center">
              <p className="text-sm text-gray-400">Loading map data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
