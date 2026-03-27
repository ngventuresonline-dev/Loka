import claude, { CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude'
import type {
  BrandIntelClaudeEnrichment,
  BrandIntelStrategicFit,
  BrandContextForIntel,
  PropertyContextForIntel,
  MatchContextForIntel,
  LiveEconomicsEnrichment,
  LiveEconomicsConfidence,
} from '@/lib/intelligence/brand-intel-enrichment.types'

export type {
  BrandIntelClaudeEnrichment,
  BrandIntelStrategicFit,
  BrandContextForIntel,
  PropertyContextForIntel,
  MatchContextForIntel,
  LiveEconomicsEnrichment,
} from '@/lib/intelligence/brand-intel-enrichment.types'

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
      rationale: 'Rent fields were missing from the AI response; showing the platform benchmark band only.',
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

function safeJsonParse(text: string, platformRent: { mid: number; low: number; high: number }): BrandIntelClaudeEnrichment {
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('No JSON in Claude response')
    parsed = JSON.parse(m[0])
  }
  const o = parsed as Record<string, unknown>
  const fitRaw = String(o.strategicFit || 'viable').toLowerCase()
  const strategicFit: BrandIntelStrategicFit = ['strong', 'viable', 'cautionary', 'weak'].includes(fitRaw)
    ? (fitRaw as BrandIntelStrategicFit)
    : 'viable'

  const asStrArr = (v: unknown, max: number): string[] =>
    Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : []

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
        'Uses modelled POI and census-proxy data plus AI interpretation—not a substitute for brokers, comps, or legal advice.'
    ).slice(0, 400),
    liveEconomics: parseLiveEconomics(o.liveEconomics, platformRent),
  }
}

/** Compact payload for Claude: avoids sending full coordinate lists. */
export function buildLocationIntelSnapshot(
  raw: Record<string, unknown>,
  match?: MatchContextForIntel | null
): Record<string, unknown> {
  const competitors = Array.isArray(raw.competitors) ? raw.competitors : []
  const topCompetitors = (competitors as Array<{ name?: string; distanceMeters?: number; placeCategory?: string }>)
    .slice(0, 12)
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
    },
    crowdPullers: (crowdPullers as Array<{ name?: string; category?: string; distanceMeters?: number }>)
      .slice(0, 6)
      .map((p) => ({ name: p.name, cat: p.category, m: p.distanceMeters })),
    dataSource: raw.dataSource,
  }
}

export async function enrichBrandLocationIntel(params: {
  brand: BrandContextForIntel
  property: PropertyContextForIntel
  intelSnapshot: Record<string, unknown>
}): Promise<BrandIntelClaudeEnrichment> {
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

  const prompt = `You are a senior retail and commercial real estate analyst for India (Bangalore focus). The client is a BRAND evaluating a specific property. Below is MODELLED / ESTIMATED location intelligence from our platform (Google/Mappls POIs, census-style demographics proxies, heuristic scores)—not ground-truth.

BRAND
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

PROPERTY
${JSON.stringify(property, null, 0)}

LOCATION INTEL SNAPSHOT (modelled)
${JSON.stringify(intelSnapshot, null, 0)}

PART A — LIVE COMMERCIAL RENT (mandatory): Use the property address, city, nearestCommercialAreaKey, propertyType, and platformEconomics (band + listing-implied ₹/sqft if present). Produce a CURRENT, micro-market-specific estimate for typical monthly commercial / retail rent in INR per sq ft (not saleable area CAM-loaded office packs—use what a brand would expect for similar high-street or mall-adjacent retail in that sub-market as of your knowledge cutoff). Adjust within the platform band or justify moving outside it (e.g. premium frontage, IT corridor vs inner lane). Integers only for rupee amounts. Set confidence low|medium|high honestly.

PART B — Briefing: Strategic narrative for the dashboard.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "liveEconomics": {
    "commercialRentPerSqftTypical": <number>,
    "commercialRentLow": <number>,
    "commercialRentHigh": <number>,
    "confidence": "low" | "medium" | "high",
    "rationale": "1-3 sentences on why this range fits this micro-location",
    "listingVsMarketNote": "optional: compare listing-implied rent vs your band, or empty string"
  },
  "executiveSummary": "2-4 sentences",
  "strategicFit": "strong" | "viable" | "cautionary" | "weak",
  "strengths": ["max 5 short bullets"],
  "risks": ["max 5 short bullets"],
  "opportunities": ["max 4 short bullets"],
  "competitorTakeaway": "one sentence on competitive context",
  "footfallInterpretation": "one sentence interpreting modelled footfall vs category",
  "nextSteps": ["max 3 concrete next steps"],
  "disclaimer": "one short sentence that estimates are not transactional quotes"
}

Tone: professional, India / Bangalore market-aware, honest about uncertainty.`

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS.insights,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  return safeJsonParse(rawText, platformRent)
}
