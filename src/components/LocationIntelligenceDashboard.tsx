'use client'

import { useState, useEffect } from 'react'
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

export default function LocationIntelligenceDashboard({ propertyId }: { propertyId: string }) {
  const [data, setData] = useState<IntelligenceData | null>(null)
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
  const [activeTab, setActiveTab] = useState('overview')

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
        // No data yet — auto-trigger enrichment
        setEnriching(true)
        try {
          const enrichRes = await fetch(`/api/intelligence/${propertyId}`, { method: 'POST' })
          if (enrichRes.ok) {
            // Re-fetch after enrichment completes
            const res2 = await fetch(`/api/intelligence/${propertyId}`)
            if (res2.ok) {
              const json2 = await res2.json()
              setData(json2.intelligence as IntelligenceData)
              setCompetitors(json2.competitors as CompetitorRow[])
              setWard(json2.ward ?? null)
            }
          }
        } finally {
          setEnriching(false)
        }
      } else {
        setData(null)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  async function triggerEnrichment() {
    setEnriching(true)
    try {
      const res = await fetch(`/api/intelligence/${propertyId}`, { method: 'POST' })
      if (res.ok) {
        await new Promise((r) => setTimeout(r, 2000))
        await fetchIntelligence()
      }
    } finally {
      setEnriching(false)
    }
  }

  if ((loading || enriching) && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin" />
        {enriching && (
          <p className="text-sm text-slate-600 animate-pulse">
            Analyzing location — competitors, demographics, revenue…
          </p>
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
    { id: 'overview', label: 'Overview' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'competition', label: 'Competition' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'transport', label: 'Transport & Access' },
    { id: 'risks', label: 'Risks & Opportunities' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-red-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Location Score</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Footfall, revenue, competition, access, and demographics
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-[#FF5200]">{data.overallScore}</div>
            <div className="text-sm text-slate-500">out of 100</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          <ScoreCard title="Footfall" score={data.footfallScore} />
          <ScoreCard title="Revenue" score={data.revenueScore} />
          <ScoreCard title="Competition" score={data.competitionScore} />
          <ScoreCard title="Accessibility" score={data.accessScore} />
          <ScoreCard title="Demographics" score={data.demographicScore} />
          <ScoreCard title="Risk" score={data.riskScore} inverse />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-[#FF5200] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
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
        <CompetitionTab competitors={competitors} competitorCount={data.competitorCount} />
      )}
      {activeTab === 'demographics' && <DemographicsTab data={data} ward={ward} />}
      {activeTab === 'transport' && <TransportTab data={data} />}
      {activeTab === 'risks' && <RisksTab data={data} />}
    </div>
  )
}

function ScoreCard({ title, score, inverse }: { title: string; score: number; inverse?: boolean }) {
  const v = inverse ? 100 - score : score
  const color = v >= 75 ? 'text-green-600' : v >= 50 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100">
      <div className="text-xs text-slate-600">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{Math.round(score)}</div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
        <div className="bg-[#FF5200] h-1.5 rounded-full" style={{ width: `${Math.min(100, score)}%` }} />
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
          <div className="text-2xl font-bold text-slate-900">
            {data.dailyFootfall.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500">
            Peak hours: {data.peakHours} · +{data.weekendBoost}% weekends
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
          <div className="text-xs text-slate-600">Revenue Potential</div>
          <div className="text-2xl font-bold text-[#FF5200]">
            ₹{(data.monthlyRevenueLow / 100000).toFixed(1)}L – ₹
            {(data.monthlyRevenueHigh / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-slate-500">
            Break-even in ~{data.breakEvenMonths || '–'} months
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
          <div className="text-xs text-slate-600">Area Snapshot</div>
          <div className="text-sm text-slate-900">
            Population {data.population.toLocaleString('en-IN')} · Median income ₹
            {data.medianIncome.toLocaleString('en-IN')}
          </div>
          {ward && (
            <div className="text-xs text-slate-500">
              Ward {ward.wardName} ({ward.locality}) · Working pop {ward.workingPopulation}%
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
  const mid = Math.round((monthlyLow + monthlyHigh) / 2)
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
