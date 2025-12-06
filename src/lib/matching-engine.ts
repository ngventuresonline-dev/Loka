import { BrandProfile, Property, MatchResult } from '@/types/workflow'

// Updated BFI scoring weights as per requirements
const BFI_WEIGHTS = {
  location: 0.30,  // 30%
  size: 0.25,      // 25%
  budget: 0.25,    // 25%
  propertyType: 0.20 // 20%
}

export interface MatchResultWithProperty {
  property: Property
  bfiScore: number
  matchReasons: string[]
  breakdown: {
    locationScore: number
    sizeScore: number
    budgetScore: number
    propertyTypeScore: number
  }
}

/**
 * Calculate BFI (Brand Fit Index) score for a property
 * Based on the new scoring algorithm
 */
export function calculateBFI(
  property: Property,
  filters: {
    businessType?: string
    sizeRange?: { min: number; max: number }
    locations?: string[]
    budgetRange?: { min: number; max: number }
    propertyType?: string
  }
): MatchResultWithProperty {
  // Location Score (30%)
  const locationScore = calculateLocationScore(property, filters.locations || [])
  
  // Size Score (25%)
  const sizeScore = calculateSizeScore(property, filters.sizeRange)
  
  // Budget Score (25%)
  const budgetScore = calculateBudgetScore(property, filters.budgetRange)
  
  // Property Type Score (20%)
  const propertyTypeScore = calculatePropertyTypeScore(property, filters.businessType, filters.propertyType)
  
  // Calculate weighted BFI
  const bfiScore = Math.round(
    locationScore * BFI_WEIGHTS.location +
    sizeScore * BFI_WEIGHTS.size +
    budgetScore * BFI_WEIGHTS.budget +
    propertyTypeScore * BFI_WEIGHTS.propertyType
  )
  
  // Generate match reasons
  const matchReasons = generateMatchReasons({
    locationScore,
    sizeScore,
    budgetScore,
    propertyTypeScore
  }, property, filters)
  
  return {
    property,
    bfiScore,
    matchReasons,
    breakdown: {
      locationScore,
      sizeScore,
      budgetScore,
      propertyTypeScore
    }
  }
}

/**
 * Location Score (30%)
 * - Property location in brand's preferred areas: 100 points
 * - Nearby (same zone): 70 points
 * - Different zone: 30 points
 */
function calculateLocationScore(property: Property, preferredLocations: string[]): number {
  if (!preferredLocations || preferredLocations.length === 0) {
    return 50 // Default score if no location preference
  }
  
  const propertyLocation = property.city.toLowerCase()
  const propertyAddress = property.address.toLowerCase()
  
  // Check if property is in preferred locations
  const isInPreferred = preferredLocations.some(loc => {
    const locLower = loc.toLowerCase()
    return propertyLocation.includes(locLower) || 
           propertyAddress.includes(locLower) ||
           locLower.includes(propertyLocation)
  })
  
  if (isInPreferred) {
    return 100 // Perfect match
  }
  
  // Check if in same zone (Bangalore zones)
  const bangaloreZones: { [key: string]: string[] } = {
    'central': ['mg road', 'brigade road', 'church street', 'commercial street'],
    'south': ['koramangala', 'jayanagar', 'btm', 'hsr', 'indiranagar'],
    'east': ['whitefield', 'marathahalli', 'hebbal', 'kundalahalli'],
    'north': ['hebbal', 'yelahanka', 'sahakar nagar'],
    'west': ['rajajinagar', 'malleswaram', 'yeshwanthpur']
  }
  
  // Find zone for property
  let propertyZone: string | null = null
  for (const [zone, areas] of Object.entries(bangaloreZones)) {
    if (areas.some(area => propertyLocation.includes(area) || propertyAddress.includes(area))) {
      propertyZone = zone
      break
    }
  }
  
  // Find zone for preferred locations
  let preferredZone: string | null = null
  for (const [zone, areas] of Object.entries(bangaloreZones)) {
    if (preferredLocations.some(loc => areas.some(area => loc.toLowerCase().includes(area)))) {
      preferredZone = zone
      break
    }
  }
  
  if (propertyZone && preferredZone && propertyZone === preferredZone) {
    return 70 // Same zone
  }
  
  return 30 // Different zone
}

/**
 * Size Score (25%)
 * - Exact match (±10%): 100 points
 * - Close match (±20%): 70 points
 * - Acceptable (±40%): 40 points
 */
function calculateSizeScore(property: Property, sizeRange?: { min: number; max: number }): number {
  if (!sizeRange || (!sizeRange.min && !sizeRange.max)) {
    return 50 // Default if no size preference
  }
  
  const propertySize = property.size
  const { min, max } = sizeRange
  
  // Use average if only one bound provided
  const targetSize = min && max ? (min + max) / 2 : (min || max || propertySize)
  const tolerance = targetSize * 0.1 // 10% tolerance
  
  // Exact match (±10%)
  if (propertySize >= targetSize - tolerance && propertySize <= targetSize + tolerance) {
    return 100
  }
  
  const tolerance20 = targetSize * 0.2 // 20% tolerance
  // Close match (±20%)
  if (propertySize >= targetSize - tolerance20 && propertySize <= targetSize + tolerance20) {
    return 70
  }
  
  const tolerance40 = targetSize * 0.4 // 40% tolerance
  // Acceptable (±40%)
  if (propertySize >= targetSize - tolerance40 && propertySize <= targetSize + tolerance40) {
    return 40
  }
  
  // Also check if within min-max range
  if (min && max && propertySize >= min && propertySize <= max) {
    return 100
  }
  
  return 20 // Poor match
}

/**
 * Budget Score (25%)
 * - Within budget: 100 points
 * - Slightly over (10%): 70 points
 * - Moderately over (20%): 40 points
 */
function calculateBudgetScore(property: Property, budgetRange?: { min: number; max: number }): number {
  if (!budgetRange || (!budgetRange.min && !budgetRange.max)) {
    return 50 // Default if no budget preference
  }
  
  // Convert property price to monthly if needed
  let monthlyPrice = property.price
  if (property.priceType === 'yearly') {
    monthlyPrice = property.price / 12
  } else if (property.priceType === 'sqft') {
    monthlyPrice = property.price * property.size // Approximate
  }
  
  const { min, max } = budgetRange
  
  // Within budget
  if (monthlyPrice >= (min || 0) && monthlyPrice <= (max || Infinity)) {
    return 100
  }
  
  // Slightly over (10%)
  if (max && monthlyPrice > max) {
    const overRatio = (monthlyPrice - max) / max
    if (overRatio <= 0.1) {
      return 70
    }
    if (overRatio <= 0.2) {
      return 40
    }
  }
  
  // Under budget (good, but score slightly lower)
  if (min && monthlyPrice < min) {
    const underRatio = monthlyPrice / min
    return Math.max(60, Math.round(underRatio * 100))
  }
  
  return 30 // Poor match
}

/**
 * Property Type Score (20%)
 * - Perfect match (QSR → retail ground floor): 100 points
 * - Good match (restaurant → food court): 70 points
 * - Acceptable: 40 points
 */
function calculatePropertyTypeScore(
  property: Property,
  businessType?: string,
  preferredPropertyType?: string
): number {
  // If specific property type preferred, check match
  if (preferredPropertyType) {
    if (property.propertyType === preferredPropertyType) {
      return 100
    }
    return 40
  }
  
  // Business type to property type mapping
  const businessTypeMapping: { [key: string]: string[] } = {
    'café': ['retail', 'restaurant'],
    'qsr': ['retail'],
    'restaurant': ['restaurant', 'retail'],
    'bar': ['restaurant', 'retail'],
    'brewery': ['restaurant', 'retail'],
    'retail': ['retail'],
    'gym': ['office', 'retail'],
    'fitness': ['office', 'retail'],
    'entertainment': ['retail', 'office']
  }
  
  if (!businessType) {
    return 50 // Default
  }
  
  const businessLower = businessType.toLowerCase()
  const compatibleTypes = businessTypeMapping[businessLower] || ['retail']
  
  if (compatibleTypes.includes(property.propertyType)) {
    // Check for ground floor preference (for QSR/Retail)
    if ((businessLower.includes('qsr') || businessLower.includes('café') || businessLower.includes('retail')) &&
        property.amenities.some(a => a.toLowerCase().includes('ground'))) {
      return 100 // Perfect match
    }
    return 70 // Good match
  }
  
  return 40 // Acceptable
}

/**
 * Generate human-readable match reasons
 */
function generateMatchReasons(
  scores: {
    locationScore: number
    sizeScore: number
    budgetScore: number
    propertyTypeScore: number
  },
  property: Property,
  filters: any
): string[] {
  const reasons: string[] = []
  
  // Location reasons
  if (scores.locationScore === 100) {
    reasons.push(`Perfect location match - in ${property.city}`)
  } else if (scores.locationScore >= 70) {
    reasons.push(`Good location - nearby your preferred areas`)
  }
  
  // Budget reasons
  if (scores.budgetScore >= 80) {
    const monthlyPrice = property.priceType === 'yearly' ? property.price / 12 : property.price
    reasons.push(`Great value - ₹${Math.round(monthlyPrice).toLocaleString()}/month within your budget`)
  } else if (scores.budgetScore >= 60) {
    reasons.push(`Close to your budget range`)
  }
  
  // Size reasons
  if (scores.sizeScore >= 80) {
    const businessType = filters.businessType || 'your business'
    reasons.push(`Ideal size - ${property.size.toLocaleString()} sqft perfect for ${businessType}`)
  } else if (scores.sizeScore >= 60) {
    reasons.push(`Good size match - ${property.size.toLocaleString()} sqft`)
  }
  
  // Property type reasons
  if (scores.propertyTypeScore >= 80) {
    reasons.push(`Perfect property type for your business`)
  }
  
  // Additional property features
  if (property.amenities.some(a => a.toLowerCase().includes('parking'))) {
    reasons.push(`Parking available`)
  }
  
  if (property.amenities.some(a => a.toLowerCase().includes('ground'))) {
    reasons.push(`Ground floor - high visibility`)
  }
  
  if (property.condition === 'excellent') {
    reasons.push(`Property in excellent condition`)
  }
  
  return reasons.slice(0, 5) // Limit to 5 reasons
}

/**
 * Find and rank properties by BFI score
 */
export function findMatches(
  properties: Property[],
  filters: {
    businessType?: string
    sizeRange?: { min: number; max: number }
    locations?: string[]
    budgetRange?: { min: number; max: number }
    propertyType?: string
  }
): MatchResultWithProperty[] {
  const matches = properties
    .map(property => calculateBFI(property, filters))
    .filter(match => match.bfiScore >= 30) // Filter out poor matches
    .sort((a, b) => b.bfiScore - a.bfiScore) // Sort by BFI descending
  
  return matches
}
