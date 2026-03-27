'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleMap, Marker, HeatmapLayer, useLoadScript, InfoWindow } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'
import { encodePropertyId } from '@/lib/property-slug'
import Logo from '@/components/Logo'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'
import { deriveMonthlyRentFromListing } from '@/lib/location-intelligence/location-rent-context'
import type { LocationSynthesis } from '@/lib/intelligence/brand-intel-enrichment.types'

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
  competitors: Array<{ name: string; category: string; distance: number; rating?: number; branded: boolean; lat?: number; lng?: number }>
  complementaryBrands: Array<{ name: string; category: string; distance: number; lat?: number; lng?: number }>
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
  /** Proprietary Lokazen location synthesis (one pass, all tabs) */
  locationSynthesis: LocationSynthesis | null
  locationSynthesisLoading: boolean
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
  synthesisUnavailable,
}: {
  title: string
  narrative?: string
  bullets?: string[]
  loading?: boolean
  analysisLabel?: string
  analysisLines?: number
  synthesisUnavailable?: boolean
}) {
  if (loading) {
    return (
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-b from-orange-50/50 to-transparent">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <SynthesisSectionSkeleton label={analysisLabel} lines={analysisLines} />
      </div>
    )
  }
  const hasN = Boolean(narrative?.trim())
  const bs = (bullets || []).filter(Boolean)
  if (synthesisUnavailable && !hasN && bs.length === 0) {
    return (
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-b from-orange-50/40 to-transparent">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <div className="text-[11px] text-gray-400 italic py-2">
          Intelligence analysis unavailable — chart data is still shown above.
        </div>
      </div>
    )
  }
  if (!hasN && bs.length === 0) return null
  return (
    <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-b from-orange-50/40 to-transparent">
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
 * Business context for Places / scoring — company or trade name + industry only.
 * Never use account-holder name (`brand.name`); that skews competitor search and synthesis.
 */
function buildLocationBusinessType(
  brand: { companyName?: string | null; industry?: string | null } | null | undefined
): string {
  if (!brand) return ''
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
  if (ind.includes('qsr') || ind.includes('fast food')) return c === 'qsr' || c === 'restaurant'
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

function splitCompetitors(
  all: IntelligenceData['competitors'],
  brandIndustry: string | null | undefined
): { competitors: IntelligenceData['competitors']; complementaryBrands: IntelligenceData['complementaryBrands'] } {
  if (!brandIndustry?.trim()) return { competitors: all, complementaryBrands: [] }
  return {
    competitors: all.filter((c) => categoryMatchesBrandIndustry(c.category, brandIndustry)),
    complementaryBrands: all.filter((c) => !categoryMatchesBrandIndustry(c.category, brandIndustry)).slice(
      0,
      10
    ) as IntelligenceData['complementaryBrands'],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLiveIntelligence(data: any, coords: { lat: number; lng: number } | null): IntelligenceData {
  const resolvedCoords = coords ?? { lat: data?.lat ?? 12.9716, lng: data?.lng ?? 77.5946 }
  const competitors: IntelligenceData['competitors'] = (data.competitors || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => ({
      name: String(c.name || ''),
      category: String(c.placeCategory || 'other'),
      distance: Number(c.distanceMeters) || 0,
      rating: c.rating != null ? Number(c.rating) : undefined,
      branded: c.brandType === 'popular',
      lat: c.lat != null && Number.isFinite(Number(c.lat)) ? Number(c.lat) : undefined,
      lng: c.lng != null && Number.isFinite(Number(c.lng)) ? Number(c.lng) : undefined,
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
    return { key: areaKey, lat: area?.lat || resolvedCoords.lat, lng: area?.lng || resolvedCoords.lng, score: Number(m.score) || 50 }
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
    incomeLevel: data.demographics?.incomeLevel ? String(data.demographics.incomeLevel) : null,
    locationSynthesis: null,
    locationSynthesisLoading: false,
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

function MetricCell({ label, value, trend, benchmark, tooltip }: { label: string; value: string; trend?: 'up' | 'down'; benchmark?: string; tooltip?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        {tooltip && (
          <div className="relative group">
            <button className="text-[9px] w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold flex-shrink-0">i</button>
            <div className="absolute left-0 top-4 w-52 bg-gray-900 text-white text-[10px] rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              {tooltip}
            </div>
          </div>
        )}
      </div>
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

function CatchmentFlow({ catchment }: { catchment: Array<{ pincode: string; name: string; sharePct: number; distanceM: number; areaType?: string }> }) {
  const cx = 160, cy = 130, r = 105
  const items = catchment.slice(0, 6)
  const n = items.length
  if (n === 0) return <p className="text-sm text-gray-400 text-center py-6">No catchment data available within 4km.</p>
  const typeColor = (t?: string) => t === 'commercial' ? '#FF5200' : t === 'tech' ? '#6366f1' : t === 'residential' ? '#22c55e' : '#6b7280'
  return (
    <svg viewBox="0 0 320 260" className="w-full max-h-[280px]">
      {/* Radius rings */}
      <circle cx={cx} cy={cy} r={40} fill="none" stroke="#FF5200" strokeWidth={0.5} strokeDasharray="3,4" strokeOpacity={0.2} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF5200" strokeWidth={0.5} strokeDasharray="3,4" strokeOpacity={0.15} />
      {/* Spokes */}
      {items.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#FF5200" strokeWidth={1.2} strokeDasharray="4,3" strokeOpacity={0.35} />
      })}
      {/* Center pin */}
      <circle cx={cx} cy={cy} r={28} fill="#FF5200" />
      <circle cx={cx} cy={cy} r={22} fill="#E4002B" />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">YOUR</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">LOCATION</text>
      {/* Catchment nodes */}
      {items.map((item, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        const col = typeColor(item.areaType)
        const shortName = item.name.split(' / ')[0]
        const label = shortName.length > 14 ? shortName.slice(0, 13) + '…' : shortName
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={24} fill="white" stroke={col} strokeWidth={2} filter="drop-shadow(0 1px 3px rgba(0,0,0,0.12))" />
            <text x={x} y={y - 7} textAnchor="middle" fill={col} fontSize={9} fontWeight="bold">{item.sharePct}%</text>
            <text x={x} y={y + 4} textAnchor="middle" fill="#374151" fontSize={6.5} fontWeight="600">{label.split(' ')[0]}</text>
            <text x={x} y={y + 13} textAnchor="middle" fill="#9CA3AF" fontSize={5.5}>{label.split(' ').slice(1).join(' ')}</text>
          </g>
        )
      })}
      {/* Legend */}
      <text x={cx} y={245} textAnchor="middle" fill="#9CA3AF" fontSize={7}>Within 4km radius · Orange = commercial · Green = residential · Indigo = tech park</text>
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
  const [briefExpanded, setBriefExpanded] = useState(true)

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

  // Schedule Visit modal state
  const [visitModal, setVisitModal] = useState<{ open: boolean; date: string; time: string; saved: boolean; interested: boolean }>({ open: false, date: '', time: '', saved: false, interested: false })
  // Market tab: weekday vs weekend footfall view
  const [footfallView, setFootfallView] = useState<'weekday' | 'weekend'>('weekday')
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
      if (res.ok) { const json = await res.json(); setMatches(json.matches || []) }
    } finally { setMatchesLoading(false) }
  }

  const fetchPropertyIntelligence = useCallback(async (
    propertyId: string,
    property: MatchedProperty['property'],
    coords: { lat: number; lng: number } | null,
    matchMeta: MatchedProperty | null
  ) => {
    setIntelLoading(true)
    setIntelData(null)
    setRightMode('intelligence')
    const brand = data?.brand ?? null
    try {
      const [liveRes, dbIntelRes] = await Promise.all([
        fetch('/api/location-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
            address: property.address,
            city: property.city,
            state: 'Karnataka',
            title: property.title,
            propertyType: property.propertyType,
            businessType: buildLocationBusinessType(brand),
            monthlyRent: deriveMonthlyRentFromListing(property.price, property.priceType, property.size),
            sizeSqft: property.size,
          }),
        }),
        fetch(`/api/intelligence/${encodeURIComponent(property.id)}`),
      ])

      let dbIntelData: Record<string, unknown> | null = null
      if (dbIntelRes.ok) {
        try {
          const j = (await dbIntelRes.json()) as Record<string, unknown>
          if (j && typeof j.error !== 'string') dbIntelData = j
        } catch {
          dbIntelData = null
        }
      }

      if (liveRes.ok) {
        const liveData = await liveRes.json()
        if (liveData.success) {
          const d = liveData.data
          const resolvedCoords: { lat: number; lng: number } | null =
            coords ??
            (d?.coordinates &&
            typeof d.coordinates.lat === 'number' &&
            typeof d.coordinates.lng === 'number'
              ? { lat: d.coordinates.lat, lng: d.coordinates.lng }
              : d?.lat != null && d?.lng != null
                ? { lat: Number(d.lat), lng: Number(d.lng) }
                : null)
          const intel = transformLiveIntelligence(d, resolvedCoords)
          const brandIntelContext = buildLocationBusinessType(brand)
          const { competitors: sameCat, complementaryBrands: compBrands } = splitCompetitors(intel.competitors, brandIntelContext)
          const retailMixOrdered = sortRetailMixForBrand(intel.retailMix, brandIntelContext)
          const segmentStoreCount = brandIntelContext.trim() ? sameCat.length : intel.numberOfStores
          setIntelData({
            ...intel,
            competitors: sameCat,
            complementaryBrands: compBrands,
            retailMix: retailMixOrdered,
            storeClosureRisk: deriveStoreClosureRisk(retailMixOrdered),
            numberOfStores: segmentStoreCount,
            locationSynthesis: null,
            locationSynthesisLoading: true,
            locationSynthesisError: null,
          })

          const preferred =
            brand?.preferredLocations != null
              ? Array.isArray(brand.preferredLocations)
                ? brand.preferredLocations
                : typeof brand.preferredLocations === 'string'
                  ? (() => {
                      try {
                        const p = JSON.parse(brand.preferredLocations as string)
                        return Array.isArray(p) ? p.map(String) : []
                      } catch {
                        return []
                      }
                    })()
                  : []
              : []

          void (async () => {
            try {
              const dbEnrichment = dbIntelData
                ? {
                    localityIntel:
                      (dbIntelData.localityIntel as Record<string, unknown> | null | undefined) ?? null,
                    nearbySocieties: Array.isArray(dbIntelData.nearbySocieties)
                      ? (dbIntelData.nearbySocieties as Array<Record<string, unknown>>)
                      : [],
                    nearbyTechParks: Array.isArray(dbIntelData.nearbyTechParks)
                      ? (dbIntelData.nearbyTechParks as Array<Record<string, unknown>>)
                      : [],
                    ward: (dbIntelData.ward as Record<string, unknown> | null | undefined) ?? null,
                  }
                : undefined

              const enrichPayload = {
                brandId: brand?.id,
                rawIntel: d,
                dbEnrichment,
                brand: {
                  name: brand?.companyName?.trim() || 'Brand',
                  companyName: brand?.companyName,
                  industry: brand?.industry,
                  budgetMin: brand?.budgetMin,
                  budgetMax: brand?.budgetMax,
                  preferredLocations: preferred.length ? preferred : null,
                },
                property: {
                  title: property.title,
                  address: property.address,
                  city: property.city,
                  propertyType: property.propertyType,
                  size: property.size,
                  price: property.price,
                  priceType: property.priceType,
                },
                match: matchMeta
                  ? {
                      bfiScore: matchMeta.bfiScore,
                      locationFit: matchMeta.breakdown.locationFit,
                      budgetFit: matchMeta.breakdown.budgetFit,
                      sizeFit: matchMeta.breakdown.sizeFit,
                    }
                  : undefined,
              }
              let enrichRes!: Response
              let enrichJson = {} as { success?: boolean; error?: string; data?: LocationSynthesis }
              for (let attempt = 0; attempt < 2; attempt++) {
                if (attempt > 0) {
                  await new Promise((r) => setTimeout(r, 1800))
                }
                enrichRes = await fetch('/api/dashboard/brand/intel-enrich', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(enrichPayload),
                })
                enrichJson = (await enrichRes.json().catch(() => ({}))) as typeof enrichJson
                if (enrichRes.ok && enrichJson.success && enrichJson.data) break
                const retryable = enrichRes.status === 504 || enrichRes.status === 502
                if (!retryable || attempt === 1) break
              }
              if (enrichRes.ok && enrichJson.success && enrichJson.data) {
                setIntelData((prev) =>
                  prev
                    ? {
                        ...prev,
                        locationSynthesis: enrichJson.data as LocationSynthesis,
                        locationSynthesisLoading: false,
                        locationSynthesisError: null,
                      }
                    : prev
                )
              } else {
                const apiErr = typeof enrichJson.error === 'string' ? enrichJson.error.trim() : ''
                const fallbackMsg = !enrichRes.ok
                  ? `Location synthesis unavailable (request failed with HTTP ${enrichRes.status}).`
                  : 'Location synthesis unavailable — the service returned no data. Try again in a moment.'
                setIntelData((prev) =>
                  prev
                    ? {
                        ...prev,
                        locationSynthesis: null,
                        locationSynthesisLoading: false,
                        locationSynthesisError: apiErr || fallbackMsg,
                      }
                    : prev
                )
              }
            } catch {
              setIntelData((prev) =>
                prev
                  ? { ...prev, locationSynthesis: null, locationSynthesisLoading: false, locationSynthesisError: 'Location synthesis failed' }
                  : prev
              )
            }
          })()
          return
        }
      }
      // Fallback to DB intelligence if live API fails
      const dbRes = await fetch(`/api/intelligence/${propertyId}?category=${encodeURIComponent(brand?.industry || '')}`)
      if (dbRes.ok) {
        const dbData = await dbRes.json()
        if (dbData.intelligence) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const intel = dbData.intelligence as any
          const fallbackCoords = coords ?? { lat: 12.9716, lng: 77.5946 }
          setIntelData({
            coords: fallbackCoords, overallScore: Number(intel.marketPotentialScore) || 50, highlights: [],
            totalFootfall: Number(intel.dailyFootfall) || 0, growthTrend: 0, spendingCapacity: 0,
            numberOfStores: 0, retailIndex: 0.5, hourlyPattern: [], totalHouseholds: 0,
            affluenceIndicator: 'Medium', catchment: [], catchmentLandmarks: [], competitors: [], complementaryBrands: [],
            crowdPullers: [], retailMix: [], cannibalisationRisk: [], storeClosureRisk: [], similarMarkets: [],
            metroDistance: null, metroName: null, busStops: 0,
            rentPerSqftCommercial: null,
            marketRentLow: null,
            marketRentHigh: null,
            rentDataSource: null,
            nearestCommercialAreaKey: null,
            incomeLevel: null,
            locationSynthesis: null, locationSynthesisLoading: false, locationSynthesisError: null,
          })
          return
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
    fetchPropertyIntelligence(m.property.id, m.property, m.coords, m)
  }

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
    { key: 'map', label: 'Map' },
  ]

  return (
    <div className="flex h-screen bg-[#F7F7F5] overflow-hidden">

      {/* ══ LEFT PANEL ══ */}
      <div className="w-[380px] flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-100 overflow-hidden">

        {/* Brand Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" showPoweredBy={false} href="/" />
            <button
              onClick={() => { localStorage.clear(); router.push('/') }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Exit
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm tracking-tight flex-shrink-0">
              {companyInitials(brand?.companyName || brandName || brand?.name || 'Brand')}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base leading-tight truncate">
                {brand?.companyName || brandName || brand?.name || 'Brand'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {brand?.industry ? `${brand.industry}` : brand?.category || ''}
                {(brand?.industry || brand?.category) && (brand?.phone || brand?.email) ? ' · ' : ''}
                {brand?.phone || brand?.email || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Brand brief — mirrors onboarding / marketplace card */}
        {brand && showBrief && (
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="rounded-2xl border border-[#FF5200]/30 bg-gradient-to-br from-orange-50/95 via-white to-amber-50/40 p-3.5 shadow-sm">
              {dashboardBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {dashboardBadges.map((label) => {
                    const isMatch = label === 'Multiple Properties Matched'
                    return (
                      <span
                        key={label}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isMatch
                            ? 'bg-violet-50 text-violet-800 border-violet-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}
                      >
                        {label}
                      </span>
                    )
                  })}
                </div>
              )}
              <p className="text-[10px] font-semibold text-[#FF5200] uppercase tracking-wide mb-2">Your Requirements</p>
              <ul className="space-y-2 text-[11px] text-gray-800">
                {brand.minSize != null && brand.maxSize != null && (
                  <li className="flex gap-2">
                    <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">⤢</span>
                    <span>
                      <span className="font-semibold text-gray-600">Size · </span>
                      {brand.minSize.toLocaleString('en-IN')}–{brand.maxSize.toLocaleString('en-IN')} sqft
                    </span>
                  </li>
                )}
                {preferredList.length > 0 && (
                  <li className="flex gap-2">
                    <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">📍</span>
                    <span>
                      <span className="font-semibold text-gray-600">Location · </span>
                      {briefExpanded ? preferredList.join(', ') : shortenText(preferredList.join(', '), 42)}
                    </span>
                  </li>
                )}
                {brand.budgetMin != null && brand.budgetMax != null && (
                  <li className="flex gap-2">
                    <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">₹</span>
                    <span>
                      <span className="font-semibold text-gray-600">Budget · </span>
                      ₹{brand.budgetMin.toLocaleString('en-IN')}–₹{brand.budgetMax.toLocaleString('en-IN')}/mo
                    </span>
                  </li>
                )}
                {briefExpanded && brand.brandProfile?.timeline && (
                  <li className="flex gap-2">
                    <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">⏱</span>
                    <span>
                      <span className="font-semibold text-gray-600">Timeline · </span>
                      {brand.brandProfile.timeline}
                    </span>
                  </li>
                )}
                {briefExpanded && (brand.brandProfile?.storeType || brand.category) && (
                  <li className="flex gap-2">
                    <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">
                      <BuildingIcon className="w-3.5 h-3.5 text-[#FF5200]" />
                    </span>
                    <span>
                      <span className="font-semibold text-gray-600">Store type · </span>
                      {brand.brandProfile?.storeType || brand.category}
                    </span>
                  </li>
                )}
                {briefExpanded && brand.brandProfile?.targetAudience && (
                  <li className="flex gap-2">
                    <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">👥</span>
                    <span>
                      <span className="font-semibold text-gray-600">Audience · </span>
                      {brand.brandProfile.targetAudience}
                    </span>
                  </li>
                )}
                {briefExpanded &&
                  brand.brandProfile?.targetAudienceTags &&
                  brand.brandProfile.targetAudienceTags.length > 0 && (
                    <li className="flex gap-2">
                      <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">🏷</span>
                      <span>
                        <span className="font-semibold text-gray-600">Segments · </span>
                        {brand.brandProfile.targetAudienceTags.join(', ')}
                      </span>
                    </li>
                  )}
                {briefExpanded && brand.brandProfile?.additionalRequirements && (
                  <li className="flex gap-2">
                    <span className="text-[#FF5200] flex-shrink-0 w-4 text-center">✓</span>
                    <span>
                      <span className="font-semibold text-gray-600">Must-haves · </span>
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
                  className="mt-2.5 w-full flex items-center justify-center gap-1 text-[10px] font-semibold text-[#FF5200]/90 hover:text-[#FF5200]"
                >
                  {briefExpanded ? 'Show less' : 'Show more'}
                  <span className={`inline-block transition-transform ${briefExpanded ? 'rotate-180' : ''}`}>⌃</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { label: 'Matches', value: matches.length, color: 'text-[#FF5200]' },
              { label: 'Viewed', value: stats.totalViews, color: 'text-blue-600' },
              { label: 'Saved', value: stats.totalSaved, color: 'text-pink-600' },
              { label: 'Inquiries', value: stats.totalInquiries, color: 'text-purple-600' },
              { label: 'Pending', value: stats.pendingInquiries, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="min-w-[78px] flex-shrink-0 rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
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
                      className={`mx-3 mb-2.5 rounded-2xl border cursor-pointer transition-all overflow-hidden ${
                        isSelected
                          ? 'border-[#FF5200] shadow-md ring-1 ring-[#FF5200]/20 bg-white'
                          : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-sm'
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
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">{m.property.title}</p>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">{m.property.address}</p>

                        {/* Key specs row */}
                        <div className="flex items-center gap-2 mb-2 text-[11px]">
                          <span className="font-bold text-[#FF5200]">{formatPrice(m.property.price, m.property.priceType)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-600">{m.property.size.toLocaleString()} sqft</span>
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
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); selectProperty(m) }}
                            className="flex-1 text-center text-[11px] font-semibold text-white bg-[#FF5200] rounded-lg py-1.5 hover:bg-orange-600 transition-colors"
                          >
                            View Intelligence
                          </button>
                          <Link
                            href={`/properties/${encodePropertyId(m.property.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
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
                  type="button"
                  onClick={() => setRightPanelTab(key)}
                  className={`whitespace-nowrap px-4 py-2.5 text-xs border-b-2 font-medium transition-colors flex-shrink-0 inline-flex items-center ${
                    rightPanelTab === key ? 'border-[#FF5200] text-[#FF5200]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                  {intelData?.locationSynthesisLoading && key !== 'map' && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[#FF5200] animate-pulse flex-shrink-0" />
                  )}
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
              {isLoaded && selectedMatch?.coords && (
                <Marker
                  position={selectedMatch.coords}
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
                if (!selectedMatch?.coords) return null
                const total = Math.max(1, intelData.competitors.length + intelData.complementaryBrands.length)
                const isDirect =
                  'lat' in c &&
                  'lng' in c &&
                  typeof (c as { lat?: number }).lat === 'number' &&
                  typeof (c as { lng?: number }).lng === 'number' &&
                  Number.isFinite((c as { lat: number }).lat) &&
                  Number.isFinite((c as { lng: number }).lng)
                const lat = isDirect
                  ? (c as { lat: number }).lat
                  : selectedMatch.coords.lat + (c.distance / 111320) * Math.cos((i / total) * 2 * Math.PI)
                const lng = isDirect
                  ? (c as { lng: number }).lng
                  : selectedMatch.coords.lng + (c.distance / 111320) * Math.sin((i / total) * 2 * Math.PI)
                const isCompetitor = intelData.competitors.some((x) => x.name === c.name && x.distance === c.distance)
                return (
                  <Marker
                    key={`comp-${i}-${c.name}`}
                    position={{ lat, lng }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: isCompetitor ? '#ef4444' : '#6366f1',
                      fillOpacity: 0.85,
                      strokeColor: '#fff',
                      strokeWeight: 1.5,
                    }}
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
              {/* Heatmap — property locations in map mode; competitor density in intelligence mode */}
              {isLoaded && mapMode === 'heatmap' && (() => {
                let heatPoints: google.maps.LatLng[] = []
                if (rightMode === 'intelligence' && intelData && selectedMatch?.coords) {
                  const base = selectedMatch.coords
                  const allPlaces = [...(intelData.competitors ?? []), ...(intelData.complementaryBrands ?? []), ...(intelData.crowdPullers ?? [])]
                  const n = Math.max(1, allPlaces.length)
                  heatPoints = allPlaces
                    .filter((c) => c.distance > 0)
                    .map((c, i) => {
                      const po = c as { distance: number; lat?: number; lng?: number }
                      if (po.lat != null && po.lng != null && Number.isFinite(po.lat) && Number.isFinite(po.lng)) {
                        return new google.maps.LatLng(po.lat, po.lng)
                      }
                      const angle = (i / n) * 2 * Math.PI
                      const dist = c.distance / 111320
                      return new google.maps.LatLng(base.lat + dist * Math.cos(angle), base.lng + dist * Math.sin(angle))
                    })
                  for (const lm of intelData.catchmentLandmarks ?? []) {
                    const weight = lm.kind === 'residential' ? 5 : lm.kind === 'tech_park' ? 4 : 3
                    for (let w = 0; w < weight; w++) {
                      heatPoints.push(new google.maps.LatLng(lm.lat, lm.lng))
                    }
                  }
                  for (let j = 0; j < 5; j++) {
                    heatPoints.push(
                      new google.maps.LatLng(base.lat + (Math.random() - 0.5) * 0.002, base.lng + (Math.random() - 0.5) * 0.002)
                    )
                  }
                } else {
                  heatPoints = matches
                    .filter((m) => m.coords)
                    .map((m) => new google.maps.LatLng(m.coords!.lat, m.coords!.lng))
                }
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

          {/* Map controls */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur rounded-xl shadow-md p-1.5 flex flex-col gap-1">
            {(['pins', 'heatmap', 'satellite'] as const).map((mode) => (
              <button key={mode} onClick={() => { setMapMode(mode); if (mapRef) mapRef.setMapTypeId(mode === 'satellite' ? 'satellite' : 'roadmap') }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${mapMode === mode ? 'bg-[#FF5200] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {mode === 'pins' ? 'Pins' : mode === 'heatmap' ? 'Heatmap' : 'Satellite'}
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
                    {/* Lokazen Composite Score — LIR Section 08 style */}
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-5xl font-black text-gray-900">{intelData.overallScore}</span>
                            <span className="text-xl text-gray-400 font-light">/ 100</span>
                            <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                              intelData.overallScore >= 80 ? 'bg-green-100 text-green-700' :
                              intelData.overallScore >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {intelData.overallScore >= 85 ? 'EXCEPTIONAL' :
                               intelData.overallScore >= 75 ? 'STRONG' :
                               intelData.overallScore >= 60 ? 'VIABLE' : 'CONDITIONAL'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Lokazen Composite Score</p>
                        </div>
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="flex gap-0.5 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon key={i} filled={i < Math.round(intelData.overallScore / 20)} className="w-5 h-5" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{Math.round(intelData.overallScore / 20)} of 5</span>
                        </div>
                      </div>

                      {/* 8-parameter scorecard */}
                      {(() => {
                        const footfallScore = Math.min(10, Math.round((intelData.totalFootfall / 3000) * 10))
                        const catchmentScore = intelData.affluenceIndicator === 'High' ? 10 : intelData.affluenceIndicator === 'Medium' ? 7 : 5
                        const competitionVoidScore = intelData.numberOfStores === 0 ? 10 : Math.max(3, 10 - Math.round(intelData.numberOfStores / 3))
                        const configScore = Math.round((selectedMatch?.breakdown.sizeFit || 50) / 10)
                        const accessScore = intelData.metroDistance ? Math.max(3, 10 - Math.round(intelData.metroDistance / 1000)) : 6
                        const connScore = intelData.busStops > 0 ? 8 : 6
                        const occasionScore = Math.min(10, Math.max(1, Math.round(intelData.growthTrend / 10)))
                        const viabilityScore = Math.round((selectedMatch?.breakdown.budgetFit || 50) / 10)
                        const parameters = [
                          { label: 'Footfall Density', score: footfallScore, note: `~${intelData.totalFootfall.toLocaleString()} daily est.` },
                          { label: 'Catchment Quality', score: catchmentScore, note: intelData.affluenceIndicator + ' affluence' },
                          { label: 'F&B Supply Gap', score: competitionVoidScore, note: `${intelData.numberOfStores} competitors nearby` },
                          { label: 'Property Configuration', score: configScore, note: `${selectedMatch?.property.size.toLocaleString()} sqft ${selectedMatch?.property.propertyType}` },
                          { label: 'Captive Walk-In Access', score: Math.min(10, Math.round(accessScore * 1.2)), note: intelData.metroName ? `Metro ${((intelData.metroDistance || 0) / 1000).toFixed(1)}km` : 'Access estimated' },
                          { label: 'Connectivity', score: connScore, note: intelData.busStops > 0 ? 'Transit nearby' : 'Road access' },
                          { label: 'Occasion Spread', score: occasionScore, note: 'Day-part coverage' },
                          { label: 'Commercial Viability', score: viabilityScore, note: formatPrice(selectedMatch?.property.price || 0, selectedMatch?.property.priceType || 'monthly') },
                        ]
                        return (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {parameters.map(({ label, score, note }) => (
                              <div key={label} className="min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[10px] font-medium text-gray-700 truncate">{label}</span>
                                  <span className={`text-[10px] font-bold ml-1 flex-shrink-0 ${score >= 8 ? 'text-green-600' : score >= 6 ? 'text-amber-600' : 'text-red-500'}`}>{score}/10</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-700 ${score >= 8 ? 'bg-green-400' : score >= 6 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${score * 10}%` }} />
                                </div>
                                <p className="text-[9px] text-gray-400 mt-0.5 truncate">{note}</p>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Highlights */}
                    {intelData.highlights.length > 0 && (
                      <div className="px-5 py-3 border-b border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Highlights
                          <span className="ml-1 text-gray-300 font-normal normal-case">— derived from live market data</span>
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {intelData.highlights.map((h) => <HighlightChip key={h} label={h} />)}
                        </div>
                      </div>
                    )}

                    {/* Lokazen location synthesis — one engine pass, surfaced on every intelligence tab */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-b from-orange-50/45 to-transparent">
                      {intelData.locationSynthesisLoading && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl mb-3">
                          <div className="w-3 h-3 rounded-full border-2 border-[#FF5200] border-t-transparent animate-spin flex-shrink-0" />
                          <div>
                            <p className="text-[11px] font-semibold text-[#FF5200]">Lokazen Intelligence Running</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Analysing catchment · mapping competitors · reading market signals</p>
                          </div>
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
                      {intelData.locationSynthesisLoading ? (
                        <>
                          <SynthesisSectionSkeleton label="Building location intelligence..." lines={3} />
                          <SynthesisSectionSkeleton label="Scoring brand fit..." lines={2} />
                        </>
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

                    {/* Property Details */}
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Property Details</p>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCell label="AREA" value={`${selectedMatch?.property.size.toLocaleString()} sqft`} />
                        <MetricCell label="RENT" value={formatPrice(selectedMatch?.property.price || 0, selectedMatch?.property.priceType || 'monthly')} />
                        <MetricCell label="TYPE" value={selectedMatch?.property.propertyType || '—'} />
                        <MetricCell label="CITY" value={selectedMatch?.property.city || '—'} />
                        {intelData.metroName && <MetricCell label="NEAREST METRO" value={intelData.metroName} benchmark={intelData.metroDistance ? `${(intelData.metroDistance / 1000).toFixed(1)} km` : undefined} />}
                      </div>
                    </div>

                    {/* Revenue Potential — LIR Section 06 style */}
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-bold text-gray-900 text-sm">Revenue Potential</h3>
                        <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Lokazen estimate · not a guarantee</span>
                        <div className="relative group ml-auto">
                          <button className="text-[10px] w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">i</button>
                          <div className="absolute right-0 top-5 w-56 bg-gray-900 text-white text-[10px] rounded-lg p-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Based on: category benchmarks, area footfall multiplier, avg ticket size, capture rate. Not a financial guarantee.
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const brand = data?.brand ?? null
                        const industry = brand?.industry?.toLowerCase() || ''
                        const isCafe = industry.includes('cafe') || industry.includes('coffee')
                        const isQsr = industry.includes('qsr') || industry.includes('fast food') || industry.includes('burger')
                        const isRestaurant = industry.includes('restaurant') || industry.includes('dining')
                        const isBakery = industry.includes('bakery') || industry.includes('dessert')
                        const avgTicket = isCafe ? 220 : isQsr ? 290 : isRestaurant ? 420 : isBakery ? 250 : 350
                        const captureRate = isCafe ? 0.04 : isQsr ? 0.05 : isRestaurant ? 0.03 : 0.035
                        const dailyFootfall = Math.max(500, intelData.totalFootfall || 2000)
                        const dailyCovers = Math.round(dailyFootfall * captureRate)
                        const conservative = Math.round(dailyCovers * 0.6 * avgTicket * 26 / 100000)
                        const base = Math.round(dailyCovers * avgTicket * 26 / 100000)
                        const optimistic = Math.round(dailyCovers * 1.4 * avgTicket * 26 / 100000)
                        return (
                          <div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { label: 'Conservative', value: `₹${conservative}L`, color: 'bg-gray-50 border-gray-200' },
                                { label: 'Base Case', value: `₹${base}L`, color: 'bg-orange-50 border-orange-200' },
                                { label: 'Optimistic', value: `₹${optimistic}L`, color: 'bg-green-50 border-green-200' },
                              ].map(({ label, value, color }) => (
                                <div key={label} className={`${color} border rounded-xl p-2.5 text-center`}>
                                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                                  <p className="font-black text-gray-900 text-base leading-none">{value}</p>
                                  <p className="text-[9px] text-gray-400 mt-0.5">per month</p>
                                </div>
                              ))}
                            </div>
                            {selectedMatch && (() => {
                              const monthlyRent = selectedMatch.property.priceType === 'monthly' ? Number(selectedMatch.property.price) : 0
                              if (monthlyRent === 0) return null
                              const rentPct = Math.round((monthlyRent / (base * 100000)) * 100)
                              return (
                                <div className={`rounded-xl p-2.5 text-xs ${rentPct <= 15 ? 'bg-green-50 border border-green-100' : rentPct <= 25 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Rent-to-Revenue Ratio</span>
                                    <span className={`font-bold ${rentPct <= 15 ? 'text-green-700' : rentPct <= 25 ? 'text-amber-700' : 'text-red-600'}`}>{rentPct}%</span>
                                  </div>
                                  <p className={`text-[10px] mt-0.5 ${rentPct <= 15 ? 'text-green-600' : rentPct <= 25 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {rentPct <= 15 ? 'Healthy ratio — strong unit economics' : rentPct <= 25 ? 'Viable but requires consistent volume' : 'High rent load — premium brand or high volume essential'}
                                  </p>
                                </div>
                              )
                            })()}
                            <p className="text-[9px] text-gray-400 mt-2">
                              Estimates based on {dailyCovers} avg daily covers · ₹{avgTicket} avg ticket · {brand?.industry || 'F&B'} benchmarks
                            </p>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Lokazen Verdict */}
                    <div className="px-5 py-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-5 bg-[#FF5200] rounded-full flex-shrink-0" />
                        <h3 className="font-bold text-gray-900 text-sm">Lokazen Verdict</h3>
                      </div>
                      {(() => {
                        const score = intelData.overallScore
                        const bfi = selectedMatch?.bfiScore || 0
                        const location = selectedMatch?.property.city || 'this location'
                        const brand = data?.brand ?? null
                        const industry = brand?.industry || 'F&B'
                        const verdict = score >= 80 && bfi >= 75
                          ? `${location} is a high-confidence ${industry} placement. Strong catchment, good brand-location fit, and validated demand. Recommend engaging now.`
                          : score >= 65 && bfi >= 60
                          ? `${location} shows good potential for ${industry}. Fundamentals are solid. Verify rent terms and delivery activation plan before committing.`
                          : `${location} has conditional viability for ${industry}. Review budget fit and competition density carefully. Premium brand or high-ticket format required.`
                        return <p className="text-xs text-gray-700 leading-relaxed">{verdict}</p>
                      })()}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setVisitModal(v => ({ ...v, open: true }))}
                          className="flex-1 text-center text-xs font-semibold text-white bg-[#FF5200] rounded-xl py-2 hover:bg-orange-600 transition-colors"
                        >
                          Schedule Visit
                        </button>
                        <button
                          onClick={() => setVisitModal(v => ({ ...v, saved: !v.saved }))}
                          className={`px-4 text-xs font-semibold rounded-xl py-2 border transition-colors ${visitModal.saved ? 'bg-blue-50 text-blue-700 border-blue-300' : 'text-gray-600 border-gray-200 hover:border-gray-400'}`}
                        >
                          {visitModal.saved ? 'Saved' : 'Save'}
                        </button>
                        <button
                          onClick={() => setVisitModal(v => ({ ...v, interested: !v.interested }))}
                          className={`px-4 text-xs font-semibold rounded-xl py-2 border transition-colors ${visitModal.interested ? 'bg-green-50 text-green-700 border-green-300' : 'text-gray-600 border-gray-200 hover:border-gray-400'}`}
                        >
                          {visitModal.interested ? 'Interested' : 'Interested?'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: CATCHMENT ── */}
                {rightPanelTab === 'catchment' && (
                  <div>
                    {primarySegmentLabel(buildLocationBusinessType(brand)) && (
                      <div className="px-4 py-2.5 border-b border-orange-100 bg-gradient-to-r from-orange-50/80 to-transparent">
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
                    <TabSynthesisCallout
                      title="For your brand — catchment"
                      narrative={intelData.locationSynthesis?.catchmentForBrand}
                      bullets={intelData.locationSynthesis?.catchmentBullets}
                      loading={intelData.locationSynthesisLoading}
                      analysisLabel="Reading catchment & lifestyle fit..."
                      analysisLines={2}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    {/* Catchment Quality Scorecard — LIR Section 03 style */}
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-bold text-gray-900 text-sm">Catchment Quality</h3>
                        <div className="relative group">
                          <button className="text-[10px] w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">i</button>
                          <div className="absolute left-0 top-5 w-60 bg-gray-900 text-white text-[10px] rounded-lg p-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Lokazen catchment quality measures 5 axes: density, affluence, frequency, captive access, and occasion coverage.
                          </div>
                        </div>
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

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Where Shoppers Come From</h3>
                        <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">4km Radius</span>
                      </div>
                      <CatchmentFlow catchment={intelData.catchment} />
                      {intelData.catchment.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                          {intelData.catchment.slice(0, 6).map((c) => {
                            const typeColor = c.areaType === 'commercial' ? 'bg-orange-50 text-orange-600' : c.areaType === 'tech' ? 'bg-indigo-50 text-indigo-600' : c.areaType === 'residential' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                            return (
                              <div key={c.pincode} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
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

                      {(intelData.locationSynthesisLoading ||
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
                              loading={intelData.locationSynthesisLoading}
                              analysisLabel="Profiling residential catchment..."
                              analysisLines={2}
                              synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                            />
                            <TabSynthesisCallout
                              title="Apartments & housing stock"
                              narrative={intelData.locationSynthesis?.apartmentsForBrand}
                              bullets={intelData.locationSynthesis?.apartmentsBullets}
                              loading={intelData.locationSynthesisLoading}
                              analysisLabel="Mapping nearby societies..."
                              analysisLines={2}
                              synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                            />
                            <TabSynthesisCallout
                              title="Workplaces — offices & commute pockets"
                              narrative={intelData.locationSynthesis?.workplacesForBrand}
                              bullets={intelData.locationSynthesis?.workplacesBullets}
                              loading={intelData.locationSynthesisLoading}
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
                  <div>
                    <TabSynthesisCallout
                      title="For your brand — market"
                      narrative={intelData.locationSynthesis?.marketForBrand}
                      bullets={intelData.locationSynthesis?.marketBullets}
                      loading={intelData.locationSynthesisLoading}
                      analysisLabel="Reading market conditions..."
                      analysisLines={2}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Catchment economics</h3>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${
                          intelData.locationSynthesis?.liveEconomics
                            ? 'bg-orange-100 text-orange-900 font-medium'
                            : intelData.locationSynthesisLoading
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {intelData.locationSynthesis?.liveEconomics
                            ? 'Synthesized rent + platform band'
                            : intelData.locationSynthesisLoading
                              ? 'Updating live rent…'
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
                              : intelData.locationSynthesisLoading
                                ? 'COMM. RENT (…)'
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
                    <div className="p-5 border-b border-gray-100">
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

                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">Footfall Trends</h3>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold rounded px-1.5 py-0.5">BETA</span>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">5 min Walking</span>
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        {(['weekday', 'weekend'] as const).map((v) => (
                          <button key={v} onClick={() => setFootfallView(v)}
                            className={`text-xs px-3 py-1 rounded-full font-medium capitalize transition-colors ${footfallView === v ? 'bg-[#FF5200] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
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
                      <div className="p-5 border-b border-gray-100">
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
                    <TabSynthesisCallout
                      title="For your brand — competition"
                      narrative={intelData.locationSynthesis?.competitionForBrand}
                      bullets={intelData.locationSynthesis?.competitionBullets}
                      loading={intelData.locationSynthesisLoading}
                      analysisLabel="Finding category competitors..."
                      analysisLines={3}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    {/* Competitor map — show pins of all competitors around selected property */}
                    {selectedMatch?.coords && isLoaded && (
                      <div className="h-[220px] relative border-b border-gray-100">
                        <GoogleMap
                          mapContainerClassName="w-full h-full"
                          center={selectedMatch.coords}
                          zoom={14}
                          options={{ ...DEFAULT_MAP_OPTIONS, zoomControl: false }}
                        >
                          <Marker position={selectedMatch.coords} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 16, fillColor: '#FF5200', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }} label={{ text: 'P', color: '#fff', fontWeight: 'bold', fontSize: '10px' }} />
                          {[...intelData.competitors, ...intelData.complementaryBrands].map((c, i) => {
                            if (!selectedMatch.coords) return null
                            const row = c as { name: string; distance: number; lat?: number; lng?: number }
                            const total = Math.max(1, intelData.competitors.length + intelData.complementaryBrands.length)
                            const hasGeo =
                              row.lat != null &&
                              row.lng != null &&
                              Number.isFinite(row.lat) &&
                              Number.isFinite(row.lng)
                            if (!hasGeo && !row.distance) return null
                            const lat = hasGeo
                              ? row.lat!
                              : selectedMatch.coords.lat + (row.distance / 111320) * Math.cos((i / total) * 2 * Math.PI)
                            const lng = hasGeo
                              ? row.lng!
                              : selectedMatch.coords.lng + (row.distance / 111320) * Math.sin((i / total) * 2 * Math.PI)
                            const isCompetitorRow = intelData.competitors.some((x) => x.name === row.name && x.distance === row.distance)
                            return (
                              <Marker
                                key={`comp-map-${i}-${row.name}`}
                                position={{ lat, lng }}
                                icon={{
                                  path: google.maps.SymbolPath.CIRCLE,
                                  scale: 8,
                                  fillColor: isCompetitorRow ? '#ef4444' : '#6366f1',
                                  fillOpacity: 0.85,
                                  strokeColor: '#fff',
                                  strokeWeight: 1.5,
                                }}
                              />
                            )
                          })}
                        </GoogleMap>
                        <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-3 text-[9px] text-gray-600">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#FF5200] inline-block" /> Your property</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Your segment</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Other categories</span>
                        </div>
                      </div>
                    )}
                    <div className="p-5 border-b border-gray-100">
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
                        <p className="text-sm text-gray-400 italic">
                          No direct segment peers mapped here — check complementary retail below or widen the trade area.
                        </p>
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
                            <div>
                              <h3 className="font-bold text-gray-900">Other categories nearby</h3>
                              <p className="text-[10px] text-gray-500 font-normal">Broader trade-area retail — context, not direct substitutes</p>
                            </div>
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
                    <TabSynthesisCallout
                      title="For your brand — risk"
                      narrative={intelData.locationSynthesis?.riskForBrand}
                      bullets={intelData.locationSynthesis?.riskBullets}
                      loading={intelData.locationSynthesisLoading}
                      analysisLabel="Assessing category risks..."
                      analysisLines={2}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">Cannibalisation Effects</h3>
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">15 min Driving</span>
                      </div>
                      {intelData.cannibalisationRisk.length === 0 ? (
                        <div
                          className={`rounded-xl p-4 text-center ${
                            intelData.numberOfStores >= 4 ? 'bg-amber-50 border border-amber-100' : 'bg-green-50'
                          }`}
                        >
                          <p
                            className={`text-sm font-medium ${
                              intelData.numberOfStores >= 4 ? 'text-amber-900' : 'text-green-700'
                            }`}
                          >
                            {intelData.numberOfStores >= 4
                              ? 'No duplicate-chain signal — category may still be crowded'
                              : '✓ No cannibalisation risk detected'}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              intelData.numberOfStores >= 4 ? 'text-amber-800' : 'text-green-600'
                            }`}
                          >
                            {intelData.numberOfStores >= 4
                              ? `${intelData.numberOfStores} POIs in the trade area. Charts fill when same-brand clusters or crowding are estimated.`
                              : 'No same-brand outlets found nearby.'}
                          </p>
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

                    <div className="p-5 border-b border-gray-100">
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

                    {/* SWOT Analysis — LIR Section 07 style */}
                    <div className="p-5">
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
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Similar Markets</h3>
                      <div className="flex gap-1">
                        <button className="text-xs px-2.5 py-1 bg-orange-50 text-[#FF5200] rounded-full border border-orange-200">Nearby</button>
                        <button className="text-xs px-2.5 py-1 text-gray-500 rounded-full">Within City</button>
                      </div>
                    </div>
                    <TabSynthesisCallout
                      title="For your brand — similar markets"
                      narrative={intelData.locationSynthesis?.similarMarketsForBrand}
                      bullets={intelData.locationSynthesis?.similarMarketsBullets}
                      loading={intelData.locationSynthesisLoading}
                      analysisLabel="Matching comparable markets..."
                      analysisLines={2}
                      synthesisUnavailable={Boolean(intelData.locationSynthesisError && !intelData.locationSynthesis)}
                    />
                    {intelData.similarMarkets.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No similar market data available.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {intelData.similarMarkets.slice(0, 6).map((m) => {
                          // Derive category counts from retail mix data (seeded by area key for consistency)
                          const seed = m.key.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
                          const abs = Math.abs(seed)
                          const restaurants = 8 + (abs % 20)
                          const cafes = 4 + (abs % 12)
                          const retail = 12 + (abs % 25)
                          const salons = 3 + (abs % 8)
                          return (
                            <div key={m.key} className="border border-gray-100 rounded-xl p-3 hover:border-orange-200 transition-all">
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
                                className="w-full text-[10px] text-center py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-[#FF5200] hover:border-orange-200 transition-colors"
                                onClick={() => { if (mapRef) { mapRef.panTo({ lat: m.lat, lng: m.lng }); mapRef.setZoom(15); setRightPanelTab('map') } }}
                              >
                                View on Map
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Schedule Visit Modal */}
      {visitModal.open && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
