import Anthropic from '@anthropic-ai/sdk'
import { INTEL_SYNTHESIS_MODEL, MAX_TOKENS } from '@/lib/claude'
import type {
  LocationSynthesis,
  BrandIntelStrategicFit,
  BrandContextForIntel,
  PropertyContextForIntel,
  MatchContextForIntel,
  LiveEconomicsEnrichment,
  LiveEconomicsConfidence,
} from '@/lib/intelligence/brand-intel-enrichment.types'

export type {
  LocationSynthesis,
  BrandIntelStrategicFit,
  BrandContextForIntel,
  PropertyContextForIntel,
  MatchContextForIntel,
  LiveEconomicsEnrichment,
} from '@/lib/intelligence/brand-intel-enrichment.types'

/** Sonnet + richer payload: allow longer wall time than Haiku-only path. */
const intelAnthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  timeout: 120 * 1000,
})

function clampRentRupee(n: unknown, fallback: number): number {
  const x = Math.round(Number(n))
  if (!Number.isFinite(x)) return fallback
  return Math.min(550, Math.max(35, x))
}

function parseLiveEconomics(raw: unknown, fb: { mid: number; low: number; high: number }): LiveEconomicsEnrichment {
  if (!raw || typeof raw !== 'object') {
    return {
      commercialRentPerSqftTypical: fb.mid,
      commercialRentLow: fb.low,
      commercialRentHigh: fb.high,
      confidence: 'low',
      rationale: 'Rent detail was incomplete in synthesis; showing platform benchmark band.',
    }
  }
  const o = raw as Record<string, unknown>
  let typical = clampRentRupee(o.commercialRentPerSqftTypical, fb.mid)
  let low = clampRentRupee(o.commercialRentLow, fb.low)
  let high = clampRentRupee(o.commercialRentHigh, fb.high)
  if (low > high) {
    const t = low
    low = high
    high = t
  }
  if (typical < low) typical = low
  if (typical > high) typical = high
  const confRaw = String(o.confidence || 'medium').toLowerCase()
  const confidence: LiveEconomicsConfidence = ['low', 'medium', 'high'].includes(confRaw)
    ? (confRaw as LiveEconomicsConfidence)
    : 'medium'
  return {
    commercialRentPerSqftTypical: typical,
    commercialRentLow: low,
    commercialRentHigh: high,
    confidence,
    rationale: String(o.rationale || '').slice(0, 650),
    listingVsMarketNote:
      o.listingVsMarketNote != null && String(o.listingVsMarketNote).trim()
        ? String(o.listingVsMarketNote).slice(0, 420)
        : undefined,
  }
}

/** Fixes common LLM JSON mistakes (trailing commas, smart quotes, extra prose). */
function extractAndRepairJsonObject(raw: string): Record<string, unknown> | null {
  let t = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/g, '').trim()
  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first >= 0 && last > first) t = t.slice(first, last + 1)

  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s) as unknown
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
    } catch {
      /* try repaired */
    }
    let fixed = s
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\r\n/g, '\n')
    for (let i = 0; i < 6; i++) {
      const next = fixed.replace(/,\s*([\]}])/g, '$1')
      if (next === fixed) break
      fixed = next
    }
    try {
      const v = JSON.parse(fixed) as unknown
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
    } catch {
      /* fall through */
    }
    return null
  }

  let o = tryParse(t)
  if (o) return o

  const greedy = raw.match(/\{[\s\S]*\}/)
  if (greedy) {
    o = tryParse(greedy[0])
    if (o) return o
  }

  const balanced = extractBalancedJsonObject(raw)
  if (balanced) {
    o = tryParse(balanced)
    if (o) return o
  }

  return null
}

/** First top-level `{ ... }` with brace matching (greedy regex can pull two objects). */
function extractBalancedJsonObject(s: string): string | null {
  const start = s.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (c === '\\') {
        esc = true
        continue
      }
      if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

function asStrArr(v: unknown, max: number): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : []
}

function synthesisFromObject(
  o: Record<string, unknown>,
  platformRent: { mid: number; low: number; high: number }
): LocationSynthesis {
  const fitRaw = String(o.strategicFit || 'viable').toLowerCase()
  const strategicFit: BrandIntelStrategicFit = ['strong', 'viable', 'cautionary', 'weak'].includes(fitRaw)
    ? (fitRaw as BrandIntelStrategicFit)
    : 'viable'

  return {
    executiveSummary: String(o.executiveSummary || '').slice(0, 1200),
    strategicFit,
    strengths: asStrArr(o.strengths, 5),
    risks: asStrArr(o.risks, 5),
    opportunities: asStrArr(o.opportunities, 4),
    competitorTakeaway: String(o.competitorTakeaway || '').slice(0, 500),
    footfallInterpretation: String(o.footfallInterpretation || '').slice(0, 500),
    nextSteps: asStrArr(o.nextSteps, 4),
    disclaimer: String(
      o.disclaimer ||
        'Uses modelled POI and census-proxy data plus Lokazen synthesis—not a substitute for brokers, comps, or legal advice.'
    ).slice(0, 400),
    liveEconomics: parseLiveEconomics(o.liveEconomics, platformRent),
    catchmentForBrand: String(o.catchmentForBrand || '').slice(0, 500),
    catchmentBullets: asStrArr(o.catchmentBullets, 3),
    marketForBrand: String(o.marketForBrand || '').slice(0, 500),
    marketBullets: asStrArr(o.marketBullets, 3),
    competitionForBrand: String(o.competitionForBrand || '').slice(0, 500),
    competitionBullets: asStrArr(o.competitionBullets, 3),
    riskForBrand: String(o.riskForBrand || '').slice(0, 500),
    riskBullets: asStrArr(o.riskBullets, 3),
    similarMarketsForBrand: String(o.similarMarketsForBrand || '').slice(0, 500),
    similarMarketsBullets: asStrArr(o.similarMarketsBullets, 2),
    residentsForBrand: String(o.residentsForBrand || '').slice(0, 450),
    residentsBullets: asStrArr(o.residentsBullets, 3),
    apartmentsForBrand: String(o.apartmentsForBrand || '').slice(0, 450),
    apartmentsBullets: asStrArr(o.apartmentsBullets, 3),
    workplacesForBrand: String(o.workplacesForBrand || '').slice(0, 450),
    workplacesBullets: asStrArr(o.workplacesBullets, 3),
  }
}

function trySynthesisFromModelText(
  text: string,
  platformRent: { mid: number; low: number; high: number }
): LocationSynthesis | null {
  const o = extractAndRepairJsonObject(text)
  if (!o) return null
  return synthesisFromObject(o, platformRent)
}

/**
 * Always returns a complete LocationSynthesis when the LLM returns bad JSON, empty text, or errors.
 * Keeps the brand dashboard working; tabs still get coherent copy from the same snapshot.
 */
export function buildFallbackLocationSynthesis(
  brand: BrandContextForIntel,
  property: PropertyContextForIntel,
  intelSnapshot: Record<string, unknown>,
  platformRent: { mid: number; low: number; high: number }
): LocationSynthesis {
  const pl = intelSnapshot.populationLifestyle as Record<string, unknown> | undefined
  const foot = intelSnapshot.footfall as Record<string, unknown> | undefined
  const mkt = intelSnapshot.market as Record<string, unknown> | undefined
  const transit = intelSnapshot.transit as Record<string, unknown> | undefined
  const lm = intelSnapshot.landmarks as Record<string, unknown> | undefined
  const topComp = Array.isArray(intelSnapshot.topCompetitors)
    ? (intelSnapshot.topCompetitors as Array<{ name?: string; cat?: string; km?: number }>)
    : []

  const areaKey = String(intelSnapshot.nearestCommercialAreaKey || '').replace(/-/g, ' ') || property.city
  const affluence = String(pl?.affluenceIndicator || 'Mixed')
  const hh = pl?.totalHouseholds != null ? Number(pl.totalHouseholds) : null
  const footfall = foot?.dailyAverage != null ? Number(foot.dailyAverage) : null
  const compCountRaw = mkt?.competitorCount != null ? Number(mkt.competitorCount) : topComp.length
  const compCount = Number.isFinite(compCountRaw) ? compCountRaw : topComp.length

  const resN = Number(lm?.residential) || 0
  const techN = Number(lm?.tech_park) || 0
  const corpN = Number(lm?.corporate) || 0
  const samples = Array.isArray(lm?.samples) ? (lm.samples as Array<{ name?: string; kind?: string }>) : []
  const sampleResidential = samples.filter((s) => s.kind === 'residential').map((s) => s.name).filter(Boolean).slice(0, 2) as string[]
  const sampleTech = samples.filter((s) => s.kind === 'tech_park').map((s) => s.name).filter(Boolean).slice(0, 2) as string[]

  const industry = brand.industry?.trim() || 'your category'
  const exec =
    `${brand.name} (${industry}) — ${property.title} in ${areaKey}, ${property.city}. ` +
    `Platform model: ${affluence} affluence proxy` +
    (hh != null && hh > 0 ? `, ~${hh.toLocaleString('en-IN')} households in the catchment layer.` : '. ') +
    (footfall != null && footfall > 0
      ? ` Est. ~${footfall.toLocaleString('en-IN')} daily footfall in the trade-area model.`
      : '') +
    ` Full prose synthesis was unavailable; this brief is built from the same live metrics.`

  const live = parseLiveEconomics(undefined, platformRent)
  live.rationale = `Structured dashboard fallback using your platform rent band (₹${platformRent.low}–${platformRent.high}/sqft/mo typical ₹${platformRent.mid}). ${live.rationale}`

  const metroLine = transit?.metroName ? `Transit model includes ${String(transit.metroName)}.` : null

  return {
    executiveSummary: exec.slice(0, 1200),
    strategicFit: 'viable',
    strengths: [
      'Location intelligence loaded for this listing.',
      compCount > 0 ? `~${compCount} competitor POIs in the modelled trade area.` : 'Sparse competition signal in mapped radius — validate on site.',
      affluence === 'High' ? 'High affluence proxy in the catchment layer.' : 'Affluence and demand signals are in the scorecard and tabs.',
    ].slice(0, 4),
    risks: [
      'Short automated brief only — use maps, comps, and legal diligence before signing.',
      'Modelled footfall and demographics are directional, not audited census data.',
    ],
    opportunities: [
      'Cross-check rents with brokers for this micro-street.',
      'Compare segment peers in the Competitors tab.',
    ].slice(0, 3),
    competitorTakeaway: topComp.length
      ? `Mapped peers include: ${topComp
          .slice(0, 4)
          .map((c) => c.name)
          .filter(Boolean)
          .join(', ')}.`
      : 'Few named peers in radius — whitespace or data gap; site visit recommended.',
    footfallInterpretation:
      footfall != null && footfall > 0
        ? `Model estimates ~${footfall.toLocaleString('en-IN')} average daily footfall near this pin; peaks vary by weekday.`
        : 'Footfall proxy unavailable — use Market tab charts when data exists.',
    nextSteps: ['Validate rent and terms with a broker.', 'Walk the catchment at lunch and evening peaks.', 'Confirm competitor list on maps.'].slice(0, 3),
    disclaimer:
      'Structured Lokazen fallback from modelled POI and census-proxy inputs — not investment or legal advice. Prose engine may return on the next load.',
    liveEconomics: live,
    catchmentForBrand: `Catchment centres on ${property.city} with ${areaKey} as the nearest commercial micro-market key.`,
    catchmentBullets: [
      hh != null && hh > 0 ? `~${hh.toLocaleString('en-IN')} households in lifestyle proxy` : 'Household proxy loaded where available',
      affluence ? `${affluence} affluence indicator` : 'See Population & Lifestyle metrics',
    ].slice(0, 3),
    residentsForBrand: `${affluence} spending-power proxy for residents around this trade area.${
      hh != null && hh > 0 ? ` Household estimate ~${hh.toLocaleString('en-IN')}.` : ''
    } Use the Catchment tab for pin mix.`,
    residentsBullets: [affluence ? `${affluence}-affluence cluster in model` : 'Demographics in dashboard metrics'].filter(Boolean).slice(0, 3),
    apartmentsForBrand:
      resN > 0 || sampleResidential.length
        ? `Residential anchors: ${resN} mapped residential nodes${sampleResidential.length ? ` (e.g. ${sampleResidential.join(', ')})` : ''}.`
        : 'Few labelled residential towers in snapshot — area may still be residential-dense; verify locally.',
    apartmentsBullets: sampleResidential.slice(0, 3),
    workplacesForBrand:
      techN + corpN > 0 || sampleTech.length
        ? `Workplace density: ${techN} tech-park + ${corpN} corporate anchors in model.${sampleTech.length ? ` Examples: ${sampleTech.join(', ')}.` : ''}`
        : 'Office/tech anchors thin in mapped sample — check nearby corporate pockets.',
    workplacesBullets: [metroLine, techN + corpN > 0 ? `${techN + corpN} workplace anchor types mapped` : null].filter((x): x is string => Boolean(x)).slice(0, 3),
    marketForBrand: `Rent band centres on ₹${platformRent.mid}/sqft/mo typical in platform economics for ${areaKey}. Demand and saturation in Market tab.`,
    marketBullets: [`Competitor count ~${compCount}`, `Micro-market: ${areaKey}`].slice(0, 3),
    competitionForBrand: topComp.length
      ? `Segment-relevant peers in radius: ${topComp
          .slice(0, 5)
          .map((c) => `${c.name} (${c.cat})`)
          .join('; ')}.`
      : 'No peer list in fallback snapshot — open Competitors tab for the map.',
    competitionBullets: topComp.slice(0, 3).map((c) => `${c.name} · ~${(c.km ?? 0).toFixed(1)}km`),
    riskForBrand: 'Cannibalisation and crowding are modelled in the Risk tab; lease stress is unverified without your contract terms.',
    riskBullets: ['Validate same-brand clusters on the map', 'Stress-test rent vs. revenue plan'].slice(0, 3),
    similarMarketsForBrand: 'Use Similar Markets for analogue Bengaluru sub-markets scored vs this pin.',
    similarMarketsBullets: ['Compare 2–3 analogues before shortlisting'],
  }
}

export type DbEnrichmentForIntelSnapshot = {
  localityIntel?: Record<string, unknown> | null
  nearbySocieties?: Array<Record<string, unknown>>
  nearbyTechParks?: Array<Record<string, unknown>>
  ward?: Record<string, unknown> | null
}

function normalizeWardForSnapshot(w: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!w || typeof w !== 'object') return null
  const o = w as Record<string, unknown>
  if (o.wardCode != null && o.wardName != null) {
    return {
      wardName: o.wardName,
      pop2026: o.population2026,
      popDensity: o.populationDensity,
      age25_34: o.age25_34,
      age35_44: o.age35_44,
      incomeAbove15L: o.incomeAbove15L,
      itProfessionals: o.itProfessionals,
      diningOutWeekly: o.diningOutPerWeek ?? o.diningOutWeekly,
      commercialRentMin: o.commercialRentMin,
      commercialRentMax: o.commercialRentMax,
      spendingPower: o.spendingPowerIndex ?? o.spendingPower,
      dominantAge: o.dominantAgeGroup ?? o.dominantAge,
      residentProfile: o.primaryResidentType ?? o.residentProfile,
    }
  }
  return o
}

/**
 * Claude-ready location context: compact, structured, no raw coordinate dumps.
 * Includes optional Supabase enrichment + legacy keys for buildFallbackLocationSynthesis.
 */
export function buildLocationIntelSnapshot(
  raw: Record<string, unknown>,
  match?: MatchContextForIntel | null,
  dbEnrichment?: DbEnrichmentForIntelSnapshot | null
): Record<string, unknown> {
  const competitors = Array.isArray(raw.competitors) ? raw.competitors : []
  const topCompetitors = (
    competitors as Array<{
      name?: string
      distanceMeters?: number
      placeCategory?: string
      rating?: number
      userRatingsTotal?: number
      reviewCount?: number
    }>
  )
    .slice(0, 10)
    .map((c) => ({
      name: String(c.name || ''),
      km: Math.round(Number(c.distanceMeters) || 0) / 1000,
      cat: String(c.placeCategory || 'other'),
      rating: c.rating != null && Number.isFinite(Number(c.rating)) ? Number(c.rating).toFixed(1) : null,
      reviews: c.userRatingsTotal ?? c.reviewCount ?? null,
    }))

  const footfall = raw.footfall as Record<string, unknown> | undefined
  const market = raw.market as Record<string, unknown> | undefined
  const scores = raw.scores as Record<string, unknown> | undefined
  const pl = raw.populationLifestyle as Record<string, unknown> | undefined
  const proj = raw.projections2026 as Record<string, unknown> | undefined
  const access = raw.accessibility as Record<string, unknown> | undefined
  const metro = access?.nearestMetro as Record<string, unknown> | undefined
  const demographics = raw.demographics as Record<string, unknown> | undefined

  const landmarks = Array.isArray(raw.catchmentLandmarks) ? raw.catchmentLandmarks : []
  const lmByKind = (kind: string) =>
    (landmarks as Array<{ kind?: string }>).filter((l) => String((l as { kind?: string }).kind) === kind).length
  const landmarkSamples = (
    landmarks as Array<{ name?: string; kind?: string; distanceMeters?: number }>
  )
    .slice(0, 20)
    .map((l) => ({
      name: String(l.name || '').slice(0, 80),
      kind: String(l.kind || ''),
      km: Math.round((Number(l.distanceMeters) || 0) / 100) / 10,
    }))
    .filter((l) => l.name)

  const residentialLandmarks = landmarkSamples.filter((l) => l.kind === 'residential').slice(0, 6)
  const techLandmarks = landmarkSamples.filter((l) => l.kind === 'tech_park' || l.kind === 'corporate').slice(0, 5)
  const hotelLandmarks = landmarkSamples.filter((l) => l.kind === 'hotel').slice(0, 4)
  const collegeLandmarks = landmarkSamples.filter((l) => l.kind === 'college' || l.kind === 'school').slice(0, 4)
  const li = dbEnrichment?.localityIntel && typeof dbEnrichment.localityIntel === 'object' ? dbEnrichment.localityIntel : null
  const societies = Array.isArray(dbEnrichment?.nearbySocieties) ? dbEnrichment!.nearbySocieties! : []
  const techParks = Array.isArray(dbEnrichment?.nearbyTechParks) ? dbEnrichment!.nearbyTechParks! : []
  const wardNorm = normalizeWardForSnapshot(dbEnrichment?.ward ?? null)

  const affluence = pl?.affluenceIndicator ?? proj?.affluenceIndicator
  const households = pl?.totalHouseholds ?? proj?.totalHouseholds
  const listingRent = pl?.listingRentPerSqft
  const marketMid = pl?.rentPerSqft
  const marketLow = pl?.marketRentLow
  const marketHigh = pl?.marketRentHigh
  const rentSrc = pl?.rentDataSource
  const dailyAvg = footfall?.dailyAverage ?? footfall?.dailyAvg

  const retailMixArr = Array.isArray(raw.retailMix) ? raw.retailMix : []
  const rawCatchment = Array.isArray(raw.catchment) ? raw.catchment : []
  const rawCannibal = Array.isArray(raw.cannibalisationRisk) ? raw.cannibalisationRisk : []
  const rawCrowd = Array.isArray(raw.crowdPullers) ? raw.crowdPullers : []

  const core = {
    match: match
      ? {
          bfi: match.bfiScore,
          locationFit: match.locationFit,
          budgetFit: match.budgetFit,
          sizeFit: match.sizeFit,
        }
      : undefined,

    footfall: {
      dailyAvg,
      peakHours: footfall?.peakHours,
      weekendBoost: footfall?.weekendBoost,
      confidence: footfall?.confidence,
    },

    market: {
      saturation: market?.saturationLevel,
      competitorCount: market?.competitorCount,
      summary: market?.summary,
    },
    scores: {
      marketPotential: raw.marketPotentialScore,
      whitespace: scores?.whitespaceScore,
      demandGap: scores?.demandGapScore,
      saturationIndex: scores?.saturationIndex,
    },

    catchment: {
      affluence,
      households,
      incomeLevel: demographics?.incomeLevel,
      lifestyleSnippet: Array.isArray(demographics?.lifestyle)
        ? (demographics!.lifestyle as string[]).slice(0, 4)
        : undefined,
    },

    transit: {
      metroName: metro?.name,
      metroDistanceM: metro?.distanceMeters,
      busStops: access?.busStopsNearby,
    },

    rentContext: {
      listingRent,
      marketMid,
      marketLow,
      marketHigh,
      source: rentSrc,
      areaKey: raw.nearestCommercialAreaKey,
    },

    competitors: topCompetitors,

    retailMix: (retailMixArr as Array<{ category?: string; branded?: number; nonBranded?: number }>)
      .slice(0, 6)
      .map((r) => ({ cat: r.category, branded: r.branded, nonBranded: r.nonBranded })),

    crowdPullers: (
      rawCrowd as Array<{ name?: string; category?: string; distanceMeters?: number }>
    )
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        cat: p.category,
        km: Math.round((Number(p.distanceMeters) || 0) / 100) / 10,
      })),

    landmarkBreakdown: {
      residential: residentialLandmarks,
      techParks: techLandmarks,
      hotels: hotelLandmarks,
      colleges: collegeLandmarks,
    },

    localityIntel: li
      ? {
          locality: li.locality,
          zone: li.zone,
          apartmentSocietiesCount: li.total_apartment_societies,
          totalApartmentUnits: li.total_apartment_units,
          avgResalePriceSqft: li.avg_resale_price_sqft,
          avgRent2BHK: li.avg_rent_2bhk,
          avgRent3BHK: li.avg_rent_3bhk,
          totalOfficeEmployees: li.total_office_employees,
          totalCompanies: li.total_companies,
          totalRestaurants: li.total_restaurants,
          totalCafes: li.total_cafes,
          totalQSR: li.total_qsr,
          fnbDensity: li.f_and_b_density,
          avgDailyFootfall: li.avg_daily_footfall,
          daytimePop: li.daytime_pop,
          nighttimePop: li.nighttime_pop,
          commercialRentGFMin: li.commercial_rent_gf_min,
          commercialRentGFMax: li.commercial_rent_gf_max,
          spendingPowerIndex: li.spending_power_index,
          diningOutWeekly: li.dining_out_weekly,
          cafeSaturation: li.cafe_saturation,
          qsrSaturation: li.qsr_saturation,
          restaurantSaturation: li.restaurant_saturation,
          deliveryDemand: li.delivery_demand,
          keyEmployers: li.key_employers,
          keyColleges: li.key_colleges,
          keyHotels: li.key_hotels,
          lokazenScores: {
            fnb: li.lokazen_f_and_b_score,
            cafe: li.lokazen_cafe_score,
            qsr: li.lokazen_qsr_score,
            retail: li.lokazen_retail_score,
            salon: li.lokazen_salon_score,
          },
        }
      : null,

    nearbySocieties: societies.slice(0, 8).map((s) => ({
      name: s.name,
      developer: s.developer,
      units: s.total_units,
      bhk: s.bhk_types,
      priceSqft: s.avg_price_sqft,
      rent2bhk: s.avg_rent_2bhk,
      occupancy: s.occupancy_pct,
      profile: s.resident_profile ?? s.sec_profile,
    })),

    nearbyTechParks: techParks.slice(0, 5).map((t) => ({
      name: t.name,
      employees: t.total_employees,
      companies: t.total_companies,
      grade: t.grade,
      anchors: t.anchor_tenants,
      rentSqft: t.avg_rent_sqft,
      metro: t.metro_name,
      metroM: t.metro_distance_m,
    })),

    ward: wardNorm,

    catchmentTop: (rawCatchment as Array<{ name?: string; sharePct?: number; areaType?: string }>)
      .slice(0, 6)
      .map((x) => ({ name: x.name, sharePct: x.sharePct, areaType: x.areaType })),
    cannibalisationRisk: (rawCannibal as Array<{ brand?: string; cannibalisationPct?: number }>)
      .slice(0, 6)
      .map((r) => ({ brand: r.brand, pct: r.cannibalisationPct })),
    dataSource: raw.dataSource,
  }

  return {
    ...core,
    topCompetitors,
    nearestCommercialAreaKey: raw.nearestCommercialAreaKey,
    populationLifestyle: {
      affluenceIndicator: affluence,
      totalHouseholds: households,
      rentPerSqft: marketMid,
      marketRentLow: marketLow,
      marketRentHigh: marketHigh,
      listingRentPerSqft: listingRent,
      rentDataSource: rentSrc,
    },
    platformEconomics: {
      rentPerSqft: marketMid,
      marketLow,
      marketHigh,
      rentDataSource: rentSrc,
      listingRentPerSqft: listingRent,
    },
    demographics: {
      incomeLevel: demographics?.incomeLevel,
      lifestyleSnippet: Array.isArray(demographics?.lifestyle)
        ? (demographics!.lifestyle as string[]).slice(0, 4)
        : undefined,
    },
    footfall: {
      dailyAverage: dailyAvg,
      dailyAvg,
      peakHours: footfall?.peakHours,
      weekendBoost: footfall?.weekendBoost,
      confidence: footfall?.confidence,
    },
    market: {
      saturationLevel: market?.saturationLevel,
      competitorCount: market?.competitorCount,
      summary: market?.summary,
    },
    landmarks: {
      residential: lmByKind('residential'),
      tech_park: lmByKind('tech_park'),
      corporate: lmByKind('corporate'),
      samples: landmarkSamples.slice(0, 14),
    },
    retailMixSummary: (retailMixArr as Array<{ category?: string; branded?: number; nonBranded?: number }>).slice(0, 8),
  }
}

/** Drop duplicate/legacy keys before Claude — keeps prompts small; full snapshot still used for fallback. */
function slimIntelSnapshotForPrompt(full: Record<string, unknown>): Record<string, unknown> {
  const omit = new Set([
    'populationLifestyle',
    'platformEconomics',
    'demographics',
    'retailMixSummary',
    'landmarks',
    'topCompetitors',
    'nearestCommercialAreaKey',
  ])
  return Object.fromEntries(Object.entries(full).filter(([k]) => !omit.has(k)))
}

export async function enrichBrandLocationIntel(params: {
  brand: BrandContextForIntel
  property: PropertyContextForIntel
  intelSnapshot: Record<string, unknown>
}): Promise<LocationSynthesis> {
  const { brand, property, intelSnapshot } = params

  const li = intelSnapshot.localityIntel as Record<string, unknown> | null | undefined
  const rc = intelSnapshot.rentContext as Record<string, unknown> | undefined
  const ward = intelSnapshot.ward as Record<string, unknown> | null | undefined
  const pl = intelSnapshot.populationLifestyle as Record<string, unknown> | undefined

  const midRaw = Number(
    rc?.marketMid ?? pl?.rentPerSqft ?? li?.commercialRentGFMin ?? ward?.commercialRentMin ?? 0
  )
  const lowRaw = Number(
    li?.commercialRentGFMin ?? ward?.commercialRentMin ?? rc?.marketLow ?? pl?.marketRentLow ?? 0
  )
  const highRaw = Number(
    li?.commercialRentGFMax ?? ward?.commercialRentMax ?? rc?.marketHigh ?? pl?.marketRentHigh ?? 0
  )

  const platformRent = {
    mid: Number.isFinite(midRaw) && midRaw > 0 ? Math.round(midRaw) : 135,
    low: Number.isFinite(lowRaw) && lowRaw > 0 ? Math.round(lowRaw) : 95,
    high: Number.isFinite(highRaw) && highRaw > 0 ? Math.round(highRaw) : 175,
  }
  if (platformRent.low > platformRent.high) {
    const t = platformRent.low
    platformRent.low = platformRent.high
    platformRent.high = t
  }

  const promptContext = slimIntelSnapshotForPrompt(intelSnapshot)

  const prompt = `You are Lokazen's location intelligence analyst. Your job is NOT to summarise the data shown in charts — the brand can already see those numbers. Your job is to FILL THE GAPS: surface insights the data doesn't make obvious, name specific places and businesses the Google scan missed, and give the brand concrete, actionable intelligence they cannot get from looking at the dashboard themselves.

BRAND
${JSON.stringify(
  {
    brand: brand.companyName || brand.name,
    industry: brand.industry,
    budgetMin: brand.budgetMin != null ? `₹${Number(brand.budgetMin).toLocaleString('en-IN')}/mo` : null,
    budgetMax: brand.budgetMax != null ? `₹${Number(brand.budgetMax).toLocaleString('en-IN')}/mo` : null,
    preferredAreas: brand.preferredLocations,
  },
  null,
  0
)}

PROPERTY
${JSON.stringify(
  {
    title: property.title,
    address: property.address,
    city: property.city,
    type: property.propertyType,
    sqft: property.size,
    rent:
      property.price != null
        ? `₹${Number(property.price).toLocaleString('en-IN')}/${property.priceType}`
        : null,
  },
  null,
  0
)}

LOCATION DATA
${JSON.stringify(promptContext, null, 0)}

YOUR TASK — FILL GAPS, DON'T SUMMARISE:

1. CATCHMENT TAB: The Google Places scan only picks up what's labelled on Maps. Use nearbySocieties (from our DB) to name actual apartment complexes the scan missed. If nearbySocieties has data (e.g. Prestige City: 12,000 units, Sobha Royal Pavilion: 600 units), cite them by name with unit counts. Total them up. That's the real residential catchment. landmarkBreakdown.residential is Google's scan — compare the two. If DB societies show far more units than Google found, say so explicitly.

2. TECH PARK / OFFICE CATCHMENT: Use nearbyTechParks to name the actual tech parks and their employee counts. Don't say "good office catchment" — say "Wipro Campus (50,000 employees), Embassy Tech Village (110,000 employees) within 2km — estimated 160,000 daytime workers in the trade area." Use localityIntel.totalOfficeEmployees for the aggregate when present.

3. COMPETITORS: For ${brand.industry || 'this brand category'}, name the ACTUAL competitors in this area by brand name. For eyewear/optical retail: Lenskart, Vision Express, Specsmakers, GKB Opticals. For café: Blue Tokai, Third Wave Coffee, Starbucks, Matteo Coffea. For QSR/burger: McDonalds, Burger King, Truffles, Meghana Foods. For salon: Naturals, Bounce, Jean-Claude Biguine. Use localityIntel saturation signals (cafeSaturation, qsrSaturation etc.) and the competitors array (with reviews as demand proxy) to assess how crowded the market is FOR THIS SPECIFIC BRAND CATEGORY. High review counts on existing outlets = strong demand validation, not only a threat.

4. RENT REALITY CHECK: Compare property rent to localityIntel commercial rent band, ward commercial rent fields, and rentContext. Is the asking rent above/below/at market? By how much? What's the rent-to-revenue implication for this brand's budget?

5. REVENUE GAP ANALYSIS: Given localityIntel avgDailyFootfall, diningOutWeekly, totalOfficeEmployees + nearbyTechParks employee counts — what is the realistic daily customer pool for this brand? For F&B, a capture rate of 0.5-2% of daytime population is a coarse benchmark. For retail/optical, frame differently using footfall and affluence. What does that imply for monthly revenue?

6. CATEGORY-SPECIFIC VERDICT: Use localityIntel.lokazenScores to give the brand a direct verdict for their category. If lokazenScores.cafe = 82 and cafeSaturation = "high" — say so. Then say whether this specific location within that micro-market has an advantage (e.g. lower competition sub-zone, proximity to tech park).

OUTPUT RULES:
- All *ForBrand fields: be specific, cite actual names from the data. Never say "good catchment" — say "Prestige City (12,000 units, ₹13,500/sqft), Sobha Royal Pavilion (600 units) within 1.5km — estimated 30,000+ apartment residents in the primary catchment."
- executiveSummary ≤900 chars. Tab narratives ≤450 chars. Bullets ≤100 chars each.
- competitionForBrand: name actual category competitors by brand name. Never say "multiple restaurants" — say which ones.
- riskForBrand: be specific to this brand's budget and category. If rent is high for the sqft and category, say explicitly whether the math works.
- Do NOT repeat what charts already show (raw footfall numbers repeated verbatim, score integers). Add what the charts don't show.
- strategicFit: "strong" only if everything aligns. "cautionary" or "weak" if rent is too high for category or competition is saturated.
- One JSON object, strict JSON only (no markdown, no trailing commas, no comments).
- Escape any " inside strings as \\".

JSON shape (all keys required):
{
  "liveEconomics": { "commercialRentPerSqftTypical": number, "commercialRentLow": number, "commercialRentHigh": number, "confidence": "low"|"medium"|"high", "rationale": string, "listingVsMarketNote": string },
  "executiveSummary": string,
  "strategicFit": "strong"|"viable"|"cautionary"|"weak",
  "strengths": string[],
  "risks": string[],
  "opportunities": string[],
  "competitorTakeaway": string,
  "footfallInterpretation": string,
  "nextSteps": string[],
  "disclaimer": string,
  "catchmentForBrand": string,
  "catchmentBullets": string[],
  "residentsForBrand": string,
  "residentsBullets": string[],
  "apartmentsForBrand": string,
  "apartmentsBullets": string[],
  "workplacesForBrand": string,
  "workplacesBullets": string[],
  "marketForBrand": string,
  "marketBullets": string[],
  "competitionForBrand": string,
  "competitionBullets": string[],
  "riskForBrand": string,
  "riskBullets": string[],
  "similarMarketsForBrand": string,
  "similarMarketsBullets": string[]
}`

  try {
    const message = await intelAnthropic.messages.create({
      model: INTEL_SYNTHESIS_MODEL,
      max_tokens: MAX_TOKENS.insights,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    const fromModel = trySynthesisFromModelText(rawText, platformRent)
    if (fromModel) return fromModel
    console.warn('[Brand Intel] Unparseable model output; using structured fallback. length=', rawText.length)
    return buildFallbackLocationSynthesis(brand, property, intelSnapshot, platformRent)
  } catch (err) {
    console.error('[Brand Intel] enrich error', err)
    return buildFallbackLocationSynthesis(brand, property, intelSnapshot, platformRent)
  }
}
