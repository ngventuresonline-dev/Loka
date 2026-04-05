import { getBrandCategory } from '@/lib/intelligence/brand-category-map'

/** True when brand context is QSR / quick-service / vada-pav–style (not full-service dining). */
export function brandContextWantsQsrCompetitors(brandIndustryContext: string): boolean {
  const t = (brandIndustryContext || '').toLowerCase()
  return /\bqsr\b|\bfast food\b|\bvada\b|vadapav|\bpav\b|quick service|snack chain|takeaway chain/i.test(t)
}

const FULL_SERVICE_DINING_HINT = /\b(north indian|mughlai|biryani house|andhra |kerala |fine dining|thali house|family restaurant|grand restaurant|dosa house|meals hotel)\b/i

/** Chains / formats that share QSR trade zones even when Google types them as restaurant. */
const QSR_CHAIN_OR_FORMAT =
  /\b(pizza|burger|ice cream|gelato|frozen yogurt|dessert parlor|polar bear|baskin|corner house|domino|pizza hut|mcdonald|kfc|subway|shawarma|momos|rolls?|vada|pav\b|quick service|snack|takeaway|cloud kitchen)\b/i

/**
 * Strict same-segment match for QSR-focused brands: Jumbo King, Goli, etc. count; typical North Indian dining does not.
 */
export function competitorMatchesQsrFocus(competitorName: string, placeCategory: string): boolean {
  const c = (placeCategory || '').toLowerCase()
  const n = (competitorName || '').toLowerCase()

  const mapped = getBrandCategory(competitorName)
  if (mapped === 'QSR') return true
  if (QSR_CHAIN_OR_FORMAT.test(n)) return true
  if (mapped === 'Restaurant' || mapped === 'Cafe') return false
  if (FULL_SERVICE_DINING_HINT.test(n) || FULL_SERVICE_DINING_HINT.test(c)) return false

  if (c === 'qsr' || /\bfast food|takeaway|meal_takeaway|quick service|snack\b/.test(c)) return true
  if (c.includes('meal_takeaway') || c.includes('fast_food')) return true

  if (c.includes('restaurant')) {
    if (/\b(cafe|coffee|bakery|bar |pub )\b/.test(c)) return false
    return /\b(snack|chaat|vada|pav|quick service|rolls?|momos?|shawarma|street food|takeaway|kiosk)\b/.test(
      `${n} ${c}`
    )
  }

  return false
}
