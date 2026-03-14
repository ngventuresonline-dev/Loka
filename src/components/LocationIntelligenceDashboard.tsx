'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { BarChart3, DollarSign, Store, Users, Train, ShieldAlert } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  GoogleMap, Marker, Circle, HeatmapLayer, useLoadScript, InfoWindow,
} from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'

// ─── types ──────────────────────────────────────────────────────────────────

interface IntelligenceData {
  overallScore: number
  footfallScore: number
  revenueScore: number
  competitionScore: number
  accessScore: number
  demographicScore: number
  riskScore: number
  dailyFootfall: number
  peakHours: string
  weekendBoost: number
  monthlyRevenueLow: number
  monthlyRevenueHigh: number
  breakEvenMonths: number
  competitors: Array<{ name: string; distance: number; rating?: number | null; priceLevel?: number | null }>
  competitorCount: number
  population: number
  medianIncome: number
  age25_44Percent: number
  workingPopPercent: number
  metroDistance: number | null
  metroName: string | null
  busStops: number
  mainRoadDistance: number
  infrastructureBoost: number
  dataQuality: number
}

interface CompetitorRow {
  id: string
  name: string
  category: string
  distance: number
  rating: number | null
  reviewCount: number | null
  priceLevel: number | null
  latitude?: number
  longitude?: number
}

interface WardData {
  wardName: string
  locality: string
  medianIncome: number
  age25_34: number
  age35_44: number
  workingPopulation: number
  diningOutPerWeek: number
  populationDensity?: number
  population2026?: number
  incomeAbove15L?: number
  itProfessionals?: number
  populationGrowth?: number
  latitude?: number
  longitude?: number
  // Real-estate & commercial (populated after db:push + seed)
  avgApptSqft?: number | null
  avgLandSqft?: number | null
  combinedAvgSqft?: number | null
  spendingPowerIndex?: number | null
  commercialRentMin?: number | null
  commercialRentMax?: number | null
  dominantAgeGroup?: string | null
  primaryResidentType?: string | null
}

type ViewMode = 'office' | 'retail' | 'fnb' | 'wellness' | 'general'

interface PropertyData {
  title?: string
  address?: string
  city?: string
  propertyType?: string
  size?: number
  price?: number
  priceType?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getViewMode(propertyType?: string, targetCategory?: string): ViewMode {
  const pt = (propertyType || '').toLowerCase()
  const tc = (targetCategory || '').toLowerCase()
  if (pt.includes('office')) return 'office'
  if (tc.includes('retail') || pt.includes('retail')) return 'retail'
  if (tc.includes('salon') || tc.includes('wellness') || tc.includes('spa') || tc.includes('beauty')) return 'wellness'
  if (tc.includes('cafe') || tc.includes('qsr') || tc.includes('restaurant') || tc.includes('dining') || pt.includes('restaurant')) return 'fnb'
  return 'general'
}

function deriveLocalityFromAddress(address?: string | null): string | null {
  if (!address) return null
  const text = address.toLowerCase()
  const known = [
    'kasturi nagar', 'hrbr layout', 'kalyan nagar', 'banaswadi',
    'indiranagar', 'koramangala', 'whitefield', 'jayanagar', 'hsr layout',
    'bellandur', 'marathahalli', 'mg road', 'brigade road', 'btm layout',
    'jp nagar', 'malleshwaram', 'rajajinagar', 'yeshwanthpur', 'electronic city',
    'sarjapur', 'banashankari', 'basavanagudi',
  ]
  for (const k of known) {
    if (text.includes(k)) return k.replace(/\b\w/g, m => m.toUpperCase())
  }
  return null
}

function computeMonthlyRent(property: PropertyData | null | undefined): number {
  if (!property?.price) return 0
  const price = Number(property.price)
  if (!Number.isFinite(price) || price === 0) return 0
  const size = property.size != null ? Number(property.size) : null
  if (property.priceType === 'yearly') return Math.round(price / 12)
  if (property.priceType === 'sqft' && size && size > 0) return Math.round(price * size)
  return Math.round(price)
}

// ─── footfall chart data — category + locality aware ─────────────────────────

type CategoryKey = 'cafe' | 'qsr' | 'casual_dining' | 'fine_dining' | 'retail' | 'salon' | 'gym' | 'grocery' | 'default'
type LocalityTier = 'A' | 'B' | 'C' | 'D' | 'E'

// Base hourly scores 0–100 for hours 6..25 (25 = 1am)
const CATEGORY_BASES: Record<CategoryKey, number[]> = {
  cafe:         [30,70,90,75,50,45, 65,60,45,40,60,75, 80,70,55,40,25,15, 10,5],
  qsr:          [10,15,20,20,30,50, 90,85,70,35,30,40, 55,80,90,85,65,40, 20,10],
  casual_dining:[5, 10,15,15,20,40, 70,85,75,35,25,35, 55,75,95,90,70,45, 20,10],
  fine_dining:  [0, 0, 5, 5, 5, 10, 30,55,50,15,10,15, 35,65,90,100,90,65,35,15],
  retail:       [5, 10,15,20,35,65, 80,75,65,60,65,80, 90,85,70,50,25,10, 5, 0],
  salon:        [0, 5, 15,30,55,80, 85,75,65,60,70,85, 80,65,40,20,10,5,  0, 0],
  gym:          [80,90,70,45,30,25, 35,30,20,20,30,55, 85,90,75,50,25,10, 5, 0],
  grocery:      [20,40,65,70,60,55, 60,55,45,40,45,60, 80,85,80,70,45,25, 15,5],
  default:      [10,18,25,30,35,45, 72,85,78,55,48,52, 65,82,90,88,70,40, 20,10],
}

// Hours array: 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 0 1
const CHART_HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]

function hourLabel(h: number): string {
  if (h < 12)  return `${h}am`
  if (h === 12) return '12pm'
  if (h === 24) return '12am'
  if (h === 25) return '1am'
  return `${h - 12}pm`
}

function getLocalityTier(locality?: string): LocalityTier {
  const loc = (locality || '').toLowerCase()
  const tierA = ['indiranagar', 'koramangala', 'mg road', 'brigade road', 'church street', 'ub city', 'vittal mallya', 'richmond town']
  const tierB = ['hsr layout', 'btm layout', 'jp nagar', 'sarjapur road', 'bellandur', 'yeshwanthpur', 'whitefield']
  const tierC = ['jayanagar', 'basavanagudi', 'malleshwaram', 'rajajinagar', 'yelahanka', 'banashankari', 'cunningham']
  const tierD = ['electronic city', 'marathahalli', 'kr puram', 'hoodi', 'varthur', 'whitefield']
  const tierE = ['devanahalli', 'hoskote', 'attibele', 'chandapura', 'nelamangala', 'doddaballapur']
  if (tierA.some(t => loc.includes(t))) return 'A'
  if (tierB.some(t => loc.includes(t))) return 'B'
  if (tierC.some(t => loc.includes(t))) return 'C'
  if (tierD.some(t => loc.includes(t))) return 'D'
  if (tierE.some(t => loc.includes(t))) return 'E'
  return 'B' // default
}

function getCategoryKey(viewMode: ViewMode, targetCategory?: string): CategoryKey {
  const cat = (targetCategory || '').toLowerCase()
  if (cat.includes('fine') || cat.includes('fine_dining')) return 'fine_dining'
  if (cat.includes('cafe') || cat.includes('coffee') || cat.includes('boba')) return 'cafe'
  if (cat.includes('qsr') || cat.includes('fast food') || cat.includes('quick')) return 'qsr'
  if (cat.includes('casual') || cat.includes('dining') || cat.includes('restaurant') || viewMode === 'fnb') return 'casual_dining'
  if (cat.includes('salon') || cat.includes('spa') || cat.includes('wellness') || viewMode === 'wellness') return 'salon'
  if (cat.includes('gym') || cat.includes('fitness')) return 'gym'
  if (cat.includes('grocery') || cat.includes('convenience')) return 'grocery'
  if (viewMode === 'retail') return 'retail'
  return 'default'
}

function applyLocalityMultipliers(scores: number[], tier: LocalityTier): number[] {
  return scores.map((s, i) => {
    const h = CHART_HOURS[i]
    let v = s
    if (tier === 'A') {
      if (h === 22) v *= 1.3
      if (h === 23) v *= 1.5
      if (h === 24) v *= 1.6
      if (h === 25) v *= 1.4
    } else if (tier === 'B') {
      if (h === 22) v *= 1.1
      if (h === 23) v *= 1.2
      if (h === 24) v *= 1.1
      if (h === 25) v *= 0.8
    } else if (tier === 'C') {
      if (h === 22) v *= 0.8
      if (h === 23) v *= 0.5
      if (h === 24) v *= 0.2
      if (h === 25) v *= 0.1
    } else if (tier === 'D') {
      // Weekday lunch spike handled separately; weekend drop applied in buildFootfallData
      if (h >= 22) v *= 0.5
    } else if (tier === 'E') {
      v = Math.min(v, 60)
      if (h >= 21) v *= 0.3
      if (h === 25) v = 0
    }
    return Math.round(Math.min(100, Math.max(0, v)))
  })
}

function getWeekendMult(tier: LocalityTier, viewMode: ViewMode): number {
  if (tier === 'A') return 1.4
  if (tier === 'B') return 1.25
  if (tier === 'D') return 0.65 // IT areas quiet on weekends
  return 1.2
}

function buildPeakCaption(weekdayScores: number[], tier: LocalityTier, weekendMult: number, viewMode: ViewMode): string {
  const peaks: string[] = []
  let inPeak = false
  let peakStart = 0
  const threshold = 70
  for (let i = 0; i < weekdayScores.length; i++) {
    const h = CHART_HOURS[i]
    if (weekdayScores[i] >= threshold && !inPeak) { inPeak = true; peakStart = h }
    if ((weekdayScores[i] < threshold || i === weekdayScores.length - 1) && inPeak) {
      inPeak = false
      const end = CHART_HOURS[i]
      if (peakStart !== end) peaks.push(`${hourLabel(peakStart)}–${hourLabel(end)}`)
    }
  }
  const boostPct = Math.round((weekendMult - 1) * 100)
  let caption = peaks.length > 0 ? `Peak: ${peaks.slice(0, 3).join(' · ')}` : 'Peak: midday & evening'
  if (tier === 'D' && (viewMode === 'fnb' || viewMode === 'retail')) caption += ' (weekdays)'
  if (boostPct > 0) caption += ` · Weekends +${boostPct}%`
  if (tier === 'A') caption += ' · Active till 1am'
  return caption
}

function buildFootfallData(ward: WardData | null, viewMode: ViewMode, targetCategory?: string) {
  const tier = getLocalityTier(ward?.locality)
  const catKey = getCategoryKey(viewMode, targetCategory)
  const base = CATEGORY_BASES[catKey]
  const weekdayRaw = applyLocalityMultipliers(base, tier)
  const weekendMult = getWeekendMult(tier, viewMode)

  return {
    points: CHART_HOURS.map((h, i) => ({
      hour: hourLabel(h),
      hourNum: h,
      weekday: weekdayRaw[i],
      weekend: Math.round(Math.min(100, weekdayRaw[i] * weekendMult)),
      isPeak: weekdayRaw[i] >= 70,
    })),
    caption: buildPeakCaption(weekdayRaw, tier, weekendMult, viewMode),
    weekendBoost: Math.round((weekendMult - 1) * 100),
  }
}

// ─── competitor colours (keyed to category search labels) ────────────────────

// ─── competitor search config (type + keyword for better Google Places results) ─

interface CategorySearch {
  type: string    // Google Places type
  keyword: string // Additional keyword to narrow results
  label: string
  color: string
}

const CATEGORY_SEARCHES_FNB: CategorySearch[] = [
  { type: 'restaurant',    keyword: 'restaurant',  label: 'Restaurant / Dining', color: '#FF5200' },
  { type: 'cafe',          keyword: 'cafe coffee',  label: 'Café / Coffee',       color: '#6F4E37' },
  { type: 'bar',           keyword: 'bar pub',      label: 'Bar / Pub',           color: '#7B2D8B' },
  { type: 'meal_takeaway', keyword: 'qsr fast food',label: 'QSR / Takeaway',      color: '#F97316' },
  { type: 'bakery',        keyword: 'bakery',       label: 'Dessert / Bakery',    color: '#F472B6' },
]
const CATEGORY_SEARCHES_CAFE: CategorySearch[] = [
  { type: 'cafe',          keyword: 'cafe coffee',  label: 'Café / Coffee',       color: '#6F4E37' },
  { type: 'restaurant',    keyword: 'restaurant',   label: 'Restaurant / Dining', color: '#FF5200' },
  { type: 'bar',           keyword: 'bar pub',      label: 'Bar / Pub',           color: '#7B2D8B' },
  { type: 'bakery',        keyword: 'bakery dessert',label: 'Dessert / Bakery',   color: '#F472B6' },
]
const CATEGORY_SEARCHES_SALON: CategorySearch[] = [
  { type: 'beauty_salon',  keyword: 'salon',        label: 'Salon / Spa',         color: '#E91E8C' },
  { type: 'spa',           keyword: 'spa wellness',  label: 'Salon / Spa',         color: '#E91E8C' },
  { type: 'gym',           keyword: 'gym fitness',   label: 'Gym / Fitness',       color: '#1565C0' },
]
const CATEGORY_SEARCHES_GYM: CategorySearch[] = [
  { type: 'gym',           keyword: 'gym fitness',   label: 'Gym / Fitness',       color: '#1565C0' },
  { type: 'beauty_salon',  keyword: 'salon',         label: 'Salon / Spa',         color: '#E91E8C' },
]
const CATEGORY_SEARCHES_RETAIL: CategorySearch[] = [
  { type: 'clothing_store',keyword: 'clothing',      label: 'Retail / Fashion',    color: '#00897B' },
  { type: 'grocery_or_supermarket', keyword: 'supermarket', label: 'Supermarket', color: '#388E3C' },
  { type: 'shoe_store',    keyword: 'shoes',         label: 'Retail / Fashion',    color: '#00897B' },
  { type: 'restaurant',    keyword: 'restaurant',    label: 'Restaurant / Dining', color: '#FF5200' },
]

function getCategorySearches(category?: string): CategorySearch[] {
  const cat = (category || '').toLowerCase()
  if (cat.includes('cafe') || cat.includes('coffee')) return CATEGORY_SEARCHES_CAFE
  if (cat.includes('salon') || cat.includes('spa') || cat.includes('beauty')) return CATEGORY_SEARCHES_SALON
  if (cat.includes('gym') || cat.includes('fitness')) return CATEGORY_SEARCHES_GYM
  if (cat.includes('retail') || cat.includes('store') || cat.includes('shop')) return CATEGORY_SEARCHES_RETAIL
  return CATEGORY_SEARCHES_FNB
}

// Fuzzy color matching — handles legacy DB categories AND new label-based categories
function catColor(cat: string): string {
  const c = (cat || '').toLowerCase()
  if (c.includes('cafe') || c.includes('coffee') || c.includes('tea') || c.includes('barista')) return '#6F4E37'
  if (c.includes('bar') || c.includes('pub') || c.includes('beer') || c.includes('brewery')) return '#7B2D8B'
  if (c.includes('salon') || c.includes('spa') || c.includes('beauty') || c.includes('wellness')) return '#E91E8C'
  if (c.includes('gym') || c.includes('fitness') || c.includes('yoga') || c.includes('crossfit')) return '#1565C0'
  if (c.includes('grocery') || c.includes('supermarket') || c.includes('super market')) return '#388E3C'
  if (c.includes('retail') || c.includes('fashion') || c.includes('cloth') || c.includes('shoe') || c.includes('store')) return '#00897B'
  if (c.includes('dessert') || c.includes('bakery') || c.includes('ice cream') || c.includes('sweet') || c.includes('cake')) return '#F472B6'
  if (c.includes('qsr') || c.includes('takeaway') || c.includes('fast food') || c.includes('meal')) return '#F97316'
  if (c.includes('restaurant') || c.includes('dining') || c.includes('food') || c.includes('diner') || c.includes('bistro')) return '#FF5200'
  return '#757575'
}

// ─── risk engine ─────────────────────────────────────────────────────────────

type RiskItem = {
  type: 'risk' | 'opportunity'
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
}

function calculateRisks(
  property: PropertyData | null,
  ward: WardData | null,
  competitors: CompetitorRow[],
  targetCategory: string,
  data: IntelligenceData,
): RiskItem[] {
  const items: RiskItem[] = []
  const cat = (targetCategory || '').toLowerCase()
  const isFnb = cat.includes('cafe') || cat.includes('qsr') || cat.includes('restaurant') || cat.includes('dining')
  const within500 = competitors.filter(c => (c.distance ?? 1000) <= 500)
  const sameCategory = within500.filter(c => {
    const cc = (c.category || '').toLowerCase()
    if (cat.includes('cafe')) return cc.includes('cafe') || cc.includes('coffee')
    if (cat.includes('qsr')) return cc.includes('qsr')
    if (cat.includes('restaurant') || cat.includes('dining')) return cc.includes('restaurant') || cc.includes('dining')
    if (cat.includes('retail')) return cc.includes('retail')
    return false
  })
  const premiumNearby = competitors.filter(c =>
    (c.name || '').match(/starbucks|blue tokai|third wave|matteo|corridor seven|subko/i)
  ).length
  const rent = computeMonthlyRent(property)

  // RISKS
  if (within500.length > 12) {
    items.push({ type: 'risk', severity: 'high', title: 'High competitor density', detail: `${within500.length} direct competitors within 500m — customer acquisition cost will be higher` })
  }
  if (rent > 0 && ward?.medianIncome && rent > (ward.medianIncome / 12) * 0.4) {
    items.push({ type: 'risk', severity: 'high', title: 'Rent burden risk', detail: 'Rent is high relative to area income — requires strong brand pull to sustain' })
  }
  if ((ward?.populationDensity ?? 18000) < 15000 && (ward?.diningOutPerWeek ?? 3) < 3) {
    items.push({ type: 'risk', severity: 'medium', title: 'Low organic footfall', detail: 'Area has low population density and infrequent dining-out habits — marketing spend will need to compensate' })
  }
  if (isFnb && ward && ward.age25_34 < 25) {
    items.push({ type: 'risk', severity: 'medium', title: 'Young audience underrepresented', detail: `Only ${ward.age25_34}% of area population is 25–34 — core café/QSR audience is limited here` })
  }
  if (sameCategory.length > 8) {
    items.push({ type: 'risk', severity: 'high', title: 'Category saturated', detail: 'Too many similar concepts nearby — differentiation will be critical to survive' })
  }

  // OPPORTUNITIES
  if ((ward?.incomeAbove15L ?? 0) > 35 && premiumNearby < 3) {
    items.push({ type: 'opportunity', severity: 'high', title: 'Underserved premium demand', detail: `${ward!.incomeAbove15L}% high-income households with limited premium options — first-mover advantage` })
  }
  if ((ward?.diningOutPerWeek ?? 0) > 4.5) {
    items.push({ type: 'opportunity', severity: 'high', title: 'Frequent diners area', detail: `Residents dine out ${ward!.diningOutPerWeek}x/week on average — strong repeat customer potential` })
  }
  if ((ward?.itProfessionals ?? 0) > 40) {
    items.push({ type: 'opportunity', severity: 'medium', title: 'High IT workforce density', detail: `${ward!.itProfessionals}% IT professionals — strong weekday lunch trade and after-work crowd` })
  }
  if (sameCategory.length < 3) {
    items.push({ type: 'opportunity', severity: 'medium', title: 'Low direct competition', detail: 'Few direct competitors nearby — strong opportunity to capture category demand' })
  }
  if ((ward?.populationGrowth ?? 0) > 1.2) {
    items.push({ type: 'opportunity', severity: 'low', title: 'High-growth locality', detail: `Area growing at ${ward!.populationGrowth}% annually — early entry advantage before market fills` })
  }

  // Sort: high risks first, medium, low, then opportunities
  const severityOrder = { high: 0, medium: 1, low: 2 }
  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'risk' ? -1 : 1
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

// ─── main component ───────────────────────────────────────────────────────────

interface LocationIntelligenceDashboardProps {
  propertyId: string
  targetCategory?: string
  propertyType?: string
}

const MAP_OPTS = {
  ...DEFAULT_MAP_OPTIONS,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

export default function LocationIntelligenceDashboard({ propertyId, targetCategory, propertyType }: LocationIntelligenceDashboardProps) {
  const viewMode = getViewMode(propertyType, targetCategory)
  const isOffice = viewMode === 'office'

  const [data, setData] = useState<IntelligenceData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([])
  const [ward, setWard] = useState<WardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [enrichStep, setEnrichStep] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  const enrichSteps = [
    'Locating property coordinates…',
    'Scanning nearby competitors…',
    'Analyzing transport access…',
    'Pulling ward demographics…',
    'Calculating revenue projections…',
    'Computing risk & opportunity scores…',
    'Finalizing intelligence report…',
  ]

  useEffect(() => { fetchIntelligence() }, [propertyId])

  async function fetchIntelligence(autoEnrich = true) {
    setLoading(true)
    try {
      const res = await fetch(`/api/intelligence/${propertyId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.intelligence as IntelligenceData)
        setProperty(json.property ?? null)
        setCompetitors(json.competitors as CompetitorRow[])
        setWard(json.ward ?? null)
      } else if (res.status === 404 && autoEnrich) {
        await runEnrichmentWithProgress()
      } else {
        setData(null)
      }
    } catch { setData(null) }
    finally { setLoading(false) }
  }

  async function runEnrichmentWithProgress() {
    setEnriching(true); setEnrichStep(0)
    const interval = setInterval(() => setEnrichStep(p => p < 6 ? p + 1 : p), 1800)
    // Abort enrichment if it takes > 90 seconds (Supabase/API timeout)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)
    try {
      const r = await fetch(`/api/intelligence/${propertyId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType: targetCategory }),
        signal: controller.signal,
      })
      clearInterval(interval); clearTimeout(timeout); setEnrichStep(6)
      if (r.ok) {
        await new Promise(res => setTimeout(res, 500))
        const r2 = await fetch(`/api/intelligence/${propertyId}`)
        if (r2.ok) {
          const j = await r2.json()
          setData(j.intelligence); setProperty(j.property ?? null)
          setCompetitors(j.competitors); setWard(j.ward ?? null)
        }
      }
    } catch { clearInterval(interval); clearTimeout(timeout) }
    finally { setEnriching(false); setEnrichStep(0) }
  }

  if ((loading || enriching) && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h3 className="text-lg font-semibold text-slate-900 text-center mb-6">
          {enriching ? 'Analyzing Location' : 'Loading Intelligence Data'}
        </h3>
        {enriching ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF5200] to-[#FF8C00] h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.round(((enrichStep + 1) / enrichSteps.length) * 100)}%` }} />
            </div>
            <div className="space-y-2">
              {enrichSteps.map((step, i) => (
                <div key={step} className={`flex items-center gap-2 text-sm transition-opacity ${i < enrichStep ? 'opacity-40' : i === enrichStep ? 'opacity-100' : 'opacity-25'}`}>
                  {i < enrichStep ? <span className="text-green-500 font-bold text-xs">✓</span>
                    : i === enrichStep ? <div className="w-3 h-3 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
                    : <span className="w-3 h-3 rounded-full bg-slate-200 inline-block" />}
                  <span className={i === enrichStep ? 'text-slate-900 font-medium' : 'text-slate-500'}>{step}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-4">This takes about 10–15 seconds</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900">Location Intelligence</h3>
        <p className="mt-2 text-sm text-slate-600">No enriched data yet. Run enrichment to analyze this location.</p>
        <button type="button" onClick={() => runEnrichmentWithProgress()} disabled={enriching}
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#FF5200] text-white font-medium text-sm hover:bg-[#E44A00] disabled:opacity-60">
          {enriching ? 'Enriching…' : 'Run Enrichment'}
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: BarChart3 },
    ...(isOffice ? [] : [{ id: 'revenue', label: 'Revenue', Icon: DollarSign }]),
    { id: 'competition', label: 'Compete', Icon: Store },
    { id: 'demographics', label: 'Demographics', Icon: Users },
    { id: 'transport', label: 'Transit', Icon: Train },
    { id: 'risks', label: 'Risks', Icon: ShieldAlert },
  ]

  const headerDesc = isOffice
    ? 'Transit, accessibility, demographics & competition for office'
    : viewMode === 'retail' ? 'Footfall, retail competition, access & demographics'
    : viewMode === 'wellness' ? 'Footfall, wellness competition, access & demographics'
    : 'Footfall, revenue, competition, access, and demographics'

  const locality = deriveLocalityFromAddress(property?.address) ?? ward?.locality ?? ward?.wardName ?? property?.city ?? 'this area'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Score card — unchanged */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-red-50 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Location Score</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{headerDesc}</p>
            {ward && (
              <p className="text-xs text-slate-500 mt-1">{locality} · {ward.workingPopulation}% working population</p>
            )}
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-4xl sm:text-5xl font-bold text-[#FF5200] leading-none">{data.overallScore}</div>
            <div className="text-xs sm:text-sm text-slate-500">out of 100</div>
          </div>
        </div>
      </div>

      {/* Tab bar — horizontal scrollable */}
      <div className="flex flex-row overflow-x-auto scrollbar-hide border-b border-slate-200 gap-0 mb-6">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${activeTab === t.id ? 'border-[#FF5200] text-[#FF5200]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.Icon className="w-4 h-4" strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab data={data} ward={ward} property={property} viewMode={viewMode} isOffice={isOffice} locality={locality} targetCategory={targetCategory} />
      )}
      {activeTab === 'revenue' && !isOffice && (
        <RevenueTab dailyFootfall={data.dailyFootfall} weekendBoost={data.weekendBoost}
          monthlyLow={data.monthlyRevenueLow} monthlyHigh={data.monthlyRevenueHigh}
          breakEvenMonths={data.breakEvenMonths} property={property} />
      )}
      {activeTab === 'competition' && (
        <CompetitionTab competitors={competitors} data={data} ward={ward} mapsLoaded={mapsLoaded} targetCategory={targetCategory} />
      )}
      {activeTab === 'demographics' && (
        <DemographicsTab data={data} ward={ward} mapsLoaded={mapsLoaded} />
      )}
      {activeTab === 'transport' && (
        <TransportTab data={data} ward={ward} mapsLoaded={mapsLoaded} />
      )}
      {activeTab === 'risks' && (
        <RisksTab data={data} ward={ward} competitors={competitors} targetCategory={targetCategory || ''} property={property} locality={locality} />
      )}
    </div>
  )
}

// ─── TAB 1: OVERVIEW ─────────────────────────────────────────────────────────

function OverviewTab({ data, ward, property, viewMode, isOffice, locality, targetCategory }: {
  data: IntelligenceData; ward: WardData | null; property: PropertyData | null
  viewMode: ViewMode; isOffice: boolean; locality: string; targetCategory?: string
}) {
  const footfall = useMemo(() => buildFootfallData(ward, viewMode, targetCategory), [ward, viewMode, targetCategory])

  return (
    <div className="space-y-4">
      {/* Area strip */}
      <div className="flex gap-3">
        {ward && (
          <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">Area</div>
            <div className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5">{locality}</div>
            <div className="text-xs text-slate-500">{ward.workingPopulation}% working population</div>
          </div>
        )}
        {isOffice ? (
          <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">Transit</div>
            <div className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5">
              {data.metroName ? `${data.metroDistance}m · ${data.metroName}` : `${data.mainRoadDistance}m to main road`}
            </div>
            <div className="text-xs text-slate-500">{data.metroName ? 'Metro station' : 'Nearest arterial road'}</div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">Daily Footfall</div>
            <div className="text-sm sm:text-base font-semibold text-[#FF5200] mt-0.5">{data.dailyFootfall.toLocaleString('en-IN')}</div>
            <div className="text-xs text-slate-500">+{data.weekendBoost}% weekends</div>
          </div>
        )}
      </div>

      {/* Footfall chart — only for non-office */}
      {!isOffice && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
          <div className="text-sm font-semibold text-slate-800 mb-3">Footfall Pattern — Typical Day</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={footfall.points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 110]} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val}`, name === 'weekday' ? 'Weekday' : 'Weekend']}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="weekday" name="weekday" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {footfall.points.map((entry, i) => (
                  <Cell key={i} fill={entry.isPeak ? '#FF5200' : '#fbbf9a'} />
                ))}
              </Bar>
              <Bar dataKey="weekend" name="weekend" radius={[3, 3, 0, 0]} fill="#fed7aa" maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#FF5200] inline-block" /> Weekday peak</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#fbbf9a] inline-block" /> Weekday off-peak</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#fed7aa] inline-block" /> Weekend</span>
            <span className="ml-auto font-medium text-slate-600">{footfall.caption}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// SVG dot icon — colored by category, works on all devices
function svgDot(color: string, size = 22): string {
  const r = size / 2
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r - 2}" fill="${color}" stroke="white" stroke-width="2.5"/></svg>`
  )}`
}

function svgYouPin(): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#FF5200"/><circle cx="18" cy="18" r="8" fill="white"/></svg>`
  )}`
}

function svgApartmentDot(): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="#90A4AE" stroke="#455A64" stroke-width="2"/></svg>`
  )}`
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, p = Math.PI / 180
  const a = Math.sin((lat2 - lat1) * p / 2) ** 2 +
    Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin((lng2 - lng1) * p / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}


interface LivePin {
  id: string; name: string; lat: number; lng: number
  category: string; rating: number | null; reviewCount: number | null
  priceLevel: number | null; distance: number
}

// ─── TAB 2: COMPETE (MAP) ─────────────────────────────────────────────────────

function CompetitionTab({ competitors, data, ward, mapsLoaded, targetCategory }: {
  competitors: CompetitorRow[]; data: IntelligenceData
  ward: WardData | null; mapsLoaded: boolean; targetCategory?: string
}) {
  const [selected, setSelected] = useState<LivePin | null>(null)
  const [livePins, setLivePins] = useState<LivePin[]>([])
  const [fetchingLive, setFetchingLive] = useState(false)
  const mapRef = useRef<any>(null)
  const apiKey = getGoogleMapsApiKey()

  const center = useMemo(() => {
    if (ward?.latitude && ward?.longitude) return { lat: ward.latitude, lng: ward.longitude }
    return { lat: 12.9716, lng: 77.5946 }
  }, [ward])

  // Always re-run when competitors or map loads — ensures DB pins never get dropped
  useEffect(() => {
    // Build DB pins inline (avoids stale closure from useMemo)
    const currentDbPins: LivePin[] = competitors
      .filter(c => c.latitude != null && c.longitude != null)
      .map(c => ({
        id: c.id, name: c.name, lat: c.latitude!, lng: c.longitude!,
        category: c.category, rating: c.rating, reviewCount: c.reviewCount,
        priceLevel: c.priceLevel, distance: c.distance,
      }))

    // Show DB pins immediately while live fetch runs
    if (!mapsLoaded || !apiKey) {
      setLivePins(currentDbPins)
      return
    }

    setLivePins(currentDbPins) // render DB pins now, enhance below
    setFetchingLive(true)

    const searches = getCategorySearches(targetCategory)
    const seen = new Set<string>(currentDbPins.map(p => p.id || `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`))
    const allPins: LivePin[] = [...currentDbPins]

    const runSearches = async () => {
      for (const s of searches) {
        try {
          // Pass both type AND keyword — Google Places returns more accurate results
          const url = `/api/intelligence/nearby?lat=${center.lat}&lng=${center.lng}&type=${encodeURIComponent(s.type)}&keyword=${encodeURIComponent(s.keyword)}&radius=800`
          const j = await fetch(url).then(r => r.json()) as { places?: LivePin[] }
          ;(j.places ?? []).forEach(p => {
            const key = p.id || `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`
            if (!seen.has(key)) { seen.add(key); allPins.push({ ...p, category: s.label }) }
          })
        } catch { /* try next */ }
      }
      setLivePins([...allPins])
    }

    runSearches().finally(() => setFetchingLive(false))
  // competitors in deps so DB pins re-render when data loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitors, mapsLoaded, apiKey, center.lat, center.lng, targetCategory])

  // fitBounds once pins load
  useEffect(() => {
    if (!mapRef.current || livePins.length === 0) return
    if (typeof window === 'undefined' || !(window as any).google?.maps) return
    const bounds = new (window as any).google.maps.LatLngBounds()
    bounds.extend(center)
    livePins.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))
    mapRef.current.fitBounds(bounds, 50)
  }, [livePins, center])

  const onMapLoad = useCallback((map: any) => { mapRef.current = map }, [])

  // Group counts for summary + dynamic legend
  const grouped = useMemo(() =>
    livePins.reduce<Record<string, number>>((acc, c) => {
      const k = c.category?.trim() || 'Other'
      acc[k] = (acc[k] ?? 0) + 1; return acc
    }, {}), [livePins])

  const presentCategories = Object.keys(grouped)
  const groupSummary = Object.entries(grouped).map(([k, n]) => `${n} ${k}`).join(' · ')

  return (
    <div className="space-y-4">
      {/* Count label */}
      {livePins.length > 0 && (
        <p className="text-sm font-semibold text-slate-700">
          {livePins.length} brands found within 800m
        </p>
      )}

      {mapsLoaded && apiKey ? (
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '360px' }}
            center={center}
            zoom={15}
            options={MAP_OPTS}
            onLoad={onMapLoad}
          >
            {/* 800m radius circle */}
            <Circle center={center} radius={800}
              options={{ strokeColor: '#FF5200', strokeOpacity: 0.6, strokeWeight: 1.5, fillOpacity: 0 }} />
            {/* Property "You" pin */}
            <Marker position={center} icon={svgYouPin()} zIndex={100} />
            {/* Competitor pins — colored by category */}
            {livePins.map((p, i) => (
              <Marker
                key={p.id || i}
                position={{ lat: p.lat, lng: p.lng }}
                icon={svgDot(catColor(p.category), 22)}
                onClick={() => setSelected(p)}
                zIndex={10}
              />
            ))}
            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="text-xs space-y-0.5 min-w-[150px]">
                  <div className="font-semibold text-slate-900">{selected.name}</div>
                  <div className="text-slate-500">{selected.category}</div>
                  {selected.rating != null && (
                    <div>⭐ {selected.rating.toFixed(1)}{selected.reviewCount ? ` · ${selected.reviewCount} reviews` : ''}</div>
                  )}
                  {selected.distance > 0 && <div className="text-slate-400">{selected.distance}m away</div>}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-100 h-64 flex items-center justify-center text-slate-500 text-sm">
          {mapsLoaded ? 'Google Maps API key not configured' : 'Loading map…'}
        </div>
      )}

      {fetchingLive && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="w-3 h-3 border border-[#FF5200] border-t-transparent rounded-full animate-spin inline-block" />
          Fetching nearby brands…
        </p>
      )}

      {/* Dynamic legend — only categories that are actually present */}
      {presentCategories.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {presentCategories.map(label => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                style={{ background: catColor(label) }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {groupSummary && <p className="text-sm text-slate-600 font-medium">{groupSummary}</p>}
    </div>
  )
}

// ─── TAB 3: DEMOGRAPHICS ─────────────────────────────────────────────────────

interface NearbyWard {
  wardName: string; locality: string; latitude: number; longitude: number
  populationDensity: number; population2026: number; incomeAbove15L: number; distance: number
}

function DemographicsTab({ data, ward, mapsLoaded }: {
  data: IntelligenceData; ward: WardData | null; mapsLoaded: boolean
}) {
  const apiKey = getGoogleMapsApiKey()
  const [nearbyWards, setNearbyWards] = useState<NearbyWard[]>([])
  const [heatmapPts, setHeatmapPts] = useState<any[]>([])
  const [marketPins, setMarketPins] = useState<LivePin[]>([])
  const [apartmentPins, setApartmentPins] = useState<LivePin[]>([])
  const [selectedApt, setSelectedApt] = useState<LivePin | null>(null)

  const center = useMemo(() => {
    if (ward?.latitude && ward?.longitude) return { lat: ward.latitude, lng: ward.longitude }
    return { lat: 12.9716, lng: 77.5946 }
  }, [ward])

  // Fetch nearby wards for heatmap
  useEffect(() => {
    fetch(`/api/intelligence/ward-density?lat=${center.lat}&lng=${center.lng}`)
      .then(r => r.json())
      .then((j: { wards?: NearbyWard[] }) => setNearbyWards(j.wards ?? []))
      .catch(() => {})
  }, [center.lat, center.lng])

  // Fetch nearby apartments (heatmap + markers) + markets
  useEffect(() => {
    if (!apiKey) return
    fetch(`/api/intelligence/nearby?lat=${center.lat}&lng=${center.lng}&type=apartment&radius=1500`)
      .then(r => r.json())
      .then((j: { places?: LivePin[] }) => {
        setApartmentPins((j.places ?? []).slice(0, 30).map(p => ({ ...p, category: 'Apartment' })))
      })
      .catch(() => {})
    fetch(`/api/intelligence/nearby?lat=${center.lat}&lng=${center.lng}&type=shopping_mall&radius=3000`)
      .then(r => r.json())
      .then((j: { places?: LivePin[] }) =>
        setMarketPins((j.places ?? []).slice(0, 6).map((p: LivePin) => ({ ...p, category: 'Market Area' })))
      )
      .catch(() => {})
  }, [center.lat, center.lng, apiKey])

  function buildHeatmapPoints(g: any) {
    if (apartmentPins.length > 0) {
      return apartmentPins.map(a => ({
        location: new g.maps.LatLng(a.lat, a.lng),
        weight: Math.max(0.2, ((a.rating ?? 3) * (a.reviewCount ?? 50)) / 100),
      }))
    }
    const wards = nearbyWards.length > 0
      ? nearbyWards
      : ward ? [{ latitude: ward.latitude!, longitude: ward.longitude!, populationDensity: ward.populationDensity ?? 15000 }] : []
    return wards.map((w: any) => ({
      location: new g.maps.LatLng(w.latitude, w.longitude),
      weight: Math.max(0.1, (w.populationDensity ?? 10000) / 1000),
    }))
  }

  const onMapLoad = useCallback((map: any) => {
    const g = (window as any).google
    if (!g?.maps?.LatLng) return
    const pts = buildHeatmapPoints(g)
    if (pts.length > 0) setHeatmapPts(pts)
    const wards = nearbyWards.length > 0 ? nearbyWards : []
    if (wards.length > 1) {
      const bounds = new g.maps.LatLngBounds()
      wards.forEach((w: any) => bounds.extend({ lat: w.latitude, lng: w.longitude }))
      map.fitBounds(bounds, 30)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyWards, ward, apartmentPins])

  useEffect(() => {
    const g = (window as any).google
    if (!g?.maps?.LatLng) return
    setHeatmapPts(buildHeatmapPoints(g))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentPins, nearbyWards])

  return (
    <div className="space-y-5 overflow-hidden">
      {/* Age distribution */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="text-sm font-semibold text-slate-800 mb-3">Age Distribution (25–44)</div>
        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
          <div className="bg-[#FF5200] h-6 rounded-full flex items-center justify-end pr-2"
            style={{ width: `${Math.min(100, data.age25_44Percent)}%` }}>
            <span className="text-xs font-semibold text-white">{Math.round(data.age25_44Percent)}%</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Prime consumer age bracket · India urban benchmark ~42%</p>
      </div>

      {/* Stats grid — replaced median income & catchment pop */}
      <div className="grid grid-cols-2 gap-3">
        {/* Commercial Rent — use DB values or derive from medianIncome */}
        {(() => {
          const income = ward?.medianIncome ?? data.medianIncome
          const rentMin = ward?.commercialRentMin ?? (income ? Math.round(income / 1000 / 5) * 5 : null)
          const rentMax = ward?.commercialRentMax ?? (income ? Math.round(income / 500 / 5) * 5 : null)
          const isEstimate = !ward?.commercialRentMin
          return rentMin && rentMax ? (
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">Commercial Rent</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{rentMin}–₹{rentMax}
              </div>
              <div className="text-xs text-slate-400">
                {isEstimate ? '/sqft/mo · estimated' : '/sqft/mo · ground floor, road-facing'}
              </div>
            </div>
          ) : null
        })()}

        {/* Dining out */}
        {ward?.diningOutPerWeek != null && (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Dining Out</div>
            <div className="text-xl font-bold text-[#FF5200] mt-0.5">{ward.diningOutPerWeek}x</div>
            <div className="text-xs text-slate-400">per week</div>
          </div>
        )}

        {/* Property Rates (from seed) */}
        {ward?.avgApptSqft != null ? (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Property Rates</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              Apts: ₹{ward.avgApptSqft.toLocaleString('en-IN')}/sqft
            </div>
            {ward?.avgLandSqft != null && (
              <div className="text-xs font-semibold text-slate-600">
                Land: ₹{ward.avgLandSqft.toLocaleString('en-IN')}/sqft
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">High Income (15L+)</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{ward?.incomeAbove15L ?? '—'}%</div>
            <div className="text-xs text-slate-400">of households</div>
          </div>
        )}

        {/* Key Demographic */}
        {ward?.dominantAgeGroup ? (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Key Demographic</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 leading-tight">{ward.dominantAgeGroup}</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">IT Professionals</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{ward?.itProfessionals ?? '—'}%</div>
            <div className="text-xs text-slate-400">of workforce</div>
          </div>
        )}
      </div>

      {/* Resident Profile — full width */}
      {ward?.primaryResidentType && (
        <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">👥</span>
          <div>
            <div className="text-xs text-slate-500">Resident Profile</div>
            <div className="text-sm font-semibold text-slate-800">{ward.primaryResidentType}</div>
          </div>
        </div>
      )}

      {/* Population density heatmap */}
      <div>
        <div className="text-sm font-semibold text-slate-800 mb-2">Residential Density within 5km</div>
        {mapsLoaded && apiKey ? (
          <div className="rounded-xl overflow-hidden border border-slate-100">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '300px' }}
              center={center}
              zoom={13}
              options={MAP_OPTS}
              onLoad={onMapLoad}
            >
              {/* Property pin */}
              <Marker position={center} icon={svgYouPin()} zIndex={100} />
              {/* Apartment pins — larger clickable dots (FIX 2) */}
              {apartmentPins.map((p, i) => (
                <Marker
                  key={`apt-${i}`}
                  position={{ lat: p.lat, lng: p.lng }}
                  icon={svgApartmentDot()}
                  onClick={() => setSelectedApt(prev => prev?.id === p.id ? null : p)}
                  zIndex={6}
                />
              ))}
              {/* Apartment InfoWindow — one at a time (FIX 2) */}
              {selectedApt && (
                <InfoWindow
                  position={{ lat: selectedApt.lat, lng: selectedApt.lng }}
                  onCloseClick={() => setSelectedApt(null)}
                >
                  <div className="text-xs space-y-0.5 min-w-[160px]">
                    <div className="font-semibold text-slate-900">{selectedApt.name}</div>
                    {selectedApt.rating != null && (
                      <div>⭐ {selectedApt.rating.toFixed(1)}</div>
                    )}
                    <div className="text-slate-500">
                      {haversineM(center.lat, center.lng, selectedApt.lat, selectedApt.lng)}m away
                    </div>
                  </div>
                </InfoWindow>
              )}
              {/* Market area pins */}
              {marketPins.map((p, i) => (
                <Marker key={`mkt-${i}`} position={{ lat: p.lat, lng: p.lng }}
                  icon={svgDot('#6B7280', 18)} title={p.name} zIndex={5} />
              ))}
              {/* Heatmap */}
              {heatmapPts.length > 0 && (
                <HeatmapLayer data={heatmapPts} options={{
                  radius: 80, opacity: 0.7,
                  gradient: [
                    'rgba(255,255,0,0)', 'rgba(255,200,0,0.8)',
                    'rgba(255,120,0,0.9)', 'rgba(255,82,0,1)', 'rgba(180,0,0,1)',
                  ],
                }} />
              )}
            </GoogleMap>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 h-48 flex items-center justify-center text-slate-500 text-sm">
            {mapsLoaded ? 'Google Maps API key not configured' : 'Loading map…'}
          </div>
        )}
        {apartmentPins.length > 0 ? (
          <p className="text-xs text-slate-600 mt-2 font-medium">
            {apartmentPins.length} residential complexes within 1.5km — click any to see details
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-2">Residential density within 5km · hotter zones = more residents</p>
        )}
      </div>
    </div>
  )
}

// ─── TAB 4: TRANSIT ──────────────────────────────────────────────────────────

function TransportTab({ data, ward, mapsLoaded }: {
  data: IntelligenceData; ward: WardData | null; mapsLoaded: boolean
}) {
  const apiKey = getGoogleMapsApiKey()
  const center = useMemo(() => {
    if (ward?.latitude && ward?.longitude) return { lat: ward.latitude, lng: ward.longitude }
    return { lat: 12.9716, lng: 77.5946 }
  }, [ward])

  const hasMetro = data.metroDistance != null && data.metroName

  const circleColor = !data.metroDistance ? '#EF4444'
    : data.metroDistance <= 500 ? '#22C55E'
    : data.metroDistance <= 1000 ? '#F59E0B'
    : '#EF4444'

  const circleRadius = data.metroDistance ?? 1000

  const metroPin = useMemo(() => {
    if (!hasMetro || !data.metroDistance) return null
    const angle = 1.2
    return {
      lat: center.lat + (data.metroDistance / 111320) * Math.cos(angle),
      lng: center.lng + (data.metroDistance / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle),
    }
  }, [hasMetro, data.metroDistance, center])

  if (!hasMetro) {
    return (
      <div className="space-y-4">
        {mapsLoaded && apiKey ? (
          <div className="rounded-xl overflow-hidden border border-slate-100">
            <GoogleMap mapContainerStyle={{ width: '100%', height: '300px' }} center={center} zoom={14} options={MAP_OPTS}>
              <Marker position={center}
                icon={{ path: (window as any).google?.maps?.SymbolPath?.CIRCLE ?? 0, scale: 12, fillColor: '#FF5200', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }} />
              <Circle center={center} radius={2000}
                options={{ strokeColor: '#EF4444', strokeOpacity: 0.6, strokeWeight: 2, fillOpacity: 0 }} />
            </GoogleMap>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 h-48 flex items-center justify-center text-slate-500 text-sm">Loading map…</div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          No metro station within 2km — auto-rickshaw and cab primary access
        </div>
        {data.mainRoadDistance != null && (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Main Road Access</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{data.mainRoadDistance}m</div>
            <div className="text-xs text-slate-400">to nearest arterial road</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {mapsLoaded && apiKey ? (
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <GoogleMap mapContainerStyle={{ width: '100%', height: '300px' }} center={center} zoom={15} options={MAP_OPTS}>
            {/* Walking-distance circle */}
            <Circle center={center} radius={circleRadius}
              options={{ strokeColor: circleColor, strokeOpacity: 0.7, strokeWeight: 2, fillOpacity: 0 }} />
            {/* Property pin */}
            <Marker position={center}
              icon={{ path: (window as any).google?.maps?.SymbolPath?.CIRCLE ?? 0, scale: 12, fillColor: '#FF5200', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }} />
            {/* Approximate metro pin */}
            {metroPin && (
              <Marker position={metroPin}
                label={{ text: 'M', color: 'white', fontWeight: 'bold', fontSize: '11px' }}
                icon={{ path: (window as any).google?.maps?.SymbolPath?.CIRCLE ?? 0, scale: 12, fillColor: '#7C3AED', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }} />
            )}
          </GoogleMap>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-100 h-48 flex items-center justify-center text-slate-500 text-sm">Loading map…</div>
      )}

      {/* Metro detail */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#7C3AED] inline-block flex-shrink-0" />
          <span className="font-semibold text-slate-900">{data.metroName}</span>
        </div>
        <div className="text-sm text-slate-600">{data.metroDistance}m · {data.metroDistance! <= 500 ? 'Walking distance' : data.metroDistance! <= 1000 ? '~10 min walk' : '~15+ min walk / ride needed'}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: circleColor }} />
          <span className="text-xs text-slate-500">
            {data.metroDistance! <= 500 ? 'Within easy walking distance' : data.metroDistance! <= 1000 ? 'Moderate walk' : 'Over 1km — reduced accessibility'}
          </span>
        </div>
      </div>

      {data.mainRoadDistance != null && (
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="text-xs text-slate-500">Main Road Access</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{data.mainRoadDistance}m</div>
          <div className="text-xs text-slate-400">to nearest arterial road</div>
        </div>
      )}
    </div>
  )
}

// ─── TAB 5: RISKS ────────────────────────────────────────────────────────────

function RisksTab({ data, ward, competitors, targetCategory, property, locality }: {
  data: IntelligenceData; ward: WardData | null; competitors: CompetitorRow[]
  targetCategory: string; property: PropertyData | null; locality: string
}) {
  const items = useMemo(() =>
    calculateRisks(property, ward, competitors, targetCategory, data),
    [property, ward, competitors, targetCategory, data]
  )

  const risks = items.filter(i => i.type === 'risk')
  const opps = items.filter(i => i.type === 'opportunity')

  const severityBadge = (s: string) => {
    if (s === 'high') return 'bg-red-100 text-red-700'
    if (s === 'medium') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-5">
      {/* Score header */}
      <div className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white/80">Risk Score · {locality}</div>
            <div className="text-4xl font-bold mt-1">{data.riskScore}/100</div>
          </div>
          <div className="text-right text-sm text-white/80">
            {risks.filter(r => r.severity === 'high').length} high risks<br />
            {opps.length} opportunities
          </div>
        </div>
      </div>

      {/* Risks */}
      {risks.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Risks</h4>
          {risks.map((r, i) => (
            <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-900 text-sm">{r.title}</div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${severityBadge(r.severity)}`}>
                  {r.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 break-words">{r.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
          No significant risks identified for this location
        </div>
      )}

      {/* Opportunities */}
      {opps.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Opportunities</h4>
          {opps.map((r, i) => (
            <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-900 text-sm">{r.title}</div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${severityBadge(r.severity)}`}>
                  {r.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 break-words">{r.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
          Market is mature — focus on differentiation over first-mover advantage
        </div>
      )}
    </div>
  )
}

// ─── Revenue tab (unchanged) ─────────────────────────────────────────────────

function RevenueTab({ dailyFootfall, weekendBoost, monthlyLow, monthlyHigh, breakEvenMonths, property }: {
  dailyFootfall: number; weekendBoost: number; monthlyLow: number; monthlyHigh: number
  breakEvenMonths: number; property?: PropertyData | null
}) {
  const [captureRate, setCaptureRate] = useState(12)
  const [avgTicket, setAvgTicket] = useState(100)
  const captureDecimal = captureRate / 100
  const customersPerDay = Math.round(dailyFootfall * captureDecimal)
  const dailyRevenue = customersPerDay * avgTicket
  const monthlyRevenue = Math.round(dailyRevenue * 21 + dailyRevenue * (1 + weekendBoost / 100) * 9)
  const operatingCosts = Math.round(monthlyRevenue * 0.6)
  const monthlyRent = computeMonthlyRent(property)
  const netProfit = Math.round(monthlyRevenue - operatingCosts - monthlyRent)

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-4">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Revenue Calculator (interactive)</div>
        <div className="text-sm text-slate-600">Footfall ~{dailyFootfall.toLocaleString('en-IN')}/day · Weekend boost +{weekendBoost}%</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-600 mb-1">Capture Rate</div>
            <div className="flex items-center gap-2">
              <input type="range" min={2} max={15} value={captureRate} onChange={e => setCaptureRate(Number(e.target.value))} className="flex-1" />
              <span className="text-xs font-semibold text-slate-800 w-10 text-right">{captureRate}%</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">Avg Ticket (₹)</div>
            <div className="flex items-center gap-2">
              <input type="range" min={100} max={600} step={10} value={avgTicket} onChange={e => setAvgTicket(Number(e.target.value))} className="flex-1" />
              <span className="text-xs font-semibold text-slate-800 w-12 text-right">₹{avgTicket}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1 text-sm text-slate-800 border-t border-slate-100 pt-3">
          <div>Customers: {customersPerDay.toLocaleString('en-IN')}/day</div>
          <div>Daily Revenue: ₹{dailyRevenue.toLocaleString('en-IN')}</div>
          <div>Monthly Revenue: ₹{(monthlyRevenue / 100000).toFixed(1)}L · Est. Net Profit: ₹{(netProfit / 100000).toFixed(1)}L</div>
        </div>
        {breakEvenMonths != null && breakEvenMonths > 0 && (
          <div className="text-xs text-slate-500">Break-even in ~{breakEvenMonths} months</div>
        )}
      </div>
    </div>
  )
}
