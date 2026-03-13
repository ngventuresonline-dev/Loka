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

// ─── footfall chart data ─────────────────────────────────────────────────────

const BASE_HOURLY: Record<string, number> = {
  '6': 10, '7': 18, '8': 25, '9': 30, '10': 35,
  '11': 45, '12': 72, '13': 85, '14': 78, '15': 55,
  '16': 48, '17': 52, '18': 65, '19': 82, '20': 90,
  '21': 88, '22': 70, '23': 40,
}

function buildFootfallData(ward: WardData | null, viewMode: ViewMode) {
  const density = ward?.populationDensity ?? 18000
  const densityMod = density > 30000 ? 1.2 : density > 20000 ? 1.1 : 1.0
  const weekendMult = 1.35

  const peakFnb = [12, 13, 19, 20, 21]
  const peakRetail = [11, 12, 13, 17, 18, 19, 20]
  const peaks = viewMode === 'retail' ? peakRetail : peakFnb

  const hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]
  return hours.map(h => {
    const base = (BASE_HOURLY[String(h)] ?? 5) * densityMod
    return {
      hour: h < 12 ? `${h}am` : h === 12 ? '12pm' : h === 24 ? '12am' : `${h - 12}pm`,
      hourNum: h,
      weekday: Math.round(base),
      weekend: Math.round(base * weekendMult),
      isPeak: peaks.includes(h),
    }
  })
}

// ─── competitor colours ───────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  'Coffee shops': '#3B82F6',
  'cafe': '#3B82F6',
  'QSR': '#EF4444',
  'Restaurants': '#EF4444',
  'restaurant': '#EF4444',
  'Retail': '#8B5CF6',
  'retail': '#8B5CF6',
  'Desserts & bakery': '#EC4899',
  'bakery': '#EC4899',
  'Bars & pubs': '#F59E0B',
  'bar': '#F59E0B',
  'Salon & wellness': '#14B8A6',
  'salon': '#14B8A6',
}

function catColor(cat: string) {
  const c = (cat || '').toLowerCase()
  return CAT_COLORS[cat] || CAT_COLORS[c] || '#64748B'
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
    try {
      const r = await fetch(`/api/intelligence/${propertyId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType: targetCategory }),
      })
      clearInterval(interval); setEnrichStep(6)
      if (r.ok) {
        await new Promise(res => setTimeout(res, 500))
        const r2 = await fetch(`/api/intelligence/${propertyId}`)
        if (r2.ok) {
          const j = await r2.json()
          setData(j.intelligence); setProperty(j.property ?? null)
          setCompetitors(j.competitors); setWard(j.ward ?? null)
        }
      }
    } catch { clearInterval(interval) }
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
        <OverviewTab data={data} ward={ward} property={property} viewMode={viewMode} isOffice={isOffice} locality={locality} />
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

function OverviewTab({ data, ward, property, viewMode, isOffice, locality }: {
  data: IntelligenceData; ward: WardData | null; property: PropertyData | null
  viewMode: ViewMode; isOffice: boolean; locality: string
}) {
  const chartData = useMemo(() => buildFootfallData(ward, viewMode), [ward, viewMode])

  const peakLabel = viewMode === 'retail' ? '11am–2pm, 5pm–9pm' : '12–2pm, 7–10pm'

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
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 110]} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val}`, name === 'weekday' ? 'Weekday' : 'Weekend']}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="weekday" name="weekday" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {chartData.map((entry, i) => (
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
            <span className="ml-auto font-medium text-slate-600">Peak: {peakLabel} · Weekend +{data.weekendBoost}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// SVG data-URL icon — no google object needed at render time
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

function getCategoryFetchTypes(category?: string): { type: string; label: string }[] {
  const cat = (category || '').toLowerCase()
  if (cat.includes('cafe') || cat.includes('coffee')) return [
    { type: 'cafe', label: 'Coffee shops' },
    { type: 'meal_takeaway', label: 'QSR' },
    { type: 'restaurant', label: 'Restaurants' },
  ]
  if (cat.includes('salon') || cat.includes('wellness') || cat.includes('spa')) return [
    { type: 'beauty_salon', label: 'Salon & wellness' },
    { type: 'spa', label: 'Salon & wellness' },
    { type: 'gym', label: 'Fitness' },
  ]
  if (cat.includes('retail') || cat.includes('store') || cat.includes('shop')) return [
    { type: 'clothing_store', label: 'Retail' },
    { type: 'shoe_store', label: 'Retail' },
    { type: 'shopping_mall', label: 'Retail' },
  ]
  // Default F&B
  return [
    { type: 'restaurant', label: 'Restaurants' },
    { type: 'cafe', label: 'Coffee shops' },
    { type: 'meal_takeaway', label: 'QSR' },
    { type: 'bar', label: 'Bars & pubs' },
    { type: 'bakery', label: 'Desserts & bakery' },
  ]
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

  // Convert DB competitors (which have lat/lng) to LivePin format
  const dbPins = useMemo((): LivePin[] =>
    competitors
      .filter(c => c.latitude != null && c.longitude != null)
      .map(c => ({
        id: c.id,
        name: c.name,
        lat: c.latitude!,
        lng: c.longitude!,
        category: c.category,
        rating: c.rating,
        reviewCount: c.reviewCount,
        priceLevel: c.priceLevel,
        distance: c.distance,
      })),
    [competitors]
  )

  // If DB has no pins with coordinates → fetch live from Google Places
  useEffect(() => {
    if (dbPins.length > 0) { setLivePins(dbPins); return }
    if (!mapsLoaded || !apiKey) return
    const types = getCategoryFetchTypes(targetCategory)
    setFetchingLive(true)
    Promise.all(
      types.map(t =>
        fetch(`/api/intelligence/nearby?lat=${center.lat}&lng=${center.lng}&type=${t.type}&radius=1000`)
          .then(r => r.json())
          .then((j: { places?: LivePin[] }) =>
            (j.places ?? []).map((p: LivePin) => ({ ...p, category: t.label }))
          )
          .catch(() => [] as LivePin[])
      )
    ).then(results => {
      const all = results.flat()
      const seen = new Set<string>()
      const deduped = all.filter(p => {
        const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`
        if (seen.has(key)) return false
        seen.add(key); return true
      })
      setLivePins(deduped)
    }).finally(() => setFetchingLive(false))
  }, [dbPins, mapsLoaded, apiKey, center, targetCategory])

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

  // Group counts for summary
  const grouped = useMemo(() =>
    livePins.reduce<Record<string, number>>((acc, c) => {
      const k = c.category?.trim() || 'Other'
      acc[k] = (acc[k] ?? 0) + 1; return acc
    }, {}), [livePins])
  const groupSummary = Object.entries(grouped).map(([k, n]) => `${n} ${k}`).join(' · ')

  const legend = [
    { label: 'Coffee shops', color: '#3B82F6' },
    { label: 'QSR / Restaurant', color: '#EF4444' },
    { label: 'Retail', color: '#8B5CF6' },
    { label: 'Desserts & bakery', color: '#EC4899' },
    { label: 'Bars & pubs', color: '#F59E0B' },
    { label: 'Salon & wellness', color: '#14B8A6' },
  ]

  return (
    <div className="space-y-4">
      {mapsLoaded && apiKey ? (
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '320px' }}
            center={center}
            zoom={15}
            options={MAP_OPTS}
            onLoad={onMapLoad}
          >
            {/* 500m radius circle */}
            <Circle center={center} radius={500}
              options={{ strokeColor: '#FF5200', strokeOpacity: 0.8, strokeWeight: 2, fillOpacity: 0 }} />
            {/* Property "You" pin */}
            <Marker position={center} icon={svgYouPin()} zIndex={100} />
            {/* Competitor pins */}
            {livePins.map((p, i) => (
              <Marker
                key={p.id || i}
                position={{ lat: p.lat, lng: p.lng }}
                icon={svgDot(catColor(p.category))}
                onClick={() => setSelected(p)}
                zIndex={10}
              />
            ))}
            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="text-xs space-y-0.5 min-w-[140px]">
                  <div className="font-semibold text-slate-900">{selected.name}</div>
                  <div className="text-slate-500">{selected.category}</div>
                  {selected.rating != null && (
                    <div>★ {selected.rating.toFixed(1)}{selected.reviewCount ? ` (${selected.reviewCount})` : ''}</div>
                  )}
                  {selected.distance > 0 && <div>{selected.distance}m away</div>}
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
          Fetching nearby competitors…
        </p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {legend.map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

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

  // Fetch nearby markets (shopping_mall, supermarket)
  useEffect(() => {
    if (!apiKey) return
    fetch(`/api/intelligence/nearby?lat=${center.lat}&lng=${center.lng}&type=shopping_mall&radius=3000`)
      .then(r => r.json())
      .then((j: { places?: LivePin[] }) =>
        setMarketPins((j.places ?? []).slice(0, 6).map((p: LivePin) => ({ ...p, category: 'Market Area' })))
      )
      .catch(() => {})
  }, [center.lat, center.lng, apiKey])

  // Build heatmap points inside onLoad so google.maps.LatLng is available
  const onMapLoad = useCallback((map: any) => {
    const g = (window as any).google
    if (!g?.maps?.LatLng) return
    const wards = nearbyWards.length > 0 ? nearbyWards : (ward ? [{ latitude: ward.latitude!, longitude: ward.longitude!, populationDensity: ward.populationDensity ?? 15000 }] : [])
    const pts = wards.map((w: any) => ({
      location: new g.maps.LatLng(w.latitude, w.longitude),
      weight: Math.max(0.1, (w.populationDensity ?? 10000) / 1000),
    }))
    if (pts.length > 0) setHeatmapPts(pts)
    // fitBounds to show all wards
    if (wards.length > 1) {
      const bounds = new g.maps.LatLngBounds()
      wards.forEach((w: any) => bounds.extend({ lat: w.latitude, lng: w.longitude }))
      map.fitBounds(bounds, 30)
    }
  }, [nearbyWards, ward])

  // Re-build heatmap points when nearbyWards loads after map
  useEffect(() => {
    if (nearbyWards.length === 0) return
    const g = (window as any).google
    if (!g?.maps?.LatLng) return
    const pts = nearbyWards.map(w => ({
      location: new g.maps.LatLng(w.latitude, w.longitude),
      weight: Math.max(0.1, w.populationDensity / 1000),
    }))
    setHeatmapPts(pts)
  }, [nearbyWards])

  // Aggregate stats from nearby wards
  const totalCatchmentPop = nearbyWards.reduce((s, w) => s + (w.population2026 ?? 0), 0)
  const avgHighIncome = nearbyWards.length > 0
    ? (nearbyWards.reduce((s, w) => s + (w.incomeAbove15L ?? 0), 0) / nearbyWards.length).toFixed(0)
    : ward?.incomeAbove15L?.toFixed(0)

  const catchmentLabel = totalCatchmentPop > 0
    ? totalCatchmentPop >= 100000 ? `${(totalCatchmentPop / 100000).toFixed(1)}L residents` : `${(totalCatchmentPop / 1000).toFixed(0)}K residents`
    : ward?.population2026 ? `${(ward.population2026 / 1000).toFixed(0)}K residents` : null

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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="text-xs text-slate-500">Median Income</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            ₹{ward?.medianIncome ? (ward.medianIncome / 100000).toFixed(1) : (data.medianIncome / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-slate-400">per year</div>
        </div>
        {ward?.diningOutPerWeek != null && (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Dining Out</div>
            <div className="text-xl font-bold text-[#FF5200] mt-0.5">{ward.diningOutPerWeek}x</div>
            <div className="text-xs text-slate-400">per week</div>
          </div>
        )}
        {ward?.incomeAbove15L != null && (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">High Income (15L+)</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{ward.incomeAbove15L}%</div>
            <div className="text-xs text-slate-400">of households</div>
          </div>
        )}
        {catchmentLabel && (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500">Catchment Pop.</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{catchmentLabel.split(' ')[0]}</div>
            <div className="text-xs text-slate-400">5km catchment · 2026</div>
          </div>
        )}
      </div>

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
              {/* Market area pins */}
              {marketPins.map((p, i) => (
                <Marker key={i} position={{ lat: p.lat, lng: p.lng }}
                  icon={svgDot('#6B7280', 18)}
                  title={p.name}
                  zIndex={5}
                />
              ))}
              {/* Heatmap */}
              {heatmapPts.length > 0 && (
                <HeatmapLayer
                  data={heatmapPts}
                  options={{
                    radius: 80,
                    opacity: 0.7,
                    gradient: [
                      'rgba(255,255,0,0)',
                      'rgba(255,200,0,0.8)',
                      'rgba(255,120,0,0.9)',
                      'rgba(255,82,0,1)',
                      'rgba(180,0,0,1)',
                    ],
                  }}
                />
              )}
            </GoogleMap>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 h-48 flex items-center justify-center text-slate-500 text-sm">
            {mapsLoaded ? 'Google Maps API key not configured' : 'Loading map…'}
          </div>
        )}
        {/* Below-map stats */}
        <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-slate-600">
          {catchmentLabel && <span><span className="font-semibold text-slate-800">{catchmentLabel}</span> in 5km</span>}
          {avgHighIncome && <span><span className="font-semibold text-slate-800">{avgHighIncome}%</span> high income households</span>}
        </div>
        <p className="text-xs text-slate-400 mt-1">Residential density within 5km · darker = higher density · grey pins = market zones</p>
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
