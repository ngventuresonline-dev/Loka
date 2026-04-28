/**
 * Commercial rent context for location intelligence — area benchmarks (Bangalore)
 * plus optional listing-implied ₹/sqft. Replaces a single hardcoded city average.
 */

/**
 * Typical monthly commercial ground-floor rent per sqft (₹), by nearest area key.
 * Bands represent street-level retail / high-street / Grade-B retail (not Grade-A office).
 * Updated Q1 2025 — prime spots within each area can exceed the high end.
 */
const RENT_BAND_BY_AREA_KEY: Record<string, { low: number; high: number }> = {
  'mg road': { low: 280, high: 520 },
  'ub city': { low: 320, high: 580 },
  'st marks road': { low: 250, high: 460 },
  'brigade road': { low: 250, high: 460 },
  'cunningham road': { low: 230, high: 420 },
  indiranagar: { low: 220, high: 420 },
  koramangala: { low: 200, high: 380 },
  'richmond town': { low: 210, high: 380 },
  'hsr layout': { low: 180, high: 340 },
  jayanagar: { low: 160, high: 300 },
  'jp nagar': { low: 150, high: 280 },
  'btm layout': { low: 140, high: 260 },
  malleswaram: { low: 130, high: 240 },
  rajajinagar: { low: 120, high: 220 },
  banashankari: { low: 110, high: 200 },
  whitefield: { low: 150, high: 300 },
  marathahalli: { low: 140, high: 270 },
  bellandur: { low: 135, high: 260 },
  'sarjapur road': { low: 140, high: 270 },
  'sarjapur junction': { low: 140, high: 270 },
  'aecs layout': { low: 130, high: 250 },
  mahadevapura: { low: 130, high: 250 },
  brookfield: { low: 130, high: 245 },
  kaikondrahalli: { low: 130, high: 245 },
  'kalyan nagar': { low: 120, high: 230 },
  'electronic city': { low: 70, high: 140 },
}

const DEFAULT_BAND = { low: 120, high: 220 }

export type RentDataSource = 'listing' | 'area_benchmark'

export type PopulationRentContext = {
  /** Primary value for UI: listing implied when sane, else area midpoint */
  rentPerSqft: number
  /** From listing monthly ÷ size when available */
  listingRentPerSqft?: number
  marketRentLow: number
  marketRentHigh: number
  marketRentMid: number
  rentDataSource: RentDataSource
  benchmarkNote: string
  nearestAreaKey?: string
}

function propertyTypeRentMultiplier(propertyType?: string): number {
  const p = (propertyType || '').toLowerCase()
  if (p.includes('warehouse') || p.includes('industrial')) return 0.5
  if (p.includes('office') || p.includes('coworking')) return 0.9
  return 1
}

export function getAreaCommercialRentBand(
  areaKey: string | null | undefined,
  propertyType?: string
): { low: number; high: number; mid: number; key: string } {
  const k = (areaKey || '').toLowerCase().trim()
  const band = k && RENT_BAND_BY_AREA_KEY[k] ? RENT_BAND_BY_AREA_KEY[k] : DEFAULT_BAND
  const m = propertyTypeRentMultiplier(propertyType)
  const low = Math.round(band.low * m)
  const high = Math.round(band.high * m)
  return { low, high, mid: Math.round((low + high) / 2), key: k || 'bengaluru' }
}

/** Total monthly rent from listing (for viability math). */
export function deriveMonthlyRentFromListing(
  price: number,
  priceType: string | undefined,
  sizeSqft: number | undefined
): number | undefined {
  if (!Number.isFinite(price) || price <= 0) return undefined
  const sz = sizeSqft != null && sizeSqft > 0 ? sizeSqft : 0
  const pt = (priceType || 'monthly').toLowerCase()
  if (pt === 'sqft') {
    if (sz <= 0) return undefined
    return price * sz
  }
  if (pt === 'yearly') return price / 12
  return price
}

/** Implied ₹/sqft/month from listing. */
export function deriveListingRentPerSqft(
  price: number,
  priceType: string | undefined,
  sizeSqft: number | undefined
): number | undefined {
  if (!Number.isFinite(price) || price <= 0) return undefined
  const sz = sizeSqft != null && sizeSqft > 0 ? sizeSqft : 0
  const pt = (priceType || 'monthly').toLowerCase()
  if (pt === 'sqft') return Math.round(price * 10) / 10
  const monthly = deriveMonthlyRentFromListing(price, priceType, sizeSqft)
  if (monthly == null || sz <= 0) return undefined
  const psf = monthly / sz
  if (!Number.isFinite(psf) || psf < 12 || psf > 750) return undefined
  return Math.round(psf * 10) / 10
}

export function buildPopulationRentContext(params: {
  nearestAreaKey: string | null | undefined
  propertyType?: string
  /** Normalized monthly rent total (optional) */
  monthlyRent?: number
  sizeSqft?: number
}): PopulationRentContext {
  const band = getAreaCommercialRentBand(params.nearestAreaKey, params.propertyType)
  let listingPsf: number | undefined
  if (
    typeof params.monthlyRent === 'number' &&
    params.monthlyRent > 0 &&
    params.sizeSqft != null &&
    params.sizeSqft > 0
  ) {
    const v = params.monthlyRent / params.sizeSqft
    if (Number.isFinite(v) && v >= 12 && v <= 750) listingPsf = Math.round(v * 10) / 10
  }

  const useListing = listingPsf != null
  const rentPerSqft: number = useListing && listingPsf != null ? listingPsf : band.mid

  const benchmarkNote = useListing
    ? `This listing implies ~₹${listingPsf}/sqft/mo (from rent ÷ ${params.sizeSqft} sqft). Typical band for ${band.key.replace(/-/g, ' ')} ~₹${band.low}–${band.high}/sqft/mo (${(params.propertyType || 'commercial').toLowerCase()}).`
    : `Typical commercial band near ${band.key.replace(/-/g, ' ')}: ~₹${band.low}–${band.high}/sqft/mo (model). Add listing rent + size on the match for an exact ₹/sqft from this property.`

  return {
    rentPerSqft,
    listingRentPerSqft: listingPsf,
    marketRentLow: band.low,
    marketRentHigh: band.high,
    marketRentMid: band.mid,
    rentDataSource: useListing ? 'listing' : 'area_benchmark',
    benchmarkNote,
    nearestAreaKey: params.nearestAreaKey ?? undefined,
  }
}
