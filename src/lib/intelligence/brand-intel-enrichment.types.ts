export type BrandIntelStrategicFit = 'strong' | 'viable' | 'cautionary' | 'weak'

export type LiveEconomicsConfidence = 'low' | 'medium' | 'high'

/** Claude micro-market commercial rent (₹/sqft/month) — real-time interpretation vs platform band. */
export type LiveEconomicsEnrichment = {
  commercialRentPerSqftTypical: number
  commercialRentLow: number
  commercialRentHigh: number
  confidence: LiveEconomicsConfidence
  rationale: string
  /** Compare ask vs band when listing rent known */
  listingVsMarketNote?: string
}

export type BrandIntelClaudeEnrichment = {
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
}

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
