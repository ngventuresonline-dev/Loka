'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleMap, Marker, HeatmapLayer, useLoadScript, InfoWindow } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'
import { encodePropertyId } from '@/lib/property-slug'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'

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

type IntelligenceData = {
  coords: { lat: number; lng: number }
  overallScore: number
  highlights: string[]
  totalFootfall: number
  growthTrend: number
  spendingCapacity: number
  numberOfStores: number
  retailIndex: number
  hourlyPattern: number[]
  totalHouseholds: number
  affluenceIndicator: string
  catchment: Array<{ pincode: string; name: string; sharePct: number; distanceM: number }>
  competitors: Array<{ name: string; category: string; distance: number; rating?: number; branded: boolean }>
  complementaryBrands: Array<{ name: string; category: string; distance: number }>
  crowdPullers: Array<{ name: string; category: string; distance: number }>
  retailMix: Array<{ category: string; branded: number; nonBranded: number }>
  cannibalisationRisk: Array<{ name: string; distance: number; cannibalisation: number }>
  storeClosureRisk: Array<{ category: string; totalPois: number }>
  similarMarkets: Array<{ key: string; lat: number; lng: number; score: number }>
  metroDistance: number | null
  metroName: string | null
  busStops: number
}

type RightPanelMode = 'map' | 'intelligence'
type IntelTab = 'overview' | 'catchment' | 'market' | 'competitors' | 'risk' | 'similar' | 'map'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, priceType: string) {
  const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
  if (priceType === 'monthly') return `${fmt}/mo`
  if (priceType === 'yearly') return `${fmt}/yr`
  if (priceType === 'sqft') return `${fmt}/sqft`
  return fmt
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHighlights(d: any): string[] {
  const h: string[] = []
  const footfall = Number(d.footfall?.dailyAverage) || 0
  h.push(footfall > 2000 ? 'high footfall' : footfall > 1000 ? 'medium footfall' : 'low footfall')
  const demandGap = Number(d.scores?.demandGapScore) || 0
  if (demandGap > 60) h.push('high spend quotient')
  else if (demandGap > 30) h.push('medium spend quotient')
  const whitespace = Number(d.scores?.whitespaceScore) || 0
  if (whitespace > 60) h.push('high growth potential')
  else if (whitespace > 30) h.push('medium growth')
  const cannib = Array.isArray(d.cannibalisationRisk) ? d.cannibalisationRisk : []
  if (cannib.length > 0 && cannib[0].cannibalisationPct > 50) h.push('high cannibalisation risk')
  const cnt = Number(d.market?.competitorCount) || 0
  h.push(cnt > 8 ? 'high competition' : cnt > 3 ? 'medium competition' : 'low competition')
  if (d.accessibility?.nearestMetro?.distanceMeters < 1000) h.push('metro accessible')
  const aff = String(d.populationLifestyle?.affluenceIndicator || d.projections2026?.affluenceIndicator || '')
  if (aff === 'High') h.push('high income area')
  else if (aff === 'Medium') h.push('medium income area')
  return h
}

function deriveStoreClosureRisk(
  retailMix: Array<{ category: string; branded: number; nonBranded: number }>
): Array<{ category: string; totalPois: number }> {
  return retailMix.map((r) => ({ category: r.category, totalPois: r.branded + r.nonBranded })).slice(0, 5)
}

function splitCompetitors(
  all: IntelligenceData['competitors'],
  brandIndustry: string | null | undefined
): { competitors: IntelligenceData['competitors']; complementaryBrands: IntelligenceData['complementaryBrands'] } {
  if (!brandIndustry) return { competitors: all, complementaryBrands: [] }
  const ind = brandIndustry.toLowerCase()
  const isSame = (cat: string) => {
    const c = cat.toLowerCase()
    if (ind.includes('qsr') || ind.includes('fast food')) return c === 'qsr' || c === 'restaurant'
    if (ind.includes('cafe') || ind.includes('coffee')) return c === 'cafe' || c === 'coffee'
    if (ind.includes('restaurant') || ind.includes('dining')) return c === 'restaurant' || c === 'dining'
    if (ind.includes('bakery') || ind.includes('dessert')) return c === 'bakery' || c === 'dessert'
    if (ind.includes('bar') || ind.includes('brew')) return c === 'bar' || c === 'brew'
    if (ind.includes('retail') || ind.includes('fashion')) return c === 'retail' || c === 'clothing'
    return c === ind
  }
  return {
    competitors: all.filter((c) => isSame(c.category)),
    complementaryBrands: all.filter((c) => !isSame(c.category)).slice(0, 8) as IntelligenceData['complementaryBrands'],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLiveIntelligence(data: any, coords: { lat: number; lng: number }): IntelligenceData {
  const competitors: IntelligenceData['competitors'] = (data.competitors || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => ({
      name: String(c.name || ''),
      category: String(c.placeCategory || 'other'),
      distance: Number(c.distanceMeters) || 0,
      rating: c.rating != null ? Number(c.rating) : undefined,
      branded: c.brandType === 'popular',
    })
  )
  const cannibalisationRisk: IntelligenceData['cannibalisationRisk'] = (data.cannibalisationRisk || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => ({
      name: String(r.brand || ''),
      distance: Number(r.nearestSameBrandDistanceM) || 0,
      cannibalisation: Number(r.cannibalisationPct) || 0,
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const retailMix: IntelligenceData['retailMix'] = (data.retailMix || []).map((r: any) => ({
    category: String(r.category || ''),
    branded: Number(r.branded) || 0,
    nonBranded: Number(r.nonBranded) || 0,
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const similarMarkets: IntelligenceData['similarMarkets'] = (data.similarMarkets || []).map((m: any) => {
    const areaKey = String(m.area || '')
    const area = BANGALORE_AREAS.find((a) => a.key === areaKey)
    return { key: areaKey, lat: area?.lat || coords.lat, lng: area?.lng || coords.lng, score: Number(m.score) || 50 }
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const crowdPullers: IntelligenceData['crowdPullers'] = (data.crowdPullers || []).map((p: any) => ({
    name: String(p.name || ''),
    category: String(p.category || ''),
    distance: Number(p.distanceMeters) || 0,
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catchment: IntelligenceData['catchment'] = (data.catchment || []).map((c: any) => ({
    pincode: String(c.pincode || ''),
    name: String(c.name || ''),
    sharePct: Number(c.sharePct) || 0,
    distanceM: Number(c.distanceM) || 0,
  }))
  return {
    coords,
    overallScore: Number(data.marketPotentialScore) || 50,
    highlights: buildHighlights(data),
    totalFootfall: Number(data.footfall?.dailyAverage) || 0,
    growthTrend: Number(data.scores?.whitespaceScore) || 0,
    spendingCapacity: Number(data.scores?.demandGapScore) || 0,
    numberOfStores: Number(data.market?.competitorCount) || 0,
    retailIndex: data.scores?.saturationIndex != null ? Math.max(0, 1 - Number(data.scores.saturationIndex) / 100) : 0.5,
    hourlyPattern: Array.isArray(data.footfall?.hourlyPattern) ? (data.footfall.hourlyPattern as number[]) : [],
    totalHouseholds: Number(data.populationLifestyle?.totalHouseholds || data.projections2026?.totalHouseholds) || 0,
    affluenceIndicator: String(data.populationLifestyle?.affluenceIndicator || data.projections2026?.affluenceIndicator || 'Medium'),
    catchment,
    competitors,
    complementaryBrands: [],
    crowdPullers,
    retailMix,
    cannibalisationRisk,
    storeClosureRisk: deriveStoreClosureRisk(retailMix),
    similarMarkets,
    metroDistance: data.accessibility?.nearestMetro?.distanceMeters != null ? Number(data.accessibility.nearestMetro.distanceMeters) : null,
    metroName: data.accessibility?.nearestMetro?.name ? String(data.accessibility.nearestMetro.name) : null,
    busStops: data.accessibility?.nearestBusStop ? 1 : 0,
  }
}

function getHourlyData(intelData: IntelligenceData) {
  const PEAK_HOURS = [12, 13, 18, 19, 20]
  if (intelData.hourlyPattern.length >= 18) {
    return intelData.hourlyPattern.slice(0, 18).map((value, i) => {
      const h = i + 6
      return { hour: h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`, value: Math.round(value), peak: PEAK_HOURS.includes(h) }
    })
  }
  const base = intelData.totalFootfall / 14 || 100
  return Array.from({ length: 18 }, (_, i) => {
    const h = i + 6
    const mult = PEAK_HOURS.includes(h) ? 1.8 : h < 10 ? 0.5 : h < 12 ? 1.1 : h < 16 ? 1.3 : h < 18 ? 1.0 : 0.7
    return { hour: h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`, value: Math.round(base * mult), peak: PEAK_HOURS.includes(h) }
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarIcon({ filled, className = 'w-5 h-5' }: { filled: boolean; className?: string }) {
  return (
    <svg className={`${className} ${filled ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.172c.969 0 1.371 1.24.588 1.81l-3.376 2.454a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.953 2.874c-.784.57-1.838-.197-1.539-1.118l1.285-3.967a1 1 0 00-.364-1.118L2.053 9.394c-.783-.57-.38-1.81.588-1.81h4.172a1 1 0 00.95-.69L9.049 2.927z" />
    </svg>
  )
}

function BuildingIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg className={`${className} text-[#FF5200]/30`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function MetricCell({ label, value, trend, benchmark }: { label: string; value: string; trend?: 'up' | 'down'; benchmark?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {trend && <span className={trend === 'up' ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>{trend === 'up' ? '↗' : '↘'}</span>}
      </div>
      {benchmark && (
        <p className="text-[10px] text-gray-400 mt-0.5">
          Bengaluru Avg <span className="font-semibold text-gray-600">{benchmark}</span>
        </p>
      )}
    </div>
  )
}

function HighlightChip({ label }: { label: string }) {
  const l = label.toLowerCase()
  const isRed = l.includes('risk') || l.includes('cannibal') || (l.includes('high') && (l.includes('competition') || l.includes('cannib'))) || l.includes('low footfall')
  const isGreen = (l.includes('high') && (l.includes('footfall') || l.includes('spend') || l.includes('growth') || l.includes('income'))) || l.includes('metro accessible') || l.includes('low competition')
  const isAmber = l.includes('medium')
  const color = isRed ? 'bg-red-50 text-red-700 border-red-200' : isGreen ? 'bg-green-50 text-green-700 border-green-200' : isAmber ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-600 border-gray-200'
  const arrow = isGreen ? '↑' : isRed ? '↓' : '→'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium ${color}`}>
      <span>{arrow}</span>{label}
    </span>
  )
}

function CatchmentFlow({ catchment }: { catchment: Array<{ pincode: string; name: string; sharePct: number; distanceM: number }> }) {
  const cx = 140, cy = 115, r = 88
  const items = catchment.slice(0, 8)
  const n = items.length
  if (n === 0) return <p className="text-sm text-gray-400 text-center py-6">No catchment data available.</p>
  return (
    <svg viewBox="0 0 280 230" className="w-full max-h-[230px]">
      {items.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        return <line key={i} x1={x} y1={y} x2={cx} y2={cy} stroke="#FF5200" strokeWidth={1} strokeDasharray="4,3" strokeOpacity={0.4} />
      })}
      <circle cx={cx} cy={cy} r={24} fill="#FF5200" />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={6} fontWeight="bold">YOUR</text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize={6} fontWeight="bold">LOCATION</text>
      {items.map((item, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={18} fill="white" stroke="#FF5200" strokeWidth={1.5} />
            <text x={x} y={y - 4} textAnchor="middle" fill="#FF5200" fontSize={7} fontWeight="bold">{item.sharePct}%</text>
            <text x={x} y={y + 5} textAnchor="middle" fill="#666" fontSize={5.5}>{item.name.length > 10 ? item.name.slice(0, 9) + '…' : item.name}</text>
          </g>
        )
      })}
    </svg>
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
  const [activeTab, setActiveTab] = useState<'matched' | 'overview' | 'saved' | 'inquiries'>('matched')

  // Matches
  const [matches, setMatches] = useState<MatchedProperty[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)

  // Map state
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null)
  const [mapMode, setMapMode] = useState<'pins' | 'heatmap' | 'satellite'>('pins')
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<string | null>(null)

  // Intelligence (right panel)
  const [rightMode, setRightMode] = useState<RightPanelMode>('map')
  const [selectedMatch, setSelectedMatch] = useState<MatchedProperty | null>(null)
  const [intelData, setIntelData] = useState<IntelligenceData | null>(null)
  const [intelLoading, setIntelLoading] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<IntelTab>('overview')

  // Google Maps loader
  const { isLoaded } = useLoadScript({ googleMapsApiKey: getGoogleMapsApiKey(), libraries: GOOGLE_MAPS_LIBRARIES })

  // Auth + fetch on mount
  useEffect(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('brandId') : null
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('brandName') : null
    if (!storedId) { router.replace('/dashboard/brand/login'); return }
    setBrandId(storedId)
    if (storedName) setBrandName(storedName)
    fetchDashboard(storedId)
    fetchMatches(storedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Auto-fit map to matches
  useEffect(() => {
    if (!mapRef || matches.length === 0 || rightMode === 'intelligence') return
    const withCoords = matches.filter((m) => m.coords)
    if (withCoords.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    withCoords.forEach((m) => bounds.extend(m.coords!))
    mapRef.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })
  }, [mapRef, matches, rightMode])

  // Pan on hover
  useEffect(() => {
    if (!mapRef || !hoveredPropertyId) return
    const m = matches.find((m) => m.property.id === hoveredPropertyId)
    if (m?.coords) mapRef.panTo({ lat: m.coords.lat, lng: m.coords.lng })
  }, [hoveredPropertyId, mapRef, matches])

  const fetchDashboard = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/brand?brandId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.brand?.name) setBrandName(json.brand.name)
      }
    } catch (err) { console.error('[Brand Dashboard] fetch error:', err) }
    finally { setLoading(false) }
  }

  const fetchMatches = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/brand/matches?brandId=${encodeURIComponent(id)}`)
      if (res.ok) { const json = await res.json(); setMatches(json.matches || []) }
    } finally { setMatchesLoading(false) }
  }

  const fetchPropertyIntelligence = useCallback(async (
    propertyId: string,
    property: MatchedProperty['property'],
    coords: { lat: number; lng: number } | null
  ) => {
    setIntelLoading(true)
    setIntelData(null)
    setRightMode('intelligence')
    const brand = data?.brand ?? null
    try {
      if (coords) {
        const liveRes = await fetch('/api/location-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: coords.lat, lng: coords.lng,
            address: property.address, city: property.city,
            state: 'Karnataka', propertyType: property.propertyType,
            businessType: brand?.industry || '',
          }),
        })
        if (liveRes.ok) {
          const liveData = await liveRes.json()
          if (liveData.success) {
            const intel = transformLiveIntelligence(liveData.data, coords)
            const { competitors: sameCat, complementaryBrands: compBrands } = splitCompetitors(intel.competitors, brand?.industry)
            setIntelData({ ...intel, competitors: sameCat, complementaryBrands: compBrands })
            return
          }
        }
      }
      // Fallback to DB intelligence
      const dbRes = await fetch(`/api/intelligence/${propertyId}?category=${encodeURIComponent(brand?.industry || '')}`)
      if (dbRes.ok) {
        const dbData = await dbRes.json()
        if (dbData.intelligence && coords) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const intel = dbData.intelligence as any
          setIntelData({
            coords, overallScore: Number(intel.marketPotentialScore) || 50, highlights: [],
            totalFootfall: Number(intel.dailyFootfall) || 0, growthTrend: 0, spendingCapacity: 0,
            numberOfStores: 0, retailIndex: 0.5, hourlyPattern: [], totalHouseholds: 0,
            affluenceIndicator: 'Medium', catchment: [], competitors: [], complementaryBrands: [],
            crowdPullers: [], retailMix: [], cannibalisationRisk: [], storeClosureRisk: [], similarMarkets: [],
            metroDistance: null, metroName: null, busStops: 0,
          })
        }
      }
    } catch (err) { console.error('[Brand Dashboard] intel error:', err) }
    finally { setIntelLoading(false) }
  }, [data])

  const selectProperty = (m: MatchedProperty) => {
    setSelectedMatch(m)
    setRightPanelTab('overview')
    setActiveInfoWindowId(m.property.id)
    if (m.coords && mapRef) { mapRef.panTo(m.coords); mapRef.setZoom(15) }
    fetchPropertyIntelligence(m.property.id, m.property, m.coords)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F7F5]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = data?.stats ?? { totalViews: 0, totalSaved: 0, totalInquiries: 0, pendingInquiries: 0 }
  const brand = data?.brand ?? null
  const recentViews = data?.recentViews ?? []
  const savedProperties = data?.savedProperties ?? []
  const inquiries = data?.inquiries ?? []

  const isMapVisible = rightMode === 'map' || (rightMode === 'intelligence' && rightPanelTab === 'map')

  const INTEL_TABS: { key: IntelTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'catchment', label: 'Catchment' },
    { key: 'market', label: 'Market' },
    { key: 'competitors', label: 'Competitors' },
    { key: 'risk', label: 'Risk' },
    { key: 'similar', label: 'Similar Markets' },
    { key: 'map', label: '🗺 Map' },
  ]

  return (
    <div className="flex h-screen bg-[#F7F7F5] overflow-hidden">

      {/* ══ LEFT PANEL ══ */}
      <div className="w-[380px] flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-100 overflow-hidden">

        {/* Brand Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lokazen-logo-text.svg" alt="Lokazen" className="h-7" />
            </Link>
            <button
              onClick={() => { localStorage.clear(); router.push('/') }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Exit
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {(brandName || 'B')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base leading-tight">{brandName || brand?.companyName || 'Brand'}</p>
              <p className="text-xs text-gray-500">
                {brand?.industry ? `${brand.industry} · ` : ''}{brand?.phone || brand?.email || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Requirements Strip */}
        {brand && (brand.budgetMin || brand.preferredLocations) && (
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <p className="text-[10px] font-semibold text-[#FF5200] uppercase tracking-wide mb-1.5">Your Requirements</p>
            <div className="flex flex-wrap gap-1.5">
              {brand.budgetMin && brand.budgetMax && (
                <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[11px] text-gray-700 font-medium">
                  ₹{brand.budgetMin.toLocaleString('en-IN')}–₹{brand.budgetMax.toLocaleString('en-IN')}/mo
                </span>
              )}
              {brand.minSize && brand.maxSize && (
                <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[11px] text-gray-700 font-medium">
                  {brand.minSize.toLocaleString()}–{brand.maxSize.toLocaleString()} sqft
                </span>
              )}
              {Array.isArray(brand.preferredLocations) && brand.preferredLocations.map((loc: string) => (
                <span key={loc} className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[11px] text-gray-700 font-medium">{loc}</span>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { label: 'Matches', value: matches.length, icon: '🎯', color: 'text-[#FF5200]' },
              { label: 'Viewed', value: stats.totalViews, icon: '👁', color: 'text-blue-600' },
              { label: 'Saved', value: stats.totalSaved, icon: '♥', color: 'text-pink-600' },
              { label: 'Inquiries', value: stats.totalInquiries, icon: '💬', color: 'text-purple-600' },
              { label: 'Pending', value: stats.pendingInquiries, icon: '⏳', color: 'text-amber-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="min-w-[78px] flex-shrink-0 rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                <div className="text-base mb-0.5">{icon}</div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 flex-shrink-0">
          <nav className="flex text-xs overflow-x-auto">
            {([
              { key: 'matched', label: `Matches (${matches.length})` },
              { key: 'overview', label: `Views (${recentViews.length})` },
              { key: 'saved', label: `Saved (${savedProperties.length})` },
              { key: 'inquiries', label: `Inquiries (${inquiries.length})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap px-3.5 py-2.5 border-b-2 font-medium transition-colors flex-shrink-0 ${
                  activeTab === key ? 'border-[#FF5200] text-[#FF5200]' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Matches Tab ── */}
          {activeTab === 'matched' && (
            <div className="py-2">
              {matchesLoading ? (
                <div className="px-3 space-y-2 py-2">
                  {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />)}
                </div>
              ) : matches.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <p className="text-sm text-gray-500 mb-3">No matches found. Update your preferences to get matched.</p>
                  <Link href="/onboarding/brand" className="text-xs text-[#FF5200] hover:underline">Update Preferences →</Link>
                </div>
              ) : (
                matches.map((m) => {
                  const imgSrc = Array.isArray(m.property.images) ? (m.property.images as string[])[0] : undefined
                  const isSelected = selectedMatch?.property.id === m.property.id
                  return (
                    <div
                      key={m.property.id}
                      onClick={() => selectProperty(m)}
                      onMouseEnter={() => setHoveredPropertyId(m.property.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      className={`mx-3 mb-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected ? 'border-[#FF5200] bg-orange-50 shadow-sm' : 'border-gray-100 bg-white hover:border-orange-200'
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-50 to-red-50 relative">
                          {imgSrc ? (
                            <Image src={imgSrc} alt={m.property.title} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><BuildingIcon /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-semibold text-sm text-gray-900 line-clamp-1">{m.property.title}</p>
                            <span className="flex-shrink-0 text-[11px] font-bold text-white bg-[#FF5200] rounded-full px-2 py-0.5">{m.bfiScore}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{m.property.city}</p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{m.property.size.toLocaleString()} sqft</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{formatPrice(m.property.price, m.property.priceType)}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 capitalize">{m.property.propertyType}</span>
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {m.breakdown.locationFit >= 80 && <span className="text-[10px] bg-green-50 text-green-700 rounded-full px-2 py-0.5">✓ Area Match</span>}
                            {m.breakdown.budgetFit >= 80 && <span className="text-[10px] bg-green-50 text-green-700 rounded-full px-2 py-0.5">✓ Budget Fit</span>}
                            {m.breakdown.budgetFit < 60 && <span className="text-[10px] bg-yellow-50 text-yellow-700 rounded-full px-2 py-0.5">⚠ Over Budget</span>}
                          </div>
                          <div className="flex gap-2 mt-1.5">
                            <Link href={`/properties/${encodePropertyId(m.property.id)}`} onClick={(e) => e.stopPropagation()} className="text-[10px] text-[#FF5200] hover:underline">View →</Link>
                            <button onClick={(e) => { e.stopPropagation(); selectProperty(m) }} className="text-[10px] text-gray-400 hover:text-[#FF5200]">Intelligence</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Views Tab ── */}
          {activeTab === 'overview' && (
            <div className="py-2 px-3">
              {recentViews.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-500 mb-3">No views yet.</p>
                  <Link href="/properties/results" className="text-xs text-[#FF5200] hover:underline">Browse Spaces →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 py-2">
                  {recentViews.map((v) => (
                    <Link key={v.id} href={`/properties/${encodePropertyId(v.propertyId)}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-orange-200 transition-all">
                      <div className="relative h-28 bg-gray-100">
                        {Array.isArray(v.property.images) && v.property.images[0] ? (
                          <Image src={v.property.images[0]} alt={v.property.title} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-50"><BuildingIcon /></div>
                        )}
                        <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge(v.property.status)}`}>
                          {v.property.status === 'approved' ? 'Live' : v.property.status}
                        </span>
                      </div>
                      <div className="p-2">
                        <p className="font-semibold text-xs text-gray-900 line-clamp-1 mb-0.5">{v.property.title}</p>
                        <p className="text-[10px] text-gray-500 mb-1">{v.property.city}</p>
                        <p className="text-xs font-bold text-[#FF5200]">{formatPrice(v.property.price, v.property.priceType)}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Viewed {formatDate(v.viewedAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Saved Tab ── */}
          {activeTab === 'saved' && (
            <div className="py-2 px-3">
              {savedProperties.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-500 mb-3">No saved spaces yet.</p>
                  <Link href="/properties/results" className="text-xs text-[#FF5200] hover:underline">Browse Spaces →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 py-2">
                  {savedProperties.map((sp) => (
                    <Link key={sp.id} href={`/properties/${encodePropertyId(sp.property.id)}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-orange-200 transition-all">
                      <div className="relative h-28 bg-gray-100">
                        {Array.isArray(sp.property.images) && (sp.property.images as string[])[0] ? (
                          <Image src={(sp.property.images as string[])[0]} alt={sp.property.title} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-50"><BuildingIcon /></div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="font-semibold text-xs text-gray-900 line-clamp-1 mb-0.5">{sp.property.title}</p>
                        <p className="text-[10px] text-gray-500 mb-1">{sp.property.city}</p>
                        <p className="text-xs font-bold text-[#FF5200]">{formatPrice(Number(sp.property.price), sp.property.priceType)}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Saved {formatDate(sp.savedAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Inquiries Tab ── */}
          {activeTab === 'inquiries' && (
            <div className="py-2 px-3">
              {inquiries.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-500 mb-3">No inquiries sent yet.</p>
                  <Link href="/properties/results" className="text-xs text-[#FF5200] hover:underline">Browse Spaces →</Link>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="bg-white rounded-xl border border-gray-100 p-3 hover:border-orange-200 transition-all">
                      <div className="flex gap-2.5">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {Array.isArray(inq.property.images) && inq.property.images[0] ? (
                            <Image src={inq.property.images[0]} alt={inq.property.title} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-orange-50"><BuildingIcon className="w-5 h-5" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <Link href={`/properties/${encodePropertyId(inq.property.id)}`} className="font-semibold text-xs text-gray-900 hover:text-[#FF5200] truncate">{inq.property.title}</Link>
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium border capitalize ${statusBadge(inq.status)}`}>{inq.status}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-1 truncate">{inq.property.city}</p>
                          <p className="text-[11px] text-gray-600 line-clamp-2">{inq.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDate(inq.createdAt)}{inq.owner ? ` · ${inq.owner.name}` : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-100 mt-2 text-center">
            <p className="text-xs text-gray-400">
              Need help?{' '}
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-[#FF5200] hover:underline">Chat on WhatsApp</a>
            </p>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Intelligence header — only when property selected */}
        {rightMode === 'intelligence' && selectedMatch && (
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white flex-shrink-0 z-10">
            <button
              onClick={() => { setRightMode('map'); setSelectedMatch(null); setIntelData(null) }}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600 transition-colors"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{selectedMatch.property.title}</p>
              <p className="text-xs text-gray-500 truncate">{selectedMatch.property.address}, {selectedMatch.property.city}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-bold text-white bg-[#FF5200] rounded-full px-3 py-1">{selectedMatch.bfiScore} BFI</span>
              <Link
                href={`/properties/${encodePropertyId(selectedMatch.property.id)}`}
                className="text-xs font-medium text-[#FF5200] border border-[#FF5200] rounded-lg px-3 py-1 hover:bg-orange-50 transition-colors"
              >
                View →
              </Link>
            </div>
          </div>
        )}

        {/* Intelligence tab bar */}
        {rightMode === 'intelligence' && (
          <div className="flex-shrink-0 border-b border-gray-100 bg-white z-10">
            <nav className="flex overflow-x-auto px-2">
              {INTEL_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRightPanelTab(key)}
                  className={`whitespace-nowrap px-4 py-2.5 text-xs border-b-2 font-medium transition-colors flex-shrink-0 ${
                    rightPanelTab === key ? 'border-[#FF5200] text-[#FF5200]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Map layer — always in DOM, z-index controlled */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${isMapVisible ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
          style={{ top: rightMode === 'intelligence' ? '97px' : '0' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerClassName="w-full h-full"
              center={selectedMatch?.coords ?? { lat: 12.9716, lng: 77.5946 }}
              zoom={rightMode === 'intelligence' ? 15 : 12}
              options={{ ...DEFAULT_MAP_OPTIONS, zoomControl: true }}
              onLoad={(map) => setMapRef(map)}
            >
              {/* All match pins */}
              {isLoaded && matches.map((m) => {
                if (!m.coords) return null
                const isActive = selectedMatch?.property.id === m.property.id
                const isHovered = hoveredPropertyId === m.property.id
                return (
                  <Marker
                    key={m.property.id}
                    position={m.coords}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: isActive ? 28 : isHovered ? 26 : 22,
                      fillColor: '#FF5200', fillOpacity: 1,
                      strokeColor: '#ffffff', strokeWeight: isActive ? 3 : 2,
                    }}
                    label={{ text: String(m.bfiScore), color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
                    onClick={() => selectProperty(m)}
                  />
                )
              })}
              {/* Competitor pins when in intelligence mode */}
              {isLoaded && rightMode === 'intelligence' && intelData && [...intelData.competitors, ...intelData.complementaryBrands].map((c, i) => {
                if (!selectedMatch?.coords) return null
                // approximate nearby coords — slight offset
                const angle = (i / Math.max(1, intelData.competitors.length + intelData.complementaryBrands.length)) * 2 * Math.PI
                const dist = c.distance / 111320
                const lat = selectedMatch.coords.lat + dist * Math.cos(angle)
                const lng = selectedMatch.coords.lng + dist * Math.sin(angle)
                return (
                  <Marker
                    key={`comp-${i}`}
                    position={{ lat, lng }}
                    icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#6366f1', fillOpacity: 0.8, strokeColor: '#fff', strokeWeight: 1.5 }}
                  />
                )
              })}
              {/* InfoWindows */}
              {isLoaded && matches.map((m) => {
                if (!m.coords || activeInfoWindowId !== m.property.id) return null
                return (
                  <InfoWindow key={`iw-${m.property.id}`} position={m.coords} onCloseClick={() => setActiveInfoWindowId(null)}>
                    <div className="p-2 min-w-[190px]">
                      <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{m.property.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{m.property.address}, {m.property.city}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#FF5200]">{formatPrice(m.property.price, m.property.priceType)}</span>
                        <span className="bg-[#FF5200] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{m.bfiScore}</span>
                      </div>
                      <a href={`/properties/${encodePropertyId(m.property.id)}`} className="block text-center text-xs font-semibold text-white bg-[#FF5200] rounded-lg py-1.5 hover:bg-orange-600">View Details →</a>
                    </div>
                  </InfoWindow>
                )
              })}
              {/* Heatmap */}
              {isLoaded && mapMode === 'heatmap' && (
                <HeatmapLayer
                  data={matches.filter((m) => m.coords).map((m) => new google.maps.LatLng(m.coords!.lat, m.coords!.lng))}
                  options={{ radius: 40, gradient: ['rgba(255,255,255,0)', '#FFB899', '#FF5200', '#E4002B'] }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Map controls */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur rounded-xl shadow-md p-1.5 flex flex-col gap-1">
            {(['pins', 'heatmap', 'satellite'] as const).map((mode) => (
              <button key={mode} onClick={() => { setMapMode(mode); if (mapRef) mapRef.setMapTypeId(mode === 'satellite' ? 'satellite' : 'roadmap') }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${mapMode === mode ? 'bg-[#FF5200] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {mode === 'pins' ? '📍 Pins' : mode === 'heatmap' ? '🌡 Heatmap' : '🛰 Satellite'}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-3 z-20 bg-white/95 backdrop-blur rounded-xl shadow-md px-3 py-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#FF5200] flex items-center justify-center"><span className="text-white text-[8px] font-bold">85</span></div>
            <span className="text-xs text-gray-700 font-medium">{matches.length} Matched Properties</span>
          </div>

          {/* "Select property" hint */}
          {rightMode === 'map' && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur rounded-full shadow-md px-4 py-2 pointer-events-none">
              <p className="text-xs text-gray-600 whitespace-nowrap">Select a property to see full Location Intelligence →</p>
            </div>
          )}
        </div>

        {/* ── Intelligence content panel ── */}
        {rightMode === 'intelligence' && rightPanelTab !== 'map' && (
          <div className="flex-1 overflow-y-auto bg-white relative z-20">

            {/* Intelligence loading */}
            {intelLoading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/95">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-700 font-medium">Fetching live intelligence...</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedMatch?.property.title}</p>
                </div>
              </div>
            )}

            {!intelLoading && !intelData && (
              <div className="flex items-center justify-center h-full py-20">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">No intelligence data available for this property.</p>
                  <p className="text-xs text-gray-400">Coordinates may be missing — coordinates are required for live intelligence.</p>
                </div>
              </div>
            )}

            {!intelLoading && intelData && (
              <>
                {/* ── TAB: OVERVIEW ── */}
                {rightPanelTab === 'overview' && (
                  <div>
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-start gap-2 mb-1">
                        <h2 className="font-bold text-lg text-gray-900">Overview</h2>
                        <span className="text-[10px] text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full mt-1 leading-tight">
                          Footfall · Competitors · Growth · Market Size
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon key={i} filled={i < Math.round(intelData.overallScore / 20)} className="w-6 h-6" />
                          ))}
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{Math.round(intelData.overallScore / 20)}</span>
                        <span className="text-gray-500 text-sm">out of 5</span>
                        <span className="text-sm text-gray-400">({intelData.overallScore}/100)</span>
                      </div>
                    </div>

                    {intelData.highlights.length > 0 && (
                      <div className="px-5 py-3 border-b border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Highlights</p>
                        <div className="flex gap-2 flex-wrap">
                          {intelData.highlights.map((h) => <HighlightChip key={h} label={h} />)}
                        </div>
                      </div>
                    )}

                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">BFI Breakdown</p>
                      {selectedMatch && [
                        { label: 'Location Fit', value: selectedMatch.breakdown.locationFit },
                        { label: 'Budget Fit', value: selectedMatch.breakdown.budgetFit },
                        { label: 'Size Fit', value: selectedMatch.breakdown.sizeFit },
                      ].map(({ label, value }) => (
                        <div key={label} className="mb-2.5">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{label}</span>
                            <span className="font-semibold text-gray-900">{value}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FF5200] rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 py-4">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Property Details</p>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCell label="AREA" value={`${selectedMatch?.property.size.toLocaleString()} sqft`} />
                        <MetricCell label="RENT" value={formatPrice(selectedMatch?.property.price || 0, selectedMatch?.property.priceType || 'monthly')} />
                        <MetricCell label="TYPE" value={selectedMatch?.property.propertyType || '—'} />
                        <MetricCell label="CITY" value={selectedMatch?.property.city || '—'} />
                        {intelData.metroName && <MetricCell label="NEAREST METRO" value={intelData.metroName} benchmark={intelData.metroDistance ? `${(intelData.metroDistance / 1000).toFixed(1)} km` : undefined} />}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: CATCHMENT ── */}
                {rightPanelTab === 'catchment' && (
                  <div>
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Population & Lifestyle</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCell label="TOTAL HOUSEHOLDS" value={intelData.totalHouseholds > 0 ? intelData.totalHouseholds.toLocaleString('en-IN') : '—'} trend="up" />
                        <MetricCell label="AFFLUENCE INDICATOR" value={intelData.affluenceIndicator || '—'} trend="up" benchmark="Bengaluru Avg 0.49" />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-4">Where Shoppers Come From</h3>
                      <CatchmentFlow catchment={intelData.catchment} />
                      {intelData.catchment.length > 0 && (
                        <div className="mt-4 space-y-1">
                          {intelData.catchment.slice(0, 6).map((c) => (
                            <div key={c.pincode} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                              <div>
                                <span className="font-medium text-gray-800">{c.name}</span>
                                <span className="text-gray-400 ml-1">({c.pincode})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#FF5200] rounded-full" style={{ width: `${c.sharePct}%` }} />
                                </div>
                                <span className="font-semibold text-gray-900 w-8 text-right">{c.sharePct}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB: MARKET ── */}
                {rightPanelTab === 'market' && (
                  <div>
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Retail Indicators</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">5 min Walking</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCell label="TOTAL FOOTFALL" value={intelData.totalFootfall.toLocaleString()} trend="up" benchmark="7.68" />
                        <MetricCell label="GROWTH TRENDS" value={intelData.growthTrend.toFixed(1)} trend="up" benchmark="36.89" />
                        <MetricCell label="SPENDING CAPACITY" value={intelData.spendingCapacity.toFixed(1)} trend="up" benchmark="27.89" />
                        <MetricCell label="NUMBER OF STORES" value={String(intelData.numberOfStores)} trend="down" benchmark="245" />
                        <MetricCell label="RETAIL INDEX" value={intelData.retailIndex.toFixed(3)} trend="up" benchmark="0.34" />
                      </div>
                    </div>

                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">Footfall Trends</h3>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold rounded px-1.5 py-0.5">BETA</span>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">5 min Walking</span>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={getHourlyData(intelData)} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                          <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={2} />
                          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f3f4f6' }} formatter={(v: number) => [`${v.toLocaleString()} people`, 'Footfall']} />
                          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            {getHourlyData(intelData).map((entry, i) => <Cell key={i} fill={entry.peak ? '#FF5200' : '#FFB899'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {intelData.retailMix.length > 0 && (
                      <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-3">Retail Mix by Category</h3>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={intelData.retailMix} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                            <XAxis dataKey="category" tick={{ fontSize: 9 }} axisLine={false} />
                            <YAxis tick={{ fontSize: 9 }} axisLine={false} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Bar dataKey="nonBranded" stackId="a" fill="#e57373" name="Non-Branded" />
                            <Bar dataKey="branded" stackId="a" fill="#4caf93" name="Branded" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {intelData.crowdPullers.length > 0 && (
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-gray-900">Crowd Pullers</h3>
                          <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">5 min Walking</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead><tr className="text-gray-400 border-b"><th className="text-left py-1">POI</th><th className="text-left">CATEGORY</th><th className="text-right">DIST (KM)</th></tr></thead>
                          <tbody>
                            {intelData.crowdPullers.slice(0, 5).map((p) => (
                              <tr key={p.name} className="border-b border-gray-50">
                                <td className="py-1.5 text-gray-800 font-medium">{p.name}</td>
                                <td className="text-gray-500">{p.category}</td>
                                <td className="text-right text-gray-700">{(p.distance / 1000).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: COMPETITORS ── */}
                {rightPanelTab === 'competitors' && (
                  <div>
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Competitor Brands</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                      </div>
                      {intelData.competitors.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No competitors found in this market.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead><tr className="text-gray-400 border-b"><th className="text-left py-1">BRAND</th><th className="text-left">CAT</th><th className="text-right">DIST</th></tr></thead>
                          <tbody>
                            {intelData.competitors.slice(0, 8).map((c, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-800 font-medium">{c.name}</span>
                                    {c.branded && <span className="text-[9px] bg-orange-100 text-orange-600 rounded px-1">Popular</span>}
                                  </div>
                                  {c.rating && <span className="text-[10px] text-yellow-500">{'★'.repeat(Math.round(c.rating))} {c.rating.toFixed(1)}</span>}
                                </td>
                                <td className="text-gray-500 capitalize">{c.category}</td>
                                <td className="text-right text-gray-600">{(c.distance / 1000).toFixed(2)} km</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {intelData.complementaryBrands.length > 0 && (
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">Complementary Brands</h3>
                            <span className="text-xs bg-green-100 text-green-600 rounded-full px-1.5 py-0.5">Low Risk</span>
                          </div>
                          <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead><tr className="text-gray-400 border-b"><th className="text-left py-1">POI</th><th className="text-left">CATEGORY</th><th className="text-right">DIST (KM)</th></tr></thead>
                          <tbody>
                            {intelData.complementaryBrands.slice(0, 6).map((b, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-1.5 text-gray-800 font-medium">{b.name}</td>
                                <td className="text-gray-500 capitalize">{b.category}</td>
                                <td className="text-right text-gray-700">{(b.distance / 1000).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: RISK ── */}
                {rightPanelTab === 'risk' && (
                  <div>
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Cannibalisation Effects</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                      </div>
                      {intelData.cannibalisationRisk.length === 0 ? (
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <p className="text-sm text-green-700 font-medium">✓ No cannibalisation risk detected</p>
                          <p className="text-xs text-green-600 mt-1">No same-brand outlets found nearby.</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={Math.max(120, intelData.cannibalisationRisk.length * 32)}>
                          <BarChart layout="vertical" data={intelData.cannibalisationRisk.slice(0, 7)} margin={{ top: 4, right: 12, left: 8, bottom: 20 }}>
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} label={{ value: 'Cannibalisation %', position: 'insideBottom', offset: -12, fontSize: 9 }} />
                            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 8 }} />
                            <Tooltip formatter={(v) => [`${v}%`, 'Cannibalisation']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Bar dataKey="cannibalisation" fill="#ef4444" radius={[0, 2, 2, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Store Closure Risk</h3>
                        <span className="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5">5 min Walking</span>
                      </div>
                      {intelData.storeClosureRisk.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No store closure data available.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead><tr className="text-gray-400 border-b"><th className="text-left py-1">CATEGORY</th><th className="text-right">TOTAL POIs</th></tr></thead>
                          <tbody>
                            {intelData.storeClosureRisk.map((r) => (
                              <tr key={r.category} className="border-b border-gray-50">
                                <td className="py-1.5 text-gray-800 capitalize">{r.category}</td>
                                <td className="text-right text-gray-700 font-medium">{r.totalPois}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB: SIMILAR MARKETS ── */}
                {rightPanelTab === 'similar' && (
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Similar Markets</h3>
                      <div className="flex gap-1">
                        <button className="text-xs px-2.5 py-1 bg-orange-50 text-[#FF5200] rounded-full border border-orange-200">Nearby</button>
                        <button className="text-xs px-2.5 py-1 text-gray-500 rounded-full">Within City</button>
                      </div>
                    </div>
                    {intelData.similarMarkets.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No similar market data available.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {intelData.similarMarkets.slice(0, 6).map((m) => (
                          <div key={m.key} className="border border-gray-100 rounded-xl p-3 hover:border-orange-200 cursor-pointer transition-all">
                            <p className="font-semibold text-sm text-gray-900 capitalize mb-1">{m.key.replace(/-/g, ' ')}</p>
                            <div className="flex gap-0.5 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} filled={i < Math.round(m.score / 20)} className="w-3.5 h-3.5" />)}
                            </div>
                            <p className="text-[10px] text-gray-400 mb-2">Score: {m.score}/100</p>
                            <div className="flex gap-1.5">
                              <button
                                className="flex-1 text-[10px] text-center py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-[#FF5200] hover:border-orange-200 transition-colors"
                                onClick={() => { if (mapRef) { mapRef.panTo({ lat: m.lat, lng: m.lng }); mapRef.setZoom(15); setRightPanelTab('map') } }}
                              >
                                View on Map
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
