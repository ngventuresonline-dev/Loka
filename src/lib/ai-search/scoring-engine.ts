/**
 * Dual AI Scoring Engine
 * Calculates BFI (Brand Fit Index) and PFI (Property Fit Index)
 */

import { BrandRequirements, OwnerRequirements, BFIScore, PFIScore, FinalScore, ScoredMatch } from './types'
import { MockProperty } from '@/lib/mockDatabase'

/**
 * Calculate BFI (Brand Fit Index) - How well PROPERTY matches BRAND
 */
export function calculateBFI(
  brand: Partial<BrandRequirements>,
  property: MockProperty
): BFIScore {
  const scores: any = {}
  
  // Area Match (20% weight)
  scores.areaMatch = calculateAreaScore(brand.area, property.size) * 0.20
  
  // Location Match (25% weight)
  scores.locationMatch = calculateLocationScore(brand.location, property) * 0.25
  
  // Budget Match (15% weight)
  scores.budgetMatch = calculateBudgetScore(brand.budget, property.price) * 0.15
  
  // Footfall Match (20% weight) - simplified for now
  scores.footfallMatch = 0.8 * 0.20  // Default high score
  
  // Competition Match (10% weight) - simplified
  scores.competitionMatch = 0.7 * 0.10
  
  // Infrastructure Match (10% weight)
  scores.infrastructureMatch = calculateInfrastructureScore(brand.infrastructure, property) * 0.10
  
  const overall = Object.values(scores).reduce((a: number, b: number) => a + b, 0)
  
  return {
    overall,
    breakdown: scores,
    confidence: calculateConfidence(brand, property),
    areaMatch: scores.areaMatch,
    locationMatch: scores.locationMatch,
    budgetMatch: scores.budgetMatch,
    footfallMatch: scores.footfallMatch,
    competitionMatch: scores.competitionMatch,
    infrastructureMatch: scores.infrastructureMatch
  }
}

/**
 * Calculate PFI (Property Fit Index) - How well BRAND matches PROPERTY
 */
export function calculatePFI(
  property: Partial<OwnerRequirements>,
  brand: Partial<BrandRequirements>
): PFIScore {
  const scores: any = {}
  
  // Category Match (25% weight)
  scores.categoryMatch = calculateCategoryScore(property.desiredTenant, brand.brandProfile) * 0.25
  
  // Brand Reputation (20% weight) - simplified
  scores.reputationMatch = 0.8 * 0.20
  
  // Rent Affordability (20% weight)
  scores.rentAffordability = calculateAffordabilityScore(property.rentExpectations, brand.budget) * 0.20
  
  // Footfall Requirement (15% weight) - simplified
  scores.footfallFit = 0.7 * 0.15
  
  // Demographics Match (10% weight) - simplified
  scores.demographicsMatch = 0.75 * 0.10
  
  // Space Utilization (10% weight)
  scores.spaceUtilization = calculateSpaceUtilization(property.property, brand.area) * 0.10
  
  const overall = Object.values(scores).reduce((a: number, b: number) => a + b, 0)
  
  return {
    overall,
    breakdown: scores,
    confidence: 0.8,
    categoryMatch: scores.categoryMatch,
    reputationMatch: scores.reputationMatch,
    rentAffordability: scores.rentAffordability,
    footfallFit: scores.footfallFit,
    demographicsMatch: scores.demographicsMatch,
    spaceUtilization: scores.spaceUtilization
  }
}

/**
 * Calculate final match score
 */
export function calculateFinalMatchScore(
  bfi: BFIScore,
  pfi: PFIScore,
  entityType: 'brand' | 'owner'
): FinalScore {
  // For brands searching: BFI weighted higher
  // For owners searching: PFI weighted higher
  const weights = entityType === 'brand' 
    ? { bfi: 0.70, pfi: 0.30 }
    : { bfi: 0.30, pfi: 0.70 }
  
  const finalScore = (bfi.overall * weights.bfi) + (pfi.overall * weights.pfi)
  
  return {
    matchScore: Math.round(finalScore * 100),  // 0-100
    bfi,
    pfi,
    confidence: Math.min(bfi.confidence, pfi.confidence),
    recommendation: generateRecommendation(finalScore)
  }
}

// ============================================================================
// HELPER SCORING FUNCTIONS
// ============================================================================

function calculateAreaScore(
  areaReq?: { min?: number; max?: number; preferred?: number },
  propertySize?: number
): number {
  if (!areaReq || !propertySize) return 0.5
  
  const { min = 0, max = Infinity, preferred } = areaReq
  
  if (preferred) {
    const diff = Math.abs(propertySize - preferred) / preferred
    return Math.max(0, 1 - diff * 2)  // Penalize difference
  }
  
  if (propertySize >= min && propertySize <= max) {
    return 1.0
  }
  
  // Partial match
  if (propertySize < min) {
    return Math.max(0, propertySize / min)
  }
  
  if (propertySize > max) {
    return Math.max(0, max / propertySize)
  }
  
  return 0.5
}

function calculateLocationScore(
  locationReq?: { city?: string; areas?: string[] },
  property?: MockProperty
): number {
  if (!locationReq || !property) return 0.5
  
  let score = 0
  
  // City match
  if (locationReq.city && property.city.toLowerCase().includes(locationReq.city.toLowerCase())) {
    score += 0.5
  }
  
  // Area match
  if (locationReq.areas && locationReq.areas.length > 0) {
    const areaMatch = locationReq.areas.some(area => 
      property.address.toLowerCase().includes(area.toLowerCase()) ||
      property.city.toLowerCase().includes(area.toLowerCase())
    )
    if (areaMatch) score += 0.5
  }
  
  return score || 0.3  // Default partial score
}

function calculateBudgetScore(
  budgetReq?: { monthlyRent?: { min?: number; max?: number } },
  propertyPrice?: number
): number {
  if (!budgetReq?.monthlyRent || !propertyPrice) return 0.5
  
  const { min = 0, max = Infinity } = budgetReq.monthlyRent
  
  if (propertyPrice >= min && propertyPrice <= max) {
    return 1.0
  }
  
  // Partial match - closer is better
  if (propertyPrice < min) {
    return Math.max(0, propertyPrice / min)
  }
  
  if (propertyPrice > max) {
    return Math.max(0, max / propertyPrice)
  }
  
  return 0.5
}

function calculateInfrastructureScore(
  infraReq?: any,
  property?: MockProperty
): number {
  if (!infraReq || !property) return 0.5
  
  let score = 0
  let factors = 0
  
  // Check amenities match
  if (infraReq.water && property.amenities.some(a => a.toLowerCase().includes('water'))) {
    score += 0.2
    factors++
  }
  
  if (infraReq.exhaust && property.amenities.some(a => a.toLowerCase().includes('exhaust'))) {
    score += 0.2
    factors++
  }
  
  if (property.parking) {
    score += 0.3
    factors++
  }
  
  if (property.amenities.some(a => a.toLowerCase().includes('ac'))) {
    score += 0.3
    factors++
  }
  
  return factors > 0 ? score : 0.5
}

function calculateCategoryScore(
  desiredTenant?: { categories?: string[] },
  brandProfile?: { category?: string }
): number {
  if (!desiredTenant?.categories || !brandProfile?.category) return 0.5
  
  const match = desiredTenant.categories.some(cat => 
    cat.toLowerCase() === brandProfile.category?.toLowerCase()
  )
  
  return match ? 1.0 : 0.3
}

function calculateAffordabilityScore(
  rentExpectations?: { monthlyRent?: number },
  budget?: { monthlyRent?: { min?: number; max?: number } }
): number {
  if (!rentExpectations?.monthlyRent || !budget?.monthlyRent) return 0.5
  
  const rent = rentExpectations.monthlyRent
  const { min = 0, max = Infinity } = budget.monthlyRent
  
  if (rent >= min && rent <= max) {
    return 1.0
  }
  
  // Partial match
  if (rent < min) {
    return Math.max(0, rent / min)
  }
  
  if (rent > max) {
    return Math.max(0, max / rent)
  }
  
  return 0.5
}

function calculateSpaceUtilization(
  property?: { area?: number },
  areaReq?: { min?: number; max?: number }
): number {
  if (!property?.area || !areaReq) return 0.5
  
  return calculateAreaScore(areaReq, property.area)
}

function calculateConfidence(
  brand: Partial<BrandRequirements>,
  property: MockProperty
): number {
  let confidence = 0.5
  
  // Higher confidence if more requirements are specified
  if (brand.area) confidence += 0.1
  if (brand.location) confidence += 0.1
  if (brand.budget) confidence += 0.1
  if (brand.propertyType) confidence += 0.1
  if (brand.brandProfile) confidence += 0.1
  
  return Math.min(1.0, confidence)
}

function generateRecommendation(score: number): string {
  if (score >= 0.8) {
    return 'Excellent match! Highly recommended.'
  } else if (score >= 0.6) {
    return 'Good match with minor considerations.'
  } else if (score >= 0.4) {
    return 'Moderate match - some requirements may not be fully met.'
  } else {
    return 'Limited match - consider alternatives.'
  }
}

