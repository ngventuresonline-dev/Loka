import { BrandProfile, Property, MatchResult, MatchingPreferences } from '@/types/workflow'

// Default matching weights
const DEFAULT_WEIGHTS: MatchingPreferences['weights'] = {
  location: 0.25,
  budget: 0.25,
  size: 0.20,
  amenities: 0.15,
  demographics: 0.10,
  competitors: 0.05
}

export class MatchingEngine {
  private weights: MatchingPreferences['weights']

  constructor(customWeights?: Partial<MatchingPreferences['weights']>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...customWeights }
  }

  /**
   * Calculate BFI (Brand Fit Index) - How well a property matches a brand's needs
   */
  calculateBrandFitIndex(brand: BrandProfile, property: Property): MatchResult {
    const breakdown = {
      locationMatch: this.calculateLocationMatch(brand, property),
      budgetMatch: this.calculateBudgetMatch(brand, property),
      sizeMatch: this.calculateSizeMatch(brand, property),
      amenityMatch: this.calculateAmenityMatch(brand, property),
      demographicMatch: this.calculateDemographicMatch(brand, property),
      competitorMatch: this.calculateCompetitorMatch(brand, property)
    }

    // Calculate weighted score
    const score = Math.round(
      breakdown.locationMatch * this.weights.location +
      breakdown.budgetMatch * this.weights.budget +
      breakdown.sizeMatch * this.weights.size +
      breakdown.amenityMatch * this.weights.amenities +
      (breakdown.demographicMatch || 0) * this.weights.demographics +
      (breakdown.competitorMatch || 0) * this.weights.competitors
    )

    const reasons = this.generateMatchReasons(breakdown, brand, property)

    return {
      id: `match_${brand.companyName}_${property.id}_${Date.now()}`,
      brandId: brand.companyName || '', // In real app, use brand ID
      propertyId: property.id,
      score,
      breakdown,
      reasons,
      createdAt: new Date(),
      status: 'active'
    }
  }

  /**
   * Find top 5 matches for a brand
   */
  findTopMatches(brand: BrandProfile, properties: Property[]): MatchResult[] {
    const matches = properties
      .map(property => this.calculateBrandFitIndex(brand, property))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return matches
  }

  /**
   * Calculate PFI (Property Fit Index) - How well brands match a property
   */
  calculatePropertyFitIndex(property: Property, brands: BrandProfile[]): MatchResult[] {
    return brands
      .map(brand => this.calculateBrandFitIndex(brand, property))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  private calculateLocationMatch(brand: BrandProfile, property: Property): number {
    if (!brand.preferredLocations?.length) return 50

    const isInPreferredLocation = brand.preferredLocations.some(location => 
      property.city.toLowerCase().includes(location.toLowerCase()) ||
      property.state.toLowerCase().includes(location.toLowerCase())
    )

    if (isInPreferredLocation) {
      return 100
    }

    // Apply flexibility scoring
    switch (brand.locationFlexibility) {
      case 'strict': return 0
      case 'flexible': return 40
      case 'very_flexible': return 70
      default: return 30
    }
  }

  private calculateBudgetMatch(brand: BrandProfile, property: Property): number {
    if (!brand.budgetRange) return 50

    const { min, max } = brand.budgetRange
    const propertyPrice = property.priceType === 'monthly' ? property.price : property.price * 12

    if (propertyPrice >= min && propertyPrice <= max) {
      return 100
    }

    // Calculate how far off the budget is
    if (propertyPrice < min) {
      const underBudgetRatio = propertyPrice / min
      return Math.max(20, underBudgetRatio * 100)
    } else {
      const overBudgetRatio = max / propertyPrice
      return Math.max(0, overBudgetRatio * 100)
    }
  }

  private calculateSizeMatch(brand: BrandProfile, property: Property): number {
    if (!brand.requirements) return 50

    const { minSize, maxSize } = brand.requirements
    
    if (!minSize && !maxSize) return 50
    if (property.size >= minSize && property.size <= maxSize) {
      return 100
    }

    // Calculate size fit score
    if (property.size < minSize) {
      const sizeRatio = property.size / minSize
      return Math.max(0, sizeRatio * 100)
    } else {
      const sizeRatio = maxSize / property.size
      return Math.max(0, sizeRatio * 100)
    }
  }

  private calculateAmenityMatch(brand: BrandProfile, property: Property): number {
    if (!brand.requirements?.mustHaveAmenities?.length) return 80

    const requiredAmenities = brand.requirements.mustHaveAmenities
    const availableAmenities = property.amenities

    const matchedAmenities = requiredAmenities.filter(amenity => 
      availableAmenities.some(available => 
        available.toLowerCase().includes(amenity.toLowerCase())
      )
    )

    const matchRatio = matchedAmenities.length / requiredAmenities.length
    return Math.round(matchRatio * 100)
  }

  private calculateDemographicMatch(brand: BrandProfile, property: Property): number | undefined {
    if (!property.locationIntelligence?.demographics) return undefined

    // Simple demographic matching based on target demographics
    if (!brand.targetDemographics?.length) return 70

    // This would be more sophisticated in a real implementation
    // For now, return a baseline score
    return 75
  }

  private calculateCompetitorMatch(brand: BrandProfile, property: Property): number | undefined {
    if (!property.locationIntelligence?.competitors) return undefined

    const competitors = property.locationIntelligence.competitors
    const directCompetitors = competitors.filter(c => c.category === 'direct')

    // Fewer direct competitors nearby = better score
    if (directCompetitors.length === 0) return 100
    if (directCompetitors.length <= 2) return 80
    if (directCompetitors.length <= 5) return 60
    return 40
  }

  private generateMatchReasons(breakdown: any, brand: BrandProfile, property: Property): string[] {
    const reasons: string[] = []

    if (breakdown.locationMatch >= 80) {
      reasons.push(`Perfect location match in ${property.city}`)
    } else if (breakdown.locationMatch >= 60) {
      reasons.push(`Good location with some flexibility`)
    }

    if (breakdown.budgetMatch >= 90) {
      reasons.push(`Fits perfectly within your budget`)
    } else if (breakdown.budgetMatch >= 70) {
      reasons.push(`Close to your budget range`)
    }

    if (breakdown.sizeMatch >= 90) {
      reasons.push(`Ideal size for your space requirements`)
    }

    if (breakdown.amenityMatch >= 80) {
      reasons.push(`Has most of your required amenities`)
    }

    if (breakdown.demographicMatch && breakdown.demographicMatch >= 80) {
      reasons.push(`Great demographic match for your target audience`)
    }

    if (breakdown.competitorMatch && breakdown.competitorMatch >= 80) {
      reasons.push(`Low competition in the immediate area`)
    }

    // Add property-specific highlights
    if (property.amenities.includes('Parking')) {
      reasons.push(`Includes parking facilities`)
    }

    if (property.condition === 'excellent') {
      reasons.push(`Property in excellent condition`)
    }

    return reasons
  }
}

// Utility functions for CRM integration
export const updateBrandProfile = async (brandId: string, matches: MatchResult[]) => {
  // In a real implementation, this would update the CRM
  console.log(`Updating brand ${brandId} with ${matches.length} new matches`)
}

export const updatePropertyProfile = async (propertyId: string, matches: MatchResult[]) => {
  // In a real implementation, this would update the CRM
  console.log(`Updating property ${propertyId} with ${matches.length} potential brand matches`)
}

export const triggerNotifications = async (matches: MatchResult[]) => {
  // In a real implementation, this would send email/SMS/WhatsApp notifications
  matches.forEach(match => {
    console.log(`Sending notification for match ${match.id} with score ${match.score}`)
  })
}
