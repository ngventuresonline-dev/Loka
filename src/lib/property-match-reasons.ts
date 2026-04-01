import type { Property } from '@/types/workflow'

/** Same shape as BFI breakdown from matching-engine */
export interface MatchReasonBreakdown {
  locationScore: number
  sizeScore: number
  budgetScore: number
  typeScore: number
}

/**
 * Monthly rent in INR for copy strings — aligned with calculateBudgetScore in matching-engine.
 */
export function propertyMonthlyRentForCopy(property: Property): number {
  let monthly = property.price
  if (property.priceType === 'yearly') {
    monthly = property.price / 12
  } else if (property.priceType === 'sqft') {
    monthly = property.price * property.size
  }
  return monthly
}

/**
 * "Why this matches" bullets. Always pass the property actually shown in the UI + the breakdown
 * used for BFI so rent/size lines cannot disagree with the card.
 */
export function buildMatchReasonStrings(
  property: Property,
  breakdown: MatchReasonBreakdown,
  businessType: string,
): string[] {
  const reasons: string[] = []
  const city = (property.city || '').trim() || 'this location'

  if (breakdown.locationScore === 100) {
    reasons.push(`In your preferred area - ${city}`)
  } else if (breakdown.locationScore >= 70) {
    reasons.push(`Nearby your preferred areas - ${city}`)
  }

  const monthlyPrice = propertyMonthlyRentForCopy(property)
  if (breakdown.budgetScore >= 80) {
    reasons.push(`Great value - ₹${Math.round(monthlyPrice).toLocaleString('en-IN')}/month within your budget`)
  } else if (breakdown.budgetScore >= 40) {
    reasons.push(`₹${Math.round(monthlyPrice).toLocaleString('en-IN')}/month – slightly above budget`)
  } else if (breakdown.budgetScore >= 10) {
    reasons.push(`₹${Math.round(monthlyPrice).toLocaleString('en-IN')}/month – in your preferred area`)
  }

  if (breakdown.sizeScore >= 80 && property.size) {
    reasons.push(
      `Ideal size - ${property.size.toLocaleString('en-IN')} sqft perfect for ${businessType || 'your business'}`,
    )
  }

  const rawAmenities = property.amenities
  const amenities = Array.isArray(rawAmenities)
    ? rawAmenities
    : rawAmenities &&
        typeof rawAmenities === 'object' &&
        Array.isArray((rawAmenities as { features?: unknown }).features)
      ? ((rawAmenities as { features: string[] }).features)
      : []

  if (amenities.some((a) => String(a).toLowerCase().includes('parking'))) {
    reasons.push('Parking available')
  }
  if (amenities.some((a) => String(a).toLowerCase().includes('ground'))) {
    reasons.push('Ground floor - high visibility')
  }

  return reasons.slice(0, 5)
}
