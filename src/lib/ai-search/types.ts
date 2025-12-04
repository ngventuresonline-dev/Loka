/**
 * Lokazen AI Search System - Type Definitions
 * Version 2.0 - World-Class Commercial Real Estate Matching
 */

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

export type EntityType = 'brand' | 'owner' | 'needs_clarification'
export type QueryIntent = 'seeking_space' | 'offering_space' | 'general_inquiry'

// ============================================================================
// CONVERSATION CONTEXT
// ============================================================================

export interface ConversationContext {
  sessionId?: string
  previousQueries: string[]
  establishedIntent?: QueryIntent
  confirmedEntityType?: EntityType
  extractedRequirements: Partial<BrandRequirements | OwnerRequirements>
  completionPercentage: number
  missingCritical: string[]
  lastQuery: string
  suggestionsMade: string[]
  // Full conversation state (optional, for comprehensive tracking)
  fullState?: import('./conversation-state').ConversationState
}

// Re-export ConversationState for convenience
export type { ConversationState } from './conversation-state'

// Import the actual type to use in ConversationContext
import type { ConversationState as FullConversationState } from './conversation-state'

// ============================================================================
// BRAND REQUIREMENTS (What they NEED)
// ============================================================================

export interface BrandRequirements {
  // Space Requirements
  area: {
    min: number           // sqft
    max: number           // sqft
    preferred?: number
    flexibility: 'strict' | 'moderate' | 'flexible'
  }

  // Location Requirements
  location: {
    city: string
    areas: string[]       // Preferred areas (Koramangala, Indiranagar, etc.)
    landmarks?: string[]  // Near specific landmarks
    restrictions?: string[] // Areas to avoid
  }

  // Property Type
  propertyType: {
    primary: 'retail_shop' | 'restaurant_space' | 'food_court' | 
             'standalone_building' | 'office' | 'warehouse' | 'qsr' | 'kiosk'
    acceptable: string[]  // Other acceptable types
  }

  // Budget
  budget: {
    monthlyRent: {
      min: number
      max: number
      currency: 'INR'
    }
    deposit: {
      maxMonths: number  // e.g., 10 months rent
    }
    fitoutBudget?: number
  }

  // Footfall & Demographics
  footfall: {
    minimumDaily?: number
    targetDemographics: {
      ageGroups: string[]     // '18-25', '25-35', '35-50', '50+'
      incomeLevel: 'budget' | 'mid' | 'premium' | 'luxury'
      workingProfessionals?: boolean
      families?: boolean
      students?: boolean
    }
  }

  // Accessibility
  accessibility: {
    metroDistance?: {
      max: number  // meters
      stations?: string[]
    }
    parkingRequired: boolean
    roadAccess: 'main_road' | 'side_street' | 'any'
  }

  // Competition
  competition: {
    preferNearCompetitors?: boolean  // Some brands want restaurant clusters
    avoidDirectCompetitors?: string[]  // Specific brands to avoid
    categoryDensity: 'low' | 'medium' | 'high'  // How many similar brands in area
  }

  // Infrastructure
  infrastructure: {
    electricity: {
      phase: 'single' | 'three'
      loadRequired?: number  // KW
    }
    water: boolean
    drainage: boolean
    exhaust: boolean  // For restaurants
    gasConnection?: boolean
  }

  // Lease Terms
  leaseTerms: {
    duration: {
      min: number  // months
      preferred: number
    }
    lockInPeriod: number
    escalation: number  // percentage per year
    rentFreePeriod?: number  // months for fitout
  }

  // Brand Specific
  brandProfile: {
    name?: string
    category: 'F&B' | 'Retail' | 'Service' | 'Entertainment'
    subcategory?: string  // 'QSR', 'Fine Dining', 'Fashion', 'Electronics', etc.
    existingOutlets?: number
    avgFootfall?: number  // At existing outlets
    peakHours?: string[]
  }
}

// ============================================================================
// OWNER REQUIREMENTS (What they HAVE & WANT)
// ============================================================================

export interface OwnerRequirements {
  // Property Details
  property: {
    area: number  // sqft
    type: 'retail_shop' | 'restaurant_space' | 'food_court' | 
          'standalone_building' | 'office' | 'warehouse' | 'qsr' | 'kiosk'
    configuration: {
      floors: number
      ceiling_height?: number  // feet
      frontage?: number  // feet
    }
  }

  // Location
  location: {
    city: string
    area: string
    address: string
    landmark?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }

  // Rent Expectations
  rentExpectations: {
    monthlyRent: number
    deposit: number  // months
    negotiable: boolean
    maintenanceCharges?: number
  }

  // Current Infrastructure
  infrastructure: {
    electricity: {
      phase: 'single' | 'three'
      load: number  // KW
    }
    water: boolean
    drainage: boolean
    exhaust: boolean
    gasConnection: boolean
    hvac?: boolean
    securitySystems?: boolean
  }

  // Accessibility Metrics (What the property HAS)
  accessibility: {
    metroDistance?: number  // meters
    nearestMetro?: string
    mainRoad: boolean
    roadWidth?: number  // feet
    parking: {
      available: boolean
      spaces?: number
      type?: 'basement' | 'surface' | 'multilevel'
    }
  }

  // Footfall & Demographics (What property RECEIVES)
  footfall: {
    averageDaily?: number
    peakHours?: string[]
    demographics: {
      dominantAgeGroup: string[]
      incomeLevel: 'budget' | 'mid' | 'premium' | 'luxury'
      workingProfessionals?: number  // percentage
      families?: number
      students?: number
    }
  }

  // Competition Analysis (What's AROUND the property)
  surroundingCompetition: {
    nearbyBrands: Array<{
      name: string
      category: string
      distance: number  // meters
    }>
    categoryDensity: {
      'F&B': number  // count within 500m
      retail: number
      services: number
    }
  }

  // Desired Tenant Profile (What owner WANTS)
  desiredTenant: {
    categories: string[]  // 'F&B', 'Retail', 'Service'
    preferredBrands?: string[]  // Specific brands if any
    avoidCategories?: string[]
    minBrandReputation?: 'startup' | 'established' | 'premium'
  }

  // Lease Terms (What owner OFFERS)
  leaseTerms: {
    minDuration: number  // months
    maxDuration?: number
    lockInPeriod: number
    escalation: number  // percentage
    rentFreePeriod: number  // months
    fitoutAllowance?: number  // INR
    negotiableTerms: string[]
  }

  // Availability
  availability: {
    status: 'immediate' | 'upcoming' | 'occupied'
    availableFrom?: Date
    currentTenant?: {
      name: string
      leaseEndDate: Date
    }
  }
}

// ============================================================================
// SEARCH INPUT/OUTPUT
// ============================================================================

export interface SearchInput {
  query: string
  entityType?: 'brand' | 'owner' | 'auto'
  context?: ConversationContext
  location?: string
  userId?: string
  conversationHistory?: string
}

export interface ProcessedQuery {
  entityType: EntityType
  confidence: number
  requirements: Partial<BrandRequirements | OwnerRequirements>
  missingCritical: string[]
  intent: QueryIntent
}

// ============================================================================
// SCORING TYPES
// ============================================================================

export interface Score {
  overall: number
  breakdown: {
    [key: string]: number
  }
  confidence: number
}

export interface BFIScore extends Score {
  areaMatch: number
  locationMatch: number
  budgetMatch: number
  footfallMatch: number
  competitionMatch: number
  infrastructureMatch: number
}

export interface PFIScore extends Score {
  categoryMatch: number
  reputationMatch: number
  rentAffordability: number
  footfallFit: number
  demographicsMatch: number
  spaceUtilization: number
}

export interface FinalScore {
  matchScore: number  // 0-100
  bfi: BFIScore
  pfi: PFIScore
  confidence: number
  recommendation: string
}

export interface ScoredMatch {
  propertyId?: string
  brandId?: string
  matchScore: FinalScore
  property?: any
  brand?: any
  strengths: string[]
  considerations: string[]
  locationInsights?: {
    footfallScore: number
    demographicsMatch: string
    competitionAnalysis: string
    accessibilityScore: number
  }
  financial?: {
    monthlyRent: number
    deposit: number
    estimatedFitout: number
    totalInitialInvestment: number
  }
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface BrandSearchResponse {
  matches: ScoredMatch[]
  summary: {
    totalMatches: number
    showingTop: number
    averageMatchScore: number
    searchCompleteness: number
  }
  recommendations?: {
    improveSearch?: string[]
    alternativeLocations?: string[]
    budgetAdjustment?: string
  }
  message: string
}

export interface OwnerSearchResponse {
  matches: ScoredMatch[]
  summary: {
    totalMatches: number
    showingTop: number
    averageMatchScore: number
  }
  recommendations?: {
    attractMoreBrands?: string[]
    improveListing?: string[]
  }
  message: string
  collectedDetails?: Partial<OwnerRequirements>
  readyToRedirect?: boolean
}

export type SearchResponse = BrandSearchResponse | OwnerSearchResponse

// ============================================================================
// CONVERSATION STATE
// ============================================================================
// NOTE: ConversationState is defined in conversation-state.ts
// This duplicate definition has been removed to avoid type conflicts
// Use: import { ConversationState } from './conversation-state'

