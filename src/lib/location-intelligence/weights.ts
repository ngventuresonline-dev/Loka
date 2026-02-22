/**
 * Configurable weights for Brand Fit Score
 * Per-brand overrides stored in brand_profiles.weight_config_json
 */

export const DEFAULT_BRAND_FIT_WEIGHTS = {
  demographic: 0.25,
  footfall: 0.25,
  affluence: 0.20,
  competition: 0.20,
  accessibility: 0.10,
} as const

export type BrandFitWeights = typeof DEFAULT_BRAND_FIT_WEIGHTS

export function getBrandFitWeights(overrides?: Partial<BrandFitWeights> | null): BrandFitWeights {
  if (!overrides) return DEFAULT_BRAND_FIT_WEIGHTS
  return { ...DEFAULT_BRAND_FIT_WEIGHTS, ...overrides }
}
