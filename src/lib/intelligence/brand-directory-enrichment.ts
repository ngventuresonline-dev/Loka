// @ts-nocheck
/**
 * Brand Directory Enrichment
 *
 * Queries bangalore_brand_directory and bangalore_locality_retail_mix
 * to produce real complementary_brands[] and retail_mix[] for property_location_cache.
 *
 * Called during property enrichment (property-reference-enrichment.ts) to replace
 * the previously empty []::jsonb values with actual Bangalore market data.
 */

import type { PrismaClient } from '@prisma/client'

export type ComplementaryBrand = {
  name: string
  industry: string
  type: string
  category: string
  price_positioning: string
  typical_store_size_sqft: number
  flagship_location: string | null
  reason: string // why it's a good co-tenant
}

export type RetailMixEntry = {
  category: string
  count: number
  saturation: string // 'low' | 'medium' | 'high'
  percentage: number
}

export type BrandDirectoryEnrichmentResult = {
  complementaryBrands: ComplementaryBrand[]
  retailMix: RetailMixEntry[]
  competitorBrands: { name: string; category: string; price_positioning: string }[]
  localityRetailProfile: {
    fnbPct: number
    retailPct: number
    wellnessPct: number
    whitespaceCategories: string[]
    dominantCategories: string[]
    anchorBrands: string[]
  } | null
}

function normaliseLocality(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(layout|road|nagar|main|area|sector|block)$/i, '')
    .trim()
}

/**
 * Resolve which brand industry key maps to for complementary brand logic.
 * A restaurant benefits from being near retail anchors, gyms, offices.
 * A gym benefits from being near cafes, healthy food, active lifestyle retail.
 */
function getComplementaryIndustries(industryKey: string): string[] {
  const map: Record<string, string[]> = {
    restaurant:   ['Retail', 'Entertainment', 'Services'],
    cafe:         ['Retail', 'Services', 'Wellness'],
    qsr:          ['Retail', 'Entertainment', 'Services'],
    bar:          ['F&B', 'Entertainment'],
    brewery:      ['F&B', 'Entertainment'],
    bakery:       ['Retail', 'Services', 'F&B'],
    retail:       ['F&B', 'Wellness', 'Entertainment'],
    salon:        ['Retail', 'F&B', 'Wellness'],
    wellness:     ['F&B', 'Retail'],
    gym:          ['F&B', 'Retail', 'Wellness'],
    entertainment:['F&B', 'Retail'],
  }
  return map[industryKey] ?? ['F&B', 'Retail', 'Services']
}

/**
 * Fetch brands from bangalore_brand_directory that are present in the locality
 * and complement the brand's industry (i.e. good co-tenants, not competitors).
 */
async function fetchComplementaryBrands(
  prisma: PrismaClient,
  locality: string,
  industryKey: string,
  brandIndustry: string,
  limit = 12
): Promise<ComplementaryBrand[]> {
  const localityPattern = `%${locality}%`
  const complementaryIndustries = getComplementaryIndustries(industryKey)

  // Exclude the brand's own industry to avoid returning competitors
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      brand_name,
      industry,
      type,
      category,
      price_positioning,
      typical_store_size_sqft,
      flagship_location,
      complementary_brands,
      co_tenant_affinity
    FROM bangalore_brand_directory
    WHERE
      is_active = true
      AND bangalore_localities::text ILIKE ${localityPattern}
      AND industry = ANY(${complementaryIndustries}::text[])
      AND industry != ${brandIndustry}
      AND data_confidence IN ('high', 'medium')
    ORDER BY
      CASE data_confidence WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      bangalore_stores_total DESC NULLS LAST
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    name: String(r.brand_name ?? ''),
    industry: String(r.industry ?? ''),
    type: String(r.type ?? ''),
    category: String(r.category ?? ''),
    price_positioning: String(r.price_positioning ?? ''),
    typical_store_size_sqft: Number(r.typical_store_size_sqft ?? 0),
    flagship_location: r.flagship_location ? String(r.flagship_location) : null,
    reason: resolveCoTenantReason(String(r.industry ?? ''), String(r.type ?? ''), industryKey),
  }))
}

function resolveCoTenantReason(
  brandIndustry: string,
  brandType: string,
  targetIndustryKey: string
): string {
  if (brandIndustry === 'Retail' && targetIndustryKey === 'restaurant')
    return 'Retail traffic drives F&B dwell time'
  if (brandIndustry === 'Retail' && targetIndustryKey === 'cafe')
    return 'Shoppers seek coffee breaks — strong co-traffic'
  if (brandIndustry === 'Entertainment' && ['restaurant', 'qsr'].includes(targetIndustryKey))
    return 'Post-entertainment dining demand'
  if (brandIndustry === 'Wellness' && ['cafe', 'qsr'].includes(targetIndustryKey))
    return 'Health-conscious customers overlap'
  if (brandIndustry === 'Services' && ['cafe', 'restaurant'].includes(targetIndustryKey))
    return 'Corporate/office workers drive weekday F&B demand'
  if (brandIndustry === 'F&B' && targetIndustryKey === 'retail')
    return 'F&B anchors drive repeat footfall to retail'
  if (brandType.toLowerCase().includes('gym') || brandType.toLowerCase().includes('fitness'))
    return 'Active lifestyle crossover audience'
  return 'Shared catchment audience'
}

/**
 * Fetch competitor brands in the locality for the brand's own industry/category.
 */
async function fetchCompetitorBrandsFromDirectory(
  prisma: PrismaClient,
  locality: string,
  brandIndustry: string,
  brandCategory: string,
  limit = 10
): Promise<{ name: string; category: string; price_positioning: string }[]> {
  const localityPattern = `%${locality}%`

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT brand_name, category, price_positioning
    FROM bangalore_brand_directory
    WHERE
      is_active = true
      AND bangalore_localities::text ILIKE ${localityPattern}
      AND industry = ${brandIndustry}
      AND data_confidence IN ('high', 'medium')
    ORDER BY
      CASE WHEN category = ${brandCategory} THEN 0 ELSE 1 END,
      bangalore_stores_total DESC NULLS LAST
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    name: String(r.brand_name ?? ''),
    category: String(r.category ?? ''),
    price_positioning: String(r.price_positioning ?? ''),
  }))
}

/**
 * Fetch retail mix from bangalore_locality_retail_mix for the matched locality.
 */
async function fetchRetailMix(
  prisma: PrismaClient,
  locality: string
): Promise<{
  mix: RetailMixEntry[]
  profile: BrandDirectoryEnrichmentResult['localityRetailProfile']
}> {
  const localityPattern = `%${locality}%`

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT *
    FROM bangalore_locality_retail_mix
    WHERE locality ILIKE ${localityPattern}
    LIMIT 1
  `

  const r = rows[0]
  if (!r) return { mix: [], profile: null }

  const toNum = (v: unknown, fb = 0) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fb
  }

  const toStr = (v: unknown) => (v != null ? String(v) : '')

  type RawEntry = { label: string; count: number; sat: string }

  // Build retail mix entries from individual count columns
  const rawEntries: RawEntry[] = [
    { label: 'QSR',        count: toNum(r.qsr_count),        sat: toStr(r.fnb_saturation_score) },
    { label: 'Cafe',       count: toNum(r.cafe_count),       sat: toStr(r.fnb_saturation_score) },
    { label: 'Restaurant', count: toNum(r.restaurant_count), sat: toStr(r.fnb_saturation_score) },
    { label: 'Bar/Pub',    count: toNum(r.bar_count),        sat: toStr(r.fnb_saturation_score) },
    { label: 'Bakery',     count: toNum(r.bakery_count),     sat: toStr(r.fnb_saturation_score) },
    { label: 'Footwear',   count: toNum(r.footwear_count),   sat: toStr(r.retail_saturation_score) },
    { label: 'Apparel',    count: toNum(r.apparel_count),    sat: toStr(r.retail_saturation_score) },
    { label: 'Eyewear',    count: toNum(r.eyewear_count),    sat: toStr(r.retail_saturation_score) },
    { label: 'Jewellery',  count: toNum(r.jewellery_count),  sat: toStr(r.retail_saturation_score) },
    { label: 'Electronics',count: toNum(r.electronics_count),sat: toStr(r.retail_saturation_score) },
    { label: 'Beauty',     count: toNum(r.beauty_count),     sat: toStr(r.retail_saturation_score) },
    { label: 'Gym/Fitness',count: toNum(r.gym_count),        sat: toStr(r.wellness_saturation_score) },
    { label: 'Salon',      count: toNum(r.salon_count),      sat: toStr(r.wellness_saturation_score) },
    { label: 'Pharmacy',   count: toNum(r.pharmacy_count),   sat: toStr(r.wellness_saturation_score) },
    { label: 'Cinema',     count: toNum(r.cinema_count),     sat: 'low' },
  ].filter((e) => e.count > 0)

  const totalCount = rawEntries.reduce((s, e) => s + e.count, 0)

  const mix: RetailMixEntry[] = rawEntries.map(({ label, count, sat }) => {
    const satScore = Number(sat)
    const satLabel: RetailMixEntry['saturation'] = Number.isFinite(satScore)
      ? satScore >= 70 ? 'high' : satScore >= 40 ? 'medium' : 'low'
      : sat.toLowerCase().indexOf('high') !== -1 ? 'high'
        : sat.toLowerCase().indexOf('low') !== -1 ? 'low'
        : 'medium'
    return {
      category: label,
      count,
      saturation: satLabel,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    }
  })

  // Parse JSONB arrays
  const parseArr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String)
    if (typeof v === 'string') {
      try { return JSON.parse(v) } catch { return [] }
    }
    return []
  }

  const profile: BrandDirectoryEnrichmentResult['localityRetailProfile'] = {
    fnbPct: toNum(r.fnb_percentage),
    retailPct: toNum(r.retail_percentage),
    wellnessPct: toNum(r.wellness_percentage),
    whitespaceCategories: parseArr(r.whitespace_categories),
    dominantCategories: parseArr(r.dominant_categories),
    anchorBrands: parseArr(r.anchor_brands),
  }

  return { mix, profile }
}

/**
 * Main export: given a locality string and brand industry context,
 * return enriched complementary_brands, retail_mix, and competitor_brands
 * from the brand directory.
 */
export async function enrichFromBrandDirectory(params: {
  prisma: PrismaClient
  locality: string          // e.g. "Koramangala", "Indiranagar"
  industryKey: string       // e.g. "restaurant", "cafe", "retail", "salon"
  brandIndustry: string     // e.g. "F&B", "Retail", "Wellness"
  brandCategory: string     // e.g. "QSR", "Casual Dining", "Footwear"
}): Promise<BrandDirectoryEnrichmentResult> {
  const { prisma, locality, industryKey, brandIndustry, brandCategory } = params
  const normLocality = normaliseLocality(locality)

  if (!normLocality) {
    return {
      complementaryBrands: [],
      retailMix: [],
      competitorBrands: [],
      localityRetailProfile: null,
    }
  }

  const [complementaryBrands, competitorBrands, { mix: retailMix, profile: localityRetailProfile }] =
    await Promise.all([
      fetchComplementaryBrands(prisma, normLocality, industryKey, brandIndustry),
      fetchCompetitorBrandsFromDirectory(prisma, normLocality, brandIndustry, brandCategory),
      fetchRetailMix(prisma, normLocality),
    ])

  return {
    complementaryBrands,
    retailMix,
    competitorBrands,
    localityRetailProfile,
  }
}

/**
 * Resolve brand industry + category from industryKey (used in enrichment pipeline).
 */
export function industryKeyToBrandContext(industryKey: string): {
  brandIndustry: string
  brandCategory: string
} {
  const map: Record<string, { brandIndustry: string; brandCategory: string }> = {
    restaurant:    { brandIndustry: 'F&B',      brandCategory: 'Casual Dining' },
    cafe:          { brandIndustry: 'F&B',      brandCategory: 'Cafe' },
    qsr:           { brandIndustry: 'F&B',      brandCategory: 'QSR' },
    bar:           { brandIndustry: 'F&B',      brandCategory: 'Bar/Restaurant' },
    brewery:       { brandIndustry: 'F&B',      brandCategory: 'Bar/Brewery' },
    bakery:        { brandIndustry: 'F&B',      brandCategory: 'Bakery' },
    retail:        { brandIndustry: 'Retail',   brandCategory: 'Apparel' },
    footwear:      { brandIndustry: 'Retail',   brandCategory: 'Footwear' },
    salon:         { brandIndustry: 'Wellness', brandCategory: 'Salon' },
    wellness:      { brandIndustry: 'Wellness', brandCategory: 'Gym/Fitness' },
    gym:           { brandIndustry: 'Wellness', brandCategory: 'Gym/Fitness' },
    entertainment: { brandIndustry: 'Entertainment', brandCategory: 'Gaming' },
  }
  return map[industryKey] ?? { brandIndustry: 'F&B', brandCategory: 'Casual Dining' }
}
