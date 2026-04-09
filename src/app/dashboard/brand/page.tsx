'use client'

import {
  useEffect,
  useId,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleMap, Marker, HeatmapLayer, useLoadScript, InfoWindow } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'
import { encodePropertyId } from '@/lib/property-slug'
import Logo from '@/components/Logo'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Area,
  AreaChart,
} from 'recharts'
import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'
import { rehydrateIntelGeographyFromCoords } from '@/lib/location-intelligence/intel-geo-fallback'
import {
  brandContextWantsQsrCompetitors,
  competitorMatchesQsrFocus,
} from '@/lib/location-intelligence/brand-competitor-segment'
import type { LocationSynthesis } from '@/lib/intelligence/brand-intel-enrichment.types'
import { toIndustryKey } from '@/lib/intelligence/industry-key'
import { buildRevenueLocationProfile, calculateRevenueFromBenchmarks } from '@/lib/intelligence/calculate-revenue'
import {
  DEFAULT_BANGALORE_MAP_CENTER,
  areUsablePinCoords,
  getMapLinkFromAmenities,
  extractLatLngFromMapLink,
  mergeCoordsWithMapLink,
} from '@/lib/property-coordinates'
import {
  LayoutGrid,
  Building2,
  Heart,
  Calendar,
  Bell,
  MapPin as LucideMapPin,
  TrendingUp,
  Activity,
  type LucideIcon,
} from 'lucide-react'

const DEFAULT_MAP_CENTER = DEFAULT_BANGALORE_MAP_CENTER

// ─── Types ────────────────────────────────────────────────────────────────────

type BrandProfileBrief = {
  timeline: string | null
  storeType: string | null
  targetAudience: string | null
  targetAudienceTags: string[]
  additionalRequirements: string | null
  badges: string[]
}

type BrandInfo = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  companyName?: string | null
  industry?: string | null
  category?: string | null
  preferredLocations?: string[] | null
  budgetMin?: number | null
  budgetMax?: number | null
  minSize?: number | null
  maxSize?: number | null
  brandProfile?: BrandProfileBrief | null
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
  /** Census-style pincode catchment */
  catchment: Array<{ pincode: string; name: string; sharePct: number; distanceM: number; areaType?: string }>
  /** Apartments, tech parks, corporate nodes — feeds heatmap density */
  catchmentLandmarks: Array<{ name: string; kind: string; distance: number; lat: number; lng: number }>
  competitors: Array<{
    name: string
    category: string
    distance: number
    rating?: number
    branded: boolean
    lat?: number
    lng?: number
    reviewCount?: number
  }>
  complementaryBrands: Array<{
    name: string
    category: string
    distance: number
    lat?: number
    lng?: number
    reviewCount?: number
  }>
  crowdPullers: Array<{ name: string; category: string; distance: number }>
  retailMix: Array<{ category: string; branded: number; nonBranded: number }>
  cannibalisationRisk: Array<{ name: string; distance: number; cannibalisation: number }>
  storeClosureRisk: Array<{ category: string; totalPois: number }>
  similarMarkets: Array<{ key: string; lat: number; lng: number; score: number }>
  metroDistance: number | null
  metroName: string | null
  busStops: number
  rentPerSqftCommercial: number | null
  /** Area / listing model band (before synthesis) */
  marketRentLow: number | null
  marketRentHigh: number | null
  rentDataSource: 'listing' | 'area_benchmark' | null
  nearestCommercialAreaKey: string | null
  incomeLevel: string | null
  /** Ward / model income band shares (%) when present on intel payload */
  incomeAbove15L?: number | null
  income10to15L?: number | null
  /** Proprietary Lokazen location synthesis (one pass, all tabs) */
  locationSynthesis: LocationSynthesis | null
  /** Narrative not in cache yet — filled by scheduled /api/ai/synthesize */
  locationSynthesisPending: boolean
  locationSynthesisError: string | null
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

function shortenText(s: string, max: number) {
  const t = (s || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function companyInitials(companyOrName: string) {
  const parts = companyOrName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  const one = parts[0] || 'B'
  return one.slice(0, 2).toUpperCase()
}

function normalizePreferredLocationsList(brand: BrandInfo | null): string[] {
  if (!brand?.preferredLocations) return []
  const raw = brand.preferredLocations
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p.map(String).filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

function resolveDashboardBadges(brand: BrandInfo | null, matchCount: number): string[] {
  const raw = brand?.brandProfile?.badges ?? []
  const out = [...raw]
  if (matchCount >= 2 && !out.includes('Multiple Properties Matched')) {
    out.push('Multiple Properties Matched')
  }
  return out
}

function brandHasBrief(brand: BrandInfo | null, preferredList: string[]): boolean {
  if (!brand) return false
  const p = brand.brandProfile
  return !!(
    (brand.budgetMin && brand.budgetMax) ||
    (brand.minSize && brand.maxSize) ||
    preferredList.length > 0 ||
    (brand.category && brand.category.trim()) ||
    (p?.timeline && p.timeline.trim()) ||
    (p?.storeType && p.storeType.trim()) ||
    (p?.targetAudience && p.targetAudience.trim()) ||
    (p?.targetAudienceTags && p.targetAudienceTags.length > 0) ||
    (p?.additionalRequirements && p.additionalRequirements.trim()) ||
    (p?.badges && p.badges.length > 0)
  )
}

function SynthesisSkeletonLine({ width = 'w-full', short = false }: { width?: string; short?: boolean }) {
  const w = short ? 'w-1/2' : width
  return (
    <div
      className={`h-3.5 ${w} rounded-full bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 animate-pulse`}
    />
  )
}

function SynthesisSectionSkeleton({ label, lines = 2 }: { label: string; lines?: number }) {
  return (
    <div className="py-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5200] animate-pulse" />
        <span className="text-[10px] font-semibold text-[#FF5200] uppercase tracking-wide animate-pulse">
          {label}
        </span>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <SynthesisSkeletonLine key={i} width={i === lines - 1 ? 'w-3/4' : 'w-full'} />
      ))}
    </div>
  )
}

function TabSynthesisCallout({
  title,
  narrative,
  bullets,
  loading,
  analysisLabel = 'Analysing…',
  analysisLines = 2,
  synthesisPending,
  synthesisUnavailable,
}: {
  title: string
  narrative?: string
  bullets?: string[]
  loading?: boolean
  analysisLabel?: string
  analysisLines?: number
  /** Scheduled synthesis not written yet — no live AI on this view */
  synthesisPending?: boolean
  synthesisUnavailable?: boolean
}) {
  if (loading) {
    return (
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gradient-to-b from-orange-50/50 to-transparent">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <SynthesisSectionSkeleton label={analysisLabel} lines={analysisLines} />
      </div>
    )
  }
  const hasN = Boolean(narrative?.trim())
  const bs = (bullets || []).filter(Boolean)
  if (synthesisPending && !hasN && bs.length === 0) {
    return (
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-b from-blue-50/30 to-transparent">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <div className="text-[11px] text-gray-500 py-2 leading-relaxed rounded-lg border border-gray-100 bg-gray-50/80 px-3 flex items-start gap-2">
          <IconPulseDot className="w-3.5 h-3.5 text-sky-500 mt-0.5 flex-shrink-0" />
          <span>
            <span className="font-medium text-gray-700">Narrative syncing.</span>{' '}
            Scores and metrics above are live. Location narrative is generated on a scheduled cycle and will appear here shortly.
          </span>
        </div>
      </div>
    )
  }
  if (synthesisUnavailable && !hasN && bs.length === 0) {
    return (
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gradient-to-b from-orange-50/40 to-transparent">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <div className="text-[11px] text-gray-400 italic py-2">
          Intelligence analysis unavailable — chart data is still shown above.
        </div>
      </div>
    )
  }
  if (!hasN && bs.length === 0) return null
  return (
    <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gradient-to-b from-orange-50/40 to-transparent">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      {hasN && <p className="text-xs text-gray-800 leading-relaxed mb-2">{narrative}</p>}
      {bs.length > 0 && (
        <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-700">
          {bs.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DecisionHeroCard({
  overallScore,
  bfiScore,
  city: _city,
  industry,
  highlights,
  onScheduleVisit,
  onToggleSave,
  onToggleInterested,
  isSaved,
  isInterested,
}: {
  overallScore: number
  bfiScore: number
  city: string
  industry: string
  highlights: string[]
  onScheduleVisit: () => void
  onToggleSave: () => void
  onToggleInterested: () => void
  isSaved: boolean
  isInterested: boolean
}) {
  const verdict =
    bfiScore >= 80 && overallScore >= 70
      ? { label: 'Open', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200', summary: 'High-confidence match. Strong brand fit and location quality.' }
      : bfiScore >= 65 && overallScore >= 55
        ? { label: 'Pilot', tone: 'bg-amber-100 text-amber-800 border-amber-200', summary: 'Good potential. Validate rent flexibility and site visit before proceeding.' }
        : bfiScore >= 50 && overallScore >= 40
          ? { label: 'Review', tone: 'bg-blue-100 text-blue-800 border-blue-200', summary: 'Location has merit. Review specific constraints before committing.' }
          : { label: 'Hold', tone: 'bg-rose-100 text-rose-800 border-rose-200', summary: 'Significant gaps in fit or viability. Explore alternatives first.' }

  return (
    <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40">
      <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Decision Console</span>
              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${verdict.tone}`}>{verdict.label}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Should we open at this location?</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{verdict.summary}</p>
          </div>
          <div className="flex items-end gap-4 sm:gap-5 flex-shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Lokazen score</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{overallScore}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">BFI</p>
              <p className="text-2xl sm:text-3xl font-black text-[#FF5200] leading-none">{bfiScore}</p>
            </div>
          </div>
        </div>
        {highlights.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Top drivers</p>
            <div className="flex flex-wrap gap-1.5">
              {highlights.slice(0, 4).map((h) => <HighlightChip key={h} label={h} />)}
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onScheduleVisit}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5200] rounded-xl hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            Schedule Visit
          </button>
          <button
            type="button"
            onClick={onToggleSave}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              isSaved ? 'bg-blue-50 text-blue-700 border-blue-300' : 'text-gray-600 border-gray-200 hover:border-gray-400'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200`}
          >
            {isSaved ? 'Saved' : 'Save Snapshot'}
          </button>
          <button
            type="button"
            onClick={onToggleInterested}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              isInterested ? 'bg-green-50 text-green-700 border-green-300' : 'text-gray-600 border-gray-200 hover:border-gray-400'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-200`}
          >
            {isInterested ? 'Interested' : 'Mark Interested'}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2.5">
          Based on {industry || 'category'} fit, catchment signal quality, competition pressure, and commercial viability.
        </p>
      </div>
    </div>
  )
}

function InsightMetricCard({
  label,
  value,
  note,
  tone = 'neutral',
  icon,
  sparkline,
}: {
  label: string
  value: string
  note?: string
  tone?: 'positive' | 'warning' | 'risk' | 'neutral'
  icon?: ReactNode
  sparkline?: { data: number[]; color: string }
}) {
  const toneClass =
    tone === 'positive'
      ? 'bg-emerald-50 border-emerald-100'
      : tone === 'warning'
        ? 'bg-amber-50 border-amber-100'
        : tone === 'risk'
          ? 'bg-rose-50 border-rose-100'
          : 'bg-gray-50 border-gray-100'
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        {icon ? <span className="text-gray-500 flex-shrink-0 opacity-80">{icon}</span> : null}
      </div>
      <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
      {note ? <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{note}</p> : null}
      {sparkline ? <MiniSparkline data={sparkline.data} color={sparkline.color} /> : null}
    </div>
  )
}

function QuickActionRail({
  onScheduleVisit,
  onToggleSave,
  onToggleInterested,
  onOpenMap,
  isSaved,
  isInterested,
}: {
  onScheduleVisit: () => void
  onToggleSave: () => void
  onToggleInterested: () => void
  onOpenMap: () => void
  isSaved: boolean
  isInterested: boolean
}) {
  return (
    <div className="sticky top-0 z-20 px-3 sm:px-4 py-2.5 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          type="button"
          onClick={onScheduleVisit}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF5200] rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          Schedule Visit
        </button>
        <button
          type="button"
          onClick={onToggleSave}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
            isSaved ? 'bg-blue-50 text-blue-700 border-blue-300' : 'text-gray-600 border-gray-200 hover:border-gray-400'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200`}
        >
          {isSaved ? 'Saved' : 'Save Snapshot'}
        </button>
        <button
          type="button"
          onClick={onToggleInterested}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
            isInterested ? 'bg-green-50 text-green-700 border-green-300' : 'text-gray-600 border-gray-200 hover:border-gray-400'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-200`}
        >
          {isInterested ? 'Interested' : 'Mark Interested'}
        </button>
        <button
          type="button"
          onClick={onOpenMap}
          className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:border-[#FF5200]/60 hover:text-[#FF5200] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
        >
          View on Map
        </button>
      </div>
    </div>
  )
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

/**
 * Business context for Places / scoring — **category + industry first** (respects QSR/Café on profile),
 * then falls back to company + industry. Never lead with account-holder person name.
 */
function buildLocationBusinessType(
  brand: { companyName?: string | null; industry?: string | null; category?: string | null } | null | undefined
): string {
  if (!brand) return ''
  const cat = brand.category != null ? String(brand.category).trim() : ''
  const ind = brand.industry != null ? String(brand.industry).trim() : ''
  if (cat || ind) return [cat, ind].filter(Boolean).join(' ')
  return [brand.companyName, brand.industry]
    .map((s) => (s != null ? String(s).trim() : ''))
    .filter(Boolean)
    .join(' ')
}

/** POI category (matches location-intelligence place categories / retail mix keys). */
function categoryMatchesBrandIndustry(cat: string, industry: string | null | undefined): boolean {
  if (!industry?.trim()) return false
  const ind = industry.toLowerCase()
  const c = cat.toLowerCase()
  if (
    ind.includes('sunglass') ||
    ind.includes('eye') ||
    ind.includes('optical') ||
    ind.includes('eyewear') ||
    ind.includes('spectacle') ||
    ind.includes('optometry') ||
    ind.includes('frames') ||
    /\blenskart\b/.test(ind) ||
    (ind.includes('lens') && !ind.includes('contact'))
  ) {
    return c === 'optical' || c === 'pharmacy' || c === 'medical' || /\b(optician|optical|eyewear)\b/.test(c)
  }
  if (ind.includes('qsr') || ind.includes('fast food')) {
    const cl = c.toLowerCase()
    return (
      cl === 'qsr' ||
      cl.includes('qsr') ||
      cl.includes('fast food') ||
      cl.includes('takeaway') ||
      cl.includes('meal_takeaway')
    )
  }
  if (ind.includes('cafe') || ind.includes('coffee')) return c === 'cafe' || c === 'coffee'
  if (ind.includes('restaurant') || ind.includes('dining')) return c === 'restaurant' || c === 'dining'
  if (ind.includes('bakery') || ind.includes('dessert')) return c === 'bakery' || c === 'dessert'
  if (ind.includes('bar') || ind.includes('brew') || ind.includes('pub')) return c === 'bar' || c === 'brew'
  if (ind.includes('pharma') || ind.includes('pharmacy') || ind.includes('wellness')) return c === 'pharmacy' || c === 'medical'
  if (ind.includes('salon') || ind.includes('beauty') || ind.includes('spa')) return c === 'salon' || c === 'beauty_salon'
  if (ind.includes('gym') || ind.includes('fitness')) return c === 'gym'
  if (ind.includes('fashion') || ind.includes('apparel') || ind.includes('clothing')) return c === 'retail' || c === 'clothing'
  if (ind.includes('jewellery') || ind.includes('jewelry') || ind.includes('watch')) return c === 'retail' || c === 'other'
  if (ind.includes('electronics') || ind.includes('mobile')) return c === 'retail'
  if (ind.includes('retail')) return c === 'retail' || c === 'optical' || c === 'salon'
  return c === ind || ind.includes(c)
}

function primarySegmentLabel(industry: string | null | undefined): string | null {
  if (!industry?.trim()) return null
  const ind = industry.toLowerCase()
  if (
    ind.includes('sunglass') ||
    ind.includes('eye') ||
    ind.includes('optical') ||
    ind.includes('eyewear') ||
    ind.includes('spectacle') ||
    ind.includes('optometry') ||
    ind.includes('frames') ||
    /\blenskart\b/.test(ind) ||
    (ind.includes('lens') && !ind.includes('contact'))
  ) {
    return 'Eyewear & optical'
  }
  if (ind.includes('qsr') || ind.includes('fast food')) return 'Quick-service food'
  if (ind.includes('cafe') || ind.includes('coffee')) return 'Cafés & coffee'
  if (ind.includes('restaurant') || ind.includes('dining')) return 'Restaurants & dining'
  if (ind.includes('bakery') || ind.includes('dessert')) return 'Bakery & desserts'
  if (ind.includes('bar') || ind.includes('brew') || ind.includes('pub')) return 'Bars & pubs'
  if (ind.includes('pharma') || ind.includes('pharmacy')) return 'Pharmacy & health'
  if (ind.includes('salon') || ind.includes('beauty') || ind.includes('spa')) return 'Salons & beauty'
  if (ind.includes('gym') || ind.includes('fitness')) return 'Fitness & gyms'
  if (ind.includes('fashion') || ind.includes('apparel')) return 'Fashion & apparel'
  if (ind.includes('retail')) return 'Retail'
  return industry.trim()
}

function sortRetailMixForBrand(
  mix: IntelligenceData['retailMix'],
  industry: string | null | undefined
): IntelligenceData['retailMix'] {
  if (!mix.length || !industry?.trim()) return mix
  return [...mix].sort((a, b) => {
    const ap = categoryMatchesBrandIndustry(a.category, industry)
    const bp = categoryMatchesBrandIndustry(b.category, industry)
    if (ap !== bp) return ap ? -1 : 1
    return b.branded + b.nonBranded - (a.branded + a.nonBranded)
  })
}

/** Map API / DB competitor coords (lat/lng vs latitude/longitude) to optional pin coordinates */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompetitorLatLngFromApi(c: any): { lat?: number; lng?: number } {
  const lat =
    c.lat != null && Number.isFinite(Number(c.lat))
      ? Number(c.lat)
      : c.latitude != null && Number.isFinite(Number(c.latitude))
        ? Number(c.latitude)
        : undefined
  const lng =
    c.lng != null && Number.isFinite(Number(c.lng))
      ? Number(c.lng)
      : c.longitude != null && Number.isFinite(Number(c.longitude))
        ? Number(c.longitude)
        : undefined
  return { lat, lng }
}

function competitorPinStyle(
  category: string | undefined,
  isDirectSegment: boolean
): { fillColor: string; fillOpacity: number } {
  const c = (category || 'other').toLowerCase()
  const colors: Record<string, string> = {
    qsr: '#dc2626',
    restaurant: '#ea580c',
    cafe: '#b45309',
    bakery: '#ca8a04',
    retail: '#2563eb',
    salon: '#9333ea',
    gym: '#059669',
    pharmacy: '#0891b2',
    optical: '#4f46e5',
    bar: '#7c3aed',
    other: '#64748b',
  }
  const fillColor = colors[c] ?? colors.other
  return { fillColor, fillOpacity: isDirectSegment ? 0.9 : 0.55 }
}

function splitCompetitors(
  all: IntelligenceData['competitors'],
  brandIndustry: string | null | undefined
): { competitors: IntelligenceData['competitors']; complementaryBrands: IntelligenceData['complementaryBrands'] } {
  if (!brandIndustry?.trim()) return { competitors: all, complementaryBrands: [] }
  if (brandContextWantsQsrCompetitors(brandIndustry)) {
    const competitors = all.filter((c) => competitorMatchesQsrFocus(c.name, c.category))
    const complementaryBrands = all
      .filter((c) => !competitorMatchesQsrFocus(c.name, c.category))
      .slice(0, 10) as IntelligenceData['complementaryBrands']
    return { competitors, complementaryBrands }
  }
  return {
    competitors: all.filter((c) => categoryMatchesBrandIndustry(c.category, brandIndustry)),
    complementaryBrands: all.filter((c) => !categoryMatchesBrandIndustry(c.category, brandIndustry)).slice(
      0,
      10
    ) as IntelligenceData['complementaryBrands'],
  }
}

function pickIntelIncomePercent(
  data: Record<string, unknown>,
  key: 'incomeAbove15L' | 'income10to15L'
): number | null {
  const asNum = (v: unknown): number | null => {
    if (v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const top = asNum(data[key])
  if (top != null) return top
  for (const nest of ['populationLifestyle', 'demographics', 'projections2026'] as const) {
    const block = data[nest]
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      const n = asNum((block as Record<string, unknown>)[key])
      if (n != null) return n
    }
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLiveIntelligence(
  data: any,
  coords: { lat: number; lng: number } | null,
  property?: { amenities?: unknown } | null
): IntelligenceData {
  let resolvedCoords =
    coords && areUsablePinCoords(coords)
      ? coords
      : {
          lat: data?.lat ?? DEFAULT_MAP_CENTER.lat,
          lng: data?.lng ?? DEFAULT_MAP_CENTER.lng,
        }
  resolvedCoords = mergeCoordsWithMapLink(property, resolvedCoords)
  const competitors: IntelligenceData['competitors'] = (data.competitors || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => ({
      name: String(c.name || ''),
      category: String(c.placeCategory || 'other'),
      distance: Number(c.distanceMeters) || 0,
      rating: c.rating != null ? Number(c.rating) : undefined,
      branded: c.brandType === 'popular',
      ...mapCompetitorLatLngFromApi(c),
      reviewCount:
        c.userRatingsTotal != null && Number.isFinite(Number(c.userRatingsTotal))
          ? Number(c.userRatingsTotal)
          : undefined,
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
    const areaKey = String(m.area || m.key || '')
    const area = BANGALORE_AREAS.find((a) => a.key === areaKey)
    const mlat = m.lat != null && Number.isFinite(Number(m.lat)) ? Number(m.lat) : undefined
    const mlng = m.lng != null && Number.isFinite(Number(m.lng)) ? Number(m.lng) : undefined
    return {
      key: areaKey,
      lat: mlat ?? area?.lat ?? resolvedCoords.lat,
      lng: mlng ?? area?.lng ?? resolvedCoords.lng,
      score: Number(m.score) || 50,
    }
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
    areaType: String(c.areaType || 'mixed'),
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catchmentLandmarks: IntelligenceData['catchmentLandmarks'] = (data.catchmentLandmarks || [])
    .map((l: any) => ({
      name: String(l.name || ''),
      kind: String(l.kind || 'mixed'),
      distance: Number(l.distanceMeters) || 0,
      lat: Number(l.lat),
      lng: Number(l.lng),
    }))
    .filter((l: { lat: number; lng: number }) => Number.isFinite(l.lat) && Number.isFinite(l.lng))
  return {
    coords: resolvedCoords,
    overallScore: Number(data.marketPotentialScore) || 50,
    highlights: buildHighlights(data),
    totalFootfall: Number(data.footfall?.dailyAverage) || 0,
    growthTrend: Number(data.scores?.whitespaceScore) || 0,
    spendingCapacity: Number(data.scores?.demandGapScore) || 0,
    numberOfStores: Number(data.market?.competitorCount) || 0,
    retailIndex: (() => {
      const sat = data.scores?.saturationIndex
      const competitors = Number(data.market?.competitorCount) || 0
      if (sat != null && Number(sat) > 0) return Math.max(0.05, parseFloat((1 - Math.min(1, Number(sat) / 100)).toFixed(3)))
      // Derive from competitor count: 0 = 1.0, 10+ = 0.2
      return Math.max(0.1, parseFloat((1 - Math.min(0.9, competitors * 0.08)).toFixed(3)))
    })(),
    hourlyPattern: Array.isArray(data.footfall?.hourlyPattern) ? (data.footfall.hourlyPattern as number[]) : [],
    totalHouseholds: Number(data.populationLifestyle?.totalHouseholds || data.projections2026?.totalHouseholds) || 0,
    affluenceIndicator: String(data.populationLifestyle?.affluenceIndicator || data.projections2026?.affluenceIndicator || 'Medium'),
    catchment,
    catchmentLandmarks,
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
    rentPerSqftCommercial:
      data.populationLifestyle?.rentPerSqft != null ? Number(data.populationLifestyle.rentPerSqft) : null,
    marketRentLow:
      data.populationLifestyle?.marketRentLow != null ? Number(data.populationLifestyle.marketRentLow) : null,
    marketRentHigh:
      data.populationLifestyle?.marketRentHigh != null ? Number(data.populationLifestyle.marketRentHigh) : null,
    rentDataSource: data.populationLifestyle?.rentDataSource === 'listing' || data.populationLifestyle?.rentDataSource === 'area_benchmark'
      ? data.populationLifestyle.rentDataSource
      : null,
    nearestCommercialAreaKey: data.nearestCommercialAreaKey != null ? String(data.nearestCommercialAreaKey) : null,
    incomeLevel:
      data.populationLifestyle?.incomeLevel != null
        ? String(data.populationLifestyle.incomeLevel)
        : data.demographics?.incomeLevel != null
          ? String(data.demographics.incomeLevel)
          : null,
    incomeAbove15L: pickIntelIncomePercent(data as Record<string, unknown>, 'incomeAbove15L'),
    income10to15L: pickIntelIncomePercent(data as Record<string, unknown>, 'income10to15L'),
    locationSynthesis: null,
    locationSynthesisPending: true,
    locationSynthesisError: null,
  }
}

function getHourlyData(intelData: IntelligenceData, view: 'weekday' | 'weekend' = 'weekday') {
  // Weekend peaks shift later: lunch 1–3pm, evening 6–10pm; overall +40% volume
  const WEEKDAY_PEAKS = [12, 13, 18, 19, 20]
  const WEEKEND_PEAKS = [13, 14, 15, 19, 20, 21]
  const peaks = view === 'weekend' ? WEEKEND_PEAKS : WEEKDAY_PEAKS
  const weekendBoost = view === 'weekend' ? 1.45 : 1.0

  if (view === 'weekday' && intelData.hourlyPattern.length >= 18) {
    return intelData.hourlyPattern.slice(0, 18).map((value, i) => {
      const h = i + 6
      return { hour: h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`, value: Math.round(value), peak: peaks.includes(h) }
    })
  }
  const base = (intelData.totalFootfall / 14 || 100) * weekendBoost
  return Array.from({ length: 18 }, (_, i) => {
    const h = i + 6
    let mult: number
    if (view === 'weekend') {
      mult = peaks.includes(h) ? 2.0 : h < 10 ? 0.3 : h < 12 ? 0.9 : h < 13 ? 1.4 : h < 16 ? 1.8 : h < 18 ? 1.5 : h < 19 ? 1.3 : 0.8
    } else {
      mult = peaks.includes(h) ? 1.8 : h < 10 ? 0.5 : h < 12 ? 1.1 : h < 16 ? 1.3 : h < 18 ? 1.0 : 0.7
    }
    return { hour: h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`, value: Math.round(base * mult), peak: peaks.includes(h) }
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

function IconMapPin({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconUsers({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function IconTag({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function IconCheckCircle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconClock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconRulerSquare({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
      <path strokeWidth={2} strokeLinecap="round" d="M8 4v4M12 4v4M16 4v4M4 8h4M4 12h4M4 16h4" />
    </svg>
  )
}

function IconRupee({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h8a3 3 0 010 6H7M10 6v12" />
    </svg>
  )
}

function IconTrendUp({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M23 6L13.5 15.5 8.5 10.5 1 18" />
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 6h6v6" />
    </svg>
  )
}

function IconTrendDown({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M23 18L13.5 8.5 8.5 13.5 1 6" />
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 18h6v-6" />
    </svg>
  )
}

function IconMinusTrend({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2.5} strokeLinecap="round" d="M5 12h14" />
    </svg>
  )
}

function IconChevronLeft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function IconChevronRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function IconChevronUp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  )
}

function IconChartBars({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" d="M4 20V10M12 20V4M20 20v-8" />
    </svg>
  )
}

function IconWallet({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function IconFootTraffic({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function IconCompetition({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM8 16a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function IconPulseDot({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`${className} animate-pulse`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="5" />
    </svg>
  )
}

function IntelInfoPopup({
  title,
  ariaLabel,
  children,
}: {
  title: string
  ariaLabel: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-gray-300/90 bg-gray-100 text-[5px] font-bold leading-none text-gray-600 shadow-sm hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
      >
        i
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-[3px] sm:items-center sm:pb-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={() => setOpen(false)}
          >
            <div
              className="max-h-[min(72vh,440px)] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/50 bg-white/90 p-4 shadow-2xl backdrop-blur-md sm:max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <p id={titleId} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {title}
              </p>
              <div className="mt-2 text-sm leading-relaxed text-gray-800">{children}</div>
              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-gray-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const chartData = data.map((v, i) => ({ i, v: Math.max(0, v) }))
  return (
    <div className="h-11 w-full mt-2 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={1.75}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function MetricCell({ label, value, trend, benchmark, tooltip }: { label: string; value: string; trend?: 'up' | 'down'; benchmark?: string; tooltip?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        {tooltip && (
          <IntelInfoPopup title={label} ariaLabel={`More info about ${label}`}>
            {tooltip}
          </IntelInfoPopup>
        )}
      </div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className={trend === 'up' ? 'text-green-600' : 'text-red-500'} aria-hidden>
            {trend === 'up' ? <IconTrendUp className="w-4 h-4" /> : <IconTrendDown className="w-4 h-4" />}
          </span>
        )}
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
  const trendIcon = isGreen ? <IconTrendUp className="w-3.5 h-3.5" /> : isRed ? <IconTrendDown className="w-3.5 h-3.5" /> : <IconMinusTrend className="w-3.5 h-3.5" />
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium ${color}`}>
      <span className="flex-shrink-0 opacity-90" aria-hidden>
        {trendIcon}
      </span>
      {label}
    </span>
  )
}

function CatchmentFlow({ catchment }: { catchment: Array<{ pincode: string; name: string; sharePct: number; distanceM: number; areaType?: string }> }) {
  const cx = 175
  const cy = 145
  const innerR = 70
  const outerR = 118

  const items = catchment.slice(0, 10)
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No catchment pincode nodes within range — location coordinates may still be syncing.</p>
  }

  const maxDist = Math.max(...items.map((i) => i.distanceM), 1)
  const threshold = maxDist * 0.4
  const innerItems = items.filter((i) => i.distanceM <= threshold)
  const outerItems = items.filter((i) => i.distanceM > threshold)

  const typeColor = (t?: string) =>
    t === 'commercial' ? '#FF5200' : t === 'tech' ? '#6366f1' : t === 'residential' ? '#22c55e' : '#6b7280'

  const positionOnRing = (
    ringItems: typeof items,
    radius: number,
    ring: 'inner' | 'outer'
  ) =>
    ringItems.map((item, i) => {
      const angle = (i / Math.max(ringItems.length, 1)) * 2 * Math.PI - Math.PI / 2
      return {
        ...item,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        ring,
      }
    })

  const innerNodes = positionOnRing(innerItems, innerR, 'inner')
  const outerNodes = positionOnRing(outerItems, outerR, 'outer')
  const allNodes = [...innerNodes, ...outerNodes]

  return (
    <svg viewBox="0 0 350 290" className="w-full max-h-[300px]">
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke="#FF5200"
        strokeWidth={0.5}
        strokeDasharray="3,4"
        strokeOpacity={0.15}
      />
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill="none"
        stroke="#FF5200"
        strokeWidth={0.5}
        strokeDasharray="3,4"
        strokeOpacity={0.2}
      />
      <text x={cx + innerR + 4} y={cy - 3} fill="#9CA3AF" fontSize={6.5}>
        ~1km
      </text>
      <text x={cx + outerR + 4} y={cy - 3} fill="#9CA3AF" fontSize={6.5}>
        ~4km
      </text>
      {allNodes.map((node, i) => (
        <line
          key={`spoke-${node.pincode}-${node.name}-${i}`}
          x1={cx}
          y1={cy}
          x2={node.x}
          y2={node.y}
          stroke="#FF5200"
          strokeWidth={1}
          strokeDasharray="4,3"
          strokeOpacity={0.3}
        />
      ))}
      <circle cx={cx} cy={cy} r={28} fill="#FF5200" />
      <circle cx={cx} cy={cy} r={22} fill="#E4002B" />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">
        YOUR
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">
        LOCATION
      </text>
      {allNodes.map((node, i) => {
        const col = typeColor(node.areaType)
        const nameParts = node.name.split(/\s+/)
        const line1 = nameParts.slice(0, 2).join(' ')
        const line2 = nameParts.slice(2).join(' ')
        const nodeR = node.ring === 'inner' ? 22 : 26
        return (
          <g key={`${node.pincode}-${node.name}-${i}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeR}
              fill="white"
              stroke={col}
              strokeWidth={2}
              filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))"
            />
            <text x={node.x} y={node.y - (line2 ? 9 : 4)} textAnchor="middle" fill={col} fontSize={9} fontWeight="bold">
              {node.sharePct}%
            </text>
            <text x={node.x} y={node.y + (line2 ? 1 : 5)} textAnchor="middle" fill="#374151" fontSize={6} fontWeight="600">
              {line1}
            </text>
            {line2 ? (
              <text x={node.x} y={node.y + 10} textAnchor="middle" fill="#9CA3AF" fontSize={5.5}>
                {line2}
              </text>
            ) : null}
          </g>
        )
      })}
      <text x={cx} y={282} textAnchor="middle" fill="#9CA3AF" fontSize={7}>
        Inner ring ≈ 1km · Outer ring ≈ 4km · Orange = commercial · Green = residential · Indigo = tech
      </text>
    </svg>
  )
}

type BrandHomeOverviewProps = {
  matches: MatchedProperty[]
  stats: Stats
  brand: BrandInfo | null
  brandName: string | null
  setActiveTab: (t: 'matched' | 'overview' | 'saved' | 'inquiries') => void
  selectProperty: (m: MatchedProperty) => void
  setVisitModal: Dispatch<
    SetStateAction<{ open: boolean; date: string; time: string; saved: boolean; interested: boolean }>
  >
  setDashboardView: (v: 'home' | 'map' | 'intel') => void
  router: ReturnType<typeof useRouter>
  setRightPanelTab: (t: IntelTab) => void
  setMapMode: (m: 'pins' | 'heatmap' | 'satellite') => void
  setMobileView: (v: 'list' | 'map' | 'intel') => void
  compact?: boolean
}

function BrandHomeOverview({
  matches,
  stats,
  brand,
  brandName,
  setActiveTab,
  selectProperty,
  setVisitModal,
  setDashboardView,
  router,
  setRightPanelTab,
  setMapMode,
  setMobileView,
  compact,
}: BrandHomeOverviewProps) {
  const [showActivity, setShowActivity] = useState(false)
  const highFit = matches.filter((m) => m.bfiScore >= 80).length
  const highFitTodayLabel = compact ? `${highFit} high-fit match${highFit === 1 ? '' : 'es'}` : `${highFit} new today`

  const statItems = [
    {
      label: 'Active Matches',
      value: matches.length,
      sub: highFitTodayLabel,
      icon: Building2,
      color: '#FF5200',
    },
    {
      label: 'Properties Saved',
      value: stats.totalSaved,
      sub: 'Across your zones',
      icon: Heart,
      color: '#6366f1',
    },
    {
      label: 'Site Visits',
      value: stats.totalInquiries,
      sub: 'Scheduled',
      icon: Calendar,
      color: '#22c55e',
    },
    {
      label: 'Unread Alerts',
      value: matches.filter((m) => m.bfiScore >= 85).length,
      sub: 'Listings matching brief',
      icon: Bell,
      color: '#f59e0b',
    },
  ] as const

  const onMatchRowClick = (m: MatchedProperty) => {
    selectProperty(m)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView('intel')
      setDashboardView('intel')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F7F4] p-3 lg:p-6">
      <div className="mb-4 lg:mb-6">
        <p className="hidden lg:block text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">For Brands — Dashboard</p>
        <h1 className="text-lg lg:text-2xl font-bold text-gray-900">
          Welcome back,{' '}
          <span className="text-[#FF5200]">{brand?.companyName || brandName || 'Brand'}</span>
        </h1>
      </div>

      {compact ? (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide mb-4">
          {statItems.map(({ label, value, sub, icon: Icon, color }) => (
            <div
              key={label}
              className="flex-shrink-0 w-36 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} aria-hidden />
              </div>
              <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statItems.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3 lg:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} aria-hidden />
              </div>
              <p className="text-2xl lg:text-4xl font-black text-gray-900 mb-0.5">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-2'} gap-3 ${compact ? 'mb-4' : 'gap-4 mb-4'}`}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 lg:px-4 lg:py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF5200] animate-pulse" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Your AI Matches</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('matched')
                setDashboardView('map')
              }}
              className="text-xs font-semibold text-[#FF5200] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {matches.slice(0, 5).map((m, i) => (
              <button
                key={m.property.id}
                type="button"
                onClick={() => onMatchRowClick(m)}
                className="w-full flex items-center gap-3 px-3 py-3 lg:px-4 hover:bg-gray-50 transition-colors text-left"
              >
                <span
                  className={`font-black w-9 flex-shrink-0 text-sm ${
                    m.bfiScore >= 90 ? 'text-green-500' : m.bfiScore >= 75 ? 'text-[#FF5200]' : 'text-amber-500'
                  }`}
                >
                  {m.bfiScore}%
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.property.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {m.property.address} · {formatPrice(m.property.price, m.property.priceType)}
                  </p>
                </div>
                {i === 0 && (
                  <span className="text-[9px] font-bold bg-[#FF5200] text-white px-2 py-0.5 rounded-full flex-shrink-0">
                    TOP PICK
                  </span>
                )}
                {m.bfiScore >= 82 && i > 0 && i < 3 && (
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    NEW
                  </span>
                )}
              </button>
            ))}
            {matches.length === 0 && (
              <div className="px-3 lg:px-4 py-8 text-center text-sm text-gray-400">
                No matches yet. Update your brief to get matched.
              </div>
            )}
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
            compact && !showActivity ? 'hidden' : ''
          }`}
        >
          <div className="flex items-center justify-between px-3 py-3 lg:px-4 lg:py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recent Activity</span>
            </div>
            <button type="button" className="text-xs font-semibold text-[#FF5200] hover:underline">
              All activity
            </button>
          </div>
          <div className="divide-y divide-gray-50 px-3 lg:px-4">
            {matches.slice(0, 3).map((m, i) => (
              <div key={m.property.id} className="py-3 flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    i === 0 ? 'bg-orange-50' : i === 1 ? 'bg-blue-50' : 'bg-green-50'
                  }`}
                >
                  {i === 0 ? (
                    <Activity className="w-3.5 h-3.5 text-[#FF5200]" aria-hidden />
                  ) : i === 1 ? (
                    <Building2 className="w-3.5 h-3.5 text-blue-600" aria-hidden />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" aria-hidden />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {i === 0 ? (
                      <>
                        New <span className="font-semibold text-[#FF5200]">{m.bfiScore}% match</span> —{' '}
                        {m.property.title.split('|')[0]?.trim() || m.property.title}
                      </>
                    ) : i === 1 ? (
                      <>
                        Property shortlisted:{' '}
                        <span className="font-semibold text-gray-900">{m.property.address}</span>
                      </>
                    ) : (
                      <>
                        Location score updated for{' '}
                        <span className="font-semibold text-gray-900">{m.property.city}</span>
                      </>
                    )}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                  {i === 0 ? '2m ago' : i === 1 ? '1h ago' : '3h ago'}
                </span>
              </div>
            ))}
            {matches.length === 0 && <div className="py-8 text-center text-sm text-gray-400">No recent activity.</div>}
          </div>
        </div>
      </div>

      {compact && (
        <button
          type="button"
          className="lg:hidden w-full text-center text-xs font-semibold text-[#FF5200] py-2 mb-4"
          onClick={() => setShowActivity((s) => !s)}
        >
          {showActivity ? 'Hide activity' : 'Show recent activity'}
        </button>
      )}

      <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-2'} gap-3`}>
        {matches.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 py-3 lg:px-5 lg:py-4 border-b border-gray-50">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Location Intelligence</span>
              <button
                type="button"
                onClick={() => {
                  selectProperty(matches[0])
                  window.setTimeout(() => {
                    setRightPanelTab('map')
                    setMapMode('heatmap')
                  }, 150)
                }}
                className="text-[10px] font-semibold text-[#FF5200] border border-[#FF5200]/30 px-2.5 py-1 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Heatmap
              </button>
            </div>
            <div className="p-3 lg:p-5 space-y-3">
              {[
                {
                  label: 'Footfall Score',
                  pct: Math.min(100, Math.round(matches[0]?.breakdown?.locationFit || 60)),
                  color: 'bg-[#FF5200]',
                },
                {
                  label: 'Competitor Proximity',
                  pct: Math.max(20, 100 - (matches[0]?.bfiScore || 70)),
                  color: 'bg-orange-400',
                },
                {
                  label: 'Catchment Match',
                  pct: matches[0]?.breakdown?.sizeFit || 75,
                  color: 'bg-[#FF5200]',
                },
                {
                  label: 'Rent vs Market',
                  pct: matches[0]?.breakdown?.budgetFit || 80,
                  color: 'bg-orange-300',
                },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-32 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span
                    className={`text-xs font-bold w-10 text-right ${pct >= 75 ? 'text-[#FF5200]' : 'text-amber-500'}`}
                  >
                    {pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 lg:px-5 lg:py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Your Next Steps</span>
            </div>
            <button
              type="button"
              className="text-[10px] font-semibold text-gray-400 border border-gray-200 px-2.5 py-1 rounded-lg hover:border-gray-300 transition-colors"
            >
              Mark all done
            </button>
          </div>
          <div className="p-3 lg:p-5 space-y-2">
            {[
              {
                num: 1,
                label: `Review your Top ${Math.min(matches.length, 5)} match reports`,
                urgent: true,
                action: () => {
                  setActiveTab('matched')
                  setDashboardView('map')
                },
              },
              {
                num: 2,
                label: matches[0]
                  ? `Schedule site visit for ${matches[0].property.title.split('|')[0]?.trim()}`
                  : 'Schedule a site visit',
                urgent: false,
                action: () => {
                  if (matches[0]) selectProperty(matches[0])
                  setVisitModal((v) => ({ ...v, open: true }))
                },
              },
              {
                num: 3,
                label: 'Complete your brand brief for better matches',
                urgent: false,
                action: () => router.push('/onboarding/brand'),
              },
            ].map(({ num, label, urgent, action }) => (
              <button
                key={num}
                type="button"
                onClick={action}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    urgent ? 'bg-[#FF5200] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {num}
                </div>
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                {urgent && (
                  <span className="text-[9px] font-bold text-[#FF5200] border border-[#FF5200]/30 px-2 py-0.5 rounded-full flex-shrink-0">
                    NOW
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
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
  const [briefExpanded, setBriefExpanded] = useState(false)
  const [requirementsOpen, setRequirementsOpen] = useState(false)

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
  const [commercialPocket, setCommercialPocket] = useState<Record<string, unknown> | null>(null)

  // Schedule Visit modal state
  const [visitModal, setVisitModal] = useState<{ open: boolean; date: string; time: string; saved: boolean; interested: boolean }>({ open: false, date: '', time: '', saved: false, interested: false })
  // Market tab: weekday vs weekend footfall view
  const [footfallView, setFootfallView] = useState<'weekday' | 'weekend'>('weekday')
  const [rightPanelTab, setRightPanelTab] = useState<IntelTab>('overview')
  const [mobileView, setMobileView] = useState<'list' | 'map' | 'intel'>('list')
  const [dashboardView, setDashboardView] = useState<'home' | 'map' | 'intel'>('home')
  const [competitorFallback, setCompetitorFallback] = useState<string | null>(null)
  const [competitorFallbackLoading, setCompetitorFallbackLoading] = useState(false)
  const competitorFallbackInFlight = useRef(false)
  const [intelWardLabel, setIntelWardLabel] = useState<string | null>(null)

  /** Listing pin: intel coords + map_link override for generic centroid; before intel loads, use map_link or match coords. */
  const selectedListingCoords = useMemo(() => {
    if (!selectedMatch) return null
    const fromAmenities = extractLatLngFromMapLink(getMapLinkFromAmenities(selectedMatch.property.amenities))
    const ic = intelData?.coords
    if (ic && areUsablePinCoords(ic)) {
      return mergeCoordsWithMapLink(selectedMatch.property, ic)
    }
    const mc = selectedMatch.coords
    return fromAmenities ?? (mc && areUsablePinCoords(mc) ? mc : null) ?? null
  }, [selectedMatch, intelData?.coords])

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

  useEffect(() => {
    if (selectedMatch) setDashboardView('intel')
  }, [selectedMatch])

  // Auto-fit map to matches
  useEffect(() => {
    if (!mapRef || matches.length === 0 || rightMode === 'intelligence') return
    const withCoords = matches.filter((m) => m.coords && areUsablePinCoords(m.coords))
    if (withCoords.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    withCoords.forEach((m) => bounds.extend(m.coords!))
    mapRef.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })
  }, [mapRef, matches, rightMode])

  // Pan on hover
  useEffect(() => {
    if (!mapRef || !hoveredPropertyId) return
    const m = matches.find((m) => m.property.id === hoveredPropertyId)
    if (m?.coords && areUsablePinCoords(m.coords)) mapRef.panTo({ lat: m.coords.lat, lng: m.coords.lng })
  }, [hoveredPropertyId, mapRef, matches])

  useEffect(() => {
    if (!intelData?.coords || !areUsablePinCoords(intelData.coords)) {
      setIntelWardLabel(null)
      return
    }
    let cancelled = false
    void fetch(
      `/api/intelligence/ward-density?lat=${encodeURIComponent(String(intelData.coords.lat))}&lng=${encodeURIComponent(String(intelData.coords.lng))}`
    )
      .then((r) => r.json())
      .then((j: { wards?: Array<{ wardName?: string; locality?: string }> }) => {
        if (cancelled) return
        const w = j.wards?.[0]
        const label = (w?.wardName || w?.locality || '').trim()
        setIntelWardLabel(label || null)
      })
      .catch(() => {
        if (!cancelled) setIntelWardLabel(null)
      })
    return () => {
      cancelled = true
    }
  }, [intelData?.coords?.lat, intelData?.coords?.lng])

  useEffect(() => {
    setCompetitorFallback(null)
    competitorFallbackInFlight.current = false
  }, [selectedMatch?.property.id])

  useEffect(() => {
    if (intelData && intelData.competitors.length > 0) {
      setCompetitorFallback(null)
    }
  }, [intelData?.competitors.length])

  useEffect(() => {
    if (
      rightPanelTab !== 'competitors' ||
      !intelData ||
      intelLoading ||
      intelData.competitors.length !== 0 ||
      !selectedMatch ||
      competitorFallback !== null ||
      competitorFallbackInFlight.current
    ) {
      return
    }

    competitorFallbackInFlight.current = true
    setCompetitorFallbackLoading(true)

    const b = data?.brand
    const industry = b?.industry || 'F&B'
    const address = selectedMatch.property.address
    const city = selectedMatch.property.city
    const area = selectedMatch.property.city

    void fetch('/api/dashboard/brand/intel-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId,
        prompt: `You are a Bangalore commercial real estate intelligence expert. 

A ${industry} brand is evaluating a property at: ${address}, ${city}.

Google Places returned no direct competitors for their category in the immediate area.

Based on your knowledge of Bangalore's ${area} market, provide a SHORT competitive landscape analysis (max 120 words) covering:
1. What ${industry} brands typically operate in this area or nearby
2. Whether the absence of mapped competitors means whitespace or data gap
3. The competitive dynamic a new ${industry} brand should expect

Be specific to ${area} / ${address}. No generic statements.`,
        brand: {
          name: b?.companyName || brandName || 'Brand',
          industry,
          companyName: b?.companyName,
        },
        rawIntel: null,
        property: {
          title: selectedMatch.property.title,
          address: selectedMatch.property.address,
          city: selectedMatch.property.city,
          propertyType: selectedMatch.property.propertyType,
        },
        useSimplePrompt: true,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { data?: { narrative?: string }; narrative?: string; text?: string } | null) => {
        const text = json?.data?.narrative || json?.narrative || json?.text || null
        if (text) setCompetitorFallback(text)
      })
      .catch(() => null)
      .finally(() => {
        competitorFallbackInFlight.current = false
        setCompetitorFallbackLoading(false)
      })

    return () => {
      competitorFallbackInFlight.current = false
    }
  }, [
    rightPanelTab,
    intelData,
    intelLoading,
    selectedMatch?.property.id,
    brandId,
    brandName,
    data?.brand?.industry,
    data?.brand?.companyName,
    competitorFallback,
  ])

  useEffect(() => {
    if (!intelData?.coords || !areUsablePinCoords(intelData.coords) || !selectedMatch?.property) {
      setCommercialPocket(null)
      return
    }

    const { lat, lng } = intelData.coords
    const p = selectedMatch.property
    const q = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      address: p.address || '',
      title: p.title || '',
    })
    let cancelled = false
    void fetch(`/api/intelligence/commercial-pocket?${q.toString()}`)
      .then((r) => r.json())
      .then((j: { pocket?: Record<string, unknown> | null }) => {
        if (!cancelled) setCommercialPocket(j.pocket ?? null)
      })
      .catch(() => {
        if (!cancelled) setCommercialPocket(null)
      })
    return () => {
      cancelled = true
    }
    // Primitives match intelData.coords + selectedMatch.property fields; whole objects would over-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lat/lng/id/address/title are the fetch inputs
  }, [
    intelData?.coords?.lat,
    intelData?.coords?.lng,
    selectedMatch?.property.id,
    selectedMatch?.property.address,
    selectedMatch?.property.title,
  ])

  const fetchDashboard = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/brand?brandId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.brand) {
          setBrandName(json.brand.companyName || json.brand.name || '')
        }
      }
    } catch (err) { console.error('[Brand Dashboard] fetch error:', err) }
    finally { setLoading(false) }
  }

  const fetchMatches = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/brand/matches?brandId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const json = await res.json()
        setMatches(Array.isArray(json.matches) ? json.matches : [])
      } else {
        console.error('[Brand Dashboard] matches API failed:', res.status, await res.text().catch(() => ''))
        setMatches([])
      }
    } catch (e) {
      console.error('[Brand Dashboard] matches fetch error:', e)
      setMatches([])
    } finally {
      setMatchesLoading(false)
    }
  }

  const fetchPropertyIntelligence = useCallback(async (
    propertyId: string,
    property: MatchedProperty['property'],
    coords: { lat: number; lng: number } | null,
    matchMeta?: MatchedProperty | null
  ) => {
    setIntelLoading(true)
    setIntelData(null)
    setIntelWardLabel(null)
    setCommercialPocket(null)
    setRightMode('intelligence')

    const brand = data?.brand ?? null
    const industryKey = toIndustryKey(brand?.industry)

    try {
      const cachedRes = await fetch(
        `/api/intelligence/cached/${propertyId}?industry=${encodeURIComponent(brand?.industry || industryKey)}`,
        { cache: 'no-store' }
      )

      if (cachedRes.ok) {
        const cachedData = (await cachedRes.json()) as {
          cached?: boolean
          synthesisAvailable?: boolean
          synthesis?: LocationSynthesis
          intel?: Record<string, any>
        }

        if (cachedData.cached && cachedData.intel) {
          const intel = cachedData.intel
          const intelPair =
            intel.coords != null &&
            Number.isFinite(Number(intel.coords.lat)) &&
            Number.isFinite(Number(intel.coords.lng))
              ? { lat: Number(intel.coords.lat), lng: Number(intel.coords.lng) }
              : null
          const fromIntel = intelPair && areUsablePinCoords(intelPair) ? intelPair : null
          const fromMatch = coords && areUsablePinCoords(coords) ? coords : null
          let resolvedCoords =
            fromIntel ?? fromMatch ?? { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng }
          resolvedCoords = mergeCoordsWithMapLink(property, resolvedCoords)

          const competitors: IntelligenceData['competitors'] = (intel.competitors || []).map((c: any) => ({
            name: String(c.name || ''),
            category: String(c.placeCategory || c.category || 'other'),
            distance: Number(c.distanceMeters || c.distance) || 0,
            rating: c.rating != null ? Number(c.rating) : undefined,
            branded: Boolean(c.brandType === 'popular' || c.branded),
            ...mapCompetitorLatLngFromApi(c),
            reviewCount:
              c.userRatingsTotal != null && Number.isFinite(Number(c.userRatingsTotal))
                ? Number(c.userRatingsTotal)
                : c.reviewCount != null && Number.isFinite(Number(c.reviewCount))
                  ? Number(c.reviewCount)
                  : undefined,
          }))

          const { competitors: sameCat, complementaryBrands: compBrands } = splitCompetitors(
            competitors,
            brand?.industry
          )

          const retailMix: IntelligenceData['retailMix'] = (intel.retailMix || []).map((r: any) => ({
            category: String(r.category || ''),
            branded: Number(r.branded) || 0,
            nonBranded: Number(r.nonBranded) || 0,
          }))

          const catchment: IntelligenceData['catchment'] = (intel.catchment || []).map((c: any) => ({
            pincode: String(c.pincode || ''),
            name: String(c.name || ''),
            sharePct: Number(c.sharePct) || 0,
            distanceM: Number(c.distanceM || c.distanceMeters) || 0,
            areaType: c.areaType ? String(c.areaType) : undefined,
          }))

          const catchmentLandmarks: IntelligenceData['catchmentLandmarks'] = (intel.catchmentLandmarks || [])
            .map((l: any) => ({
              name: String(l.name || ''),
              kind: String(l.kind || ''),
              distance: Number(l.distanceMeters || l.distance) || 0,
              lat: Number(l.lat) || resolvedCoords.lat,
              lng: Number(l.lng) || resolvedCoords.lng,
            }))

          const crowdPullers: IntelligenceData['crowdPullers'] = (intel.crowdPullers || []).map((p: any) => ({
            name: String(p.name || ''),
            category: String(p.category || ''),
            distance: Number(p.distanceMeters || p.distance) || 0,
          }))

          const cannibalisationRisk: IntelligenceData['cannibalisationRisk'] = (intel.cannibalisationRisk || []).map((r: any) => ({
            name: String(r.brand || r.name || ''),
            distance: Number(r.nearestSameBrandDistanceM || r.distance) || 0,
            cannibalisation: Number(r.cannibalisationPct || r.cannibalisation) || 0,
          }))

          const similarMarkets: IntelligenceData['similarMarkets'] = (intel.similarMarkets || []).map((m: any) => {
            const areaKey = String(m.area || m.key || '')
            const area = BANGALORE_AREAS.find((a) => a.key === areaKey)
            const mlat = m.lat != null && Number.isFinite(Number(m.lat)) ? Number(m.lat) : undefined
            const mlng = m.lng != null && Number.isFinite(Number(m.lng)) ? Number(m.lng) : undefined
            return {
              key: areaKey,
              lat: mlat ?? area?.lat ?? resolvedCoords.lat,
              lng: mlng ?? area?.lng ?? resolvedCoords.lng,
              score: Number(m.score) || 50,
            }
          })

          const highlights = buildHighlights({
            footfall: { dailyAverage: intel.totalFootfall },
            scores: { demandGapScore: intel.spendingCapacity, whitespaceScore: intel.growthTrend },
            market: { competitorCount: intel.numberOfStores },
            cannibalisationRisk: intel.cannibalisationRisk,
            accessibility: { nearestMetro: intel.metroName ? { distanceMeters: intel.metroDistance } : null },
            populationLifestyle: { affluenceIndicator: intel.affluenceIndicator },
          })

          const geo = rehydrateIntelGeographyFromCoords({
            coords: resolvedCoords,
            catchment,
            catchmentLandmarks,
            similarMarkets,
            nearestCommercialAreaKey: intel.nearestAreaKey != null ? String(intel.nearestAreaKey) : null,
          })

          setIntelData({
            coords: resolvedCoords,
            overallScore: Number(intel.overallScore || 50),
            highlights,
            totalFootfall: Number(intel.totalFootfall || 0),
            growthTrend: Number(intel.growthTrend || 0),
            spendingCapacity: Number(intel.spendingCapacity || 0),
            numberOfStores: Number(intel.numberOfStores || sameCat.length || 0),
            retailIndex: Number(intel.retailIndex || 0.5),
            hourlyPattern: [],
            totalHouseholds: Number(
              intel.totalHouseholds ?? (intel as { populationLifestyle?: { totalHouseholds?: number } }).populationLifestyle?.totalHouseholds ?? 0
            ),
            affluenceIndicator: String(
              intel.affluenceIndicator ??
                (intel as { populationLifestyle?: { affluenceIndicator?: string } }).populationLifestyle?.affluenceIndicator ??
                'Medium'
            ),
            catchment: geo.catchment,
            catchmentLandmarks: geo.catchmentLandmarks,
            competitors: sameCat,
            complementaryBrands: compBrands,
            crowdPullers,
            retailMix,
            cannibalisationRisk,
            storeClosureRisk: deriveStoreClosureRisk(retailMix),
            similarMarkets: geo.similarMarkets,
            metroDistance: intel.metroDistance != null ? Number(intel.metroDistance) : null,
            metroName: intel.metroName != null ? String(intel.metroName) : null,
            busStops: Number(intel.busStops || 0),
            rentPerSqftCommercial: intel.rentContext?.marketMid != null ? Number(intel.rentContext.marketMid) : null,
            marketRentLow: intel.rentContext?.marketLow != null ? Number(intel.rentContext.marketLow) : null,
            marketRentHigh: intel.rentContext?.marketHigh != null ? Number(intel.rentContext.marketHigh) : null,
            rentDataSource:
              intel.rentContext?.source === 'listing' || intel.rentContext?.source === 'area_benchmark'
                ? intel.rentContext.source
                : null,
            nearestCommercialAreaKey: geo.nearestCommercialAreaKey,
            incomeLevel: String(
              (intel as { incomeLevel?: string }).incomeLevel ??
                (intel as { populationLifestyle?: { incomeLevel?: string } }).populationLifestyle?.incomeLevel ??
                'medium'
            ),
            incomeAbove15L: pickIntelIncomePercent(intel as Record<string, unknown>, 'incomeAbove15L'),
            income10to15L: pickIntelIncomePercent(intel as Record<string, unknown>, 'income10to15L'),
            locationSynthesis: cachedData.synthesisAvailable ? (cachedData.synthesis as LocationSynthesis) : null,
            locationSynthesisPending: !cachedData.synthesisAvailable,
            locationSynthesisError: null,
          })

          setIntelLoading(false)

          return
        }
      }

      const liveRes = await fetch('/api/location-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
          address: property.address,
          city: property.city,
          title: property.title,
          state: 'Karnataka',
          propertyType: property.propertyType,
          businessType: buildLocationBusinessType(brand),
        }),
      })

      if (liveRes.ok) {
        const liveData = await liveRes.json()
        if (liveData.success) {
          const liveLat = liveData.data?.coordinates ? Number(liveData.data.coordinates.lat) : NaN
          const liveLng = liveData.data?.coordinates ? Number(liveData.data.coordinates.lng) : NaN
          const fromLive =
            Number.isFinite(liveLat) && Number.isFinite(liveLng) ? { lat: liveLat, lng: liveLng } : null
          const fromLiveOk = fromLive && areUsablePinCoords(fromLive) ? fromLive : null
          const fromMatchOk = coords && areUsablePinCoords(coords) ? coords : null
          let resolvedCoords =
            fromMatchOk ?? fromLiveOk ?? { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng }
          resolvedCoords = mergeCoordsWithMapLink(property, resolvedCoords)
          const intel = transformLiveIntelligence(liveData.data, resolvedCoords, property)
          const geo = rehydrateIntelGeographyFromCoords({
            coords: intel.coords,
            catchment: intel.catchment,
            catchmentLandmarks: intel.catchmentLandmarks,
            similarMarkets: intel.similarMarkets,
            nearestCommercialAreaKey: intel.nearestCommercialAreaKey,
          })
          const intelGeo = { ...intel, ...geo }
          const { competitors: sameCat, complementaryBrands: compBrands } = splitCompetitors(
            intelGeo.competitors,
            brand?.industry
          )
          const retailMixOrdered = sortRetailMixForBrand(intelGeo.retailMix, brand?.industry)
          setIntelData({
            ...intelGeo,
            competitors: sameCat,
            complementaryBrands: compBrands,
            retailMix: retailMixOrdered,
            storeClosureRisk: deriveStoreClosureRisk(retailMixOrdered),
            locationSynthesis: null,
            locationSynthesisPending: true,
            locationSynthesisError: null,
          })
          setIntelLoading(false)
          return
        }
      }
    } catch (err) {
      console.error('[fetchPropertyIntelligence]', err)
    }

    setIntelLoading(false)
  }, [data])

  const selectProperty = (m: MatchedProperty) => {
    setSelectedMatch(m)
    setDashboardView('intel')
    setRightPanelTab('overview')
    setActiveInfoWindowId(m.property.id)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView('intel')
    }
    if (m.coords && areUsablePinCoords(m.coords) && mapRef) {
      mapRef.panTo(m.coords)
      mapRef.setZoom(15)
    }
    fetchPropertyIntelligence(
      m.property.id,
      m.property,
      m.coords && areUsablePinCoords(m.coords) ? m.coords : null,
      m
    )
  }

  const goToDashboardHome = useCallback(() => {
    setSelectedMatch(null)
    setIntelData(null)
    setIntelWardLabel(null)
    setRightMode('map')
    setDashboardView('home')
    setMobileView('list')
  }, [])

  const brand = data?.brand ?? null
  const preferredList = useMemo(() => normalizePreferredLocationsList(brand), [brand])
  const dashboardBadges = useMemo(() => resolveDashboardBadges(brand, matches.length), [brand, matches.length])

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
  const showBrief = brandHasBrief(brand, preferredList)
  const requirementsSummaryLine = useMemo(() => {
    if (!brand || !showBrief) return ''
    const parts: string[] = []
    if (brand.minSize != null && brand.maxSize != null) {
      parts.push(`${brand.minSize.toLocaleString('en-IN')}–${brand.maxSize.toLocaleString('en-IN')} sqft`)
    }
    if (preferredList.length > 0) parts.push(shortenText(preferredList.join(', '), 36))
    if (brand.budgetMin != null && brand.budgetMax != null) {
      parts.push(
        `₹${brand.budgetMin.toLocaleString('en-IN')}–₹${brand.budgetMax.toLocaleString('en-IN')}/mo`
      )
    }
    return parts.join(' · ')
  }, [brand, showBrief, preferredList])
  const recentViews = data?.recentViews ?? []
  const savedProperties = data?.savedProperties ?? []
  const inquiries = data?.inquiries ?? []

  const showDesktopHomeOverlay =
    dashboardView === 'home' && !selectedMatch && rightMode === 'map'
  const isMapVisible =
    (rightMode === 'map' || (rightMode === 'intelligence' && rightPanelTab === 'map')) && !showDesktopHomeOverlay

  const INTEL_TABS: { key: IntelTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'catchment', label: 'Catchment' },
    { key: 'market', label: 'Market' },
    { key: 'competitors', label: 'Competitors' },
    { key: 'risk', label: 'Risk' },
    { key: 'similar', label: 'Similar Markets' },
    { key: 'map', label: 'Map' },
  ]

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-[#F8F7F4] overflow-hidden">

      {/* ══ LEFT PANEL ══ */}
      <div
        className={`w-full lg:w-[380px] flex-shrink-0 flex flex-col min-h-0 lg:h-full bg-white lg:bg-[#0F0F0F] border-b border-gray-100 lg:border-b-0 lg:border-r lg:border-white/10 overflow-hidden transition-all duration-200 ${
          mobileView === 'list'
            ? 'h-[100dvh]'
            : 'h-0 lg:h-full overflow-hidden pointer-events-none lg:pointer-events-auto'
        }`}
      >

        {/* Compact list header: brand + stats + collapsible requirements (mobile + desktop) */}
        <div className="flex-shrink-0 border-b border-gray-100 lg:border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2.5">
            <div className="min-w-0 flex flex-1 items-center gap-2">
              <div className="hidden shrink-0 origin-left scale-[0.82] lg:block">
                <Logo size="sm" showPoweredBy={false} href="/" variant="dark" />
              </div>
              <div className="block shrink-0 origin-left scale-[0.82] lg:hidden">
                <Logo size="sm" showPoweredBy={false} href="/" variant="light" />
              </div>
              <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white text-[10px] font-bold tracking-tight">
                {companyInitials(brand?.companyName || brandName || brand?.name || 'Brand')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 lg:text-white leading-tight">
                  {brand?.companyName || brandName || brand?.name || 'Brand'}
                </p>
                <p className="truncate text-[9px] text-gray-500 lg:text-gray-400 leading-tight mt-0.5">
                  {(brand?.industry || brand?.category) && <span>{brand?.industry || brand?.category} · </span>}
                  <span className="text-green-600 lg:text-green-400">Active · Onboarded</span>
                  {(brand?.phone || brand?.email) && (
                    <span className="text-gray-400"> · {brand?.phone || brand?.email}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.clear()
                router.push('/')
              }}
              className="shrink-0 text-[10px] font-medium text-gray-500 hover:text-gray-900 lg:text-gray-400 lg:hover:text-white transition-colors inline-flex items-center gap-0.5"
            >
              <IconChevronLeft className="w-3 h-3" aria-hidden />
              Exit
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto px-2 pb-2 scrollbar-hide">
            {[
              { label: 'Matches', value: matches.length, color: 'text-[#FF5200]' },
              { label: 'Viewed', value: stats.totalViews, color: 'text-blue-600 lg:text-blue-400' },
              { label: 'Saved', value: stats.totalSaved, color: 'text-pink-600 lg:text-pink-400' },
              { label: 'Inq.', value: stats.totalInquiries, color: 'text-purple-600 lg:text-purple-400' },
              { label: 'Pend.', value: stats.pendingInquiries, color: 'text-amber-600 lg:text-amber-400' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="min-w-[3.25rem] shrink-0 rounded-lg bg-gray-50 px-1.5 py-1 text-center lg:bg-white/5"
              >
                <p className={`text-sm font-bold leading-none ${color}`}>{value}</p>
                <p className="text-[7px] font-medium uppercase tracking-tighter text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          {brand && showBrief && (
            <>
              <button
                type="button"
                onClick={() => setRequirementsOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 border-t border-gray-100 px-2 py-1.5 text-left lg:border-white/10"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#FF5200]">Requirements</span>
                  {!requirementsOpen && requirementsSummaryLine ? (
                    <span className="mt-0.5 block truncate text-[10px] text-gray-600 lg:text-gray-300">
                      {requirementsSummaryLine}
                    </span>
                  ) : null}
                </div>
                <IconChevronUp
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${requirementsOpen ? '' : 'rotate-180'}`}
                  aria-hidden
                />
              </button>
              {requirementsOpen && (
                <div className="border-t border-gray-100 px-2 pb-2 pt-1.5 lg:border-white/10">
                  <div className="rounded-xl border border-[#FF5200]/35 bg-gray-50 p-2.5 shadow-sm lg:bg-white/5">
                    {dashboardBadges.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {dashboardBadges.map((label) => {
                          const isMatch = label === 'Multiple Properties Matched'
                          return (
                            <span
                              key={label}
                              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                                isMatch
                                  ? 'border-violet-200 bg-violet-50 text-violet-800 lg:border-violet-500/30 lg:bg-violet-500/15 lg:text-violet-200'
                                  : 'border-sky-200 bg-sky-50 text-sky-800 lg:border-sky-500/30 lg:bg-sky-500/15 lg:text-sky-200'
                              }`}
                            >
                              {label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF5200]">Your Requirements</p>
                    <ul className="space-y-1.5 text-[10px] text-gray-700 lg:text-gray-200">
                      {brand.minSize != null && brand.maxSize != null && (
                        <li className="flex gap-2">
                          <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                            <IconRulerSquare className="w-3 h-3" />
                          </span>
                          <span>
                            <span className="font-semibold text-gray-500 lg:text-gray-400">Size · </span>
                            {brand.minSize.toLocaleString('en-IN')}–{brand.maxSize.toLocaleString('en-IN')} sqft
                          </span>
                        </li>
                      )}
                      {preferredList.length > 0 && (
                        <li className="flex gap-2">
                          <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                            <IconMapPin className="w-3 h-3" />
                          </span>
                          <span>
                            <span className="font-semibold text-gray-500 lg:text-gray-400">Location · </span>
                            {briefExpanded ? preferredList.join(', ') : shortenText(preferredList.join(', '), 42)}
                          </span>
                        </li>
                      )}
                      {brand.budgetMin != null && brand.budgetMax != null && (
                        <li className="flex gap-2">
                          <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                            <IconRupee className="w-3 h-3" />
                          </span>
                          <span>
                            <span className="font-semibold text-gray-500 lg:text-gray-400">Budget · </span>
                            ₹{brand.budgetMin.toLocaleString('en-IN')}–₹{brand.budgetMax.toLocaleString('en-IN')}/mo
                          </span>
                        </li>
                      )}
                      {briefExpanded && brand.brandProfile?.timeline && (
                        <li className="flex gap-2">
                          <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                            <IconClock className="w-3 h-3" />
                          </span>
                          <span>
                            <span className="font-semibold text-gray-500 lg:text-gray-400">Timeline · </span>
                            {brand.brandProfile.timeline}
                          </span>
                        </li>
                      )}
                      {briefExpanded && (brand.brandProfile?.storeType || brand.category) && (
                        <li className="flex gap-2">
                          <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                            <BuildingIcon className="w-3 h-3 text-[#FF5200]" />
                          </span>
                          <span>
                            <span className="font-semibold text-gray-500 lg:text-gray-400">Store type · </span>
                            {brand.brandProfile?.storeType || brand.category}
                          </span>
                        </li>
                      )}
                      {briefExpanded && brand.brandProfile?.targetAudience && (
                        <li className="flex gap-2">
                          <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                            <IconUsers className="w-3 h-3" />
                          </span>
                          <span>
                            <span className="font-semibold text-gray-500 lg:text-gray-400">Audience · </span>
                            {brand.brandProfile.targetAudience}
                          </span>
                        </li>
                      )}
                      {briefExpanded &&
                        brand.brandProfile?.targetAudienceTags &&
                        brand.brandProfile.targetAudienceTags.length > 0 && (
                          <li className="flex gap-2">
                            <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                              <IconTag className="w-3 h-3" />
                            </span>
                            <span>
                              <span className="font-semibold text-gray-500 lg:text-gray-400">Segments · </span>
                              {brand.brandProfile.targetAudienceTags.join(', ')}
                            </span>
                          </li>
                        )}
                      {briefExpanded && brand.brandProfile?.additionalRequirements && (
                        <li className="flex gap-2">
                          <span className="flex w-4 flex-shrink-0 items-center justify-center text-[#FF5200]">
                            <IconCheckCircle className="w-3 h-3" />
                          </span>
                          <span>
                            <span className="font-semibold text-gray-500 lg:text-gray-400">Must-haves · </span>
                            {brand.brandProfile.additionalRequirements}
                          </span>
                        </li>
                      )}
                    </ul>
                    {(brand.brandProfile?.timeline ||
                      brand.brandProfile?.storeType ||
                      brand.category ||
                      brand.brandProfile?.targetAudience ||
                      brand.brandProfile?.additionalRequirements ||
                      (brand.brandProfile?.targetAudienceTags && brand.brandProfile.targetAudienceTags.length > 0)) && (
                      <button
                        type="button"
                        onClick={() => setBriefExpanded((e) => !e)}
                        className="mt-2 flex w-full items-center justify-center gap-1 text-[10px] font-semibold text-[#FF5200]/90 hover:text-[#FF5200]"
                      >
                        {briefExpanded ? 'Show less' : 'Show more'}
                        <IconChevronUp
                          className={`h-3 w-3 transition-transform ${briefExpanded ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Nav — desktop only; mobile uses bottom nav */}
        <div className="hidden lg:block px-3 py-3 border-b border-gray-100 lg:border-white/10 flex-shrink-0">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest px-2 mb-2">Main</p>
          {(
            [
              {
                label: 'Dashboard',
                icon: LayoutGrid,
                active: dashboardView === 'home' && !selectedMatch,
                action: goToDashboardHome,
              },
              {
                label: 'My Matches',
                icon: Building2,
                count: matches.length,
                active: false,
                action: () => {
                  setActiveTab('matched')
                  setDashboardView('map')
                  setMobileView('list')
                },
              },
              {
                label: 'Saved',
                icon: Heart,
                count: stats.totalSaved,
                active: false,
                action: () => {
                  setActiveTab('saved')
                  setDashboardView('map')
                },
              },
              {
                label: 'Site Visits',
                icon: Calendar,
                count: stats.totalInquiries,
                active: false,
                action: () => {
                  setActiveTab('inquiries')
                  setDashboardView('map')
                },
              },
            ] satisfies Array<{
              label: string
              icon: LucideIcon
              active: boolean
              action: () => void
              count?: number
            }>
          ).map(({ label, icon: Icon, count, active, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-0.5 transition-colors text-left ${
                active
                  ? 'bg-[#FF5200] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 lg:text-gray-400 lg:hover:bg-white/5 lg:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
              </div>
              {count != null && count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-[#FF5200]/20 text-[#FF5200]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}

          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest px-2 mt-3 mb-2">Intelligence</p>
          {(
            [
              {
                label: 'Location Intel',
                icon: LucideMapPin,
                action: () => {
                  if (matches[0]) selectProperty(matches[0])
                  else {
                    setActiveTab('matched')
                    setDashboardView('map')
                    setMobileView('list')
                  }
                },
              },
              {
                label: 'Revenue Model',
                icon: TrendingUp,
                action: () => {
                  setActiveTab('matched')
                  setDashboardView('map')
                  setMobileView('list')
                },
              },
              {
                label: 'Heatmap',
                icon: Activity,
                action: () => {
                  setDashboardView('map')
                  setMapMode('heatmap')
                  setMobileView('map')
                  if (matches[0]) {
                    selectProperty(matches[0])
                    window.setTimeout(() => setRightPanelTab('map'), 200)
                  }
                },
              },
            ] as const
          ).map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 lg:text-gray-400 lg:hover:bg-white/5 lg:hover:text-white transition-colors text-left"
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 lg:border-white/10 flex-shrink-0">
          <nav className="flex text-xs overflow-x-auto">
            {([
              { key: 'matched', label: `Matches (${matches.length})` },
              { key: 'overview', label: `Views (${recentViews.length})` },
              { key: 'saved', label: `Saved (${savedProperties.length})` },
              { key: 'inquiries', label: `Inquiries (${inquiries.length})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key)
                  setDashboardView('map')
                }}
                className={`whitespace-nowrap px-3.5 py-2.5 border-b-2 font-medium transition-colors flex-shrink-0 ${
                  activeTab === key
                    ? 'border-[#FF5200] text-[#FF5200]'
                    : 'border-transparent text-gray-500 hover:text-gray-900 lg:text-gray-400 lg:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content + mobile home + bottom footer */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-20 lg:pb-4">
          {dashboardView === 'home' && !selectedMatch && (
            <div className="lg:hidden border-b border-gray-100 lg:border-white/10">
              <BrandHomeOverview
                compact
                matches={matches}
                stats={stats}
                brand={brand}
                brandName={brandName}
                setActiveTab={setActiveTab}
                selectProperty={selectProperty}
                setVisitModal={setVisitModal}
                setDashboardView={setDashboardView}
                router={router}
                setRightPanelTab={setRightPanelTab}
                setMapMode={setMapMode}
                setMobileView={setMobileView}
              />
            </div>
          )}

          <div
            className={
              dashboardView === 'home' && !selectedMatch
                ? 'max-lg:hidden'
                : ''
            }
          >
          {/* ── Matches Tab ── */}
          {activeTab === 'matched' && (
            <div className="py-2">
              {matchesLoading ? (
                <div className="px-3 space-y-2 py-2">
                  {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />)}
                </div>
              ) : matches.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <p className="text-sm text-gray-400 mb-3">No matches found. Update your preferences to get matched.</p>
                  <Link href="/onboarding/brand" className="text-xs text-[#FF5200] hover:underline inline-flex items-center gap-0.5">
                    Update Preferences
                    <IconChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden />
                  </Link>
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
                      className={`mx-3 mb-2.5 rounded-2xl border cursor-pointer transition-all overflow-hidden ${
                        isSelected
                          ? 'border-[#FF5200] shadow-md ring-1 ring-[#FF5200]/20 bg-orange-50/80 lg:bg-white/10 lg:ring-[#FF5200]/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm lg:border-white/10 lg:bg-white/5 lg:hover:bg-white/10 lg:hover:border-white/20'
                      }`}
                    >
                      {/* Full-width image banner */}
                      <div className="relative h-[100px] bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden">
                        {imgSrc ? (
                          <Image src={imgSrc} alt={m.property.title} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-40">
                            <BuildingIcon className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {/* BFI badge — top right */}
                        <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm rounded-lg px-2 py-1 flex flex-col items-center leading-none min-w-[40px]">
                          <span className="text-[#FF5200] text-base font-black leading-none">{m.bfiScore}</span>
                          <span className="text-gray-300 text-[8px] uppercase tracking-wider leading-none mt-0.5">BFI</span>
                        </div>
                        {/* City + type — bottom left overlay */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium rounded-full px-2 py-0.5">{m.property.city}</span>
                          <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] rounded-full px-2 py-0.5 capitalize">{m.property.propertyType}</span>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-3">
                        <p className="font-semibold text-sm text-gray-900 lg:text-white line-clamp-1 mb-1">{m.property.title}</p>
                        <p className="text-[11px] text-gray-500 lg:text-gray-400 line-clamp-1 mb-2">{m.property.address}</p>

                        {/* Key specs row */}
                        <div className="flex items-center gap-2 mb-2 text-[11px]">
                          <span className="font-bold text-[#FF5200]">{formatPrice(m.property.price, m.property.priceType)}</span>
                          <span className="text-gray-400 lg:text-gray-500">·</span>
                          <span className="text-gray-600 lg:text-gray-300">{m.property.size.toLocaleString()} sqft</span>
                        </div>

                        {/* Fit chips */}
                        <div className="flex gap-1 flex-wrap mb-2.5">
                          {m.breakdown.locationFit >= 80 && (
                            <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-md px-1.5 py-0.5 font-medium">Area Match</span>
                          )}
                          {m.breakdown.budgetFit >= 80 && (
                            <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-md px-1.5 py-0.5 font-medium">Budget Fit</span>
                          )}
                          {m.breakdown.sizeFit >= 80 && (
                            <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-md px-1.5 py-0.5 font-medium">Size Match</span>
                          )}
                          {m.breakdown.budgetFit < 60 && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 rounded-md px-1.5 py-0.5 font-medium">Over Budget</span>
                          )}
                          {m.bfiScore >= 80 && (
                            <span className="text-[10px] bg-orange-50 text-[#FF5200] border border-orange-100 rounded-md px-1.5 py-0.5 font-medium">Strong Match</span>
                          )}
                        </div>

                        {/* Action row */}
                        <div className="flex flex-col min-[380px]:flex-row gap-2 min-w-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); selectProperty(m) }}
                            className="flex-1 text-center text-[11px] font-semibold text-white bg-[#FF5200] rounded-lg py-1.5 hover:bg-orange-600 transition-colors min-h-[40px]"
                          >
                            View Intelligence
                          </button>
                          <Link
                            href={`/properties/${encodePropertyId(m.property.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-center text-[11px] text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 hover:text-gray-900 lg:text-gray-300 lg:border-white/15 lg:hover:border-white/30 lg:hover:text-white transition-colors whitespace-nowrap min-h-[40px] flex items-center justify-center min-[380px]:inline-flex"
                          >
                            Listing
                          </Link>
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
                  <p className="text-sm text-gray-400 mb-3">No views yet.</p>
                  <Link href="/properties/results" className="text-xs text-[#FF5200] hover:underline inline-flex items-center gap-0.5">
                    Browse Spaces
                    <IconChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 py-2">
                  {recentViews.map((v) => (
                    <Link key={v.id} href={`/properties/${encodePropertyId(v.propertyId)}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-orange-200 hover:shadow-sm lg:bg-white/5 lg:border-white/10 lg:hover:bg-white/10 lg:hover:border-white/20 transition-all">
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
                        <p className="font-semibold text-xs text-gray-900 lg:text-white line-clamp-1 mb-0.5">{v.property.title}</p>
                        <p className="text-[10px] text-gray-500 lg:text-gray-400 mb-1">{v.property.city}</p>
                        <p className="text-xs font-bold text-[#FF5200]">{formatPrice(v.property.price, v.property.priceType)}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Viewed {formatDate(v.viewedAt)}</p>
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
                  <p className="text-sm text-gray-400 mb-3">No saved spaces yet.</p>
                  <Link href="/properties/results" className="text-xs text-[#FF5200] hover:underline inline-flex items-center gap-0.5">
                    Browse Spaces
                    <IconChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 py-2">
                  {savedProperties.map((sp) => (
                    <Link key={sp.id} href={`/properties/${encodePropertyId(sp.property.id)}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-orange-200 hover:shadow-sm lg:bg-white/5 lg:border-white/10 lg:hover:bg-white/10 lg:hover:border-white/20 transition-all">
                      <div className="relative h-28 bg-gray-100">
                        {Array.isArray(sp.property.images) && (sp.property.images as string[])[0] ? (
                          <Image src={(sp.property.images as string[])[0]} alt={sp.property.title} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-50"><BuildingIcon /></div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="font-semibold text-xs text-gray-900 lg:text-white line-clamp-1 mb-0.5">{sp.property.title}</p>
                        <p className="text-[10px] text-gray-500 lg:text-gray-400 mb-1">{sp.property.city}</p>
                        <p className="text-xs font-bold text-[#FF5200]">{formatPrice(Number(sp.property.price), sp.property.priceType)}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Saved {formatDate(sp.savedAt)}</p>
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
                  <p className="text-sm text-gray-400 mb-3">No inquiries sent yet.</p>
                  <Link href="/properties/results" className="text-xs text-[#FF5200] hover:underline inline-flex items-center gap-0.5">
                    Browse Spaces
                    <IconChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="bg-white rounded-xl border border-gray-200 p-3 hover:border-orange-200 lg:bg-white/5 lg:border-white/10 lg:hover:bg-white/10 lg:hover:border-white/20 transition-all">
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
                            <Link href={`/properties/${encodePropertyId(inq.property.id)}`} className="font-semibold text-xs text-gray-900 hover:text-[#FF5200] lg:text-white truncate">{inq.property.title}</Link>
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium border capitalize ${statusBadge(inq.status)}`}>{inq.status}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 lg:text-gray-400 mb-1 truncate">{inq.property.city}</p>
                          <p className="text-[11px] text-gray-600 lg:text-gray-300 line-clamp-2">{inq.message}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{formatDate(inq.createdAt)}{inq.owner ? ` · ${inq.owner.name}` : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="px-3 sm:px-4 py-4 border-t border-gray-100 lg:border-white/10 mt-2 text-center">
            <p className="text-xs text-gray-500">
              Need help?{' '}
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-[#FF5200] hover:underline">Chat on WhatsApp</a>
            </p>
          </div>
        </div>
        <div className="hidden lg:flex mt-auto p-3 border-t border-white/10 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2.5 w-full">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {companyInitials(brand?.companyName || brandName || 'B')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 lg:text-white truncate">{brand?.companyName || brandName || 'Brand'}</p>
              <p className="text-[10px] text-gray-500">Brand account</p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div
        className={`flex-1 flex flex-col min-h-0 lg:h-full overflow-hidden relative transition-all duration-200 ${
          mobileView === 'list' ? 'h-0 lg:h-full pointer-events-none lg:pointer-events-auto' : 'h-[100dvh]'
        }`}
      >
        {/* Mobile intel header — list back; only when intel mode on mobile */}
        {selectedMatch && mobileView === 'intel' && (
          <div className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 flex-shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={goToDashboardHome}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 flex-shrink-0"
              aria-label="Back to dashboard"
            >
              <IconChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{selectedMatch.property.title}</p>
              <p className="text-[9px] text-gray-500 truncate leading-tight">{selectedMatch.property.address}</p>
            </div>
            <span className="text-[10px] font-black text-white bg-[#FF5200] rounded-full px-2 py-0.5 flex-shrink-0 tabular-nums">
              {selectedMatch.bfiScore} BFI
            </span>
          </div>
        )}

        {/* Intelligence header — only when property selected (desktop / large screens) */}
        {rightMode === 'intelligence' && selectedMatch && (
          <div className="hidden lg:flex lg:flex-nowrap items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white flex-shrink-0 z-10">
            <button
              type="button"
              onClick={goToDashboardHome}
              className="rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-1 flex-shrink-0 text-gray-700 text-[11px] font-semibold px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
              aria-label="Back to dashboard"
            >
              <IconChevronLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-xs truncate leading-tight">{selectedMatch.property.title}</p>
              <p className="text-[10px] text-gray-500 truncate">
                {selectedMatch.property.address}, {selectedMatch.property.city}
                {intelWardLabel ? (
                  <span className="text-gray-400"> · {intelWardLabel}</span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-bold text-white bg-[#FF5200] rounded-full px-2.5 py-1 tabular-nums">{selectedMatch.bfiScore} BFI</span>
              <Link
                href={`/properties/${encodePropertyId(selectedMatch.property.id)}`}
                className="text-[10px] font-medium text-[#FF5200] border border-[#FF5200] rounded-md px-2 py-0.5 hover:bg-orange-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 whitespace-nowrap inline-flex items-center gap-0.5"
              >
                View
                <IconChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden />
              </Link>
              {(() => {
                const mapLink = getMapLinkFromAmenities(selectedMatch.property.amenities)
                const ml = mapLink?.trim() || null
                const coords = selectedListingCoords
                const googleMapsUrl =
                  ml ||
                  (coords && areUsablePinCoords(coords)
                    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
                    : null)
                if (!googleMapsUrl) return null
                return (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Google Maps"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                )
              })()}
            </div>
          </div>
        )}

        {/* Intelligence tab bar */}
        {rightMode === 'intelligence' && (
          <div
            className={`flex-shrink-0 border-b border-gray-100 bg-white z-10 ${
              mobileView === 'map' ? 'hidden lg:block' : ''
            }`}
          >
            <nav className="flex overflow-x-auto px-1 sm:px-2 scrollbar-hide pb-px">
              {INTEL_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRightPanelTab(key)}
                  aria-pressed={rightPanelTab === key}
                  className={`whitespace-nowrap px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] border-b-2 font-medium transition-colors flex-shrink-0 inline-flex items-center min-h-[34px] sm:min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 ${
                    rightPanelTab === key ? 'border-[#FF5200] text-[#FF5200]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        )}

        <div className="flex-1 min-h-0 relative">
        {showDesktopHomeOverlay && (
          <div className="absolute inset-0 z-[25] hidden lg:flex flex-col min-h-0 bg-[#F8F7F4] overflow-hidden">
            <BrandHomeOverview
              matches={matches}
              stats={stats}
              brand={brand}
              brandName={brandName}
              setActiveTab={setActiveTab}
              selectProperty={selectProperty}
              setVisitModal={setVisitModal}
              setDashboardView={setDashboardView}
              router={router}
              setRightPanelTab={setRightPanelTab}
              setMapMode={setMapMode}
              setMobileView={setMobileView}
            />
          </div>
        )}
        {/* Map layer — always in DOM, z-index controlled; fills area below intel chrome */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${isMapVisible ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          {isLoaded ? (
            <GoogleMap
              mapContainerClassName="w-full h-full"
              center={
                selectedListingCoords ??
                (selectedMatch?.coords && areUsablePinCoords(selectedMatch.coords)
                  ? selectedMatch.coords
                  : null) ??
                DEFAULT_MAP_CENTER
              }
              zoom={rightMode === 'intelligence' ? 15 : 12}
              options={{ ...DEFAULT_MAP_OPTIONS, zoomControl: true }}
              onLoad={(map) => setMapRef(map)}
            >
              {/* All match pins */}
              {isLoaded && matches.map((m) => {
                if (!m.coords || !areUsablePinCoords(m.coords)) return null
                const isActive = selectedMatch?.property.id === m.property.id
                const isHovered = hoveredPropertyId === m.property.id
                const position = isActive ? selectedListingCoords ?? m.coords : m.coords
                return (
                  <Marker
                    key={m.property.id}
                    position={position}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: isActive ? 32 : isHovered ? 30 : 26,
                      fillColor: '#FF5200', fillOpacity: 1,
                      strokeColor: '#ffffff', strokeWeight: isActive ? 3.5 : 2.5,
                    }}
                    label={{ text: String(m.bfiScore), color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}
                    onClick={() => selectProperty(m)}
                  />
                )
              })}
              {/* Pulse ring for active/selected property */}
              {isLoaded && selectedListingCoords && areUsablePinCoords(selectedListingCoords) && (
                <Marker
                  position={selectedListingCoords}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 44,
                    fillColor: '#FF5200',
                    fillOpacity: 0.15,
                    strokeColor: '#FF5200',
                    strokeWeight: 1.5,
                    strokeOpacity: 0.4,
                  }}
                  clickable={false}
                  zIndex={0}
                />
              )}
              {/* Competitor pins when in intelligence mode */}
              {isLoaded && rightMode === 'intelligence' && intelData && [...intelData.competitors, ...intelData.complementaryBrands].map((c, i) => {
                if (!selectedListingCoords) return null
                const row = c as { name: string; distance: number; lat?: number; lng?: number; category?: string }
                if (
                  row.lat == null ||
                  row.lng == null ||
                  !Number.isFinite(row.lat) ||
                  !Number.isFinite(row.lng) ||
                  !areUsablePinCoords({ lat: row.lat, lng: row.lng })
                ) {
                  return null
                }
                const isCompetitor = intelData.competitors.some((x) => x.name === row.name && x.distance === row.distance)
                const pin = competitorPinStyle(row.category, isCompetitor)
                return (
                  <Marker
                    key={`comp-${i}-${row.name}`}
                    position={{ lat: row.lat, lng: row.lng }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 9,
                      fillColor: pin.fillColor,
                      fillOpacity: pin.fillOpacity,
                      strokeColor: '#fff',
                      strokeWeight: 1.5,
                    }}
                    title={row.name}
                  />
                )
              })}
              {/* InfoWindows */}
              {isLoaded && matches.map((m) => {
                if (!m.coords || !areUsablePinCoords(m.coords) || activeInfoWindowId !== m.property.id)
                  return null
                const iwPos =
                  selectedMatch?.property.id === m.property.id ? selectedListingCoords ?? m.coords : m.coords
                return (
                  <InfoWindow key={`iw-${m.property.id}`} position={iwPos} onCloseClick={() => setActiveInfoWindowId(null)}>
                    <div className="p-2 min-w-[190px]">
                      <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{m.property.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{m.property.address}, {m.property.city}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#FF5200]">{formatPrice(m.property.price, m.property.priceType)}</span>
                        <span className="bg-[#FF5200] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{m.bfiScore}</span>
                      </div>
                      <a
                        href={`/properties/${encodePropertyId(m.property.id)}`}
                        className="flex items-center justify-center gap-1 text-center text-xs font-semibold text-white bg-[#FF5200] rounded-lg py-1.5 hover:bg-orange-600"
                      >
                        View Details
                        <IconChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-white" aria-hidden />
                      </a>
                    </div>
                  </InfoWindow>
                )
              })}
              {/* Heatmap — matches-only in map mode; multi-layer coloured signals in intelligence mode */}
              {isLoaded && mapMode === 'heatmap' && (() => {
                if (rightMode === 'intelligence' && intelData && selectedListingCoords) {
                  const base = selectedListingCoords
                  const offsetPoint = (distanceM: number, angleDeg: number) => {
                    const rad = (angleDeg * Math.PI) / 180
                    const dlat = (distanceM * Math.cos(rad)) / 111320
                    const dlng = (distanceM * Math.sin(rad)) / (111320 * Math.cos((base.lat * Math.PI) / 180))
                    return new google.maps.LatLng(base.lat + dlat, base.lng + dlng)
                  }

                  const officePoints: google.maps.LatLng[] = (intelData.catchmentLandmarks ?? [])
                    .filter((l) => l.kind === 'tech_park' || l.kind === 'corporate')
                    .flatMap((l) => {
                      const pt = new google.maps.LatLng(l.lat, l.lng)
                      return [pt, pt, pt, pt]
                    })

                  const residentialPoints: google.maps.LatLng[] = (intelData.catchmentLandmarks ?? [])
                    .filter((l) => l.kind === 'residential')
                    .flatMap((l) => {
                      const pt = new google.maps.LatLng(l.lat, l.lng)
                      return [pt, pt, pt]
                    })

                  const pullers = intelData.crowdPullers ?? []
                  const compBrands = intelData.complementaryBrands ?? []
                  const anchorPoints: google.maps.LatLng[] = [
                    ...pullers
                      .filter((c) => c.distance > 0)
                      .map((c, i) => {
                        const co = c as { lat?: number; lng?: number; distance: number }
                        if (co.lat != null && co.lng != null && Number.isFinite(co.lat) && Number.isFinite(co.lng)) {
                          return new google.maps.LatLng(co.lat, co.lng)
                        }
                        return offsetPoint(co.distance, (i / Math.max(1, pullers.length)) * 360)
                      }),
                    ...compBrands
                      .filter((c) => c.distance > 0)
                      .map((c, i) => {
                        if (c.lat != null && c.lng != null && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
                          return new google.maps.LatLng(c.lat, c.lng)
                        }
                        return offsetPoint(c.distance, (i / Math.max(1, compBrands.length)) * 360)
                      }),
                  ]

                  const comps = intelData.competitors ?? []
                  const competitorPoints: google.maps.LatLng[] = comps
                    .filter((c) => c.distance > 0)
                    .map((c, i) => {
                      if (c.lat != null && c.lng != null && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
                        return new google.maps.LatLng(c.lat, c.lng)
                      }
                      return offsetPoint(c.distance, (i / Math.max(1, comps.length)) * 360)
                    })

                  const centerBoost: google.maps.LatLng[] = Array.from({ length: 8 }, (_, i) => {
                    const angle = (i / 8) * 2 * Math.PI
                    const d = 0.00035
                    return new google.maps.LatLng(base.lat + d * Math.cos(angle), base.lng + d * Math.sin(angle))
                  })

                  return (
                    <>
                      {officePoints.length > 0 && (
                        <HeatmapLayer
                          data={officePoints}
                          options={{
                            radius: 60,
                            opacity: 0.7,
                            gradient: ['rgba(255,255,255,0)', 'rgba(255,165,0,0.3)', '#FF5200', '#E4002B'],
                          }}
                        />
                      )}
                      {residentialPoints.length > 0 && (
                        <HeatmapLayer
                          data={residentialPoints}
                          options={{
                            radius: 55,
                            opacity: 0.65,
                            gradient: ['rgba(255,255,255,0)', 'rgba(99,102,241,0.3)', '#6366f1', '#4338ca'],
                          }}
                        />
                      )}
                      {anchorPoints.length > 0 && (
                        <HeatmapLayer
                          data={anchorPoints}
                          options={{
                            radius: 45,
                            opacity: 0.6,
                            gradient: ['rgba(255,255,255,0)', 'rgba(34,197,94,0.3)', '#22c55e', '#15803d'],
                          }}
                        />
                      )}
                      {competitorPoints.length > 0 && (
                        <HeatmapLayer
                          data={competitorPoints}
                          options={{
                            radius: 40,
                            opacity: 0.55,
                            gradient: ['rgba(255,255,255,0)', 'rgba(239,68,68,0.2)', '#ef4444', '#b91c1c'],
                          }}
                        />
                      )}
                      <HeatmapLayer
                        data={centerBoost}
                        options={{
                          radius: 35,
                          opacity: 0.9,
                          gradient: ['rgba(255,255,255,0)', '#FFB899', '#FF5200', '#E4002B'],
                        }}
                      />
                    </>
                  )
                }
                const heatPoints = matches
                  .filter((m) => m.coords && areUsablePinCoords(m.coords))
                  .map((m) => new google.maps.LatLng(m.coords!.lat, m.coords!.lng))
                if (heatPoints.length === 0) return null
                return (
                  <HeatmapLayer
                    data={heatPoints}
                    options={{ radius: 50, opacity: 0.8, gradient: ['rgba(255,255,255,0)', '#FFB899', '#FF5200', '#E4002B'] }}
                  />
                )
              })()}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Map controls (pins / heatmap / satellite) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-md p-1.5 flex flex-col gap-1">
              {(['pins', 'heatmap', 'satellite'] as const).map((mode) => (
                <button key={mode} onClick={() => { setMapMode(mode); if (mapRef) mapRef.setMapTypeId(mode === 'satellite' ? 'satellite' : 'roadmap') }}
                  aria-pressed={mapMode === mode}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 ${mapMode === mode ? 'bg-[#FF5200] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {mode === 'pins' ? 'Pins' : mode === 'heatmap' ? 'Heatmap' : 'Satellite'}
                </button>
              ))}
            </div>
          </div>

          {mapMode === 'heatmap' && rightMode === 'intelligence' && intelData && (
            <div className="absolute bottom-10 max-lg:bottom-32 left-2 z-20 bg-white/95 rounded-xl shadow-md px-3 py-2 text-[9px] space-y-1 max-w-[11rem]">
              <p className="font-semibold text-gray-700 uppercase tracking-wide mb-1">Heatmap layers</p>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5200] flex-shrink-0" />
                <span className="text-gray-600">Office / Tech parks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#6366f1] flex-shrink-0" />
                <span className="text-gray-600">Residential</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#22c55e] flex-shrink-0" />
                <span className="text-gray-600">Anchor brands</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ef4444] flex-shrink-0" />
                <span className="text-gray-600">Competitors</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 max-lg:bottom-28 left-2 right-14 sm:right-16 z-20 max-w-[min(100%,18rem)] min-w-0 bg-white/95 backdrop-blur rounded-xl shadow-md px-2.5 sm:px-3 py-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#FF5200] flex flex-shrink-0 items-center justify-center"><span className="text-white text-[8px] font-bold">85</span></div>
            <span className="text-[11px] sm:text-xs text-gray-700 font-medium truncate">{matches.length} Matched Properties</span>
          </div>

          {/* "Select property" hint */}
          {rightMode === 'map' && !(selectedMatch && mobileView === 'map') && (
            <div className="absolute bottom-14 max-lg:bottom-24 left-1/2 -translate-x-1/2 z-20 max-w-[min(92vw,22rem)] bg-white/95 backdrop-blur rounded-2xl shadow-md px-3 py-2 pointer-events-none">
              <p className="text-[10px] sm:text-xs text-gray-600 text-center leading-snug whitespace-normal flex items-center justify-center gap-0.5 flex-wrap">
                <span>Select a property to see full Location Intelligence</span>
                <IconChevronRight className="w-3 h-3 flex-shrink-0 text-gray-500" aria-hidden />
              </p>
            </div>
          )}

          {/* Mobile: floating property bottom sheet when map is active */}
          {selectedMatch && mobileView === 'map' && (
            <div className="lg:hidden absolute bottom-16 inset-x-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setMobileView('intel')
                  }
                }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 cursor-pointer active:bg-gray-50"
                onClick={() => setMobileView('intel')}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{selectedMatch.property.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{selectedMatch.property.address}</p>
                  <p className="text-[10px] font-semibold text-[#FF5200] mt-0.5">
                    {formatPrice(selectedMatch.property.price, selectedMatch.property.priceType)} · {selectedMatch.property.size.toLocaleString('en-IN')} sqft
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-xs font-black text-white bg-[#FF5200] rounded-full px-2.5 py-1">
                    {selectedMatch.bfiScore} BFI
                  </span>
                  <span className="text-[9px] text-gray-400 inline-flex items-center gap-0.5">
                    Tap for intel
                    <IconChevronRight className="w-2.5 h-2.5 flex-shrink-0" aria-hidden />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Intelligence content panel ── */}
        {rightMode === 'intelligence' && rightPanelTab !== 'map' && (
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-white z-20 min-h-0 pb-20 lg:pb-0">
            {selectedMatch && (
              <div className="hidden lg:block">
              <QuickActionRail
                onScheduleVisit={() => setVisitModal(v => ({ ...v, open: true }))}
                onToggleSave={() => setVisitModal(v => ({ ...v, saved: !v.saved }))}
                onToggleInterested={() => setVisitModal(v => ({ ...v, interested: !v.interested }))}
                onOpenMap={() => setRightPanelTab('map')}
                isSaved={visitModal.saved}
                isInterested={visitModal.interested}
              />
              </div>
            )}

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
                  <p className="text-sm text-gray-500 mb-2">Intelligence data could not be loaded.</p>
                  <p className="text-xs text-gray-400">Try selecting the property again or check your connection.</p>
                </div>
              </div>
            )}

            {!intelLoading && intelData && (
              <>
                {/* ── TAB: OVERVIEW ── */}
                {rightPanelTab === 'overview' && (
                  <div>
                    <DecisionHeroCard
                      overallScore={intelData.overallScore}
                      bfiScore={selectedMatch?.bfiScore || 0}
                      city={selectedMatch?.property.city || 'this market'}
                      industry={data?.brand?.industry || 'F&B'}
                      highlights={intelData.highlights}
                      onScheduleVisit={() => setVisitModal(v => ({ ...v, open: true }))}
                      onToggleSave={() => setVisitModal(v => ({ ...v, saved: !v.saved }))}
                      onToggleInterested={() => setVisitModal(v => ({ ...v, interested: !v.interested }))}
                      isSaved={visitModal.saved}
                      isInterested={visitModal.interested}
                    />

                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100 bg-white">
                      {(() => {
                        const brandFilteredCompetitorCount = intelData.competitors.length
                        const saturationToMarketPotential = (sat: string | null | undefined) => {
                          if (sat === 'low') return 82
                          if (sat === 'medium') return 62
                          if (sat === 'high') return 42
                          if (sat === 'saturated') return 22
                          if (brandFilteredCompetitorCount === 0) return 78
                          if (brandFilteredCompetitorCount <= 3) return 62
                          if (brandFilteredCompetitorCount <= 6) return 45
                          return 30
                        }
                        const marketPotentialScore = Math.max(
                          Math.round(intelData.growthTrend),
                          saturationToMarketPotential(null),
                        )
                        const demandGapScore =
                          brandFilteredCompetitorCount === 0
                            ? 85
                            : brandFilteredCompetitorCount <= 2
                              ? 65
                              : brandFilteredCompetitorCount <= 5
                                ? 40
                                : brandFilteredCompetitorCount <= 8
                                  ? 22
                                  : 10
                        const effectiveDemandGap = Math.max(demandGapScore, Math.round(intelData.spendingCapacity))
                        const brand = data?.brand
                        const hpRaw = intelData.hourlyPattern.filter(
                          (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0,
                        )
                        const hourlyForSpark = hpRaw.length >= 2 ? hpRaw.slice(0, 14) : null
                        const maxH = hourlyForSpark?.length ? Math.max(...hourlyForSpark, 1) : 1
                        const sparkMarket =
                          hourlyForSpark ??
                          [
                            marketPotentialScore * 0.82,
                            marketPotentialScore * 0.88,
                            marketPotentialScore * 0.93,
                            marketPotentialScore * 0.97,
                            marketPotentialScore,
                          ]
                        const sparkDemand =
                          hourlyForSpark != null
                            ? hourlyForSpark.map((v) => (v / maxH) * effectiveDemandGap)
                            : [
                                effectiveDemandGap * 0.78,
                                effectiveDemandGap * 0.86,
                                effectiveDemandGap * 0.92,
                                effectiveDemandGap * 0.96,
                                effectiveDemandGap,
                              ]
                        const c = brandFilteredCompetitorCount
                        const sparkComp =
                          c === 0
                            ? [1, 1.5, 1.2, 1.8, 1.3, 1.6, 1.4, 1.2]
                            : Array.from({ length: 10 }, (_, i) =>
                                Math.max(0.5, c + Math.sin(i / 1.7) * Math.max(1, c * 0.12)),
                              )
                        const affBase =
                          intelData.affluenceIndicator === 'High'
                            ? 82
                            : intelData.affluenceIndicator === 'Medium'
                              ? 55
                              : 36
                        const catchSlice = intelData.catchment.slice(0, 10)
                        const sparkAff =
                          catchSlice.length >= 2
                            ? catchSlice.map((x) => Math.max(1, (x.sharePct / 50) * affBase))
                            : [affBase * 0.88, affBase * 0.92, affBase * 0.97, affBase, affBase * 1.03]
                        const colMp =
                          marketPotentialScore >= 60 ? '#059669' : marketPotentialScore >= 40 ? '#d97706' : '#e11d48'
                        const colDg =
                          effectiveDemandGap >= 55 ? '#059669' : effectiveDemandGap >= 35 ? '#d97706' : '#e11d48'
                        const colComp =
                          brandFilteredCompetitorCount <= 2
                            ? '#059669'
                            : brandFilteredCompetitorCount <= 5
                              ? '#d97706'
                              : '#e11d48'
                        const colAff =
                          intelData.affluenceIndicator === 'High'
                            ? '#059669'
                            : intelData.affluenceIndicator === 'Medium'
                              ? '#d97706'
                              : '#6b7280'
                        return (
                          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            <InsightMetricCard
                              label="Market potential"
                              value={`${marketPotentialScore}/100`}
                              note="Whitespace and expansion signal"
                              tone={marketPotentialScore >= 60 ? 'positive' : marketPotentialScore >= 40 ? 'warning' : 'risk'}
                              icon={<IconTrendUp className="w-5 h-5" />}
                              sparkline={{ data: sparkMarket, color: colMp }}
                            />
                            <InsightMetricCard
                              label="Demand gap"
                              value={`${effectiveDemandGap}/100`}
                              note="Unmet demand for your category"
                              tone={effectiveDemandGap >= 55 ? 'positive' : effectiveDemandGap >= 35 ? 'warning' : 'risk'}
                              icon={<IconWallet className="w-5 h-5" />}
                              sparkline={{ data: sparkDemand, color: colDg }}
                            />
                            <InsightMetricCard
                              label="Competition pressure"
                              value={`${brandFilteredCompetitorCount}`}
                              note={
                                brandFilteredCompetitorCount === 0
                                  ? 'No direct competitors mapped'
                                  : `Direct ${brand?.industry || 'category'} competitors`
                              }
                              tone={
                                brandFilteredCompetitorCount <= 2
                                  ? 'positive'
                                  : brandFilteredCompetitorCount <= 5
                                    ? 'warning'
                                    : 'risk'
                              }
                              icon={<IconCompetition className="w-5 h-5" />}
                              sparkline={{ data: sparkComp, color: colComp }}
                            />
                            <InsightMetricCard
                              label="Catchment affluence"
                              value={intelData.affluenceIndicator}
                              note={
                                intelData.totalHouseholds > 0
                                  ? `${intelData.totalHouseholds.toLocaleString('en-IN')} households`
                                  : 'Household data loading'
                              }
                              tone={
                                intelData.affluenceIndicator === 'High'
                                  ? 'positive'
                                  : intelData.affluenceIndicator === 'Medium'
                                    ? 'warning'
                                    : 'neutral'
                              }
                              icon={<IconUsers className="w-5 h-5" />}
                              sparkline={{ data: sparkAff, color: colAff }}
                            />
                          </div>
                        )
                      })()}
                    </div>

                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Signal scorecard</p>
                      {(() => {
                        const brandFilteredCount = intelData.competitors.length
                        const footfallScore = Math.min(10, Math.round((intelData.totalFootfall / 3000) * 10))
                        const catchmentScore = intelData.affluenceIndicator === 'High' ? 10 : intelData.affluenceIndicator === 'Medium' ? 7 : 5
                        const competitionVoidScore =
                          brandFilteredCount === 0 ? 10 : Math.max(2, 10 - Math.round(brandFilteredCount / 2))
                        const configScore = Math.round((selectedMatch?.breakdown.sizeFit || 50) / 10)
                        const accessScore = intelData.metroDistance ? Math.max(3, 10 - Math.round(intelData.metroDistance / 1000)) : 6
                        const connScore = intelData.busStops > 0 ? 8 : 6
                        const occasionScore = Math.min(10, Math.max(1, Math.round(intelData.growthTrend / 10)))
                        const viabilityScore = Math.round((selectedMatch?.breakdown.budgetFit || 50) / 10)
                        const parameters = [
                          { label: 'Footfall Density', score: footfallScore, note: `~${intelData.totalFootfall.toLocaleString()} daily est.` },
                          { label: 'Catchment Quality', score: catchmentScore, note: intelData.affluenceIndicator + ' affluence' },
                          {
                            label: 'F&B Supply Gap',
                            score: competitionVoidScore,
                            note:
                              brandFilteredCount === 0
                                ? 'No direct competitors'
                                : `${brandFilteredCount} ${data?.brand?.industry || 'category'} competitors`,
                          },
                          { label: 'Property Configuration', score: configScore, note: `${selectedMatch?.property.size.toLocaleString()} sqft ${selectedMatch?.property.propertyType}` },
                          { label: 'Walk-In Access', score: Math.min(10, Math.round(accessScore * 1.2)), note: intelData.metroName ? `Metro ${((intelData.metroDistance || 0) / 1000).toFixed(1)}km` : 'Access estimated' },
                          { label: 'Connectivity', score: connScore, note: intelData.busStops > 0 ? 'Transit nearby' : 'Road access' },
                          { label: 'Occasion Spread', score: occasionScore, note: 'Day-part coverage' },
                          { label: 'Commercial Viability', score: viabilityScore, note: formatPrice(selectedMatch?.property.price || 0, selectedMatch?.property.priceType || 'monthly') },
                        ]
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {parameters.map(({ label, score, note }) => (
                              <div key={label} className="rounded-xl border border-gray-200 bg-white p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                                  <span className={`text-xs font-bold ml-1 flex-shrink-0 ${score >= 8 ? 'text-green-600' : score >= 6 ? 'text-amber-600' : 'text-red-500'}`}>{score}/10</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-700 ${score >= 8 ? 'bg-green-400' : score >= 6 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${score * 10}%` }} />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">{note}</p>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Demand Composition — visual pie (area + catchment priors; household count is capped so it cannot wipe office share) */}
                    {(() => {
                      const officeSignals = [
                        intelData.catchmentLandmarks.filter(
                          (l) => l.kind === 'tech_park' || l.kind === 'corporate',
                        ).length * 200,
                        intelData.competitors.filter((c) => {
                          const cat = c.category?.toLowerCase() ?? ''
                          return cat.includes('cafe') || cat.includes('qsr')
                        }).length * 150,
                      ].reduce((a, b) => a + b, 0)

                      const resLandmarkPts =
                        intelData.catchmentLandmarks.filter((l) => l.kind === 'residential').length * 150
                      const hh = intelData.totalHouseholds > 0 ? intelData.totalHouseholds : 0
                      const householdPts = hh > 0 ? Math.min(380, 40 + Math.log1p(hh) * 32) : 0
                      const residentialSignals = resLandmarkPts + householdPts

                      let areaKey = intelData.nearestCommercialAreaKey?.toLowerCase() || ''
                      const propBlob = `${selectedMatch?.property.title || ''} ${selectedMatch?.property.address || ''} ${selectedMatch?.property.city || ''}`.toLowerCase()
                      if (!areaKey.trim()) {
                        if (/\bhsr\b|hsr layout|24th main|27th main|sector\s*\d/i.test(propBlob)) areaKey = 'hsr layout'
                        else if (/\bkoramangala\b/i.test(propBlob)) areaKey = 'koramangala'
                        else if (/\b(indiranagar|indra nagar)\b/i.test(propBlob)) areaKey = 'indiranagar'
                        else if (/\b(btm|madivala)\b/i.test(propBlob)) areaKey = 'btm layout'
                        else if (/\b(whitefield|itpl|hoodi)\b/i.test(propBlob)) areaKey = 'whitefield'
                        else if (/\b(sarjapur|ambalipura|kasavanahalli)\b/i.test(propBlob)) areaKey = 'sarjapur road'
                        else if (/\b(bellandur|outer ring)\b/i.test(propBlob)) areaKey = 'bellandur'
                        else if (/\b(electronic city|ecity|bommasandra)\b/i.test(propBlob)) areaKey = 'electronic city'
                      }
                      const knownOfficePct: Record<string, number> = {
                        'hsr layout': 52,
                        hsr: 52,
                        whitefield: 65,
                        'electronic city': 72,
                        manyata: 70,
                        marathahalli: 55,
                        bellandur: 58,
                        sarjapur: 62,
                        'sarjapur road': 60,
                        'sarjapur junction': 60,
                        ecity: 72,
                        koramangala: 40,
                        indiranagar: 28,
                        'mg road': 38,
                        'kalyan nagar': 32,
                        'new bel': 45,
                        jayanagar: 12,
                        btm: 36,
                        'btm layout': 36,
                        hoodi: 62,
                        kaikondrahalli: 48,
                      }
                      const officePctFromArea =
                        Object.entries(knownOfficePct).find(([k]) => areaKey.includes(k))?.[1] ?? null

                      const officePctFromCatchment = (() => {
                        const rows = intelData.catchment
                        if (!rows.length) return null
                        let off = 0
                        let res = 0
                        for (const c of rows) {
                          const w = Number(c.sharePct) || 0
                          const t = (c.areaType || 'mixed').toLowerCase()
                          if (t === 'commercial' || t === 'tech') off += w
                          else if (t === 'residential') res += w
                          else {
                            off += w * 0.42
                            res += w * 0.58
                          }
                        }
                        const s = off + res
                        return s > 0 ? Math.round((off / s) * 100) : null
                      })()

                      const totalSignals = officeSignals + residentialSignals
                      const computedOfficePct =
                        totalSignals > 0 ? Math.round((officeSignals / totalSignals) * 100) : null
                      let officePct =
                        officePctFromArea ?? officePctFromCatchment ?? computedOfficePct ?? 42
                      if (officePct < 22 && (officeSignals > 0 || officePctFromCatchment != null)) {
                        officePct = Math.max(officePct, 28)
                      }
                      officePct = Math.max(12, Math.min(88, officePct))
                      const resPct = 100 - officePct

                      const isLeisureHeavy = ['indiranagar', 'koramangala', 'mg road', 'brigade', 'church street'].some(
                        (k) => areaKey.includes(k),
                      )
                      const transitPct = isLeisureHeavy ? Math.round((officePct + resPct) * 0.12) : 0
                      let adjustedOfficePct = officePct - Math.round(transitPct * 0.4)
                      let adjustedResPct = resPct - Math.round(transitPct * 0.6)
                      adjustedOfficePct = Math.max(8, Math.min(92, adjustedOfficePct))
                      adjustedResPct = Math.max(8, Math.min(92, adjustedResPct))

                      let demandData: { name: string; value: number; fill: string }[] = [
                        { name: 'Office/Daytime', value: adjustedOfficePct, fill: '#FF5200' },
                        { name: 'Residential', value: adjustedResPct, fill: '#6366f1' },
                        ...(transitPct > 0 ? [{ name: 'Leisure/Transit', value: transitPct, fill: '#22c55e' }] : []),
                      ]
                      let sliceSum = demandData.reduce((s, d) => s + d.value, 0)
                      if (sliceSum !== 100 && demandData.length > 0) {
                        const diff = 100 - sliceSum
                        const last = demandData[demandData.length - 1]
                        demandData = [...demandData.slice(0, -1), { ...last, value: Math.max(5, last.value + diff) }]
                        sliceSum = demandData.reduce((s, d) => s + d.value, 0)
                        if (sliceSum !== 100) {
                          const d2 = 100 - sliceSum
                          const first = demandData[0]
                          demandData = [{ ...first, value: Math.max(5, first.value + d2) }, ...demandData.slice(1)]
                        }
                      }

                      const narrativeOfficePct = transitPct > 0 ? adjustedOfficePct : officePct

                      return (
                        <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Demand Composition
                          </p>
                          <div className="flex items-center gap-4">
                            <PieChart width={80} height={80}>
                              <Pie
                                data={demandData}
                                cx={35}
                                cy={35}
                                innerRadius={22}
                                outerRadius={36}
                                dataKey="value"
                                strokeWidth={0}
                              >
                                {demandData.map((entry, i) => (
                                  <Cell key={i} fill={entry.fill} />
                                ))}
                              </Pie>
                            </PieChart>
                            <div className="flex-1 space-y-2">
                              {demandData.map((d) => (
                                <div key={d.name} className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ background: d.fill }}
                                    />
                                    <span className="text-[11px] text-gray-600">{d.name}</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-gray-800">{d.value}%</span>
                                </div>
                              ))}
                              <p className="text-[9px] text-gray-400 pt-1">
                                {transitPct > 0
                                  ? 'Leisure/transit corridor — strong evening & weekend footfall alongside base office/residential mix'
                                  : narrativeOfficePct > 60
                                    ? 'Office-dominant — weekday peak, strong delivery, lower weekend'
                                    : narrativeOfficePct > 40
                                      ? 'Mixed catchment — good daily spread across all day-parts'
                                      : 'Residential-dominant — strong evenings, weekends, and family dining'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Highlights */}
                    {intelData.highlights.length > 0 && (
                      <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Highlights
                          <span className="hidden sm:inline ml-1 text-gray-300 font-normal normal-case">— derived from live market data</span>
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {intelData.highlights.map((h) => <HighlightChip key={h} label={h} />)}
                        </div>
                      </div>
                    )}

                    {/* Lokazen location synthesis — one engine pass, surfaced on every intelligence tab */}
                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100 bg-gradient-to-b from-orange-50/45 to-transparent">
                      {intelData.locationSynthesisPending && !intelData.locationSynthesis && (
                        <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl mb-3">
                          <p className="text-[11px] font-medium text-gray-700">Narrative syncing</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                            Scores and metrics above are live. Location narrative is generated on a scheduled cycle and will appear here shortly.
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Location synthesis
                          <span className="ml-1.5 normal-case font-normal text-[#FF5200]">· Lokazen intelligence</span>
                        </p>
                        {intelData.locationSynthesis && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              intelData.locationSynthesis.strategicFit === 'strong'
                                ? 'bg-emerald-100 text-emerald-800'
                                : intelData.locationSynthesis.strategicFit === 'viable'
                                  ? 'bg-amber-100 text-amber-800'
                                  : intelData.locationSynthesis.strategicFit === 'cautionary'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {intelData.locationSynthesis.strategicFit} fit
                          </span>
                        )}
                      </div>
                      {intelData.locationSynthesisError && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">{intelData.locationSynthesisError}</p>
                      )}
                      {intelData.locationSynthesisPending && !intelData.locationSynthesis ? (
                        <p className="text-xs text-gray-400">Scores and data above are live. Full narrative syncing shortly.</p>
                      ) : intelData.locationSynthesis ? (
                        <div className="space-y-3 text-xs text-gray-700">
                          <p className="leading-relaxed text-gray-800">{intelData.locationSynthesis.executiveSummary}</p>
                          {intelData.locationSynthesis.liveEconomics && (
                            <div className="rounded-lg border border-orange-100 bg-white/90 px-3 py-2">
                              <p className="text-[9px] font-bold text-orange-800 uppercase tracking-wide mb-0.5">Live commercial rent</p>
                              <p className="text-sm font-bold text-gray-900">
                                ₹{intelData.locationSynthesis.liveEconomics.commercialRentPerSqftTypical}/sqft/mo typical
                                <span className="text-[11px] font-normal text-gray-500">
                                  {' '}· band ₹{intelData.locationSynthesis.liveEconomics.commercialRentLow}–
                                  {intelData.locationSynthesis.liveEconomics.commercialRentHigh}
                                  <span className="capitalize"> · {intelData.locationSynthesis.liveEconomics.confidence} confidence</span>
                                </span>
                              </p>
                              <p className="text-[10px] text-gray-600 mt-1">{shortenText(intelData.locationSynthesis.liveEconomics.rationale, 220)}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Strengths</p>
                              <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-700">
                                {intelData.locationSynthesis.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Risks</p>
                              <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-700">
                                {intelData.locationSynthesis.risks.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {intelData.locationSynthesis.opportunities.length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Opportunities</p>
                              <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-700">
                                {intelData.locationSynthesis.opportunities.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-[11px] text-gray-600">
                            <span className="font-semibold text-gray-700">Competition: </span>
                            {intelData.locationSynthesis.competitorTakeaway}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            <span className="font-semibold text-gray-700">Footfall: </span>
                            {intelData.locationSynthesis.footfallInterpretation}
                          </p>
                          {intelData.locationSynthesis.nextSteps.length > 0 && (
                            <div className="rounded-lg bg-white/80 border border-orange-100 px-3 py-2">
                              <p className="text-[9px] font-bold text-orange-800 uppercase mb-1">Suggested next steps</p>
                              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-800">
                                {intelData.locationSynthesis.nextSteps.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          <p className="text-[9px] text-gray-400 leading-snug pt-1 border-t border-gray-100">
                            {intelData.locationSynthesis.disclaimer}
                          </p>
                        </div>
                      ) : intelData.locationSynthesisError && !intelData.locationSynthesis ? (
                        <>
                          <div className="text-[11px] text-gray-400 italic py-2">
                            Intelligence analysis unavailable — chart data is still shown above.
                          </div>
                          <div className="text-[11px] text-gray-400 italic py-2">
                            Intelligence analysis unavailable — chart data is still shown above.
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* BFI Breakdown */}
                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
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

                    {/* Property Details */}
                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Property Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <MetricCell label="AREA" value={`${selectedMatch?.property.size.toLocaleString()} sqft`} />
                        <MetricCell label="RENT" value={formatPrice(selectedMatch?.property.price || 0, selectedMatch?.property.priceType || 'monthly')} />
                        <MetricCell label="TYPE" value={selectedMatch?.property.propertyType || '—'} />
                        <MetricCell label="CITY" value={selectedMatch?.property.city || '—'} />
                        {intelData.metroName && <MetricCell label="NEAREST METRO" value={intelData.metroName} benchmark={intelData.metroDistance ? `${(intelData.metroDistance / 1000).toFixed(1)} km` : undefined} />}
                      </div>
                    </div>

                    {/* Revenue Potential — LIR Section 06 style */}
                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="font-bold text-gray-900 text-sm">Revenue Potential</h3>
                        <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 max-w-full">Lokazen estimate · not a guarantee</span>
                        <div className="ml-auto flex-shrink-0">
                          <IntelInfoPopup title="Revenue model" ariaLabel="More info about revenue model">
                            Based on format turn model (covers × turns × ticket) + delivery stream + real catchment data
                            (offices, residents, road) + pocket-level multiplier + spending power + competition. Not a
                            guarantee.
                          </IntelInfoPopup>
                        </div>
                      </div>
                      {(() => {
                        const brand = data?.brand ?? null
                        const businessType = buildLocationBusinessType(brand)
                        const prop = selectedMatch?.property
                        const priceNum = prop?.price != null ? Number(prop.price) : null
                        const sizeNum = prop?.size != null ? Number(prop.size) : null
                        const monthlyRent =
                          priceNum != null && prop
                            ? prop.priceType === 'yearly'
                              ? priceNum / 12
                              : prop.priceType === 'sqft' && sizeNum
                                ? priceNum * sizeNum
                                : prop.priceType === 'monthly'
                                  ? priceNum
                                  : null
                            : null

                        const spiFallback =
                          intelData.affluenceIndicator === 'High'
                            ? 82
                            : intelData.affluenceIndicator === 'Low'
                              ? 38
                              : 55

                        const locationProfile = buildRevenueLocationProfile({
                          amenities: prop?.amenities,
                          landmarks: intelData.catchmentLandmarks,
                          directCompetitorCount: intelData.numberOfStores,
                          rawCompetitors: intelData.competitors.map((c) => ({
                            rating: c.rating,
                            reviewCount: c.reviewCount,
                          })),
                          metroDistanceM: intelData.metroDistance,
                          busStops: intelData.busStops,
                          pocket: commercialPocket,
                          localityIntel: null,
                          ward: null,
                          competitorCountForSaturationFallback: intelData.numberOfStores,
                          spendingPowerIndexFallback: spiFallback,
                        })

                        const pocketData = commercialPocket
                          ? {
                              name: String(commercialPocket['name'] ?? ''),
                              tier: Number(commercialPocket['tier']),
                              revenueMultiplier: Number(commercialPocket['revenue_multiplier']),
                              rentGfTypical: Number(commercialPocket['rent_gf_typical']),
                              avgDailyFootfall: Number(commercialPocket['avg_daily_footfall']),
                              officeDemandPct: Number(commercialPocket['office_demand_pct']),
                              residentialDemandPct: Number(commercialPocket['residential_demand_pct']),
                              officeLunchCaptureRate: Number(commercialPocket['office_lunch_capture_rate']),
                              fnbSaturation:
                                commercialPocket['fnb_saturation'] != null
                                  ? String(commercialPocket['fnb_saturation'])
                                  : null,
                              roadType:
                                commercialPocket['road_type'] != null
                                  ? String(commercialPocket['road_type'])
                                  : null,
                            }
                          : null

                        const revenue = calculateRevenueFromBenchmarks({
                          latitude: intelData.coords.lat,
                          longitude: intelData.coords.lng,
                          propertyType: prop?.propertyType,
                          businessType,
                          monthlyRent,
                          sizeSqft: prop?.size != null ? Number(prop.size) : null,
                          locationProfile,
                          pocketData,
                        })

                        const conservativeL = Math.max(0, Math.round(revenue.monthlyRevenueLow / 100000))
                        const baseL = Math.max(0, Math.round(revenue.monthlyRevenueMid / 100000))
                        const optimisticL = Math.max(0, Math.round(revenue.monthlyRevenueHigh / 100000))
                        const { breakdown } = revenue
                        const healthyPct = revenue.healthyRentToRevenuePct

                        return (
                          <div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { label: 'Conservative', value: `₹${conservativeL}L`, color: 'bg-gray-50 border-gray-200' },
                                { label: 'Base Case', value: `₹${baseL}L`, color: 'bg-orange-50 border-orange-200' },
                                { label: 'Optimistic', value: `₹${optimisticL}L`, color: 'bg-green-50 border-green-200' },
                              ].map(({ label, value, color }) => (
                                <div key={label} className={`${color} border rounded-xl p-2.5 text-center`}>
                                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                                  <p className="font-black text-gray-900 text-base leading-none">{value}</p>
                                  <p className="text-[9px] text-gray-400 mt-0.5">per month</p>
                                </div>
                              ))}
                            </div>
                            <details className="mt-3 border-t border-gray-100 pt-3 group">
                              <summary className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide cursor-pointer list-none flex items-center gap-1 mb-2 [&::-webkit-details-marker]:hidden">
                                <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block">▸</span>
                                How we calculated this
                              </summary>
                              <div className="space-y-1.5 text-[10px]">
                                <div className="flex justify-between font-semibold text-gray-800 pb-1.5 border-b border-gray-100">
                                  <span>{breakdown.formatLabel}</span>
                                  <span className="text-gray-500">
                                    {breakdown.covers > 0
                                      ? `${breakdown.covers} covers · ${breakdown.turnsPerDay}x turns`
                                      : 'Delivery only'}
                                  </span>
                                </div>

                                {breakdown.pocketName && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Commercial pocket</span>
                                    <span className="font-medium text-gray-700">
                                      {breakdown.pocketName}
                                      {breakdown.pocketTier === 1 && ' · Ultra-prime'}
                                      {breakdown.pocketTier === 2 && ' · Prime'}
                                    </span>
                                  </div>
                                )}

                                {breakdown.officeWorkerDemand > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Office workers</span>
                                    <span className="text-gray-700">{breakdown.officeWorkerDemand} customers/day</span>
                                  </div>
                                )}
                                {breakdown.residentialDemand > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Residential catchment</span>
                                    <span className="text-gray-700">{breakdown.residentialDemand} customers/day</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Road walk-in
                                    <span className="text-gray-400 ml-1">
                                      ({breakdown.roadTypeModifier.replace(/_/g, ' ')})
                                    </span>
                                  </span>
                                  <span className="text-gray-700">{breakdown.roadWalkIn}/day</span>
                                </div>
                                {breakdown.deliveryOrders > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Delivery orders</span>
                                    <span className="text-gray-700">
                                      {Math.round(breakdown.deliveryOrders)}/day · ₹{breakdown.deliveryAvgTicket} avg
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between pt-1.5 border-t border-gray-100">
                                  <span className="text-gray-500">Dine-in revenue</span>
                                  <span className="text-gray-700">₹{(breakdown.monthlyDineIn / 100000).toFixed(1)}L/mo</span>
                                </div>
                                {breakdown.monthlyDelivery > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Delivery ({Math.round(breakdown.deliverySharePct * 100)}% mix)
                                    </span>
                                    <span className="text-gray-700">₹{(breakdown.monthlyDelivery / 100000).toFixed(1)}L/mo</span>
                                  </div>
                                )}

                                <div className="flex justify-between pt-1.5 border-t border-gray-100">
                                  <span className="text-gray-500">Location multiplier</span>
                                  <span className="text-gray-700">{breakdown.areaMultiplier}× vs city avg</span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-gray-500">Competition</span>
                                  <span
                                    className={`capitalize font-medium ${
                                      breakdown.saturationLevel === 'saturated'
                                        ? 'text-red-500'
                                        : breakdown.saturationLevel === 'high'
                                          ? 'text-amber-500'
                                          : breakdown.saturationLevel === 'low'
                                            ? 'text-green-600'
                                            : 'text-gray-600'
                                    }`}
                                  >
                                    {breakdown.saturationLevel} · {breakdown.competitorCount} direct
                                  </span>
                                </div>
                                {breakdown.marketValidatedDemand && (
                                  <div className="text-green-600 flex items-start gap-1.5">
                                    <IconCheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden />
                                    <span>High competitor ratings — demand proven in area</span>
                                  </div>
                                )}

                                {breakdown.affluenceAdjustment !== 1.0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Spending power on ticket</span>
                                    <span
                                      className={breakdown.affluenceAdjustment > 1 ? 'text-green-600' : 'text-amber-600'}
                                    >
                                      {breakdown.affluenceAdjustment > 1 ? '+' : ''}
                                      {Math.round((breakdown.affluenceAdjustment - 1) * 100)}%
                                    </span>
                                  </div>
                                )}

                                {breakdown.accessBonuses.length > 0 && (
                                  <div className="flex justify-between gap-2">
                                    <span className="text-gray-500 shrink-0">Access</span>
                                    <span className="text-green-600 text-right">{breakdown.accessBonuses.join(' · ')}</span>
                                  </div>
                                )}
                                {breakdown.floorPenalty && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Floor</span>
                                    <span className="text-amber-600">{breakdown.floorPenalty}</span>
                                  </div>
                                )}

                                {breakdown.pocketRentTypical != null &&
                                  selectedMatch?.property.size &&
                                  (() => {
                                    const pocketMonthlyBenchmark =
                                      breakdown.pocketRentTypical * (selectedMatch.property.size / 100)
                                    const listingRent = monthlyRent ?? 0
                                    const premium =
                                      listingRent > 0 && pocketMonthlyBenchmark > 0
                                        ? Math.round((listingRent / pocketMonthlyBenchmark - 1) * 100)
                                        : null
                                    if (premium == null) return null
                                    return (
                                      <div className="flex justify-between pt-1.5 border-t border-gray-100">
                                        <span className="text-gray-500">Rent vs market</span>
                                        <span
                                          className={
                                            Math.abs(premium) <= 10
                                              ? 'text-green-600'
                                              : premium > 10
                                                ? 'text-amber-500'
                                                : 'text-green-600'
                                          }
                                        >
                                          {premium > 10
                                            ? `+${premium}% above market`
                                            : premium < -10
                                              ? `${Math.abs(premium)}% below market`
                                              : 'At market rate'}
                                        </span>
                                      </div>
                                    )
                                  })()}

                                <div className="flex justify-between font-medium border-t border-gray-100 pt-1.5 mt-1">
                                  <span className="text-gray-700">
                                    Est. {breakdown.customersPerDay} customers/day · ₹{breakdown.avgTicket} avg
                                  </span>
                                </div>
                              </div>
                            </details>
                            {selectedMatch && monthlyRent != null && monthlyRent > 0 && revenue.monthlyRevenueMid > 0 && (() => {
                              const rentPct = Math.round((monthlyRent / revenue.monthlyRevenueMid) * 100)
                              return (
                                <div className={`rounded-xl p-2.5 text-xs mt-3 ${rentPct <= healthyPct ? 'bg-green-50 border border-green-100' : rentPct <= healthyPct + 10 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Rent-to-Revenue Ratio</span>
                                    <span className={`font-bold ${rentPct <= healthyPct ? 'text-green-700' : rentPct <= healthyPct + 10 ? 'text-amber-700' : 'text-red-600'}`}>{rentPct}%</span>
                                  </div>
                                  <p className={`text-[10px] mt-0.5 ${rentPct <= healthyPct ? 'text-green-600' : rentPct <= healthyPct + 10 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {rentPct <= healthyPct ? 'Healthy ratio — strong unit economics' : rentPct <= healthyPct + 10 ? 'Viable but requires consistent volume' : 'High rent load — premium brand or high volume essential'}
                                  </p>
                                </div>
                              )
                            })()}
                            <p className="text-[9px] text-gray-400 mt-2">
                              Lokazen model: catchment + access + competition · {brand?.industry || 'F&B'} category profile · not a financial guarantee
                            </p>
                          </div>
                        )
                      })()}
                    </div>

                    <div className="px-4 sm:px-5 py-4 bg-gray-50">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1 h-5 bg-[#FF5200] rounded-full flex-shrink-0" />
                          <h3 className="font-bold text-gray-900 text-sm">Strategic recommendation</h3>
                        </div>
                        {(() => {
                          const score = intelData.overallScore
                          const bfi = selectedMatch?.bfiScore || 0
                          const location = selectedMatch?.property.city || 'this location'
                          const brand = data?.brand ?? null
                          const industry = brand?.industry || 'F&B'
                          const verdict = score >= 80 && bfi >= 75
                            ? `${location} is a high-confidence ${industry} placement. Prioritize this property for immediate commercial discussion.`
                            : score >= 65 && bfi >= 60
                              ? `${location} is viable for ${industry}. Move ahead with a site visit and validate rent-negotiation flexibility before locking.`
                              : `${location} is conditional for ${industry}. Keep as a backup while benchmarking lower-rent alternatives nearby.`
                          return <p className="text-sm text-gray-700 leading-relaxed">{verdict}</p>
                        })()}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-800 text-[11px] font-medium">Next step: site validation</span>
                          <span className="px-2.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 text-[11px] font-medium">Recommended: compare 2 nearby options</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: CATCHMENT ── */}
                {rightPanelTab === 'catchment' && (
                  <div className="px-3 sm:px-4 py-3 bg-[#F8F9FB] space-y-3">
                    {primarySegmentLabel(buildLocationBusinessType(brand)) && (
                      <div className="px-4 py-2.5 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/80 to-transparent shadow-sm">
                        <p className="text-[11px] text-gray-800 leading-snug">
                          <span className="font-semibold text-[#FF5200]">Primary trade focus — </span>
                          {primarySegmentLabel(buildLocationBusinessType(brand))}.
                          <span className="text-gray-600">
                            {' '}
                            Catchment describes households and movement for the wider area. Competitor and mix views prioritize this segment first, then other retail nearby.
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Population & Lifestyle</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                      </div>
                      {intelWardLabel ? (
                        <p className="text-[10px] text-gray-500 mb-3">
                          Census ward / unit: <span className="font-semibold text-gray-700">{intelWardLabel}</span>
                        </p>
                      ) : null}
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCell label="TOTAL HOUSEHOLDS" value={intelData.totalHouseholds > 0 ? intelData.totalHouseholds.toLocaleString('en-IN') : '—'} trend="up" />
                        <MetricCell label="AFFLUENCE INDICATOR" value={intelData.affluenceIndicator || '—'} trend="up" benchmark="Bengaluru Avg 0.49" />
                      </div>
                    </div>
                    {(intelData.totalHouseholds > 0 || Boolean(intelData.affluenceIndicator)) && (
                      <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm mb-3">Resident Profile</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-orange-50 rounded-xl p-3 text-center">
                            <p className="text-xl font-black text-gray-900">
                              {intelData.totalHouseholds > 0 ? intelData.totalHouseholds.toLocaleString('en-IN') : '—'}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">Households (Ward)</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-3 text-center">
                            <p className="text-xl font-black text-gray-900">{intelData.affluenceIndicator || '—'}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">Affluence Level</p>
                          </div>
                        </div>
                        {(() => {
                          const incomeAbove15L = Number(intelData.incomeAbove15L ?? 0)
                          const income10to15L = Number(intelData.income10to15L ?? 0)
                          const below10L = Math.max(0, 100 - incomeAbove15L - income10to15L)
                          if (!incomeAbove15L && !income10to15L) return null
                          return (
                            <div className="mt-3">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Income Distribution</p>
                              <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                                <div
                                  style={{ width: `${incomeAbove15L}%` }}
                                  className="bg-green-500 flex items-center justify-center text-[8px] text-white font-bold"
                                >
                                  {incomeAbove15L > 8 ? `${incomeAbove15L}%` : ''}
                                </div>
                                <div
                                  style={{ width: `${income10to15L}%` }}
                                  className="bg-amber-400 flex items-center justify-center text-[8px] text-white font-bold"
                                >
                                  {income10to15L > 8 ? `${income10to15L}%` : ''}
                                </div>
                                <div
                                  style={{ width: `${below10L}%` }}
                                  className="bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 font-bold"
                                >
                                  {below10L > 8 ? `${below10L}%` : ''}
                                </div>
                              </div>
                              <div className="flex gap-3 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1 text-[9px] text-gray-500">
                                  <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                                  &gt;₹15L/yr
                                </span>
                                <span className="flex items-center gap-1 text-[9px] text-gray-500">
                                  <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0" />
                                  ₹10-15L
                                </span>
                                <span className="flex items-center gap-1 text-[9px] text-gray-500">
                                  <span className="w-2 h-2 bg-gray-200 rounded-full shrink-0" />
                                  &lt;₹10L
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                    <TabSynthesisCallout
                      title="For your brand — catchment"
                      narrative={intelData.locationSynthesis?.catchmentForBrand}
                      bullets={intelData.locationSynthesis?.catchmentBullets}
                      loading={false}
                      synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                      analysisLabel="Reading catchment & lifestyle fit..."
                      analysisLines={2}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    {/* Catchment Quality Scorecard — LIR Section 03 style */}
                    <div className="px-4 sm:px-5 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-bold text-gray-900 text-sm">Catchment Quality</h3>
                        <IntelInfoPopup title="Catchment quality" ariaLabel="More info about catchment quality">
                          Lokazen catchment quality measures 5 axes: density, affluence, frequency, captive access, and
                          occasion coverage.
                        </IntelInfoPopup>
                      </div>
                      {(() => {
                        const seg = primarySegmentLabel(buildLocationBusinessType(brand))
                        const axes = [
                          {
                            label: 'Density (Daily Footfall)',
                            score: Math.min(10, Math.round((intelData.totalFootfall / 2000) * 10)),
                            signal: intelData.totalFootfall > 5000 ? 'Benchmark-level for CBD location' : intelData.totalFootfall > 2000 ? 'Good footfall density' : 'Below average — verify catchment',
                          },
                          {
                            label: 'Affluence / Willingness to Pay',
                            score: intelData.affluenceIndicator === 'High' ? 10 : intelData.affluenceIndicator === 'Medium' ? 7 : 5,
                            signal: `${intelData.affluenceIndicator} affluence area`,
                          },
                          {
                            label: 'Competitive Void',
                            score: intelData.numberOfStores === 0 ? 10 : Math.max(2, 10 - intelData.numberOfStores),
                            signal:
                              intelData.numberOfStores === 0
                                ? seg
                                  ? `No direct peers mapped in ${seg.toLowerCase()} — whitespace opportunity`
                                  : 'Zero competition — category void'
                                : seg
                                  ? `${intelData.numberOfStores} mapped in your segment (${seg})`
                                  : `${intelData.numberOfStores} competitors mapped`,
                          },
                          {
                            label: 'Occasion Spread',
                            score: Math.min(10, Math.max(4, Math.round(intelData.growthTrend / 10))),
                            signal: 'Day-part coverage estimate',
                          },
                          {
                            label: 'Catchment Radius Coverage',
                            score: intelData.catchment.length >= 5 ? 9 : intelData.catchment.length >= 3 ? 7 : 5,
                            signal: `${intelData.catchment.length} pincodes in catchment`,
                          },
                        ]
                        return (
                          <div className="space-y-3">
                            {axes.map(({ label, score, signal }) => (
                              <div key={label}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-700 font-medium">{label}</span>
                                  <span className={`text-xs font-bold ${score >= 8 ? 'text-green-600' : score >= 6 ? 'text-amber-600' : 'text-red-500'}`}>{score}/10</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-0.5">
                                  <div className={`h-full rounded-full ${score >= 8 ? 'bg-green-400' : score >= 6 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${score * 10}%` }} />
                                </div>
                                <p className="text-[9px] text-gray-400">{signal}</p>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Where Shoppers Come From</h3>
                        <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">4km radius</span>
                      </div>
                      <CatchmentFlow catchment={intelData.catchment} />
                      {intelData.catchment.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                          {intelData.catchment.slice(0, 10).map((c) => {
                            const typeColor = c.areaType === 'commercial' ? 'bg-orange-50 text-orange-600' : c.areaType === 'tech' ? 'bg-indigo-50 text-indigo-600' : c.areaType === 'residential' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                            return (
                              <div key={`${c.pincode}-${c.name}`} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-medium text-gray-800 truncate">{c.name.split(' / ')[0]}</span>
                                  {c.areaType && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 capitalize ${typeColor}`}>{c.areaType}</span>}
                                  <span className="text-gray-400 text-[10px]">{(c.distanceM / 1000).toFixed(1)}km</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#FF5200] rounded-full" style={{ width: `${c.sharePct}%` }} />
                                  </div>
                                  <span className="font-bold text-gray-900 w-7 text-right">{c.sharePct}%</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {((intelData.locationSynthesisPending && !intelData.locationSynthesis) ||
                        intelData.catchmentLandmarks.length > 0 ||
                        intelData.locationSynthesis?.residentsForBrand ||
                        intelData.locationSynthesis?.apartmentsForBrand ||
                        intelData.locationSynthesis?.workplacesForBrand ||
                        (intelData.locationSynthesis?.residentsBullets?.length ?? 0) > 0 ||
                        (intelData.locationSynthesis?.apartmentsBullets?.length ?? 0) > 0 ||
                        (intelData.locationSynthesis?.workplacesBullets?.length ?? 0) > 0 ||
                        (intelData.locationSynthesisError && !intelData.locationSynthesis)) && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-gray-900">Residents, apartments &amp; workplaces</h4>
                            <span className="text-[10px] bg-orange-50 text-orange-800 rounded-full px-2 py-0.5 font-medium">
                              Lokazen intelligence
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mb-3">
                            Narrative is synthesized from your catchment model (households, pins, mapped anchors). Mapped list below powers the heatmap.
                          </p>
                          <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 bg-white">
                            <TabSynthesisCallout
                              title="Residents — profile & spending context"
                              narrative={intelData.locationSynthesis?.residentsForBrand}
                              bullets={intelData.locationSynthesis?.residentsBullets}
                              loading={false}
                              synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                              analysisLabel="Profiling residential catchment..."
                              analysisLines={2}
                              synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                            />
                            <TabSynthesisCallout
                              title="Apartments & housing stock"
                              narrative={intelData.locationSynthesis?.apartmentsForBrand}
                              bullets={intelData.locationSynthesis?.apartmentsBullets}
                              loading={false}
                              synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                              analysisLabel="Mapping nearby societies..."
                              analysisLines={2}
                              synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                            />
                            <TabSynthesisCallout
                              title="Workplaces — offices & commute pockets"
                              narrative={intelData.locationSynthesis?.workplacesForBrand}
                              bullets={intelData.locationSynthesis?.workplacesBullets}
                              loading={false}
                              synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                              analysisLabel="Identifying office catchment..."
                              analysisLines={2}
                              synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                            />
                          </div>
                          {intelData.catchmentLandmarks.length > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Mapped anchors</h5>
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5">Heatmap density</span>
                              </div>
                              <ul className="space-y-1.5 max-h-[220px] overflow-y-auto">
                                {intelData.catchmentLandmarks.slice(0, 12).map((lm) => {
                                  const chip =
                                    lm.kind === 'residential'
                                      ? 'Residential'
                                      : lm.kind === 'tech_park'
                                        ? 'Tech park'
                                        : 'Corporate'
                                  const chipCls =
                                    lm.kind === 'residential'
                                      ? 'bg-green-50 text-green-800'
                                      : lm.kind === 'tech_park'
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'bg-slate-100 text-slate-700'
                                  return (
                                    <li key={`${lm.name}-${lm.lat}`} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-gray-50">
                                      <span className="text-gray-800 truncate min-w-0 font-medium">{lm.name}</span>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${chipCls}`}>{chip}</span>
                                        <span className="text-gray-500 w-14 text-right">{(lm.distance / 1000).toFixed(2)} km</span>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB: MARKET ── */}
                {rightPanelTab === 'market' && (
                  <div className="px-3 sm:px-4 py-3 bg-[#F8F9FB] space-y-3">
                    <TabSynthesisCallout
                      title="For your brand — market"
                      narrative={intelData.locationSynthesis?.marketForBrand}
                      bullets={intelData.locationSynthesis?.marketBullets}
                      loading={false}
                      synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                      analysisLabel="Reading market conditions..."
                      analysisLines={2}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Catchment economics</h3>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${
                          intelData.locationSynthesis?.liveEconomics
                            ? 'bg-orange-100 text-orange-900 font-medium'
                            : intelData.locationSynthesisPending && !intelData.locationSynthesis
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {intelData.locationSynthesis?.liveEconomics
                            ? 'Synthesized rent + platform band'
                            : intelData.locationSynthesisPending && !intelData.locationSynthesis
                              ? 'Intelligence sync pending'
                              : intelData.rentDataSource === 'listing'
                                ? 'Listing + area band'
                                : 'Area benchmark model'}
                        </span>
                      </div>
                      {intelData.nearestCommercialAreaKey && (
                        <p className="text-[10px] text-gray-500 mb-2">
                          Micro-market: <span className="font-medium text-gray-700 capitalize">{intelData.nearestCommercialAreaKey.replace(/-/g, ' ')}</span>
                          {intelData.rentDataSource === 'listing' ? ' · Listing used for implied ₹/sqft' : ''}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-3 mb-1">
                        <MetricCell
                          label={
                            intelData.locationSynthesis?.liveEconomics
                              ? 'COMM. RENT (LIVE)'
                              : 'COMM. RENT (MODEL)'
                          }
                          value={(() => {
                            const le = intelData.locationSynthesis?.liveEconomics
                            const v = le?.commercialRentPerSqftTypical ?? intelData.rentPerSqftCommercial
                            return v != null && Number.isFinite(Number(v)) ? `₹${Math.round(Number(v))}/sqft` : '—'
                          })()}
                          trend="up"
                          benchmark={(() => {
                            const le = intelData.locationSynthesis?.liveEconomics
                            if (le) return `₹${le.commercialRentLow}–${le.commercialRentHigh}/sqft (${le.confidence})`
                            if (intelData.marketRentLow != null && intelData.marketRentHigh != null) {
                              return `₹${intelData.marketRentLow}–${intelData.marketRentHigh}/sqft`
                            }
                            return undefined
                          })()}
                          tooltip={(() => {
                            const le = intelData.locationSynthesis?.liveEconomics
                            if (le) return `${le.rationale} Not a quote—validate with brokers/comps.`
                            return 'Typical commercial ₹/sqft/month band for the nearest mapped Bengaluru sub-market, adjusted for property type. Pass listing rent + size for listing-implied ₹/sqft.'
                          })()}
                        />
                        <MetricCell
                          label="INCOME BAND (AREA)"
                          value={intelData.incomeLevel ? intelData.incomeLevel.charAt(0).toUpperCase() + intelData.incomeLevel.slice(1) : '—'}
                          trend="up"
                          benchmark="medium"
                          tooltip="Household income mix proxy from Census demographics for the surrounding ward."
                        />
                        <MetricCell
                          label="AFFLUENCE"
                          value={intelData.affluenceIndicator}
                          trend="up"
                          benchmark="Medium"
                          tooltip="Spending-power indicator from projected household income / affluence labels."
                        />
                        <MetricCell
                          label="HOUSEHOLDS (EST.)"
                          value={intelData.totalHouseholds > 0 ? intelData.totalHouseholds.toLocaleString() : '—'}
                          trend="up"
                          tooltip="Estimated household count where Census ward data is available."
                        />
                      </div>
                      {intelData.locationSynthesis?.liveEconomics?.listingVsMarketNote ? (
                        <p className="text-[11px] text-gray-600 mt-2 leading-snug border-t border-gray-100 pt-2">
                          <span className="font-semibold text-gray-700">Listing vs market: </span>
                          {intelData.locationSynthesis.liveEconomics.listingVsMarketNote}
                        </p>
                      ) : null}
                    </div>
                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Retail Indicators</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">5 min Walking</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCell label="TOTAL FOOTFALL" value={intelData.totalFootfall.toLocaleString()} trend="up" benchmark="7.68" tooltip="Estimated average daily footfall in the 5-min walking catchment. Derived from POI density and Lokazen area multipliers." />
                        <MetricCell label="GROWTH TRENDS" value={intelData.growthTrend.toFixed(1)} trend="up" benchmark="36.89" tooltip="Whitespace score — higher means more room to grow. Measures unmet demand vs current supply." />
                        <MetricCell label="SPENDING CAPACITY" value={intelData.spendingCapacity.toFixed(1)} trend="up" benchmark="27.89" tooltip="Demand Gap Score — how underserved this area is for your category. Higher = better opportunity." />
                        <MetricCell label="NUMBER OF STORES" value={String(intelData.numberOfStores)} trend="down" benchmark="245" tooltip="Total competitor and complementary brand count within 800m of the listing pin from Lokazen’s mapped trade area." />
                        <MetricCell label="RETAIL INDEX" value={intelData.retailIndex.toFixed(3)} trend="up" benchmark="0.34" tooltip="Inverse saturation index — higher means less congested retail market. 1.0 = zero competition." />
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">Footfall Trends</h3>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold rounded px-1.5 py-0.5">BETA</span>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">5 min Walking</span>
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        {(['weekday', 'weekend'] as const).map((v) => (
                          <button key={v} type="button" aria-pressed={footfallView === v} onClick={() => setFootfallView(v)}
                            className={`text-xs px-3 py-1 rounded-full font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 ${footfallView === v ? 'bg-[#FF5200] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {v === 'weekday' ? 'Weekday' : 'Weekend'}
                          </button>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={getHourlyData(intelData, footfallView)} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                          <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={2} />
                          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f3f4f6' }} formatter={(v: number) => [`${v.toLocaleString()} people`, 'Footfall']} />
                          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            {getHourlyData(intelData, footfallView).map((entry, i) => <Cell key={i} fill={entry.peak ? '#FF5200' : '#FFB899'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="text-[9px] text-gray-400 mt-1 text-center">{footfallView === 'weekend' ? 'Weekend footfall typically 40-60% higher in F&B/retail areas' : 'Weekday pattern — office hours drive AM/lunch/PM peaks'}</p>
                    </div>

                    {intelData.retailMix.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-1">Trade-area retail mix</h3>
                        <p className="text-[10px] text-gray-500 mb-3">
                          {primarySegmentLabel(buildLocationBusinessType(brand))
                            ? `Your segment (${primarySegmentLabel(buildLocationBusinessType(brand))}) is ordered first; other categories follow by footprint.`
                            : 'POI-weighted category counts near this listing.'}
                        </p>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={intelData.retailMix} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                            <XAxis dataKey="category" tick={{ fontSize: 9 }} axisLine={false} />
                            <YAxis tick={{ fontSize: 9 }} axisLine={false} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Bar dataKey="nonBranded" stackId="a" name="Non-Branded">
                              {intelData.retailMix.map((row, i) => (
                                <Cell
                                  key={`nb-${i}`}
                                  fill={
                                    categoryMatchesBrandIndustry(row.category, buildLocationBusinessType(brand)) ? '#c62828' : '#e57373'
                                  }
                                />
                              ))}
                            </Bar>
                            <Bar dataKey="branded" stackId="a" name="Branded" radius={[2, 2, 0, 0]}>
                              {intelData.retailMix.map((row, i) => (
                                <Cell
                                  key={`b-${i}`}
                                  fill={
                                    categoryMatchesBrandIndustry(row.category, buildLocationBusinessType(brand)) ? '#2e7d32' : '#4caf93'
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {intelData.crowdPullers.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
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
                  <div className="px-3 sm:px-4 py-3 bg-[#F8F9FB] space-y-3">
                    <TabSynthesisCallout
                      title="For your brand — competition"
                      narrative={intelData.locationSynthesis?.competitionForBrand}
                      bullets={intelData.locationSynthesis?.competitionBullets}
                      loading={false}
                      synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                      analysisLabel="Finding category competitors..."
                      analysisLines={3}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    {intelData.competitors.length > 0 &&
                      (() => {
                        const within500 = intelData.competitors.filter((c) => c.distance <= 500).length
                        const within1km = intelData.competitors.filter((c) => c.distance > 500 && c.distance <= 1000).length
                        const beyond1km = intelData.competitors.filter((c) => c.distance > 1000).length
                        const branded = intelData.competitors.filter((c) => c.branded).length
                        const rated = intelData.competitors.filter((c) => c.rating != null && Number.isFinite(c.rating))
                        const avgRating =
                          rated.length > 0 ? rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length : 0
                        const total = intelData.competitors.length
                        return (
                          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 text-sm mb-3">
                              {brand?.industry || 'Category'} Competition Summary
                            </h3>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-red-50 rounded-xl p-2.5 text-center">
                                <p className="text-lg font-black text-red-600">{total}</p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wide">Total</p>
                              </div>
                              <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                                <p className="text-lg font-black text-orange-600">{branded}</p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wide">Chains</p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                                <p
                                  className={`text-lg font-black ${avgRating >= 4.0 ? 'text-green-600' : 'text-amber-600'}`}
                                >
                                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                                </p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wide">Avg Rating</p>
                              </div>
                            </div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Distance Distribution</p>
                            <div className="space-y-1.5">
                              {[
                                { label: 'Within 500m', count: within500, color: 'bg-red-500' },
                                { label: '500m – 1km', count: within1km, color: 'bg-amber-400' },
                                { label: 'Beyond 1km', count: beyond1km, color: 'bg-gray-300' },
                              ].map(({ label, count, color }) => (
                                <div key={label} className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
                                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${color} rounded-full flex items-center justify-end pr-1.5`}
                                      style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                                    >
                                      {count > 0 && <span className="text-[8px] text-white font-bold">{count}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    {/* Competitor map — show pins of all competitors around selected property */}
                    {selectedListingCoords && areUsablePinCoords(selectedListingCoords) && isLoaded && (
                      <div className="h-[220px] relative rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <GoogleMap
                          mapContainerClassName="w-full h-full"
                          center={selectedListingCoords}
                          zoom={14}
                          options={{ ...DEFAULT_MAP_OPTIONS, zoomControl: false }}
                        >
                          <Marker position={selectedListingCoords} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 16, fillColor: '#FF5200', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }} label={{ text: 'P', color: '#fff', fontWeight: 'bold', fontSize: '10px' }} />
                          {[...intelData.competitors, ...intelData.complementaryBrands].map((c, i) => {
                            if (!selectedListingCoords) return null
                            const row = c as { name: string; distance: number; lat?: number; lng?: number; category?: string }
                            if (
                              row.lat == null ||
                              row.lng == null ||
                              !Number.isFinite(row.lat) ||
                              !Number.isFinite(row.lng) ||
                              !areUsablePinCoords({ lat: row.lat, lng: row.lng })
                            ) {
                              return null
                            }
                            const isCompetitorRow = intelData.competitors.some((x) => x.name === row.name && x.distance === row.distance)
                            const pin = competitorPinStyle(row.category, isCompetitorRow)
                            return (
                              <Marker
                                key={`comp-map-${i}-${row.name}`}
                                position={{ lat: row.lat, lng: row.lng }}
                                icon={{
                                  path: google.maps.SymbolPath.CIRCLE,
                                  scale: 9,
                                  fillColor: pin.fillColor,
                                  fillOpacity: pin.fillOpacity,
                                  strokeColor: '#fff',
                                  strokeWeight: 1.5,
                                }}
                                title={row.name}
                              />
                            )
                          })}
                        </GoogleMap>
                        <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 max-w-[95%] text-[8px] text-gray-600 leading-tight">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-[#FF5200] inline-block shrink-0" /> Property</span>
                            <span className="opacity-90">Pins by type: QSR · restaurant · café · bakery · retail · other (lighter = outside your segment)</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">Your segment — competitors</h3>
                          {primarySegmentLabel(buildLocationBusinessType(brand)) && (
                            <p className="text-[10px] text-gray-500 mt-0.5">{primarySegmentLabel(buildLocationBusinessType(brand))}</p>
                          )}
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                      </div>
                      {intelData.competitors.length === 0 ? (
                        <div className="space-y-3">
                          {competitorFallbackLoading ? (
                            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs text-gray-600 font-medium">
                                  Analysing competitive landscape for {brand?.industry || 'your category'}...
                                </p>
                              </div>
                            </div>
                          ) : competitorFallback ? (
                            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-2">
                                Lokazen Intelligence — {brand?.industry || 'Category'} Competitive Landscape
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed">{competitorFallback}</p>
                              <p className="text-[9px] text-gray-400 mt-2">
                                AI-generated analysis · Google Places returned no pins for this segment in this area
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              No direct segment peers mapped — check complementary retail below or widen the trade area.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {[...intelData.competitors]
                            .sort((a, b) => a.distance - b.distance)
                            .slice(0, 8)
                            .map((c, i) => (
                              <div
                                key={`${c.name}-${c.distance}-${i}`}
                                className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-orange-200 transition-all"
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${
                                    c.branded ? 'bg-red-500' : 'bg-gray-400'
                                  }`}
                                >
                                  {c.category?.charAt(0)?.toUpperCase() || 'F'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
                                    {c.branded && (
                                      <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                                        Chain
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-500 capitalize">{c.category}</span>
                                    <span className="text-[10px] text-gray-400">·</span>
                                    <span className="text-[10px] text-gray-500">{(c.distance / 1000).toFixed(2)}km away</span>
                                  </div>
                                  {c.rating != null && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            c.rating >= 4.2 ? 'bg-green-500' : c.rating >= 3.8 ? 'bg-amber-400' : 'bg-red-400'
                                          }`}
                                          style={{ width: `${(c.rating / 5) * 100}%` }}
                                        />
                                      </div>
                                      <span
                                        className={`text-[9px] font-bold shrink-0 inline-flex items-center gap-0.5 ${
                                          c.rating >= 4.2 ? 'text-green-600' : c.rating >= 3.8 ? 'text-amber-600' : 'text-red-500'
                                        }`}
                                      >
                                        <StarIcon filled className="w-3 h-3 flex-shrink-0" />
                                        {c.rating.toFixed(1)}
                                      </span>
                                      {c.reviewCount != null && c.reviewCount > 0 && (
                                        <span className="text-[9px] text-gray-400">({c.reviewCount.toLocaleString('en-IN')})</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {intelData.complementaryBrands.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Other categories nearby</h3>
                              <p className="text-[10px] text-gray-500 font-normal leading-snug">Broader trade-area retail — context, not direct substitutes</p>
                            </div>
                            <span className="text-xs bg-green-100 text-green-600 rounded-full px-1.5 py-0.5 flex-shrink-0">Low Risk</span>
                          </div>
                          <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 flex-shrink-0">15 min Driving</span>
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
                  <div className="px-3 sm:px-4 py-3 bg-[#F8F9FB] space-y-3">
                    <TabSynthesisCallout
                      title="For your brand — risk"
                      narrative={intelData.locationSynthesis?.riskForBrand}
                      bullets={intelData.locationSynthesis?.riskBullets}
                      loading={false}
                      synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                      analysisLabel="Assessing category risks..."
                      analysisLines={2}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    {(() => {
                      const brandFilteredCount = intelData.competitors.length
                      const price = selectedMatch?.property?.price != null ? Number(selectedMatch.property.price) : 0
                      const ff = intelData.totalFootfall
                      const estRev = ff > 0 ? ff * 0.04 * 300 * 26 : 0
                      const rentToRev = price > 0 && estRev > 0 && Number.isFinite(estRev) ? price / estRev : 0.2
                      const levelConfig = {
                        low: { color: 'bg-green-500', bg: 'bg-green-50 border-green-100', text: 'text-green-700', label: 'Low' },
                        medium: { color: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', label: 'Medium' },
                        high: { color: 'bg-orange-500', bg: 'bg-orange-50 border-orange-100', text: 'text-orange-700', label: 'High' },
                        critical: { color: 'bg-red-600', bg: 'bg-red-50 border-red-100', text: 'text-red-700', label: 'Critical' },
                      } as const
                      type RK = keyof typeof levelConfig
                      const risks: Array<{ label: string; level: RK; value: string; icon: ReactNode }> = [
                        {
                          label: 'Competition Risk',
                          level:
                            brandFilteredCount === 0
                              ? 'low'
                              : brandFilteredCount <= 3
                                ? 'low'
                                : brandFilteredCount <= 6
                                  ? 'medium'
                                  : brandFilteredCount <= 10
                                    ? 'high'
                                    : 'critical',
                          value: brandFilteredCount === 0 ? 'First mover' : `${brandFilteredCount} direct competitors`,
                          icon: <IconCompetition className="w-5 h-5 text-gray-600" />,
                        },
                        {
                          label: 'Rent Risk',
                          level:
                            rentToRev < 0.12 ? 'low' : rentToRev < 0.2 ? 'medium' : rentToRev < 0.3 ? 'high' : 'critical',
                          value: selectedMatch?.property?.price
                            ? `₹${Number(selectedMatch.property.price).toLocaleString('en-IN')}/mo`
                            : '—',
                          icon: <IconWallet className="w-5 h-5 text-gray-600" />,
                        },
                        {
                          label: 'Market Saturation',
                          level:
                            intelData.numberOfStores <= 3
                              ? 'low'
                              : intelData.numberOfStores <= 6
                                ? 'medium'
                                : intelData.numberOfStores <= 10
                                  ? 'high'
                                  : 'critical',
                          value: `${intelData.numberOfStores} total F&B outlets`,
                          icon: <IconChartBars className="w-5 h-5 text-gray-600" />,
                        },
                        {
                          label: 'Footfall Risk',
                          level:
                            intelData.totalFootfall > 6000
                              ? 'low'
                              : intelData.totalFootfall > 3000
                                ? 'medium'
                                : intelData.totalFootfall > 1500
                                  ? 'high'
                                  : 'critical',
                          value: `~${intelData.totalFootfall.toLocaleString()} daily`,
                          icon: <IconFootTraffic className="w-5 h-5 text-gray-600" />,
                        },
                      ]
                      return (
                        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                          <h3 className="font-bold text-gray-900 text-sm mb-3">Risk Matrix</h3>
                          <div className="space-y-2">
                            {risks.map((r) => {
                              const cfg = levelConfig[r.level]
                              return (
                                <div key={r.label} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg}`}>
                                  <span className="shrink-0 flex items-center justify-center" aria-hidden>
                                    {r.icon}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800">{r.label}</p>
                                    <p className="text-[10px] text-gray-500">{r.value}</p>
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/80 ${cfg.text} bg-white/90 shrink-0`}
                                  >
                                    {cfg.label}
                                  </span>
                                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0">
                                    <div
                                      className={`h-full ${cfg.color} rounded-full`}
                                      style={{
                                        width:
                                          r.level === 'low' ? '25%' : r.level === 'medium' ? '50%' : r.level === 'high' ? '75%' : '100%',
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Cannibalisation Effects</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                      </div>
                      {intelData.cannibalisationRisk.length === 0 ? (
                        (() => {
                          const brandFilteredCompetitorCount = intelData.competitors.length
                          const brand = data?.brand
                          const brandedChains = [...intelData.competitors]
                            .filter((c) => c.branded)
                            .sort((a, b) => a.distance - b.distance)
                            .slice(0, 6)
                          const nonBrandedCompetitors = [...intelData.competitors]
                            .filter((c) => !c.branded)
                            .sort((a, b) => a.distance - b.distance)
                            .slice(0, 4)
                          const renderCompetitorRow = (c: IntelligenceData['competitors'][number], i: number) => (
                            <div
                              key={`${c.name}-${c.distance}-${i}`}
                              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="text-xs font-medium text-gray-800">{c.name}</p>
                                <p className="text-[10px] text-gray-500 capitalize">
                                  {c.category} · {(c.distance / 1000).toFixed(2)}km away
                                </p>
                              </div>
                                {c.rating != null && (
                                <div className="text-right">
                                  <p className="text-xs font-bold text-gray-700 inline-flex items-center justify-end gap-1">
                                    <StarIcon filled className="w-3.5 h-3.5 flex-shrink-0" />
                                    {c.rating.toFixed(1)}
                                  </p>
                                  {c.reviewCount != null && c.reviewCount > 0 && (
                                    <p className="text-[9px] text-gray-400">
                                      {c.reviewCount.toLocaleString()} reviews
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                          return (
                            <div className="space-y-3">
                              <div
                                className={`rounded-xl p-4 ${
                                  brandFilteredCompetitorCount === 0
                                    ? 'bg-green-50 border border-green-100'
                                    : brandFilteredCompetitorCount <= 3
                                      ? 'bg-amber-50 border border-amber-100'
                                      : 'bg-red-50 border border-red-100'
                                }`}
                              >
                                <p
                                  className={`text-sm font-semibold flex items-start gap-2 ${
                                    brandFilteredCompetitorCount === 0
                                      ? 'text-green-800'
                                      : brandFilteredCompetitorCount <= 3
                                        ? 'text-amber-800'
                                        : 'text-red-800'
                                  }`}
                                >
                                  {brandFilteredCompetitorCount === 0 ? (
                                    <>
                                      <IconCheckCircle className="w-4 h-4 flex-shrink-0 text-green-600 mt-0.5" aria-hidden />
                                      <span>{`No direct ${brand?.industry || 'category'} competitors mapped in this area`}</span>
                                    </>
                                  ) : (
                                    <span>{`${brandFilteredCompetitorCount} direct ${brand?.industry || 'category'} competitor${brandFilteredCompetitorCount > 1 ? 's' : ''} in the trade zone`}</span>
                                  )}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    brandFilteredCompetitorCount === 0
                                      ? 'text-green-600'
                                      : brandFilteredCompetitorCount <= 3
                                        ? 'text-amber-600'
                                        : 'text-red-600'
                                  }`}
                                >
                                  {brandFilteredCompetitorCount === 0
                                    ? 'First-mover advantage available. Demand exists but supply is uncontested.'
                                    : brandFilteredCompetitorCount <= 3
                                      ? 'Moderate competition. Differentiation on product quality or format will win share.'
                                      : 'High competition. Only a strong brand with clear differentiation should consider this location.'}
                                </p>
                              </div>

                              {brandedChains.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Branded chains in your category
                                  </p>
                                  <div className="space-y-1.5">{brandedChains.map((c, i) => renderCompetitorRow(c, i))}</div>
                                </div>
                              )}
                              {nonBrandedCompetitors.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Independent competitors
                                  </p>
                                  <div className="space-y-1.5">
                                    {nonBrandedCompetitors.map((c, i) => renderCompetitorRow(c, i))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()
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

                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Category Health in Area</h3>
                        <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">Trade zone</span>
                      </div>
                      {(() => {
                        const brandedCompetitors = intelData.competitors.filter((c) => c.branded).length
                        const withRating = intelData.competitors.filter(
                          (c) => c.rating != null && Number.isFinite(c.rating) && c.rating > 0,
                        )
                        const avgRating =
                          withRating.length > 0
                            ? withRating.reduce((s, c) => s + (c.rating ?? 0), 0) / withRating.length
                            : null
                        const totalReviews = intelData.competitors.reduce((s, c) => s + (c.reviewCount ?? 0), 0)

                        return (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-gray-900">{intelData.competitors.length}</p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">
                                  Direct competitors
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-gray-900">{brandedCompetitors}</p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">
                                  Branded chains
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p
                                  className={`text-lg font-black ${avgRating && avgRating >= 4.0 ? 'text-green-600' : 'text-amber-600'}`}
                                >
                                  {avgRating != null ? avgRating.toFixed(1) : '—'}
                                </p>
                                <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">Avg rating</p>
                              </div>
                            </div>

                            {totalReviews > 0 && (
                              <div
                                className={`rounded-xl p-3 text-xs ${totalReviews > 2000 ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}
                              >
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total category reviews in area</span>
                                  <span className="font-bold text-gray-800">{totalReviews.toLocaleString()}</span>
                                </div>
                                <p
                                  className={`text-[10px] mt-0.5 ${totalReviews > 2000 ? 'text-green-600' : 'text-gray-500'}`}
                                >
                                  {totalReviews > 5000
                                    ? 'Very high review volume — category demand is proven and active'
                                    : totalReviews > 2000
                                      ? 'Solid review volume — healthy category demand in this area'
                                      : totalReviews > 500
                                        ? 'Moderate demand signal — category is developing'
                                        : 'Low review volume — category may be early or underserved'}
                                </p>
                              </div>
                            )}

                            {intelData.complementaryBrands.slice(0, 3).length > 0 && (
                              <div>
                                <p className="text-[10px] text-gray-500 font-medium mb-1.5">
                                  Complementary brands nearby (crowd pullers)
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {intelData.complementaryBrands.slice(0, 5).map((b, i) => (
                                    <span
                                      key={`${b.name}-${i}`}
                                      className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 border border-blue-100"
                                    >
                                      {b.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* SWOT Analysis — LIR Section 07 style */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <h3 className="font-bold text-gray-900 text-sm mb-3">SWOT Analysis</h3>
                      {(() => {
                        const hasGoodFootfall = intelData.totalFootfall > 2000
                        const lowCompetition = intelData.numberOfStores < 5
                        const highAffluence = intelData.affluenceIndicator === 'High'
                        const metroNear = intelData.metroDistance != null && intelData.metroDistance < 1500
                        const highBudgetFit = (selectedMatch?.breakdown.budgetFit || 0) >= 70
                        const highLocationFit = (selectedMatch?.breakdown.locationFit || 0) >= 70

                        const strengths = [
                          hasGoodFootfall && `Strong footfall density (~${intelData.totalFootfall.toLocaleString()} daily)`,
                          lowCompetition && 'Low competitor density — category opportunity',
                          highAffluence && 'High-affluence catchment — strong spending power',
                          metroNear && `Metro access within ${((intelData.metroDistance || 0) / 1000).toFixed(1)}km`,
                          highLocationFit && 'Located in your preferred area',
                        ].filter(Boolean) as string[]

                        const weaknesses = [
                          !highBudgetFit && 'Rent above your stated budget range',
                          !lowCompetition && `${intelData.numberOfStores} active competitors in the area`,
                          !metroNear && 'No metro station nearby — auto/cab dependent',
                          intelData.catchment.length < 3 && 'Limited catchment radius data available',
                        ].filter(Boolean) as string[]

                        const opportunities = [
                          lowCompetition && 'First-mover advantage in underserved market',
                          `Delivery channel — ${intelData.catchment[0]?.name || 'local'} delivery zone`,
                          (intelData.crowdPullers.length > 0) && `${intelData.crowdPullers[0].name} nearby drives footfall overflow`,
                        ].filter(Boolean) as string[]

                        const threats = [
                          !lowCompetition && 'Competition density may increase further',
                          !highBudgetFit && 'High rent-to-revenue ratio risk',
                          intelData.cannibalisationRisk.length > 0 && 'Cannibalisation risk from same-brand outlets nearby',
                        ].filter(Boolean) as string[]

                        const sections = [
                          { title: 'Strengths', items: strengths.slice(0, 4), color: 'bg-green-50 border-green-100', titleColor: 'text-green-700', dot: 'bg-green-500' },
                          { title: 'Weaknesses', items: weaknesses.slice(0, 3), color: 'bg-red-50 border-red-100', titleColor: 'text-red-700', dot: 'bg-red-400' },
                          { title: 'Opportunities', items: opportunities.slice(0, 3), color: 'bg-blue-50 border-blue-100', titleColor: 'text-blue-700', dot: 'bg-blue-400' },
                          { title: 'Threats', items: threats.slice(0, 3), color: 'bg-amber-50 border-amber-100', titleColor: 'text-amber-700', dot: 'bg-amber-400' },
                        ]
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            {sections.map(({ title, items, color, titleColor, dot }) => (
                              <div key={title} className={`${color} border rounded-xl p-3`}>
                                <p className={`text-[11px] font-bold ${titleColor} uppercase tracking-wide mb-2`}>{title}</p>
                                {items.length === 0 ? (
                                  <p className="text-[10px] text-gray-400 italic">None identified</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {items.map((item, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${dot} mt-1 flex-shrink-0`} />
                                        <span className="text-[10px] text-gray-700 leading-tight">{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* ── TAB: SIMILAR MARKETS ── */}
                {rightPanelTab === 'similar' && (
                  <div className="px-3 sm:px-4 py-3 bg-[#F8F9FB] space-y-3">
                    <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Similar Markets</h3>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="text-xs px-2.5 py-1 bg-orange-50 text-[#FF5200] rounded-full border border-orange-200"
                          >
                            Nearby
                          </button>
                          <button type="button" className="text-xs px-2.5 py-1 text-gray-500 rounded-full">
                            Within City
                          </button>
                        </div>
                      </div>
                      <TabSynthesisCallout
                        title="For your brand — similar markets"
                        narrative={intelData.locationSynthesis?.similarMarketsForBrand}
                        bullets={intelData.locationSynthesis?.similarMarketsBullets}
                        loading={false}
                        synthesisPending={Boolean(intelData.locationSynthesisPending && !intelData.locationSynthesis)}
                        analysisLabel="Matching comparable markets..."
                        analysisLines={2}
                        synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                      />
                      {intelData.similarMarkets.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No similar market data available.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {intelData.similarMarkets.slice(0, 6).map((m) => {
                              const seed = m.key.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
                              const abs = Math.abs(seed)
                              const restaurants = 8 + (abs % 20)
                              const cafes = 4 + (abs % 12)
                              const retail = 12 + (abs % 25)
                              const salons = 3 + (abs % 8)
                              return (
                                <div key={m.key} className="border border-gray-100 rounded-xl p-3 hover:border-orange-200 hover:shadow-sm transition-all">
                                  <p className="font-semibold text-sm text-gray-900 capitalize mb-1">{m.key.replace(/-/g, ' ')}</p>
                                  <div className="flex gap-0.5 mb-1.5">
                                    {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} filled={i < Math.round(m.score / 20)} className="w-3 h-3" />)}
                                    <span className="text-[10px] text-gray-400 ml-1">{m.score}/100</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 mb-2">
                                    {[
                                      { label: 'Restaurants', val: restaurants },
                                      { label: 'Cafes', val: cafes },
                                      { label: 'Retail', val: retail },
                                      { label: 'Salons', val: salons },
                                    ].map(({ label, val }) => (
                                      <div key={label} className="bg-gray-50 rounded-lg px-1.5 py-1 text-center">
                                        <p className="text-[11px] font-bold text-gray-900">{val}</p>
                                        <p className="text-[8px] text-gray-400">{label}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    className="w-full text-[10px] text-center py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-[#FF5200] hover:border-orange-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                                    onClick={() => {
                                      if (mapRef) {
                                        mapRef.panTo({ lat: m.lat, lng: m.lng })
                                        mapRef.setZoom(15)
                                        setRightPanelTab('map')
                                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                          setMobileView('map')
                                        }
                                      }
                                    }}
                                  >
                                    View on Map
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                          {isLoaded && areUsablePinCoords(intelData.coords) ? (
                            <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-3 pt-3 pb-1">Area map</p>
                              <div className="h-[200px] w-full">
                                <GoogleMap
                                  mapContainerClassName="w-full h-full"
                                  center={(() => {
                                    const pts = [intelData.coords, ...intelData.similarMarkets.slice(0, 6)]
                                    return {
                                      lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
                                      lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
                                    }
                                  })()}
                                  zoom={11}
                                  options={{ ...DEFAULT_MAP_OPTIONS, zoomControl: true }}
                                >
                                  <Marker
                                    position={intelData.coords}
                                    icon={{
                                      path: google.maps.SymbolPath.CIRCLE,
                                      scale: 11,
                                      fillColor: '#E4002B',
                                      fillOpacity: 1,
                                      strokeColor: '#fff',
                                      strokeWeight: 2,
                                    }}
                                    title="Your listing"
                                  />
                                  {intelData.similarMarkets.slice(0, 6).map((m) => (
                                    <Marker
                                      key={`sim-map-${m.key}`}
                                      position={{ lat: m.lat, lng: m.lng }}
                                      icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 8,
                                        fillColor: '#FF5200',
                                        fillOpacity: 0.9,
                                        strokeColor: '#fff',
                                        strokeWeight: 2,
                                      }}
                                      title={m.key.replace(/-/g, ' ')}
                                    />
                                  ))}
                                </GoogleMap>
                              </div>
                              <p className="text-[9px] text-gray-400 px-3 py-2 bg-gray-50 border-t border-gray-100">
                                Red = this property · Orange = comparable Bengaluru trade areas (model centres).
                              </p>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Mobile bottom navigation — Google Maps style */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex">
          <button
            type="button"
            onClick={goToDashboardHome}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${
              mobileView === 'list' && dashboardView === 'home' && !selectedMatch ? 'text-[#FF5200]' : 'text-gray-500'
            }`}
          >
            <LayoutGrid className="w-5 h-5" aria-hidden />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileView('list')
              setDashboardView('map')
              setActiveTab('matched')
            }}
            className={`relative flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${
              mobileView === 'list' && dashboardView !== 'home' ? 'text-[#FF5200]' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Matches</span>
            {matches.length > 0 && mobileView !== 'list' && (
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FF5200] text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                {matches.length > 99 ? '99+' : matches.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileView('map')
              setDashboardView('map')
              setRightPanelTab('map')
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${
              mobileView === 'map' ? 'text-[#FF5200]' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span>Map</span>
          </button>

          {selectedMatch && (
            <button
              type="button"
              onClick={() => {
                setMobileView('intel')
                setRightPanelTab((t) => (t === 'map' ? 'overview' : t))
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors relative ${
                mobileView === 'intel' ? 'text-[#FF5200]' : 'text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Intel</span>
              {mobileView !== 'intel' && (
                <span className="absolute top-1 right-[22%] w-1.5 h-1.5 bg-[#FF5200] rounded-full" aria-hidden />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setVisitModal((v) => ({ ...v, open: true }))}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Visit</span>
          </button>
        </div>
      </nav>

      {/* Schedule Visit Modal */}
      {visitModal.open && selectedMatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] max-w-full mx-4">
            <h3 className="font-bold text-gray-900 text-base mb-1">Schedule a Visit</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-1">{selectedMatch.property.title} — {selectedMatch.property.city}</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Preferred Date</label>
                <input
                  type="date"
                  value={visitModal.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setVisitModal(v => ({ ...v, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Preferred Time</label>
                <select
                  value={visitModal.time}
                  onChange={(e) => setVisitModal(v => ({ ...v, time: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Select time slot</option>
                  {['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!visitModal.date || !visitModal.time) return
                  const msg = `Hi, I'd like to schedule a visit for ${selectedMatch.property.title} on ${visitModal.date} at ${visitModal.time}. Please confirm.`
                  window.open(`https://wa.me/919845791657?text=${encodeURIComponent(msg)}`, '_blank')
                  setVisitModal(v => ({ ...v, open: false }))
                }}
                disabled={!visitModal.date || !visitModal.time}
                className="flex-1 text-center text-xs font-semibold text-white bg-[#FF5200] rounded-xl py-2.5 hover:bg-orange-600 transition-colors disabled:opacity-40"
              >
                Confirm Visit
              </button>
              <button
                onClick={() => setVisitModal(v => ({ ...v, open: false }))}
                className="px-4 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
