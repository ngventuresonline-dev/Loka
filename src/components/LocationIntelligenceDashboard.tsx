'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, DollarSign, Store, Users, Train, ShieldCheck, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const INTEL_FOR_BRANDS_HREF = '/for-brands'

function LockedIntelOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/80 px-4 py-8 text-center backdrop-blur-[2px]">
      <div className="rounded-full bg-slate-100 p-3 mb-2">
        <Lock className="w-6 h-6 text-slate-600" strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-slate-900 max-w-sm">Unlock full location intelligence</p>
      <p className="text-xs text-slate-600 mt-1 max-w-sm">
        Overview and Revenue stay open on every property. Onboard your brand on Loka to access Compete, Demographics, Transit, and Risks.
      </p>
      <Link
        href={INTEL_FOR_BRANDS_HREF}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#FF5200] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#E44A00] transition-colors shadow-md"
      >
        Onboard your brand
      </Link>
    </div>
  )
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

type IntelTabId = 'overview' | 'revenue' | 'competition' | 'demographics' | 'transport' | 'risks'

export default function LocationIntelligenceDashboard({
  propertyId,
  targetCategory,
  propertyType: _propertyType,
}: {
  propertyId: string
  targetCategory?: string
  propertyType?: string
}) {
  const { user } = useAuth()
  const fullIntelAccess = user?.userType === 'admin'

  const [data, setData] = useState<IntelligenceData | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([])
  const [ward, setWard] = useState<{
    wardName: string
    locality?: string
    medianIncome: number
    age25_34: number
    age35_44: number
    workingPopulation: number
    diningOutPerWeek: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [enrichStep, setEnrichStep] = useState(0)
  const [activeTab, setActiveTab] = useState<IntelTabId>('overview')

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
      const res = await fetch(`/api/intelligence/${propertyId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.intelligence as IntelligenceData)
        setCompetitors(json.competitors as CompetitorRow[])
        setWard(json.ward ?? null)
      } else if (res.status === 404 && autoEnrich) {
        // No data yet — auto-trigger enrichment with progress steps
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
        body: JSON.stringify(targetCategory ? { businessType: targetCategory } : {}),
      })
      clearInterval(stepInterval)
      setEnrichStep(6) // Final step

      if (enrichRes.ok) {
        await new Promise((r) => setTimeout(r, 500))
        const res2 = await fetch(`/api/intelligence/${propertyId}`)
        if (res2.ok) {
          const json2 = await res2.json()
          setData(json2.intelligence as IntelligenceData)
          setCompetitors(json2.competitors as CompetitorRow[])
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

  const tabs: Array<{ id: IntelTabId; label: string; Icon: typeof BarChart3; locked: boolean }> = [
    { id: 'overview', label: 'Overview', Icon: BarChart3, locked: false },
    { id: 'revenue', label: 'Revenue', Icon: DollarSign, locked: false },
    { id: 'competition', label: 'Compete', Icon: Store, locked: !fullIntelAccess },
    { id: 'demographics', label: 'Demographics', Icon: Users, locked: !fullIntelAccess },
    { id: 'transport', label: 'Transit', Icon: Train, locked: !fullIntelAccess },
    { id: 'risks', label: 'Risks', Icon: ShieldCheck, locked: !fullIntelAccess },
  ]

  const isLockedPanel = (id: IntelTabId) =>
    !fullIntelAccess && ['competition', 'demographics', 'transport', 'risks'].includes(id)

  return (
    <div className="space-y-4 sm:space-y-6">
      {!fullIntelAccess && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs sm:text-sm text-amber-950">
            <span className="font-semibold">Free preview:</span> Overview and Revenue are open on every property.
            Onboard your brand to unlock Compete, Demographics, Transit, and Risks.
          </p>
          <Link
            href={INTEL_FOR_BRANDS_HREF}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#FF5200] px-3 py-2 text-xs font-semibold text-white hover:bg-[#E44A00] transition-colors"
          >
            Onboard brand →
          </Link>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-red-50 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Location Score</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {fullIntelAccess
                ? 'Footfall, revenue, competition, access, and demographics'
                : 'Full breakdown unlocks after brand onboarding — footfall & revenue scores stay visible below.'}
            </p>
            {ward && (
              <p className="text-xs text-slate-500 mt-1">
                {ward.locality || ward.wardName} · {ward.workingPopulation}% working population
              </p>
            )}
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-4xl sm:text-5xl font-bold text-[#FF5200] leading-none">{data.overallScore}</div>
            <div className="text-xs sm:text-sm text-slate-500">out of 100</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6">
          <ScoreCard title="Footfall" score={data.footfallScore} />
          <ScoreCard title="Revenue" score={data.revenueScore} />
          <ScoreCardLocked title="Competition" score={data.competitionScore} locked={!fullIntelAccess} />
          <ScoreCardLocked title="Access" score={data.accessScore} locked={!fullIntelAccess} />
          <ScoreCardLocked title="Demographics" score={data.demographicScore} locked={!fullIntelAccess} />
          <ScoreCardLocked title="Risk" score={data.riskScore} inverse locked={!fullIntelAccess} />
        </div>
      </div>

      <div className="flex flex-row overflow-x-auto scrollbar-hide border-b border-slate-200 gap-0 mb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
              activeTab === t.id
                ? 'border-[#FF5200] text-[#FF5200]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="relative inline-flex items-center justify-center">
              <t.Icon className="w-4 h-4" strokeWidth={1.8} />
              {t.locked && (
                <Lock
                  className={`absolute -right-2 -bottom-1 w-2.5 h-2.5 stroke-[3] ${
                    activeTab === t.id ? 'text-[#FF5200]/80' : 'text-slate-400'
                  }`}
                />
              )}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab data={data} ward={ward} />}
      {activeTab === 'revenue' && (
        <RevenueTab
          dailyFootfall={data.dailyFootfall}
          weekendBoost={data.weekendBoost}
          monthlyLow={data.monthlyRevenueLow}
          monthlyHigh={data.monthlyRevenueHigh}
          breakEvenMonths={data.breakEvenMonths}
        />
      )}
      {activeTab === 'competition' && (
        <div className="relative min-h-[180px] rounded-xl">
          <div className={isLockedPanel('competition') ? 'pointer-events-none select-none blur-[6px] opacity-55' : ''}>
            <CompetitionTab competitors={competitors} competitorCount={data.competitorCount} />
          </div>
          {isLockedPanel('competition') && <LockedIntelOverlay />}
        </div>
      )}
      {activeTab === 'demographics' && (
        <div className="relative min-h-[180px] rounded-xl">
          <div className={isLockedPanel('demographics') ? 'pointer-events-none select-none blur-[6px] opacity-55' : ''}>
            <DemographicsTab data={data} ward={ward} />
          </div>
          {isLockedPanel('demographics') && <LockedIntelOverlay />}
        </div>
      )}
      {activeTab === 'transport' && (
        <div className="relative min-h-[180px] rounded-xl">
          <div className={isLockedPanel('transport') ? 'pointer-events-none select-none blur-[6px] opacity-55' : ''}>
            <TransportTab data={data} />
          </div>
          {isLockedPanel('transport') && <LockedIntelOverlay />}
        </div>
      )}
      {activeTab === 'risks' && (
        <div className="relative min-h-[180px] rounded-xl">
          <div className={isLockedPanel('risks') ? 'pointer-events-none select-none blur-[6px] opacity-55' : ''}>
            <RisksTab data={data} />
          </div>
          {isLockedPanel('risks') && <LockedIntelOverlay />}
        </div>
      )}
    </div>
  )
}

function ScoreCardLocked({
  title,
  score,
  inverse,
  locked,
}: {
  title: string
  score: number
  inverse?: boolean
  locked: boolean
}) {
  if (!locked) return <ScoreCard title={title} score={score} inverse={inverse} />
  const v = inverse ? 100 - score : score
  const color = v >= 75 ? 'text-green-600' : v >= 50 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="relative bg-white p-2.5 sm:p-4 rounded-xl border border-slate-100 overflow-hidden min-h-[72px] sm:min-h-[88px]">
      <div className="pointer-events-none select-none blur-[5px] opacity-45">
        <div className="text-[10px] sm:text-xs text-slate-600 truncate">{title}</div>
        <div className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 ${color}`}>{Math.round(score)}</div>
        <div className="w-full bg-slate-100 rounded-full h-1 sm:h-1.5 mt-1.5 sm:mt-2">
          <div className="bg-[#FF5200] h-1 sm:h-1.5 rounded-full" style={{ width: `${Math.min(100, score)}%` }} />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-white/65">
        <Lock className="w-4 h-4 text-slate-400" strokeWidth={2} />
        <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 text-center px-1">Onboard</span>
      </div>
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

function OverviewTab({ data, ward }: { data: IntelligenceData; ward: any | null }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
          <div className="text-xs text-slate-600">Daily Footfall (est.)</div>
          <div className="text-2xl font-bold text-slate-900">{data.dailyFootfall.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-500">
            Peak hours: {data.peakHours} · +{data.weekendBoost}% weekends
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
          <div className="text-xs text-slate-600">Revenue Potential</div>
          <div className="text-2xl font-bold text-[#FF5200]">
            ₹{(data.monthlyRevenueLow / 100000).toFixed(1)}L – ₹{(data.monthlyRevenueHigh / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-slate-500">Break-even in ~{data.breakEvenMonths || '–'} months</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
          <div className="text-xs text-slate-600">Area Snapshot</div>
          <div className="text-sm text-slate-900">
            Population {data.population.toLocaleString('en-IN')} · Median income ₹
            {data.medianIncome.toLocaleString('en-IN')}
          </div>
          {ward && (
            <div className="text-xs text-slate-500">
              Ward {ward.wardName} ({ward.locality ?? '—'}) · Working pop {ward.workingPopulation}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RevenueTab({
  dailyFootfall,
  weekendBoost,
  monthlyLow,
  monthlyHigh,
  breakEvenMonths,
}: {
  dailyFootfall: number
  weekendBoost: number
  monthlyLow: number
  monthlyHigh: number
  breakEvenMonths: number
}) {
  const [captureRate, setCaptureRate] = useState(12)
  const [avgTicket, setAvgTicket] = useState(450)

  const captureDecimal = captureRate / 100
  const customersPerDay = Math.round(dailyFootfall * captureDecimal)
  const dailyRevenue = customersPerDay * avgTicket
  const monthlyRevenue = Math.round(
    dailyRevenue * 21 + dailyRevenue * (1 + weekendBoost / 100) * 9,
  )
  const operatingCosts = Math.round(monthlyRevenue * 0.6)
  const netProfit = Math.round(monthlyRevenue - operatingCosts)

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
                min={8}
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
                min={300}
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
        <div className="text-xs text-slate-500 mt-2">
          Benchmark band: ₹{(monthlyLow / 100000).toFixed(1)}L – ₹
          {(monthlyHigh / 100000).toFixed(1)}L · Break-even in ~{breakEvenMonths || '–'} months
        </div>
      </div>
    </div>
  )
}

function CompetitionTab({
  competitors,
  competitorCount,
}: {
  competitors: CompetitorRow[]
  competitorCount: number
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900">Nearby Competition</h3>
      <div className="space-y-3">
        {competitors.slice(0, 5).map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-100">
            <div className="font-semibold text-slate-900">{c.name}</div>
            <div className="flex gap-4 mt-1 text-sm text-slate-600">
              {c.rating != null && <span>★ {c.rating.toFixed(1)}</span>}
              {c.reviewCount != null && <span>({c.reviewCount} reviews)</span>}
              <span>{c.distance}m away</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">{competitorCount} competitors within 1 km</p>
    </div>
  )
}

function DemographicsTab({ data, ward }: { data: IntelligenceData; ward: any | null }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold text-slate-800 mb-1">Age Distribution (25–44)</div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="w-28 text-sm text-slate-600">25–44</span>
            <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
              <div
                className="bg-[#FF5200] h-6 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${Math.min(100, data.age25_44Percent)}%` }}
              >
                <span className="text-xs font-semibold text-white">
                  {Math.round(data.age25_44Percent)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Prime consumer age bracket · India urban benchmark ~42%</p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Income & Lifestyle</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-600">Median Income (2026)</div>
            <div className="text-xl font-bold text-[#FF5200]">
              ₹{data.medianIncome.toLocaleString('en-IN')}
            </div>
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

function RisksTab({ data }: { data: IntelligenceData }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white p-6 rounded-xl">
        <h3 className="text-lg font-bold">Risk Assessment</h3>
        <div className="text-5xl font-bold mt-4">{data.riskScore}/100</div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-2">
        <h4 className="font-semibold text-slate-900">Strengths</h4>
        <p className="text-sm text-slate-600">
          High-income working population and solid transport connectivity support strong weekday and
          weekend demand.
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-2">
        <h4 className="font-semibold text-slate-900">Challenges</h4>
        <p className="text-sm text-slate-600">
          {data.competitorCount > 10
            ? 'Moderate to high competition nearby – concept and execution must clearly differentiate.'
            : 'Some competition in the catchment – positioning and pricing still matter.'}
        </p>
      </div>
    </div>
  )
}
