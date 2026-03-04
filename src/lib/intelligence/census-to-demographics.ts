/**
 * Map CensusData ward record to LocationIntelligenceResponse demographics format.
 * Used by /api/location-intelligence and LocationIntelligence component.
 */

export type DemographicsVariant = {
  ageGroups: { range: string; percentage: number }[]
  incomeLevel: 'low' | 'medium' | 'high' | 'mixed'
  lifestyle: string[]
}

export interface CensusWardLike {
  age0_17?: number | null
  age18_24?: number | null
  age25_34?: number | null
  age35_44?: number | null
  age45_54?: number | null
  age55_64?: number | null
  age65Plus?: number | null
  medianIncome?: number | null
  incomeAbove15L?: number | null
  income6to10L?: number | null
  incomeUnder3L?: number | null
  literacyRate?: number | null
  graduatePercent?: number | null
  workingPopPercent?: number | null
  gymMembershipRate?: number | null
  diningOutFreq?: number | null
  vegetarianPercent?: number | null
  vehicleOwnership?: number | null
  wardName?: string | null
}

/**
 * Convert CensusData age distribution to ageGroups format for LocationIntelligenceResponse.
 */
function buildAgeGroups(ward: CensusWardLike): { range: string; percentage: number }[] {
  const a18 = ward.age18_24 ?? 0
  const a25 = ward.age25_34 ?? 0
  const a35 = ward.age35_44 ?? 0
  const a45Plus = (ward.age45_54 ?? 0) + (ward.age55_64 ?? 0) + (ward.age65Plus ?? 0)
  const total = a18 + a25 + a35 + a45Plus || 1
  return [
    { range: '18–24', percentage: Math.round((a18 / total) * 100) },
    { range: '25–34', percentage: Math.round((a25 / total) * 100) },
    { range: '35–44', percentage: Math.round((a35 / total) * 100) },
    { range: '45+', percentage: Math.round((a45Plus / total) * 100) },
  ]
}

/**
 * Derive incomeLevel from medianIncome (₹/year) and incomeAbove15L.
 * Based on india-benchmarks.ts thresholds and FOOTFALL_GEOIQ area profiles.
 */
function deriveIncomeLevel(ward: CensusWardLike): 'low' | 'medium' | 'high' | 'mixed' {
  const median = ward.medianIncome ?? 0
  const above15 = ward.incomeAbove15L ?? 0
  const under3 = ward.incomeUnder3L ?? 0
  const mid6to10 = ward.income6to10L ?? 0

  if (above15 >= 35 && median >= 10_00_000) return 'high'
  if (above15 <= 12 && median < 6_00_000) return 'low'
  if (under3 < 20 && above15 > 25) return 'high'
  if (mid6to10 >= 28 && above15 < 15 && under3 < 25) return 'medium'
  if (under3 > 25 && above15 < 15) return 'low'
  if (above15 > 20 && under3 > 15) return 'mixed'
  if (median >= 9_00_000) return 'high'
  if (median <= 5_00_000) return 'low'
  return 'medium'
}

/**
 * Derive lifestyle tags from census fields (CHANNEL_USAGE, CONSUMER_BEHAVIOUR, area profile).
 */
function deriveLifestyle(ward: CensusWardLike): string[] {
  const tags: string[] = []
  const grad = ward.graduatePercent ?? 0
  const work = ward.workingPopPercent ?? 0
  const gym = ward.gymMembershipRate ?? 0
  const dine = ward.diningOutFreq ?? 0
  const veg = ward.vegetarianPercent ?? 0
  const vehicle = ward.vehicleOwnership ?? 0

  if (grad >= 55 && work >= 65) tags.push('Young professionals')
  if (work >= 70) tags.push('Office crowd')
  if (gym >= 20) tags.push('Health-conscious')
  if (dine >= 3) tags.push('Foodies', 'Dining-out frequent')
  if (veg >= 60) tags.push('Traditional cuisine preference')
  if (vehicle >= 0.7) tags.push('Vehicle owners')
  if (grad >= 60 && work >= 72) tags.push('Tech workers')
  if (grad < 50 && work < 60) tags.push('Families', 'Local shoppers')
  if (dine >= 3.5) tags.push('Premium dining')
  if (work >= 75) tags.push('Corporate crowd')

  if (tags.length === 0) tags.push('Young professionals', 'Office crowd', 'Local shoppers')
  return [...new Set(tags)].slice(0, 6)
}

/**
 * Map CensusData ward to LocationIntelligenceResponse demographics format.
 */
export function censusToDemographics(ward: CensusWardLike): DemographicsVariant {
  return {
    ageGroups: buildAgeGroups(ward),
    incomeLevel: deriveIncomeLevel(ward),
    lifestyle: deriveLifestyle(ward),
  }
}
