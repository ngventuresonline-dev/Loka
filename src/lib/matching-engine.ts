import { Property } from '@/types/workflow'

/**
 * BFI (Brand Fit Index) Scoring Algorithm
 * Calculates how well a property matches a brand's requirements
 */

interface BrandRequirements {
  locations: string[]
  sizeMin: number
  sizeMax: number
  budgetMin: number
  budgetMax: number
  businessType: string
}

interface BFIScore {
  score: number
  breakdown: {
    locationScore: number
    sizeScore: number
    budgetScore: number
    typeScore: number
  }
}

/**
 * Calculate BFI score for a property based on brand requirements
 * 
 * @param property - The property to score
 * @param brandRequirements - Brand's requirements and preferences
 * @returns BFI score (0-100) and breakdown of component scores
 */
export function calculateBFI(
  property: Property,
  brandRequirements: BrandRequirements
): BFIScore {
  // Calculate individual component scores
  const locationScore = calculateLocationScore(property, brandRequirements.locations)
  const sizeScore = calculateSizeScore(property, brandRequirements.sizeMin, brandRequirements.sizeMax)
  const budgetScore = calculateBudgetScore(property, brandRequirements.budgetMin, brandRequirements.budgetMax)
  const typeScore = calculatePropertyTypeScore(property, brandRequirements.businessType)

  // Calculate weighted BFI score
  const score = Math.round(
    locationScore * 0.3 +  // 30% weight
    sizeScore * 0.25 +     // 25% weight
    budgetScore * 0.25 +   // 25% weight
    typeScore * 0.2        // 20% weight
  )

  return {
    score: Math.max(0, Math.min(100, score)), // Clamp between 0-100
    breakdown: {
      locationScore,
      sizeScore,
      budgetScore,
      typeScore
    }
  }
}

/**
 * Location Score (30% weight)
 * - Property in brand's preferred locations: 100 points
 * - Property in same zone but different area: 70 points
 * - Property in different zone: 30 points
 */
function calculateLocationScore(property: Property, preferredLocations: string[]): number {
  if (!preferredLocations || preferredLocations.length === 0) {
    return 50 // Default if no location preference
  }

  const propertyCity = property.city.toLowerCase()
  const propertyAddress = property.address.toLowerCase()

  // Check if property is in preferred locations
  const isInPreferred = preferredLocations.some(loc => {
    const locLower = loc.toLowerCase()
    return (
      propertyCity.includes(locLower) ||
      propertyAddress.includes(locLower) ||
      locLower.includes(propertyCity)
    )
  })

  if (isInPreferred) {
    return 100 // Perfect match - in preferred location
  }

  // Check if in same zone (Bangalore zones)
  const bangaloreZones: { [key: string]: string[] } = {
    'central': ['mg road', 'brigade road', 'church street', 'commercial street', 'cubbon park'],
    'south': ['koramangala', 'jayanagar', 'btm', 'hsr', 'indiranagar', 'btm layout', 'hsr layout'],
    'east': ['whitefield', 'marathahalli', 'hebbal', 'kundalahalli', 'varthur'],
    'north': ['hebbal', 'yelahanka', 'sahakar nagar', 'yeshwanthpur'],
    'west': ['rajajinagar', 'malleswaram', 'yeshwanthpur', 'vijayanagar']
  }

  // Find zone for property
  let propertyZone: string | null = null
  for (const [zone, areas] of Object.entries(bangaloreZones)) {
    if (areas.some(area => 
      propertyCity.includes(area) || 
      propertyAddress.includes(area)
    )) {
      propertyZone = zone
      break
    }
  }

  // Find zone for preferred locations
  let preferredZone: string | null = null
  for (const [zone, areas] of Object.entries(bangaloreZones)) {
    if (preferredLocations.some(loc => 
      areas.some(area => loc.toLowerCase().includes(area))
    )) {
      preferredZone = zone
      break
    }
  }

  // Same zone but different area
  if (propertyZone && preferredZone && propertyZone === preferredZone) {
    return 70
  }

  // Different zone
  return 30
}

/**
 * Size Score (25% weight)
 * - Property size within ±10% of brand requirement: 100 points
 * - Property size within ±20% of brand requirement: 70 points
 * - Property size within ±40% of brand requirement: 40 points
 * - Outside range: 0 points
 */
function calculateSizeScore(property: Property, sizeMin: number, sizeMax: number): number {
  const propertySize = property.size
  const targetSize = (sizeMin + sizeMax) / 2
  const sizeRange = sizeMax - sizeMin

  // Check if within exact range first
  if (propertySize >= sizeMin && propertySize <= sizeMax) {
    return 100
  }

  // Calculate percentage difference from target
  const percentDiff = Math.abs((propertySize - targetSize) / targetSize)

  // Within ±10%
  if (percentDiff <= 0.1) {
    return 100
  }

  // Within ±20%
  if (percentDiff <= 0.2) {
    return 70
  }

  // Within ±40%
  if (percentDiff <= 0.4) {
    return 40
  }

  // Outside range
  return 0
}

/**
 * Budget Score (25% weight)
 * - Rent within brand's budget: 100 points
 * - Rent 10% over budget: 70 points
 * - Rent 20% over budget: 40 points
 * - More than 20% over (or below minimum budget): 0 points
 */
function calculateBudgetScore(property: Property, budgetMin: number, budgetMax: number): number {
  // Convert property price to monthly rent
  let monthlyRent = property.price
  if (property.priceType === 'yearly') {
    monthlyRent = property.price / 12
  } else if (property.priceType === 'sqft') {
    monthlyRent = property.price * property.size // Approximate monthly
  }

  // Within budget
  if (monthlyRent >= budgetMin && monthlyRent <= budgetMax) {
    return 100
  }

  // Over budget - calculate percentage over (still give some score so "in your area but expensive" can show)
  if (monthlyRent > budgetMax && budgetMax > 0) {
    const overAmount = monthlyRent - budgetMax
    const overPercent = overAmount / budgetMax

    if (overPercent <= 0.1) return 70
    if (overPercent <= 0.2) return 40
    if (overPercent <= 0.5) return 25  // 20–50% over: still show with lower score
    if (overPercent <= 1) return 15    // 50–100% over: show so preferred-area options appear
    return 10                           // 100%+ over: minimal score but still visible
  }

  return 0
}

/**
 * Property Type Score (20% weight)
 * - Office → office only (no F&B). Fitness/Gym → gym-relevant (office, retail), NOT restaurant.
 * - F&B → restaurant, retail. Retail → retail.
 * - Perfect match: 100. Good: 70. Acceptable: 40. Wrong type: 0.
 */
function calculatePropertyTypeScore(property: Property, businessType: string): number {
  if (!businessType) {
    return 50 // Default if no business type specified
  }

  const businessLower = businessType.toLowerCase()
  const propertyType = (property.propertyType || '').toLowerCase()
  const rawAmenities = property.amenities
  const amenitiesArr = Array.isArray(rawAmenities) ? rawAmenities : (rawAmenities && typeof rawAmenities === 'object' && Array.isArray((rawAmenities as any).features) ? (rawAmenities as any).features : [])
  const amenityStr = amenitiesArr.map((a: any) => String(a || '').toLowerCase()).join(' ')

  // STRICT: Office space → office only. Do NOT match restaurant/F&B.
  if (businessLower.includes('office') || businessLower.includes('coworking') || businessLower.includes('it park') || businessLower.includes('business park')) {
    return propertyType === 'office' ? 100 : 0
  }

  // Fitness, Gym, Sports → office or retail (gym-friendly). NOT restaurant.
  if (businessLower.includes('fitness') || businessLower.includes('gym') || businessLower.includes('sports facility') || businessLower.includes('yoga') || businessLower.includes('wellness')) {
    if (propertyType === 'restaurant') return 0
    if (propertyType === 'office' || propertyType === 'retail') return 100
    if (propertyType === 'other' && (amenityStr.includes('parking') || amenityStr.includes('high ceiling'))) return 70
    return propertyType === 'warehouse' ? 40 : 0
  }

  // F&B types → restaurant or retail (ground floor preferred)
  const fnbTypes = ['restaurant', 'café', 'cafe', 'qsr', 'bar', 'brewery', 'food court', 'bakery', 'dessert']
  const isFnb = fnbTypes.some(t => businessLower.includes(t))
  if (isFnb) {
    if (propertyType === 'restaurant') return 100
    if (propertyType === 'retail') {
      const hasGround = amenityStr.includes('ground') || amenityStr.includes('street facing')
      return hasGround ? 100 : 70
    }
    if (propertyType === 'other') return 40
    if (propertyType === 'office') return 20 // Office can sometimes work for café
    return 0
  }

  // Retail, Fashion, Boutique → retail preferred
  if (businessLower.includes('retail') || businessLower.includes('fashion') || businessLower.includes('boutique') || businessLower.includes('showroom')) {
    if (propertyType === 'retail') return 100
    if (propertyType === 'restaurant' || propertyType === 'office') return 40
    return 0
  }

  // Warehouse, Logistics → warehouse only
  if (businessLower.includes('warehouse') || businessLower.includes('logistics') || businessLower.includes('storage')) {
    return propertyType === 'warehouse' ? 100 : (propertyType === 'other' ? 40 : 0)
  }

  // Entertainment → flexible (retail, office, restaurant)
  if (businessLower.includes('entertainment') || businessLower.includes('gaming')) {
    if (['retail', 'office', 'restaurant'].includes(propertyType)) return 70
    return propertyType === 'other' ? 40 : 0
  }

  // Service, Salon, Clinic, etc. → retail or office
  if (businessLower.includes('service') || businessLower.includes('salon') || businessLower.includes('clinic') || businessLower.includes('spa')) {
    if (propertyType === 'retail' || propertyType === 'office') return 100
    return propertyType === 'other' ? 40 : 0
  }

  // Fallback for custom/Other business types
  return 50
}

/**
 * Find and rank properties by BFI score
 * Helper function to calculate BFI for multiple properties
 */
export function findMatches(
  properties: Property[],
  brandRequirements: BrandRequirements
): Array<{ property: Property; bfiScore: BFIScore }> {
  return properties
    .map(property => ({
      property,
      bfiScore: calculateBFI(property, brandRequirements)
    }))
    .filter(result => result.bfiScore.score >= 30) // Filter out poor matches
    .sort((a, b) => b.bfiScore.score - a.bfiScore.score) // Sort by BFI descending
}
