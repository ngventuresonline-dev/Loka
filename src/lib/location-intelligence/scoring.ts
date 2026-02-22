/**
 * Derived intelligence & scoring engine
 * Saturation, Demand Gap, Whitespace, Brand Fit
 */

import type { BrandFitWeights } from './weights'
import { DEFAULT_BRAND_FIT_WEIGHTS } from './weights'

/** Saturation Index: competitor_count / max(1, population_density) normalized 0–100 */
export function computeSaturationIndex(
  competitorCount: number,
  populationDensity500m: number = 5000
): number {
  if (competitorCount <= 0) return 0
  const raw = competitorCount / Math.max(1, populationDensity500m / 1000)
  return Math.min(100, Math.round(raw * 100))
}

/** Demand Gap Score: high = underserved (good opportunity) */
export function computeDemandGapScore(
  populationWeighted: number,
  categorySupplyScore: number
): number {
  const gap = Math.max(0, populationWeighted - categorySupplyScore)
  return Math.min(100, Math.round(gap))
}

/** Whitespace Score: high demand + low competition + good footfall */
export function computeWhitespaceScore(
  demandScore: number,
  inverseSaturationScore: number,
  footfallScore: number
): number {
  const w = (demandScore * 0.4 + inverseSaturationScore * 0.4 + footfallScore * 0.2)
  return Math.min(100, Math.round(w))
}

/** Brand Fit Score (weighted combination) */
export function computeBrandFitScore(
  scores: {
    demographicScore: number
    footfallScore: number
    affluenceScore: number
    competitionScore: number
    accessibilityScore: number
  },
  weights: BrandFitWeights = DEFAULT_BRAND_FIT_WEIGHTS
): number {
  const w = weights
  const total =
    w.demographic * scores.demographicScore +
    w.footfall * scores.footfallScore +
    w.affluence * scores.affluenceScore +
    w.competition * scores.competitionScore +
    w.accessibility * scores.accessibilityScore
  return Math.min(100, Math.round(total))
}

/**
 * Monthly revenue projection (gross, before rent/COGS).
 * Formula: daily_footfall × 30 days × (capture_rate/100) × avg_ticket_size
 * Conservative defaults aligned with research: ~1.2% capture (4% entry × 30% purchase),
 * ₹240 avg ticket for cafe/QSR India.
 */
export function estimateMonthlyRevenue(
  dailyFootfall: number,
  captureRatePercent: number = 1.2,
  avgTicketSize: number = 240
): number {
  const dailyRevenue = dailyFootfall * (captureRatePercent / 100) * avgTicketSize
  return Math.round(dailyRevenue * 30)
}
