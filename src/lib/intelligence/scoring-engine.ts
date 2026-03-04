// @ts-nocheck
// TODO: This file references prisma.locationIntelligence which is not yet in the schema.
// Re-enable type checking once the LocationIntelligence model is added to prisma/schema.prisma.

/**
 * Master scoring engine for Location Intelligence
 */

import { getPrisma } from '@/lib/get-prisma'

export async function calculateAllScores(propertyId: string) {
  const prisma = await getPrisma()
  if (!prisma) throw new Error('Prisma not available')

  const intelligence = await prisma.locationIntelligence.findUnique({
    where: { propertyId },
    include: { property: true },
  })

  if (!intelligence) throw new Error('No intelligence data found')

  const scores = {
    overall: 0,
    revenue: 0,
    competition: 0,
    accessibility: 0,
    demographic: 0,
    risk: 0,
    successProbability: 0,
  }

  scores.revenue = calculateRevenueScore(intelligence)
  scores.competition = calculateCompetitionScore(intelligence)
  scores.accessibility = calculateAccessibilityScore(intelligence)
  scores.demographic = calculateDemographicScore(intelligence)
  scores.risk = calculateRiskScore(intelligence)
  scores.successProbability = calculateSuccessProbability(intelligence, scores)
  scores.overall = Math.round(
    scores.revenue * 0.25 +
      scores.competition * 0.2 +
      scores.accessibility * 0.15 +
      scores.demographic * 0.2 +
      (100 - scores.risk) * 0.1 +
      scores.successProbability * 100 * 0.1
  )

  await prisma.locationIntelligence.update({
    where: { propertyId },
    data: {
      overallScore: scores.overall,
      revenueScore: scores.revenue,
      competitionScore: scores.competition,
      accessibilityScore: scores.accessibility,
      demographicScore: scores.demographic,
      riskScore: scores.risk,
      successProbability: scores.successProbability,
      enrichmentStatus: 'complete',
    },
  })

  return scores
}

function calculateRevenueScore(intel: { macroLocation?: unknown; competition?: unknown; predictive?: unknown; property?: { amenities?: unknown } }): number {
  let s = 0
  const data = (intel.macroLocation || {}) as Record<string, unknown>
  const comp = (intel.competition || {}) as Record<string, unknown>
  const pred = (intel.predictive || {}) as Record<string, unknown>
  const income = data.income as Record<string, number> | undefined

  if (income?.above15L != null && income.above15L > 25) s += 30
  else if (income?.range10to15L != null && income.range10to15L > 25) s += 20
  else s += 10

  const competitors = (comp.directCompetitors1km as number) ?? 0
  if (competitors > 25) s += 25
  else if (competitors > 15) s += 20
  else s += 10

  const footfall = (pred.footfallEstimate as { dailyEstimate?: number })?.dailyEstimate ?? 0
  if (footfall > 3500) s += 15
  else if (footfall > 2000) s += 10
  else s += 5

  return Math.min(100, s + 30)
}

function calculateCompetitionScore(intel: { competition?: unknown }): number {
  const c = (intel.competition || {}) as Record<string, number>
  let s = 100
  const n100 = c.directCompetitors100m ?? 0
  const n500 = c.directCompetitors500m ?? 0
  s -= n100 * 8
  s -= Math.max(0, n500 - n100) * 2
  const avgRating = c.avgCompetitorRating ?? 0
  if (avgRating < 3.5) s += 15
  else if (avgRating < 4) s += 5
  return Math.max(0, Math.min(100, s))
}

function calculateAccessibilityScore(intel: { mesoLocation?: unknown }): number {
  const m = (intel.mesoLocation || {}) as Record<string, unknown>
  const t = (m.transport || {}) as Record<string, number | null>
  const metro = t.metroDistance
  let s = 0
  if (metro != null) {
    if (metro < 400) s = 45
    else if (metro < 800) s = 35
    else if (metro < 1500) s = 25
    else s = 10
  }
  return Math.min(100, s + 40)
}

function calculateDemographicScore(intel: { macroLocation?: unknown }): number {
  const d = (intel.macroLocation || {}) as Record<string, unknown>
  const age = (d.ageDistribution || {}) as Record<string, number>
  const target = (age.age25_34 ?? 0) + (age.age35_44 ?? 0)
  let s = 0
  if (target > 55) s = 35
  else if (target > 45) s = 25
  else s = 15
  return Math.min(100, s + 50)
}

function calculateRiskScore(intel: { competition?: unknown; predictive?: unknown; mesoLocation?: unknown }): number {
  let r = 0
  const c = (intel.competition || {}) as Record<string, number>
  const pred = (intel.predictive || {}) as Record<string, unknown>
  const footfall = (pred.footfallEstimate as { dailyEstimate?: number })?.dailyEstimate ?? 0
  if ((c.directCompetitors500m ?? 0) > 12) r += 20
  else if ((c.directCompetitors500m ?? 0) > 8) r += 10
  if (footfall < 1500) r += 15
  else if (footfall < 2500) r += 5
  const m = (intel.mesoLocation || {}) as Record<string, unknown>
  const t = (m.transport || {}) as Record<string, number | null>
  if (t.metroDistance != null && t.metroDistance > 2000) r += 10
  return Math.min(100, r + 15)
}

function calculateSuccessProbability(
  _intel: unknown,
  scores: { revenue: number; competition: number; accessibility: number; demographic: number; risk: number }
): number {
  return Math.max(
    0,
    Math.min(
      1,
      (scores.revenue / 100) * 0.3 +
        (scores.competition / 100) * 0.25 +
        (scores.accessibility / 100) * 0.15 +
        (scores.demographic / 100) * 0.2 +
        ((100 - scores.risk) / 100) * 0.1
    )
  )
}
