/**
 * Classify competitors as Popular (well-known chains) vs New/Emerging brands.
 * Used to prioritize new-age brands in the UI.
 */

export const POPULAR_BRAND_PATTERNS = [
  'starbucks', 'cafe coffee day', 'ccd', 'blue tokai', 'third wave coffee', 'chaayos', 'chai point',
  'mcdonald', 'kfc', 'pizza hut', 'domino', 'subway', 'haldiram', 'bikanervala', 'barista',
  'costa coffee', 'dunkin', 'krispy kreme', 'faasos', 'wow momo', 'saravana bhavan', 'sagar ratna',
  'indian coffee house', 'dmart', 'reliance', 'big bazaar', 'pantaloons', 'marks & spencer',
  'tcafe', 'cafe mcc', 'pepperfry', 'urban ladder', 'woodland', 'bata', 'crocs',
  'decathlon', 'ikea', 'miniso', 'westside', 'titan', 'tanishq', 'tata', 'relaxo',
  // Optical / eyewear (India)
  'lenskart', 'titan eye', 'eye plus', 'vision express', 'specsmakers', 'lawrence & mayo', 'lawrence and mayo',
  'gkb optical', 'john jacobs', 'aqualens', 'coolwinks', 'cleardekho', 'iyoga', 'himalaya optical',
  // Pharmacy / beauty chains
  'apollo pharmacy', 'medplus', 'nettmeds', 'wellness forever',
]

export type BrandType = 'popular' | 'new'

export function classifyBrand(name: string, userRatingsTotal?: number): BrandType {
  const n = (name || '').toLowerCase().trim()
  if (!n) return 'new'

  const isKnownChain = POPULAR_BRAND_PATTERNS.some((p) => n.includes(p))
  const hasHighReviewCount = (userRatingsTotal ?? 0) >= 200

  if (isKnownChain || hasHighReviewCount) return 'popular'
  return 'new'
}
