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

  // Over budget - calculate percentage over
  if (monthlyRent > budgetMax) {
    const overAmount = monthlyRent - budgetMax
    const overPercent = overAmount / budgetMax

    // 10% over
    if (overPercent <= 0.1) {
      return 70
    }

    // 20% over
    if (overPercent <= 0.2) {
      return 40
    }

    // More than 20% over
    return 0
  }

  return 0
}

/**
 * Property Type Score (20% weight)
 * - Perfect match (e.g., QSR → Ground floor retail): 100 points
 * - Good match (e.g., Restaurant → Food court): 70 points
 * - Acceptable match: 40 points
 */
function calculatePropertyTypeScore(property: Property, businessType: string): number {
  if (!businessType) {
    return 50 // Default if no business type specified
  }

  const businessLower = businessType.toLowerCase()
  const propertyType = property.propertyType.toLowerCase()

  // Business type to property type mapping
  const perfectMatches: { [key: string]: string[] } = {
    'qsr': ['retail'],
    'café': ['retail', 'restaurant'],
    'cafe': ['retail', 'restaurant'],
    'restaurant': ['restaurant'],
    'bar': ['restaurant'],
    'brewery': ['restaurant'],
    'retail': ['retail'],
    'fashion': ['retail'],
    'boutique': ['retail'],
    'gym': ['office', 'retail'],
    'fitness': ['office', 'retail'],
    'office': ['office'],
    'warehouse': ['warehouse']
  }

  // Check for perfect match
  const compatibleTypes = perfectMatches[businessLower] || ['retail']
  
  if (compatibleTypes.includes(propertyType)) {
    // Check for ground floor preference (for QSR/Retail/Café)
    if (
      (businessLower.includes('qsr') || 
       businessLower.includes('café') || 
       businessLower.includes('cafe') ||
       businessLower.includes('retail')) &&
      (property.amenities.some(a => a.toLowerCase().includes('ground')) ||
       property.amenities.some(a => a.toLowerCase().includes('street facing')))
    ) {
      return 100 // Perfect match
    }
    return 70 // Good match
  }

  // Check for acceptable matches (related types)
  const acceptableMatches: { [key: string]: string[] } = {
    'qsr': ['restaurant'],
    'restaurant': ['retail'],
    'retail': ['restaurant', 'office'],
    'office': ['retail']
  }

  const acceptableTypes = acceptableMatches[businessLower] || []
  if (acceptableTypes.includes(propertyType)) {
    return 40 // Acceptable match
  }

  // No match
  return 0
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
