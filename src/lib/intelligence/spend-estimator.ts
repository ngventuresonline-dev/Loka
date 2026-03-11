import { getBrandTier } from './brand-tier-map'
import { SPEND_BENCHMARKS, SpendTier, BrandCategory } from './spend-benchmarks'
import { getLocationAdjustedBenchmarks } from './location-spend-profile'

interface NearbyBrand {
  name: string
  category: string
}

interface SpendEstimate {
  spendTier: SpendTier
  avgSpendPerVisit: number
  spendRange: { min: number; max: number }
  brandMixBreakdown: { budget: number; mid: number; premium: number }
  marketGap: boolean
  marketGapNote?: string
  confidence: 'high' | 'medium' | 'low'
}

export function estimateCategorySpend(
  nearbyBrands: NearbyBrand[],
  targetCategory: BrandCategory,
  wardMedianIncome: number,
  locality?: string
): SpendEstimate {
  const benchmarks = locality
    ? getLocationAdjustedBenchmarks(locality, SPEND_BENCHMARKS)
    : SPEND_BENCHMARKS
  // Count tiers from nearby brands
  const tierCounts = { budget: 0, mid: 0, premium: 0, unknown: 0 }

  for (const brand of nearbyBrands) {
    const tier = getBrandTier(brand.name)
    if (tier) tierCounts[tier]++
    else tierCounts.unknown++
  }

  const total = tierCounts.budget + tierCounts.mid + tierCounts.premium

  // If no recognizable brands, fall back to income-based tier
  if (total === 0) {
    const incomeTier: SpendTier = wardMedianIncome > 1500000 ? 'premium'
      : wardMedianIncome > 800000 ? 'mid'
      : 'budget'
    const benchmark = benchmarks[targetCategory][incomeTier]
    return {
      spendTier: incomeTier,
      avgSpendPerVisit: benchmark.avg,
      spendRange: { min: benchmark.min, max: benchmark.max },
      brandMixBreakdown: { budget: 0, mid: 0, premium: 0 },
      marketGap: false,
      confidence: 'low',
    }
  }

  // Determine dominant tier from brand mix
  const premiumRatio = tierCounts.premium / total
  const budgetRatio = tierCounts.budget / total

  let spendTier: SpendTier
  if (premiumRatio >= 0.5) spendTier = 'premium'
  else if (budgetRatio >= 0.6) spendTier = 'budget'
  else spendTier = 'mid'

  // Market gap detection
  const incomeExpected: SpendTier = wardMedianIncome > 1500000 ? 'premium'
    : wardMedianIncome > 800000 ? 'mid'
    : 'budget'
  const tierRank = { budget: 0, mid: 1, premium: 2 }
  const marketGap = tierRank[incomeExpected] - tierRank[spendTier] >= 2

  const benchmark = benchmarks[targetCategory][spendTier]

  return {
    spendTier,
    avgSpendPerVisit: benchmark.avg,
    spendRange: { min: benchmark.min, max: benchmark.max },
    brandMixBreakdown: { budget: tierCounts.budget, mid: tierCounts.mid, premium: tierCounts.premium },
    marketGap,
    marketGapNote: marketGap
      ? `Area income supports ${incomeExpected}-tier spend but only ${spendTier}-tier brands present — underserved opportunity`
      : undefined,
    confidence: total >= 5 ? 'high' : total >= 2 ? 'medium' : 'low',
  }
}
