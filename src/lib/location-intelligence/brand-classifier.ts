/**
 * Classify competitors as Popular (well-known chains) vs New/Emerging brands.
 * Used to prioritize new-age brands in the UI.
 */

const POPULAR_BRAND_PATTERNS = [
  'starbucks', 'cafe coffee day', 'ccd', 'blue tokai', 'third wave coffee', 'chaayos', 'chai point',
  'mcdonald', 'kfc', 'pizza hut', 'domino', 'subway', 'haldiram', 'bikanervala', 'barista',
  'costa coffee', 'dunkin', 'krispy kreme', 'faasos', 'wow momo', 'saravana bhavan', 'sagar ratna',
  'indian coffee house', 'dmart', 'reliance', 'big bazaar', 'pantaloons', 'marks & spencer',
  'tcafe', 'cafe mcc', 'pepperfry', 'urban ladder', 'woodland', 'bata', 'crocs',
  'decathlon', 'ikea', 'miniso', 'westside', 'titan', 'tanishq', 'tata', 'relaxo',
]

export type BrandType = 'popular' | 'new'

export function classifyBrand(name: string, userRatingsTotal?: number): BrandType {
  const n = (name || '').toLowerCase().trim()
  if (!n) return 'new'

  const isKnownChain = POPULAR_BRAND_PATTERNS.some((p) => n.includes(p))
  const hasHighReviewCount = (userRatingsTotal ?? 0) >= 500

  if (isKnownChain || hasHighReviewCount) return 'popular'
  return 'new'
}
