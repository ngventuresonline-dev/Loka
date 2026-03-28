/**
 * Maps brand industry strings to the 8 canonical cache keys.
 * All synthesis is pre-computed for these 8 categories.
 */
export type IndustryKey =
  | 'cafe'
  | 'qsr'
  | 'restaurant'
  | 'retail'
  | 'salon'
  | 'bakery'
  | 'brewery'
  | 'wellness'

export const INDUSTRY_KEYS: IndustryKey[] = [
  'cafe',
  'qsr',
  'restaurant',
  'retail',
  'salon',
  'bakery',
  'brewery',
  'wellness',
]

export function toIndustryKey(industry: string | null | undefined): IndustryKey {
  const t = (industry || '').toLowerCase()
  if (/cafe|coffee|dessert|beverage|bubble|chai|tea\b/.test(t)) return 'cafe'
  if (/qsr|quick.service|fast.food|takeaway|vada|pav|momo|shawarma|wrap|kiosk|snack/.test(t)) return 'qsr'
  if (/restaurant|dining|casual|fine.dining|north.indian|south.indian|biryani|meals/.test(t)) return 'restaurant'
  if (/retail|fashion|clothing|optical|eyewear|jewel|electronics|store|shop/.test(t)) return 'retail'
  if (/salon|spa|beauty|hair|wellness|skin/.test(t)) return 'salon'
  if (/baker|dessert.brand|patiss|cake|pastry/.test(t)) return 'bakery'
  if (/brew|taproom|bar|pub|craft.beer/.test(t)) return 'brewery'
  if (/fitness|gym|yoga|pilates|health.club/.test(t)) return 'wellness'
  return 'restaurant'
}
