'use client'

import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, Store, Users, Train, ShieldAlert } from 'lucide-react'
import { estimateCategorySpend } from '@/lib/intelligence/spend-estimator'
import {
  SPEND_BENCHMARKS,
  SPEND_DISPLAY_CATEGORIES,
  TIER_LABELS,
  type BrandCategory,
} from '@/lib/intelligence/spend-benchmarks'
import { getLocationAdjustedBenchmarks } from '@/lib/intelligence/location-spend-profile'

function filterCompetitorsByCategory(competitors: CompetitorRow[], targetCategory: string): CompetitorRow[] {
  if (!targetCategory?.trim()) return competitors
  const key = targetCategory.trim().toLowerCase()
  const filtered = competitors.filter((c) => {
    const cat = (c.category || '').toLowerCase()
    if (key.includes('cafe') || key === 'cafe') return cat === 'cafe'
    if (key.includes('qsr')) return cat === 'qsr'
    if (key.includes('restaurant') || key.includes('dining') || key.includes('casual') || key.includes('fine')) return cat === 'restaurant' || cat.includes('dining')
    if (key.includes('brew') || key.includes('taproom') || key.includes('bar')) return cat === 'bar' || cat.includes('brew')
    if (key.includes('retail')) return cat === 'retail' || cat.includes('store') || cat.includes('shop')
    if (key.includes('bakery')) return cat === 'bakery'
    if (key.includes('salon') || key.includes('wellness') || key.includes('spa') || key.includes('beauty')) return cat === 'salon' || cat.includes('spa') || cat.includes('beauty')
    return true
  })
  // If filter returns empty, show all (better than showing nothing)
  return filtered.length > 0 ? filtered : competitors
}

function mapBrandCategory(profileCategory: string): BrandCategory {
  if (!profileCategory?.trim()) return 'casual_dining'
  const key = profileCategory.trim().toLowerCase()
  const map: Record<string, BrandCategory> = {
    'qsr': 'qsr',
    'cafe': 'cafe',
    'casual dining': 'casual_dining',
    'fine dining': 'fine_dining',
    'brewery': 'brewery_taproom',
    'taproom': 'brewery_taproom',
    'brewery / taproom': 'brewery_taproom',
    'retail': 'retail',
    'salon': 'salon',
  }
  return map[key] ?? 'casual_dining'
}
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
}

type ViewMode = 'office' | 'retail' | 'fnb' | 'wellness' | 'general'

function getViewMode(propertyType?: string, targetCategory?: string): ViewMode {
  const pt = (propertyType || '').toLowerCase()
  const tc = (targetCategory || '').toLowerCase()
  if (pt.includes('office')) return 'office'
  if (tc.includes('retail') || pt.includes('retail')) return 'retail'
  if (tc.includes('salon') || tc.includes('wellness') || tc.includes('spa') || tc.includes('beauty')) return 'wellness'
  if (tc.includes('cafe') || tc.includes('qsr') || tc.includes('restaurant') || tc.includes('dining') || pt.includes('restaurant')) return 'fnb'
  return 'general'
}

interface LocationIntelligenceDashboardProps {
  propertyId: string
  targetCategory?: string
  propertyType?: string
}

export default function LocationIntelligenceDashboard({ propertyId, targetCategory, propertyType }: LocationIntelligenceDashboardProps) {
  const viewMode = getViewMode(propertyType, targetCategory)
  const isOffice = viewMode === 'office'
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [property, setProperty] = useState<{ title?: string; address?: string; city?: string; propertyType?: string; size?: number; price?: number } | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([])
  const [ward, setWard] = useState<{
    wardName: string
    locality: string
    medianIncome: number
    age25_34: number
    age35_44: number
    workingPopulation: number
    diningOutPerWeek: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [enrichStep, setEnrichStep] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  const enrichSteps = [
    'Locating property coordinates…',
    'Scanning nearby competitors…',
    'Analyzing transport access…',
    'Pulling ward demographics…',
    'Calculating revenue projections…',
    'Computing risk & opportunity scores…',
    'Finalizing intelligence report…',
  ]

  useEffect(() => {
    fetchIntelligence()
  }, [propertyId])

  async function fetchIntelligence(autoEnrich = true) {
    setLoading(true)
    try {
      // Always fetch all competitors (1km radius); filter by category client-side
      const res = await fetch(`/api/intelligence/${propertyId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.intelligence as IntelligenceData)
        setProperty(json.property ?? null)
        const comps = json.competitors as CompetitorRow[]
        setCompetitors(targetCategory ? filterCompetitorsByCategory(comps, targetCategory) : comps)
        setWard(json.ward ?? null)
      } else if (res.status === 404 && autoEnrich) {
        await runEnrichmentWithProgress()
      } else {
        setData(null)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  async function runEnrichmentWithProgress() {
    setEnriching(true)
    setEnrichStep(0)

    // Animate through steps while enrichment runs in background
    const stepInterval = setInterval(() => {
      setEnrichStep((prev) => (prev < 6 ? prev + 1 : prev))
    }, 1800)

    try {
      const enrichRes = await fetch(`/api/intelligence/${propertyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType: targetCategory ?? undefined }),
      })
      clearInterval(stepInterval)
      setEnrichStep(6) // Final step

      if (enrichRes.ok) {
        await new Promise((r) => setTimeout(r, 500))
        const res2 = await fetch(`/api/intelligence/${propertyId}`)
        if (res2.ok) {
          const json2 = await res2.json()
          setData(json2.intelligence as IntelligenceData)
          setProperty(json2.property ?? null)
          const comps = json2.competitors as CompetitorRow[]
          setCompetitors(targetCategory ? filterCompetitorsByCategory(comps, targetCategory) : comps)
          setWard(json2.ward ?? null)
        }
      }
    } catch {
      clearInterval(stepInterval)
    } finally {
      setEnriching(false)
      setEnrichStep(0)
    }
  }

  async function triggerEnrichment() {
    await runEnrichmentWithProgress()
  }

  if ((loading || enriching) && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h3 className="text-lg font-semibold text-slate-900 text-center mb-6">
          {enriching ? 'Analyzing Location' : 'Loading Intelligence Data'}
        </h3>
        {enriching ? (
          <div className="max-w-md mx-auto space-y-4">
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF5200] to-[#FF8C00] h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.round(((enrichStep + 1) / enrichSteps.length) * 100)}%` }}
              />
            </div>
            {/* Steps */}
            <div className="space-y-2">
              {enrichSteps.map((step, i) => (
                <div key={step} className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
                  i < enrichStep ? 'opacity-50' : i === enrichStep ? 'opacity-100' : 'opacity-30'
                }`}>
                  {i < enrichStep ? (
                    <span className="text-green-500 font-bold text-xs">✓</span>
                  ) : i === enrichStep ? (
                    <div className="w-3 h-3 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-slate-200 inline-block" />
                  )}
                  <span className={i === enrichStep ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-4">
              This takes about 10–15 seconds
            </p>
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
        <button
          type="button"
          onClick={triggerEnrichment}
          disabled={enriching}
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#FF5200] text-white font-medium text-sm hover:bg-[#E44A00] disabled:opacity-60"
        >
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

  const scoreCards = [
    ...(isOffice ? [] : [
      { title: 'Footfall', score: data.footfallScore, inverse: false },
      { title: 'Revenue', score: data.revenueScore, inverse: false },
    ]),
    { title: 'Competition', score: data.competitionScore, inverse: false },
    { title: 'Access', score: data.accessScore, inverse: false },
    { title: 'Demographics', score: data.demographicScore, inverse: false },
    { title: 'Risk', score: data.riskScore, inverse: true },
  ]

  const headerDesc = isOffice
    ? 'Transit, accessibility, demographics & competition for office'
    : viewMode === 'retail'
      ? 'Footfall, retail competition, access & demographics'
      : viewMode === 'wellness'
        ? 'Footfall, wellness competition, access & demographics'
        : 'Footfall, revenue, competition, access, and demographics'

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-red-50 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Location Score</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {headerDesc}
            </p>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-4xl sm:text-5xl font-bold text-[#FF5200] leading-none">{data.overallScore}</div>
            <div className="text-xs sm:text-sm text-slate-500">out of 100</div>
          </div>
        </div>
        <div className={`grid gap-2 sm:gap-3 mt-4 sm:mt-6 ${scoreCards.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {scoreCards.map((c) => (
            <ScoreCard key={c.title} title={c.title} score={c.score} inverse={c.inverse} />
          ))}
        </div>
      </div>

      <div className={`grid gap-1 sm:gap-2 ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 py-2 sm:py-2.5 rounded-lg transition-colors ${
              activeTab === t.id
                ? 'bg-[#FF5200] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <t.Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.8} />
            <span className="text-[9px] sm:text-xs font-medium leading-none">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          data={data}
          ward={ward}
          property={property}
          competitors={competitors}
          targetCategory={targetCategory}
          viewMode={viewMode}
          isOffice={isOffice}
        />
      )}
      {activeTab === 'revenue' && !isOffice && (
        <RevenueTab
          dailyFootfall={data.dailyFootfall}
          weekendBoost={data.weekendBoost}
          monthlyLow={data.monthlyRevenueLow}
          monthlyHigh={data.monthlyRevenueHigh}
          breakEvenMonths={data.breakEvenMonths}
          property={property}
        />
      )}
      {activeTab === 'competition' && (
        <CompetitionTab
          competitors={competitors}
          competitorCount={targetCategory ? competitors.length : data.competitorCount}
          targetCategory={targetCategory}
          totalUnfilteredCount={data.competitorCount}
        />
      )}
      {activeTab === 'demographics' && (
        <DemographicsTab
          data={data}
          ward={ward}
          competitors={competitors}
          targetCategory={targetCategory}
        />
      )}
      {activeTab === 'transport' && <TransportTab data={data} />}
      {activeTab === 'risks' && (
        <RisksTab
          data={data}
          ward={ward}
          competitors={competitors}
          targetCategory={targetCategory}
        />
      )}
    </div>
  )
}

function ScoreCard({ title, score, inverse }: { title: string; score: number; inverse?: boolean }) {
  const v = inverse ? 100 - score : score
  const color = v >= 75 ? 'text-green-600' : v >= 50 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-100">
      <div className="text-[10px] sm:text-xs text-slate-600 truncate">{title}</div>
      <div className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 ${color}`}>{Math.round(score)}</div>
      <div className="w-full bg-slate-100 rounded-full h-1 sm:h-1.5 mt-1.5 sm:mt-2">
        <div className="bg-[#FF5200] h-1 sm:h-1.5 rounded-full" style={{ width: `${Math.min(100, score)}%` }} />
      </div>
    </div>
  )
}

function OverviewTab({
  data,
  ward,
  property,
  competitors,
  targetCategory,
  viewMode,
  isOffice,
}: {
  data: IntelligenceData
  ward: any | null
  property: { title?: string; address?: string; city?: string; propertyType?: string; size?: number; price?: number } | null
  competitors: CompetitorRow[]
  targetCategory?: string
  viewMode?: ViewMode
  isOffice?: boolean
}) {
  const locality = ward?.locality ?? ward?.wardName ?? property?.city ?? 'this area'
  const categoryLabel = targetCategory ? `${targetCategory} ` : ''
  const compCount = targetCategory ? competitors.length : data.competitorCount

  const summaryPoints: string[] = []
  if (ward) {
    summaryPoints.push(`${ward.locality} (Ward ${ward.wardName}) — ${ward.workingPopulation}% working population`)
  }
  if (!isOffice) {
    const footfallLabel = viewMode === 'retail' ? 'retail footfall' : viewMode === 'wellness' ? 'footfall' : 'daily footfall'
    summaryPoints.push(`~${data.dailyFootfall.toLocaleString('en-IN')} ${footfallLabel} potential · Peak ${data.peakHours} · +${data.weekendBoost}% weekends`)
  }
  summaryPoints.push(`${compCount} ${categoryLabel}competitors within 1 km`)
  if (data.metroName && data.metroDistance != null) {
    summaryPoints.push(`${data.metroName} — ${data.metroDistance}m · ${data.busStops} bus stops nearby`)
  } else {
    summaryPoints.push(`${data.busStops} bus stops · ${data.mainRoadDistance}m to main road`)
  }
  summaryPoints.push(`Population ${data.population.toLocaleString('en-IN')} · Median income ₹${(data.medianIncome / 100000).toFixed(1)}L/year`)
  if (property?.size) summaryPoints.push(`${property.size} sq ft · ${property.propertyType ?? 'commercial'}`)
  if (property?.price != null && property.price > 0) {
    const p = Number(property.price)
    const priceStr = p >= 100000 ? `₹${(p / 100000).toFixed(1)}L` : `₹${p.toLocaleString('en-IN')}`
    summaryPoints.push(`Rent ${priceStr}/mo`)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isOffice ? (
          <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
            <div className="text-xs text-slate-600">Transit & Accessibility</div>
            <div className="text-2xl font-bold text-slate-900">
              {data.metroName ? `${data.metroDistance}m to ${data.metroName}` : `${data.busStops} bus stops`}
            </div>
            <div className="text-xs text-slate-500">
              {data.metroName && data.metroDistance != null
                ? `${data.busStops} bus stops · ${data.mainRoadDistance}m to main road`
                : `${data.mainRoadDistance}m to main road`}
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
            <div className="text-xs text-slate-600">
              {viewMode === 'retail' ? 'Retail' : viewMode === 'wellness' ? 'Footfall' : 'Daily'} Footfall (est.)
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data.dailyFootfall.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500">
              Peak hours: {data.peakHours} · +{data.weekendBoost}% weekends
            </div>
          </div>
        )}
        {ward && (
          <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
            <div className="text-xs text-slate-600">Area</div>
            <div className="text-sm font-medium text-slate-900">
              {ward.locality} ({ward.wardName})
            </div>
            <div className="text-xs text-slate-500">
              {isOffice ? 'Workforce & commuter base' : `Working pop ${ward.workingPopulation}%`}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Property Summary
        </div>
        <ul className="space-y-2 text-sm text-slate-700">
          {summaryPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[#FF5200] mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function computeMonthlyRent(property: {
  price?: number | string
  priceType?: string
  size?: number
} | null | undefined): number {
  if (!property?.price) return 0
  const price = Number(property.price)
  if (!Number.isFinite(price)) return 0
  const size = property.size != null ? Number(property.size) : null
  if (property.priceType === 'yearly') return Math.round(price / 12)
  if (property.priceType === 'sqft' && size && size > 0) return Math.round(price * size)
  return Math.round(price)
}

function RevenueTab({
  dailyFootfall,
  weekendBoost,
  monthlyLow,
  monthlyHigh,
  breakEvenMonths,
  property,
}: {
  dailyFootfall: number
  weekendBoost: number
  monthlyLow: number
  monthlyHigh: number
  breakEvenMonths: number
  property?: { price?: number; priceType?: string; size?: number } | null
}) {
  const [captureRate, setCaptureRate] = useState(12)
  const [avgTicket, setAvgTicket] = useState(100)

  const captureDecimal = captureRate / 100
  const customersPerDay = Math.round(dailyFootfall * captureDecimal)
  const dailyRevenue = customersPerDay * avgTicket
  const monthlyRevenue = Math.round(
    dailyRevenue * 21 + dailyRevenue * (1 + weekendBoost / 100) * 9,
  )
  const operatingCosts = Math.round(monthlyRevenue * 0.6)
  const monthlyRent = computeMonthlyRent(property)
  const netProfit = Math.round(monthlyRevenue - operatingCosts - monthlyRent)

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-2">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Revenue Calculator (interactive)
        </div>
        <div className="text-sm text-slate-600">
          Footfall ~{dailyFootfall.toLocaleString('en-IN')}/day · Weekend boost +{weekendBoost}%.
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <div className="text-xs text-slate-600 mb-1">Capture Rate</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={15}
                value={captureRate}
                onChange={(e) => setCaptureRate(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-semibold text-slate-800 w-10 text-right">
                {captureRate}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">Avg Ticket (₹)</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={100}
                max={600}
                step={10}
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-semibold text-slate-800 w-12 text-right">
                ₹{avgTicket}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-sm text-slate-800">
          <div>Customers: {customersPerDay.toLocaleString('en-IN')}/day</div>
          <div>Daily Revenue: ₹{dailyRevenue.toLocaleString('en-IN')}</div>
          <div>
            Monthly Revenue: ₹{(monthlyRevenue / 100000).toFixed(1)}L · Est. Net Profit:{' '}
            ₹{(netProfit / 100000).toFixed(1)}L
          </div>
        </div>
        {breakEvenMonths != null && breakEvenMonths > 0 && (
          <div className="text-xs text-slate-500 mt-2">
            Break-even in ~{breakEvenMonths} months
          </div>
        )}
      </div>
    </div>
  )
}

function CompetitionTab({
  competitors,
  competitorCount,
  targetCategory,
  totalUnfilteredCount,
}: {
  competitors: CompetitorRow[]
  competitorCount: number
  targetCategory?: string
  totalUnfilteredCount?: number
}) {
  const showAllFallback = targetCategory && competitorCount === 0 && (totalUnfilteredCount ?? 0) > 0

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900">
        Nearby {targetCategory ? `${targetCategory} ` : ''}Competition
      </h3>
      {showAllFallback && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          No {targetCategory} competitors found. Run enrichment with your brand type to fetch category-specific competitors.
        </p>
      )}
      <div className="space-y-3">
        {competitors.slice(0, 10).map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-slate-900">{c.name}</div>
              {c.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  {c.category}
                </span>
              )}
            </div>
            <div className="flex gap-4 mt-1 text-sm text-slate-600">
              {c.rating != null && <span>★ {c.rating.toFixed(1)}</span>}
              {c.reviewCount != null && <span>({c.reviewCount} reviews)</span>}
              <span>{c.distance}m away</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {competitorCount} {targetCategory ? 'matching ' : ''}competitors within 1 km
      </p>
    </div>
  )
}

function DemographicsTab({
  data,
  ward,
  competitors,
  targetCategory = 'Casual Dining',
}: {
  data: IntelligenceData
  ward: any | null
  competitors: CompetitorRow[]
  targetCategory?: string
}) {
  const locality = ward?.locality ?? ward?.wardName ?? ''
  const brandCategory = mapBrandCategory(targetCategory)
  const spendEstimate = estimateCategorySpend(
    competitors.map((c) => ({ name: c.name, category: c.category })),
    brandCategory,
    ward?.medianIncome ?? data.medianIncome,
    locality
  )
  const locationBenchmarks = getLocationAdjustedBenchmarks(locality, SPEND_BENCHMARKS)

  // Display tier: always show Mid-Range for most locations,
  // only show Premium tier label in premium markets
  const displayTier = spendEstimate.spendTier === 'premium' ? 'premium' : 'mid'
  const benchmarksForLocation = locationBenchmarks[brandCategory]
  const displayRange = benchmarksForLocation[displayTier]

  const tierColor = {
    budget: 'text-blue-600',
    mid: 'text-orange-500',
    premium: 'text-green-600',
  }[displayTier]

  const tierBg: Record<'budget' | 'mid' | 'premium', string> = {
    budget: 'bg-blue-50 border-blue-200 text-blue-800',
    mid: 'bg-orange-50 border-orange-200 text-orange-800',
    premium: 'bg-green-50 border-green-200 text-green-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Age Distribution</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="w-28 text-sm text-slate-600">25–44</span>
            <div className="flex-1 bg-slate-100 rounded-full h-5">
              <div
                className="bg-[#FF5200] h-5 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${data.age25_44Percent}%` }}
              >
                <span className="text-xs font-medium text-white">
                  {Math.round(data.age25_44Percent)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Income & Lifestyle</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-white p-4 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-600">Est. Spend Per Customer</div>
            <div className={`text-lg sm:text-xl font-semibold mt-1 ${tierColor}`}>
              {TIER_LABELS[displayTier]}: ₹{displayRange.min}–₹{displayRange.max}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Based on local brand mix & income · {spendEstimate.confidence} confidence
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              {spendEstimate.brandMixBreakdown.premium > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {spendEstimate.brandMixBreakdown.premium} premium nearby
                </span>
              )}
              {spendEstimate.brandMixBreakdown.mid > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {spendEstimate.brandMixBreakdown.mid} mid-range nearby
                </span>
              )}
              {spendEstimate.brandMixBreakdown.budget > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {spendEstimate.brandMixBreakdown.budget} budget nearby
                </span>
              )}
            </div>

            {spendEstimate.marketGap && (
              <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2">
                ⚡ {spendEstimate.marketGapNote}
              </div>
            )}
          </div>
          {ward && (
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-600">Dining Out</div>
              <div className="text-xl font-bold text-[#FF5200]">
                {ward.diningOutPerWeek}x/week
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Category-wise Est. Spend / Visit
        </div>
        <div className="space-y-4">
          {SPEND_DISPLAY_CATEGORIES.map(({ key, label }) => {
            const benchmarks = locationBenchmarks[key]
            return (
              <div key={key}>
                <div className="text-sm font-semibold text-slate-800 mb-2">{label}</div>
                <div className="flex flex-wrap gap-2">
                  {(['budget', 'mid', 'premium'] as const).map((tier) => (
                    <span
                      key={tier}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${tierBg[tier]}`}
                    >
                      {TIER_LABELS[tier]}: ₹{benchmarks[tier].min}–₹{benchmarks[tier].max}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          {locality ? `Location-adjusted for ${locality} · ` : ''}
          Based on nearby brand mix · {spendEstimate.brandMixBreakdown.premium} premium,{' '}
          {spendEstimate.brandMixBreakdown.mid} mid, {spendEstimate.brandMixBreakdown.budget} budget
          {spendEstimate.marketGap && (
            <span className="block mt-1 text-amber-600">⚡ {spendEstimate.marketGapNote}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function TransportTab({ data }: { data: IntelligenceData }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900">Transport Accessibility</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <div className="text-sm text-slate-600">Nearest Metro</div>
          <div className="text-lg font-bold mt-2">{data.metroName ?? 'N/A'}</div>
          <div className="text-sm text-[#FF5200] mt-1">
            {data.metroDistance != null ? `${data.metroDistance}m` : 'No metro nearby'}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <div className="text-sm text-slate-600">Bus & Road Access</div>
          <div className="text-3xl font-bold text-[#FF5200] mt-2">
            {data.busStops} stops · {data.mainRoadDistance}m to main road
          </div>
        </div>
      </div>
    </div>
  )
}

function RisksTab({
  data,
  ward,
  competitors,
  targetCategory,
}: {
  data: IntelligenceData
  ward: any | null
  competitors: CompetitorRow[]
  targetCategory?: string
}) {
  const locality = ward?.locality ?? ward?.wardName ?? 'this area'
  const categoryLabel = targetCategory ? `${targetCategory} ` : ''
  const compCount = targetCategory ? competitors.length : data.competitorCount

  const riskPointers: string[] = []
  if (compCount > 15) riskPointers.push(`In ${locality}, ${compCount} ${categoryLabel}competitors within 1 km — differentiation critical for this concept`)
  else if (compCount > 8) riskPointers.push(`${locality} has moderate ${categoryLabel}competition — strong concept and execution needed`)
  if (data.metroDistance == null || data.metroDistance > 800) riskPointers.push(`${locality}: metro access limited (${data.metroDistance != null ? `${data.metroDistance}m` : 'none'}) — may affect weekday footfall for ${targetCategory || 'F&B'}`)
  if (data.busStops < 3) riskPointers.push(`Only ${data.busStops} bus stops nearby — catchment may be car-dependent; consider for ${targetCategory || 'driven traffic'}`)
  if (data.mainRoadDistance > 200) riskPointers.push(`Property ${data.mainRoadDistance}m from main road — visibility and walk-in may be lower in ${locality}`)
  if (data.demographicScore < 50) riskPointers.push(`${locality} demographic fit below average for ${targetCategory || 'target'} — verify audience presence`)
  if (ward && ward.workingPopulation < 60) riskPointers.push(`${locality} working population ${ward.workingPopulation}% — weekday demand may be softer for ${targetCategory || 'daytime'} concepts`)
  if (data.footfallScore < 40) riskPointers.push(`Footfall potential below benchmark in ${locality} — consider secondary catchment or delivery`)
  if (data.revenueScore < 45) riskPointers.push(`Revenue projection conservative for ${locality} — ensure rent-to-revenue ratio is viable for ${targetCategory || 'this'} format`)
  if (riskPointers.length === 0) riskPointers.push(`No major red flags identified for ${locality} — standard due diligence recommended`)

  const strengthPointers: string[] = []
  if (compCount <= 5) strengthPointers.push(`${locality} has low ${categoryLabel}competition — whitespace opportunity for this concept`)
  if (data.metroDistance != null && data.metroDistance <= 500) strengthPointers.push(`${data.metroName ?? 'Metro'} ${data.metroDistance}m away — strong weekday footfall potential for ${targetCategory || 'F&B'}`)
  if (data.busStops >= 5) strengthPointers.push(`${data.busStops} bus stops in ${locality} — broad catchment accessibility`)
  if (data.demographicScore >= 70) strengthPointers.push(`${locality} has strong demographic fit for ${targetCategory || 'target'} — audience well-represented`)
  if (ward && ward.workingPopulation >= 65) strengthPointers.push(`${locality} working population ${ward.workingPopulation}% — weekday demand supported for ${targetCategory || 'F&B'}`)
  if (data.footfallScore >= 60) strengthPointers.push(`Above-average footfall potential in ${locality} for ${targetCategory || 'this'} format`)
  if (ward && ward.diningOutPerWeek > 2) strengthPointers.push(`${locality} dining-out frequency ${ward.diningOutPerWeek}x/week — strong F&B demand`)
  if (strengthPointers.length === 0) strengthPointers.push(`Solid transport and demographic base in ${locality} — execution will drive success for ${targetCategory || 'this'} concept`)

  const riskScore = 100 - data.riskScore
  const isHighRisk = riskScore > 50
  const isModerateRisk = riskScore > 25 && riskScore <= 50

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white p-6 rounded-xl">
        <h3 className="text-lg font-bold">Risk Assessment</h3>
        <p className="text-sm text-white/80 mt-1">
          {locality}{targetCategory ? ` · ${targetCategory}` : ''}
        </p>
        <div className="text-5xl font-bold mt-4">{data.riskScore}/100</div>
        <p className="text-sm text-white/90 mt-2">
          {isHighRisk ? 'Higher risk — review pointers below' : isModerateRisk ? 'Moderate risk — due diligence advised' : 'Lower risk — favourable conditions'}
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-3">
        <h4 className="font-semibold text-slate-900">Strengths</h4>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {strengthPointers.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-3">
        <h4 className="font-semibold text-slate-900">Challenges & Risks</h4>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {riskPointers.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
