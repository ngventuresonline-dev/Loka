/**
 * India F&B & Retail Market Benchmarks
 * Derived from published market research, consumer surveys, and industry reports (2024–2026).
 * Used to enrich location intelligence with realistic revenue, footfall, and viability estimates.
 * Sources: population/demographics, consumer spending, CPI, retail leasing, cafes & bars, F&B franchise trends.
 */

/** Category-specific revenue profile: capture rate, avg ticket (₹), base footfall, per-competitor footfall lift */
export interface CategoryProfile {
  captureRate: number
  avgTicket: number
  baseFootfall: number
  perCompetitor: number
  /** Typical gross margin (0–1). Used for rent viability context. */
  grossMarginPct?: number
  /** Market growth rate (CAGR) for outlook */
  growthCagrPct?: number
  /** Share of office workers in catchment likely to convert on a given day (revenue engine). */
  officeLunchShare?: number
  /** Share of residential dining-out pool captured per day (revenue engine). */
  residentialShare?: number
}

/** India population & urban context (2026) */
export const INDIA_POPULATION_2026 = {
  total: 1_476_625_576,
  urbanPct: 0.376,
  urbanCount: 555_299_296,
  densityPerKm2: 497,
  medianAge: 29.2,
  worldSharePct: 17.79,
}

/** CPI Food & Beverage (base 2012=100). Urban Jan 2025. Used for inflation-adjusted revenue. */
export const CPI_FOOD_BEVERAGE = {
  urbanJan2025: 204.6,
  ruralJan2025: 198.8,
  allIndiaJan2025: 200.9,
  baseYear: 2012,
}

/** India Cafes & Bars market (2025–2031) */
export const CAFES_BARS_MARKET = {
  size2025UsdB: 18.83,
  size2031UsdB: 31.47,
  cagrPct: 8.92,
  /** Specialist coffee & tea share of market */
  specialistSharePct: 84.72,
  /** Independent outlets share */
  independentSharePct: 76.05,
  /** Chained outlets growth rate */
  chainedCagrPct: 11.72,
  /** Travel/transit outlets growth rate */
  travelCagrPct: 12.24,
  /** Delivery service growth rate */
  deliveryCagrPct: 12.05,
  /** Dine-in revenue share */
  dineInSharePct: 47.68,
}

/** India Coffee Cafe segment (specialty/artisanal) */
export const COFFEE_CAFE_SEGMENT = {
  size2024UsdM: 439.56,
  size2030UsdM: 928.98,
  cagrPct: 13.28,
  /** Premium vs traditional avg order value (INR) */
  premiumAovRange: [200, 400],
  traditionalAovRange: [80, 120],
}

/** Retail leasing (2025) – metros and formats */
export const RETAIL_LEASING_2025 = {
  grossLeasingSqFtM: 12.5,
  yoyGrowthPct: 54,
  mallLeasingSharePct: 45,
  highStreetSharePct: 48,
  totalMallStockSqFtM: 92,
  /** Domestic vs foreign brand leasing */
  domesticSharePct: 82,
}

/** Consumer behaviour (India F&B) – from consumer surveys */
export const CONSUMER_BEHAVIOUR = {
  /** % concerned about food cost */
  foodCostConcernedPct: 63,
  /** % whose food choices rooted in culture/tradition */
  cultureRootedPct: 74,
  /** Taste as top-3 factor */
  tasteTopFactorPct: 40,
  /** Price as top-3 factor */
  priceTopFactorPct: 39,
  /** Nutrition as top-3 factor */
  nutritionTopFactorPct: 38,
  /** Very concerned about food safety */
  foodSafetyConcernedPct: 84,
  /** Use healthcare apps/wearables */
  healthTechUsagePct: 80,
  /** Prefer sustainable packaging */
  sustainablePackagingPct: 49,
  /** Will pay more for environmentally sustainable food production */
  willingToPayPremiumSustainabilityPct: 73,
  /** Prefer local even if more expensive (India vs global) */
  preferLocalPremiumPct: 53,
}

/** Channel usage (grocery/shopping) – last 12 months */
export const CHANNEL_USAGE = {
  supermarketsPct: 70,
  localRetailersPct: 60,
  onDemandGroceryPct: 55,
  readyToEatPct: 46,
  takeoutPct: 41,
  eatOutWeeklyPct: 38,
}

/** Rent viability – industry norms for F&B in India */
export const RENT_VIABILITY = {
  /** F&B: rent as % of revenue considered healthy (10–15% typical) */
  fnbHealthyRentToRevenuePct: 15,
  /** Non-F&B (e.g. retail): rent as % of revenue considered healthy */
  healthyRentToRevenuePct: 25,
  /** Stretched but workable */
  stretchedRentToRevenuePct: 35,
  /** Above this generally unviable */
  unviableRentToRevenuePct: 40,
}

/** Category profiles – capture rate as decimal (e.g. 1.2 = 1.2%), avg ticket INR */
export function getIndiaCategoryProfile(
  placeType: string,
  businessType?: string
): CategoryProfile {
  const raw = `${businessType || ''} ${placeType}`.toLowerCase()

  // QSR – high volume, low ticket, ~25–30% margin typical
  if (/\b(qsr|quick service|fast food|burger|pizza|momo|shawarma|biryani)\b/.test(raw)) {
    return {
      captureRate: 1.5,
      avgTicket: 180,
      baseFootfall: 3200,
      perCompetitor: 150,
      grossMarginPct: 0.28,
      growthCagrPct: 12.6,
      officeLunchShare: 0.18,
      residentialShare: 0.05,
    }
  }

  // Cafe / Coffee – premium AOV INR 200–400, specialty growth 13%+
  if (/\b(cafe|coffee|chai)\b/.test(raw)) {
    return {
      captureRate: 1.2,
      avgTicket: 260, // between traditional 80–120 and premium 200–400
      baseFootfall: 2800,
      perCompetitor: 180,
      grossMarginPct: 0.55, // beverage-heavy
      growthCagrPct: 13.28,
      officeLunchShare: 0.15,
      residentialShare: 0.04,
    }
  }

  // Restaurant – lower volume, higher ticket
  if (/\brestaurant\b/.test(raw)) {
    return {
      captureRate: 1,
      avgTicket: 350,
      baseFootfall: 2200,
      perCompetitor: 120,
      grossMarginPct: 0.25,
      growthCagrPct: 9,
      officeLunchShare: 0.12,
      residentialShare: 0.035,
    }
  }

  // Bar / Brew
  if (/\b(bar|brew|pub)\b/.test(raw)) {
    return {
      captureRate: 0.8,
      avgTicket: 450,
      baseFootfall: 1800,
      perCompetitor: 100,
      grossMarginPct: 0.6,
      growthCagrPct: 9,
      officeLunchShare: 0.08,
      residentialShare: 0.04,
    }
  }

  // Bakery / Dessert / Sweet
  if (/\b(bakery|dessert|sweet|sweets|ice cream|cake)\b/.test(raw)) {
    return {
      captureRate: 1.3,
      avgTicket: 200,
      baseFootfall: 2500,
      perCompetitor: 140,
      grossMarginPct: 0.45,
      growthCagrPct: 10,
      officeLunchShare: 0.12,
      residentialShare: 0.04,
    }
  }

  // Cloud kitchen / delivery-first
  if (/\b(cloud kitchen|ghost kitchen|delivery)\b/.test(raw)) {
    return {
      captureRate: 1.4,
      avgTicket: 220,
      baseFootfall: 2400,
      perCompetitor: 160,
      grossMarginPct: 0.22,
      growthCagrPct: 12.6,
      officeLunchShare: 0.15,
      residentialShare: 0.045,
    }
  }

  if (/\b(retail|fashion|clothing|store|shop|optical|eyewear|jewel|electronics)\b/.test(raw)) {
    return {
      captureRate: 0.9,
      avgTicket: 280,
      baseFootfall: 1800,
      perCompetitor: 100,
      grossMarginPct: 0.35,
      growthCagrPct: 8,
      officeLunchShare: 0.05,
      residentialShare: 0.025,
    }
  }

  if (/\b(salon|spa|beauty|hair|wellness|skin)\b/.test(raw)) {
    return {
      captureRate: 0.85,
      avgTicket: 320,
      baseFootfall: 1600,
      perCompetitor: 90,
      grossMarginPct: 0.5,
      growthCagrPct: 9,
      officeLunchShare: 0.05,
      residentialShare: 0.025,
    }
  }

  // General F&B default
  return {
    captureRate: 1,
    avgTicket: 220,
    baseFootfall: 2000,
    perCompetitor: 120,
    grossMarginPct: 0.3,
    officeLunchShare: 0.12,
    residentialShare: 0.035,
  }
}

/** Top India cities – population estimates for density scaling (urban agglomeration, 2025) */
export const TOP_INDIA_CITIES_POPULATION: Record<string, number> = {
  'new delhi': 30_222_405,
  kolkata: 22_549_738,
  mumbai: 20_203_056,
  bengaluru: 13_187_098,
  bangalore: 13_187_098,
  chennai: 11_153_205,
  hyderabad: 9_190_795,
  ahmedabad: 7_632_408,
  surat: 6_908_925,
  pune: 6_817_951,
  lucknow: 5_052_444,
  kochi: 5_077_670,
  jaipur: 4_071_754,
  kanpur: 4_329_973,
  varanasi: 3_858_863,
  indore: 3_476_423,
  patna: 3_309_383,
  nagpur: 3_257_841,
}

/** Consumer behaviour modifier: India consumers are taste-led (not value-led like global).
 * Use to slightly boost capture for quality/taste-differentiated concepts. */
export function getTasteLedModifier(): number {
  return 1.02 // ~2% lift vs global value-led baseline
}

/** Cost-conscious modifier: 63% concerned about food cost – use for price-sensitive formats. */
export function getCostConsciousModifier(isBudgetFormat: boolean): number {
  return isBudgetFormat ? 1.08 : 0.98
}
