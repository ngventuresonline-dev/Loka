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

/** Narrow client: bounded wait so the HTTP route returns JSON instead of an empty platform 504. */
const intelAnthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  timeout: 52 * 1000,
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

/** Compact snapshot for synthesis: avoids sending full coordinate lists. */
export function buildLocationIntelSnapshot(
  raw: Record<string, unknown>,
  match?: MatchContextForIntel | null
): Record<string, unknown> {
  const competitors = Array.isArray(raw.competitors) ? raw.competitors : []
  const topCompetitors = (competitors as Array<{ name?: string; distanceMeters?: number; placeCategory?: string }>)
    .slice(0, 8)
    .map((c) => ({
      name: String(c.name || ''),
      km: Math.round(Number(c.distanceMeters) || 0) / 1000,
      cat: String(c.placeCategory || 'other'),
    }))

  const retailMix = Array.isArray(raw.retailMix) ? raw.retailMix : []
  const cannibalisationRisk = Array.isArray(raw.cannibalisationRisk) ? raw.cannibalisationRisk : []
  const catchment = Array.isArray(raw.catchment) ? raw.catchment : []
  const landmarks = Array.isArray(raw.catchmentLandmarks) ? raw.catchmentLandmarks : []
  const crowdPullers = Array.isArray(raw.crowdPullers) ? raw.crowdPullers : []

  const lmByKind = (kind: string) => landmarks.filter((l: { kind?: string }) => (l as { kind?: string }).kind === kind).length
  const landmarkSamples = (landmarks as Array<{ name?: string; kind?: string; distanceMeters?: number }>)
    .slice(0, 14)
    .map((l) => ({
      name: String(l.name || '').slice(0, 80),
      kind: String(l.kind || ''),
      km: Math.round((Number(l.distanceMeters) || 0) / 100) / 10,
    }))
    .filter((l) => l.name)

  const footfall = raw.footfall as Record<string, unknown> | undefined
  const market = raw.market as Record<string, unknown> | undefined
  const scores = raw.scores as Record<string, unknown> | undefined
  const demographics = raw.demographics as Record<string, unknown> | undefined
  const populationLifestyle = raw.populationLifestyle as Record<string, unknown> | undefined
  const accessibility = raw.accessibility as Record<string, unknown> | undefined
  const metro = accessibility?.nearestMetro as Record<string, unknown> | undefined
  const projections2026 = raw.projections2026 as Record<string, unknown> | undefined

  return {
    match: match
      ? { bfi: match.bfiScore, loc: match.locationFit, budget: match.budgetFit, size: match.sizeFit }
      : undefined,
    footfall: {
      dailyAverage: footfall?.dailyAverage,
      peakHours: footfall?.peakHours,
      weekendBoost: footfall?.weekendBoost,
      confidence: footfall?.confidence,
    },
    market: {
      saturationLevel: market?.saturationLevel,
      competitorCount: market?.competitorCount,
      summary: market?.summary,
    },
    scores: {
      saturationIndex: scores?.saturationIndex,
      whitespaceScore: scores?.whitespaceScore,
      demandGapScore: scores?.demandGapScore,
      marketPotentialScore: raw.marketPotentialScore,
    },
    demographics: {
      incomeLevel: demographics?.incomeLevel,
      lifestyleSnippet: Array.isArray(demographics?.lifestyle)
        ? (demographics!.lifestyle as string[]).slice(0, 4)
        : undefined,
    },
    populationLifestyle: {
      affluenceIndicator: populationLifestyle?.affluenceIndicator ?? projections2026?.affluenceIndicator,
      totalHouseholds: populationLifestyle?.totalHouseholds ?? projections2026?.totalHouseholds,
      rentPerSqft: populationLifestyle?.rentPerSqft,
      marketRentLow: populationLifestyle?.marketRentLow,
      marketRentHigh: populationLifestyle?.marketRentHigh,
      listingRentPerSqft: populationLifestyle?.listingRentPerSqft,
      rentDataSource: populationLifestyle?.rentDataSource,
    },
    platformEconomics: {
      rentPerSqft: populationLifestyle?.rentPerSqft,
      marketLow: populationLifestyle?.marketRentLow,
      marketHigh: populationLifestyle?.marketRentHigh,
      rentDataSource: populationLifestyle?.rentDataSource,
      listingRentPerSqft: populationLifestyle?.listingRentPerSqft,
    },
    nearestCommercialAreaKey: raw.nearestCommercialAreaKey,
    transit: {
      metroM: metro?.distanceMeters,
      metroName: metro?.name,
    },
    topCompetitors,
    retailMixSummary: (retailMix as Array<{ category?: string; branded?: number; nonBranded?: number }>).slice(0, 8),
    cannibalisationRisk: (cannibalisationRisk as Array<{ brand?: string; cannibalisationPct?: number }>)
      .slice(0, 6)
      .map((r) => ({ brand: r.brand, pct: r.cannibalisationPct })),
    catchmentTop: (catchment as Array<{ name?: string; sharePct?: number; areaType?: string }>).slice(0, 6),
    landmarks: {
      residential: lmByKind('residential'),
      tech_park: lmByKind('tech_park'),
      corporate: lmByKind('corporate'),
      samples: landmarkSamples,
    },
    crowdPullers: (crowdPullers as Array<{ name?: string; category?: string; distanceMeters?: number }>)
      .slice(0, 4)
      .map((p) => ({ name: p.name, cat: p.category, m: p.distanceMeters })),
    dataSource: raw.dataSource,
  }
}

export async function enrichBrandLocationIntel(params: {
  brand: BrandContextForIntel
  property: PropertyContextForIntel
  intelSnapshot: Record<string, unknown>
}): Promise<LocationSynthesis> {
  const { brand, property, intelSnapshot } = params

  const pl = intelSnapshot.populationLifestyle as Record<string, unknown> | undefined
  const pe = intelSnapshot.platformEconomics as Record<string, unknown> | undefined
  const mid = Number(pe?.rentPerSqft ?? pl?.rentPerSqft)
  const low = Number(pe?.marketLow ?? pl?.marketRentLow)
  const high = Number(pe?.marketHigh ?? pl?.marketRentHigh)
  const platformRent = {
    mid: Number.isFinite(mid) && mid > 0 ? Math.round(mid) : 135,
    low: Number.isFinite(low) && low > 0 ? Math.round(low) : 95,
    high: Number.isFinite(high) && high > 0 ? Math.round(high) : 175,
  }
  if (platformRent.low > platformRent.high) {
    const t = platformRent.low
    platformRent.low = platformRent.high
    platformRent.high = t
  }

  const prompt = `You are the Lokazen proprietary location intelligence engine. Output helps a BRAND user on their dashboard: everything must be tailored to their industry, budget, preferred areas, and the specific listing—never generic city talk.

The data below is MODELLED (POIs, demographics proxies, heuristics)—not transactional truth. Be precise, India/Bangalore-aware, and concise to save tokens.

BRAND PROFILE
${JSON.stringify(
  {
    name: brand.name,
    company: brand.companyName,
    industry: brand.industry,
    budgetMin: brand.budgetMin,
    budgetMax: brand.budgetMax,
    preferredAreas: brand.preferredLocations,
  },
  null,
  0
)}

LISTING
${JSON.stringify(property, null, 0)}

LOCATION SNAPSHOT (modelled inputs)
${JSON.stringify(intelSnapshot, null, 0)}

RULES
- One JSON object only, no markdown. Be brief: speed matters.
- Strict JSON: double quotes on all keys/strings only; escape any " inside a string as \\"; no trailing commas; no // or /* */ comments; no raw line breaks inside string values.
- executiveSummary ≤900 characters. Every *ForBrand narrative ≤450 characters. Bullet items ≤100 characters. Max bullets per array: catchment/market/competition/risk = 3; similarMarkets = 2. strengths/risks ≤4 items each; opportunities ≤3; nextSteps ≤3.
- liveEconomics: typical monthly commercial/retail ₹/sqft for THIS micro-market (integers). Anchor on address + nearestCommercialAreaKey + platformEconomics band; adjust if justified. confidence = low|medium|high honestly.
- Tab fields must reference the brand profile (category, budget fit vs ask, preferred micro-markets) where relevant.
- competitorTakeaway + competitionForBrand: same-brand / category peers, not repeating executiveSummary verbatim.
- riskForBrand: cannibalisation, crowding, lease/rent stress for this brand—not generic.
- residentsForBrand / apartmentsForBrand / workplacesForBrand: use ONLY snapshot fields (catchmentTop, demographics, populationLifestyle, landmarks.samples + counts, transit). Describe who lives here, housing/apartment context, and daytime offices/tech parks—each ≤380 characters; 3 bullets max each, ≤90 chars. If data is thin, say so honestly. Do not invent specific building names not in landmarks.samples.

JSON shape (all keys required; use "" or [] if nothing to say):
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
