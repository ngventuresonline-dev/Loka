import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { enrichPropertyIntelligence } from '@/lib/intelligence/enrichment'

export const revalidate = 3600 // 1 hour — intelligence data is stable

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  const categoryFilter = req.nextUrl.searchParams.get('category') ?? undefined
  if (!propertyId) {
    return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const intelligence = await prisma.propertyIntelligence.findUnique({
    where: { propertyId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          state: true,
          propertyType: true,
          size: true,
          price: true,
          priceType: true,
        },
      },
    },
  })

  if (!intelligence) {
    return NextResponse.json(
      { error: 'No intelligence data. Trigger enrichment with POST.' },
      { status: 404 }
    )
  }

  let competitors = await prisma.competitor.findMany({
    where: { propertyId },
    orderBy: { distance: 'asc' },
    take: 500,
  })

  if (categoryFilter) {
    const normalized = categoryFilter.trim().toLowerCase()
    const categoryMatch = (c: { category: string }) => {
      const cat = (c.category || '').toLowerCase()
      if (normalized.includes('cafe') || normalized === 'cafe') return cat === 'cafe'
      if (normalized.includes('qsr')) return cat === 'qsr'
      if (normalized.includes('restaurant') || normalized.includes('dining') || normalized.includes('casual') || normalized.includes('fine')) return cat === 'restaurant' || cat.includes('dining')
      if (normalized.includes('brew') || normalized.includes('taproom') || normalized.includes('bar')) return cat === 'bar' || cat.includes('brew')
      if (normalized.includes('retail')) return cat === 'retail' || cat.includes('store') || cat.includes('shop')
      if (normalized.includes('bakery')) return cat === 'bakery'
      if (normalized.includes('salon') || normalized.includes('wellness') || normalized.includes('spa')) return cat === 'salon' || cat.includes('spa') || cat.includes('beauty')
      return true
    }
    competitors = competitors.filter(categoryMatch)
  }

  // Raw SQL: bypasses Prisma select validation when client schema lags behind DB columns (@map snake_case as listed).
  const ward =
    intelligence.wardCode != null
      ? await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT 
        "wardCode", "wardName", locality, city, latitude, longitude,
        "population2021", "population2026", "populationDensity", "populationGrowth",
        age18_24, age25_34, age35_44, age45_54, "age55Plus", "medianAge",
        "income6to10L", "income10to15L", "incomeAbove15L", "medianIncome",
        "workingPopulation", "itProfessionals", "businessOwners",
        apartments, "carOwnership", "diningOutPerWeek",
        avg_appt_sqft, avg_land_sqft, combined_avg_sqft,
        spending_power_index, commercial_rent_min, commercial_rent_max,
        dominant_age_group, primary_resident_type
      FROM ward_demographics
      WHERE "wardCode" = ${intelligence.wardCode}
      LIMIT 1
    `
          .then((rows: Array<Record<string, unknown>>) => {
            if (!rows?.length) return null
            const r = rows[0]
            const num = (k: string) => (r[k] != null ? Number(r[k]) : NaN)
            const numOrNull = (k: string) => (r[k] != null ? Number(r[k]) : null)
            return {
              wardCode: r['wardCode'],
              wardName: r['wardName'],
              locality: r['locality'],
              city: r['city'],
              latitude: num('latitude'),
              longitude: num('longitude'),
              population2021: num('population2021'),
              population2026: num('population2026'),
              populationDensity: num('populationDensity'),
              populationGrowth: num('populationGrowth'),
              age18_24: num('age18_24'),
              age25_34: num('age25_34'),
              age35_44: num('age35_44'),
              age45_54: num('age45_54'),
              age55Plus: num('age55Plus'),
              medianAge: num('medianAge'),
              income6to10L: num('income6to10L'),
              income10to15L: num('income10to15L'),
              incomeAbove15L: num('incomeAbove15L'),
              medianIncome: num('medianIncome'),
              workingPopulation: num('workingPopulation'),
              itProfessionals: num('itProfessionals'),
              businessOwners: num('businessOwners'),
              apartments: num('apartments'),
              carOwnership: num('carOwnership'),
              diningOutPerWeek: num('diningOutPerWeek'),
              avgApptSqft: numOrNull('avg_appt_sqft'),
              avgLandSqft: numOrNull('avg_land_sqft'),
              combinedAvgSqft: numOrNull('combined_avg_sqft'),
              spendingPowerIndex: numOrNull('spending_power_index'),
              commercialRentMin: numOrNull('commercial_rent_min'),
              commercialRentMax: numOrNull('commercial_rent_max'),
              dominantAgeGroup: r['dominant_age_group'] as string | null,
              primaryResidentType: r['primary_resident_type'] as string | null,
            }
          })
          .catch(() => null)
      : null

  const localityKey =
    intelligence.property?.city?.split(',')[0]?.trim() ||
    intelligence.property?.address?.split(',').slice(-1)[0]?.trim() ||
    ''

  const normalizeSqlRow = (row: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(row)) {
      out[k] = typeof v === 'bigint' ? Number(v) : v
    }
    return out
  }

  let localityIntel: Record<string, unknown> | null = null
  let nearbySocieties: Array<Record<string, unknown>> = []
  let nearbyTechParks: Array<Record<string, unknown>> = []

  if (localityKey) {
    const likePattern = `%${localityKey.toLowerCase()}%`
    try {
      const liRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT 
          li.locality, li.zone,
          li.total_apartment_societies, li.total_apartment_units,
          li.avg_resale_price_sqft, li.avg_rent_2bhk, li.avg_rent_3bhk,
          li.total_office_employees, li.total_companies,
          li.total_restaurants, li.total_cafes, li.total_qsr,
          li.f_and_b_density, li.avg_daily_footfall,
          li.commercial_rent_gf_min, li.commercial_rent_gf_max,
          li.daytime_pop, li.nighttime_pop,
          li.spending_power_index, li.dining_out_weekly,
          li.cafe_saturation, li.qsr_saturation, li.restaurant_saturation,
          li.delivery_demand,
          li.key_employers, li.key_colleges, li.key_hotels,
          li.lokazen_f_and_b_score, li.lokazen_cafe_score, li.lokazen_qsr_score,
          li.lokazen_retail_score, li.lokazen_salon_score
        FROM bangalore_locality_intel li
        WHERE LOWER(TRIM(li.locality)) = LOWER(${localityKey})
           OR LOWER(li.locality) LIKE ${likePattern}
        LIMIT 1
      `
      if (liRows?.length) localityIntel = normalizeSqlRow(liRows[0] as Record<string, unknown>)
    } catch (e) {
      console.warn('[Intelligence GET] bangalore_locality_intel:', e instanceof Error ? e.message : e)
    }

    try {
      const socRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT name, developer, total_units, bhk_types, avg_price_sqft,
               avg_rent_2bhk, occupancy_pct, sec_profile, resident_profile
        FROM bangalore_societies
        WHERE LOWER(locality) LIKE ${likePattern}
          AND COALESCE(is_active, true) = true
        ORDER BY total_units DESC NULLS LAST
        LIMIT 6
      `
      nearbySocieties = (socRows || []).map((r) => normalizeSqlRow(r as Record<string, unknown>))
    } catch (e) {
      console.warn('[Intelligence GET] bangalore_societies:', e instanceof Error ? e.message : e)
    }

    try {
      const tpRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT name, total_employees, total_companies, grade, anchor_tenants,
               avg_rent_sqft, metro_distance_m, metro_name
        FROM bangalore_tech_parks
        WHERE (LOWER(locality) LIKE ${likePattern}
           OR LOWER(locality) LIKE '%outer ring road%')
          AND COALESCE(is_active, true) = true
        ORDER BY total_employees DESC NULLS LAST
        LIMIT 4
      `
      nearbyTechParks = (tpRows || []).map((r) => normalizeSqlRow(r as Record<string, unknown>))
    } catch (e) {
      console.warn('[Intelligence GET] bangalore_tech_parks:', e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({
    property: intelligence.property,
    intelligence,
    competitors,
    ward,
    localityIntel,
    nearbySocieties,
    nearbyTechParks,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  if (!propertyId) {
    return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
  }

  let businessType: string | undefined
  try {
    const body = (await req.json().catch(() => null)) as { businessType?: string; targetCategory?: string } | null
    businessType = body?.businessType ?? body?.targetCategory ?? undefined
  } catch {
    // ignore
  }

  try {
    const result = await enrichPropertyIntelligence(propertyId, businessType)
    return NextResponse.json(
      {
        message: 'Enrichment completed',
        propertyId,
        result,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Enrichment failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
