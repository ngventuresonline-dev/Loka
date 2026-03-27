export type BrandIntelStrategicFit = 'strong' | 'viable' | 'cautionary' | 'weak'

export type LiveEconomicsConfidence = 'low' | 'medium' | 'high'

/** Micro-market commercial rent (₹/sqft/month) — synthesis vs platform band. */
export type LiveEconomicsEnrichment = {
  commercialRentPerSqftTypical: number
  commercialRentLow: number
  commercialRentHigh: number
  confidence: LiveEconomicsConfidence
  rationale: string
  listingVsMarketNote?: string
}

/**
 * Single cost-effective response: proprietary location synthesis for the brand dashboard.
 * Populated in one engine pass; surfaced across Overview, Catchment, Market, Competitors, Risk, Similar.
 */
export type LocationSynthesis = {
  executiveSummary: string
  strategicFit: BrandIntelStrategicFit
  strengths: string[]
  risks: string[]
  opportunities: string[]
  competitorTakeaway: string
  footfallInterpretation: string
  nextSteps: string[]
  disclaimer: string
  liveEconomics: LiveEconomicsEnrichment
  /** Catchment tab: shoppers, landmarks, affluence — tailored to this brand */
  catchmentForBrand: string
  catchmentBullets: string[]
  /** Catchment: resident/profile narrative (grounded in modelled demographics + catchment) */
  residentsForBrand: string
  residentsBullets: string[]
  /** Housing stock — apartments, towers, gated pockets near the listing */
  apartmentsForBrand: string
  apartmentsBullets: string[]
  /** Offices, tech parks, corporate nodes — daytime population & commute */
  workplacesForBrand: string
  workplacesBullets: string[]
  /** Market tab: demand, saturation, rent — tailored */
  marketForBrand: string
  marketBullets: string[]
  /** Competitors tab */
  competitionForBrand: string
  competitionBullets: string[]
  /** Risk tab: cannibalisation, crowding, lease */
  riskForBrand: string
  riskBullets: string[]
  /** Similar markets tab */
  similarMarketsForBrand: string
  similarMarketsBullets: string[]
}

/** @deprecated use LocationSynthesis */
export type BrandIntelClaudeEnrichment = LocationSynthesis

export type BrandContextForIntel = {
  name: string
  companyName?: string | null
  industry?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  preferredLocations?: string[] | null
}

export type PropertyContextForIntel = {
  title: string
  address: string
  city: string
  propertyType: string
  size: number
  price: number
  priceType: string
}

export type MatchContextForIntel = {
  bfiScore: number
  locationFit: number
  budgetFit: number
  sizeFit: number
}
