/**
 * Location-aware spend profiles for Bengaluru.
 * Business districts (Indiranagar, Brigade Road, Lavelle Road) support higher spends.
 * Residential areas (Jayanagar, JP Nagar) cap spend — e.g. people won't spend ₹5k even at five-star in Jayanagar.
 */

export type LocationProfile = 'business' | 'mixed' | 'residential'

const BUSINESS_LOCALITIES = [
  'brigade road', 'lavelle road', 'mg road', 'indiranagar', 'koramangala 4th block',
  'koramangala 5th block', 'whitefield', 'ub city', 'cunningham road', 'residency road',
  'st marks road', 'commercial street', 'koramangala 1st block', 'hsr sector',
]

const RESIDENTIAL_LOCALITIES = [
  'jayanagar', 'jp nagar', 'btm layout', 'hsr layout', 'electronic city',
  'marathahalli', 'sarakki', 'banashankari', 'basavanagudi', 'malleshwaram',
  'rajajinagar', 'yeshwanthpur', 'hebbal', 'yelahanka', 'vijayanagar',
  'kasturi nagar', 'rammurthy nagar', 'ramamurthy nagar', 'hegde nagar',
  'hessarghatta', 'hulimavu', 'kalyan nagar', 'thanisandra',
]

export function getLocationProfile(locality: string): LocationProfile {
  const loc = (locality || '').toLowerCase().trim()
  if (!loc) return 'mixed'
  if (BUSINESS_LOCALITIES.some((b) => loc.includes(b))) return 'business'
  if (RESIDENTIAL_LOCALITIES.some((r) => loc.includes(r))) return 'residential'
  return 'mixed'
}

/** Multiplier and caps for each profile. Applied to benchmark min/max/avg. */
export function getLocationSpendAdjustment(profile: LocationProfile): {
  multiplier: number
  /** Max spend caps by category key (cafe, casual_dining, fine_dining, etc.) — premium tier only */
  premiumCaps: Partial<Record<string, number>>
} {
  switch (profile) {
    case 'business':
      return { multiplier: 1.0, premiumCaps: {} }
    case 'mixed':
      return {
        multiplier: 0.85,
        premiumCaps: {
          cafe: 450,
          casual_dining: 800,
          fine_dining: 3500,
          brewery_taproom: 1200,
        },
      }
    case 'residential':
      return {
        multiplier: 0.7,
        premiumCaps: {
          cafe: 400,
          casual_dining: 650,
          fine_dining: 2500,
          brewery_taproom: 900,
          qsr: 350,
        },
      }
    default:
      return { multiplier: 1.0, premiumCaps: {} }
  }
}

export type SpendTier = 'budget' | 'mid' | 'premium'
export type BrandCategory = 'cafe' | 'qsr' | 'casual_dining' | 'fine_dining' | 'brewery_taproom' | 'retail' | 'salon'

export function getLocationAdjustedBenchmarks(
  locality: string,
  baseBenchmarks: Record<BrandCategory, Record<SpendTier, { min: number; max: number; avg: number }>>
): Record<BrandCategory, Record<SpendTier, { min: number; max: number; avg: number }>> {
  const profile = getLocationProfile(locality)
  const { multiplier, premiumCaps } = getLocationSpendAdjustment(profile)

  const out = {} as Record<BrandCategory, Record<SpendTier, { min: number; max: number; avg: number }>>

  for (const [cat, tiers] of Object.entries(baseBenchmarks) as [BrandCategory, Record<SpendTier, { min: number; max: number; avg: number }>][]) {
    out[cat] = {} as Record<SpendTier, { min: number; max: number; avg: number }>
    for (const [tier, vals] of Object.entries(tiers) as [SpendTier, { min: number; max: number; avg: number }][]) {
      let min = Math.round(vals.min * multiplier)
      let max = Math.round(vals.max * multiplier)
      let avg = Math.round(vals.avg * multiplier)
      const cap = premiumCaps[cat]
      if (tier === 'premium' && cap != null) {
        min = Math.min(min, cap)
        max = Math.min(max, cap)
        avg = Math.min(avg, cap)
      }
      out[cat][tier] = { min, max, avg }
    }
  }
  return out
}
