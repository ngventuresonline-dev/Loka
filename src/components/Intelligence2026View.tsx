'use client'

interface Projections2026 {
  demographics?: {
    totalPopulation?: number
    medianIncome?: number
    workingPopulation?: number
    projectionSource?: string
    confidence?: number
  }
  economics?: Record<string, number>
  lifestyle?: Record<string, number | string>
  infrastructure?: {
    metroImpact?: number
    roadImpact?: number
    commercialImpact?: number
    overallBoost?: number
    footfallBoost?: number
    rentPressure?: number
    competitionIncrease?: number
    timeline?: string
    confidence?: number
  }
  highlights?: {
    populationGrowth?: string
    incomeGrowth?: string
    footfallBoost?: number
    marketHeat?: string
  }
  baselineYear?: number
  projectionYear?: number
  confidence?: number
  methodology?: string
}

interface Intelligence2026ViewProps {
  data: { predictive?: Record<string, unknown> } | null
}

export function Intelligence2026View({ data }: Intelligence2026ViewProps) {
  const projections = (data?.predictive?.projections2026 as Projections2026 | undefined) ?? {}

  if (!projections.demographics && !projections.highlights) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900">2026 Market Projections</h3>
        <p className="mt-2 text-sm text-slate-600">
          Run enrichment to generate 2026 projections from Census 2021 baseline.
        </p>
      </div>
    )
  }

  const highlights = projections.highlights ?? {}
  const economics = projections.economics ?? {}
  const lifestyle = projections.lifestyle ?? {}
  const infrastructure = projections.infrastructure

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold">2026 Market Projections</h3>
            <p className="text-white/90 mt-1">Based on 5-year growth trends from Census 2021</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Market Heat</div>
            <div className="text-3xl font-bold mt-1">{highlights.marketHeat ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GrowthCard
          title="Population Growth"
          value={highlights.populationGrowth ?? '—'}
          subtitle="2021 → 2026"
          trend="up"
        />
        <GrowthCard
          title="Income Growth"
          value={highlights.incomeGrowth ?? '—'}
          subtitle="Median household income"
          trend="up"
        />
        <GrowthCard
          title="Footfall Boost"
          value={`+${highlights.footfallBoost ?? 0}%`}
          subtitle="From infrastructure projects"
          trend="up"
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h4 className="font-bold text-lg mb-4">Demographics (2026 Projected)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600">High Income (&gt;₹15L)</div>
            <div className="text-3xl font-bold text-green-600">
              {economics.incomeAbove15L != null ? `${Math.round(economics.incomeAbove15L)}%` : '—'}
            </div>
            <div className="text-xs text-gray-500">
              vs {economics.incomeAbove15L != null ? Math.round(economics.incomeAbove15L - 25) : '—'}% in 2021
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Dining Out Frequency</div>
            <div className="text-3xl font-bold text-orange-600">
              {lifestyle.diningOutFrequency2026 != null
                ? `${lifestyle.diningOutFrequency2026}x/week`
                : '—'}
            </div>
            <div className="text-xs text-gray-500">Growing consumer base</div>
          </div>
          {projections.demographics?.totalPopulation != null && (
            <div>
              <div className="text-sm text-gray-600">Total Population</div>
              <div className="text-2xl font-bold text-slate-900">
                {projections.demographics.totalPopulation.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">2026 projected</div>
            </div>
          )}
          {projections.demographics?.medianIncome != null && (
            <div>
              <div className="text-sm text-gray-600">Median Income</div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{(projections.demographics.medianIncome / 100000).toFixed(1)}L
              </div>
              <div className="text-xs text-gray-500">Annual household</div>
            </div>
          )}
        </div>
      </div>

      {infrastructure && (infrastructure.overallBoost ?? 0) > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-3">Infrastructure Development Impact</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            {(infrastructure.metroImpact ?? 0) > 0 && (
              <li>• New metro station planned nearby (+{infrastructure.metroImpact}% footfall)</li>
            )}
            {(infrastructure.roadImpact ?? 0) > 0 && (
              <li>• Road expansion projects (+{infrastructure.roadImpact}% accessibility)</li>
            )}
            {(infrastructure.commercialImpact ?? 0) > 0 && (
              <li>• New commercial development (+{infrastructure.commercialImpact}% activity)</li>
            )}
            <li className="font-semibold">
              Total projected boost: +{infrastructure.overallBoost}% by 2026
            </li>
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Projection confidence: {Math.round((projections.confidence ?? 0) * 100)}% •
        Data source: {projections.methodology ?? '5-year CAGR projection from Census 2021'}
      </div>
    </div>
  )
}

function GrowthCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string
  value: string
  subtitle: string
  trend: string
}) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="text-sm text-gray-600">{title}</div>
      <div
        className={`text-2xl font-bold mt-1 ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  )
}
