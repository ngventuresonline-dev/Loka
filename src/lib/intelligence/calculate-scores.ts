import type { TransportInfo } from './fetch-transport'
import type { RawCompetitor } from './fetch-competitors'
import type { AreaDemographics, WardDemographics, CensusData } from '@prisma/client'

export type ScoreInputs = {
  dailyFootfall: number
  weekendBoostPercent: number
  competitorCount: number
  competitorsTop5: RawCompetitor[]
  transport: TransportInfo
  area: AreaDemographics | null
  monthlyRevenueMid: number
  monthlyRent?: number | null
  infrastructureBoostPercent: number
  ward: WardDemographics | null
  census: CensusData | null
  propertyType: string
}

export type ScoreOutputs = {
  footfallScore: number
  revenueScore: number
  competitionScore: number
  accessScore: number
  demographicScore: number
  riskScore: number
  overallScore: number
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

type PriceBand = 'premium' | 'mid-range' | 'budget'

function mapPropertyTypeToPriceBand(propertyType: string): PriceBand {
  const t = (propertyType || '').toLowerCase()
  if (t.includes('restaurant') || t.includes('bar')) return 'mid-range'
  if (t.includes('retail') || t.includes('office')) return 'premium'
  return 'budget'
}

function computeFootfallScore(input: ScoreInputs): number {
  const { dailyFootfall, weekendBoostPercent, competitorCount, transport, infrastructureBoostPercent } =
    input

  // Area density (0–30): more footfall = higher score, up to ~5000/day
  const areaDensityScore = clamp((dailyFootfall / 5000) * 30, 0, 30)

  // Transport access (0–25)
  let transportScore = 10
  const { metroDistance, busStops, mainRoadDistance } = transport
  if (metroDistance != null) {
    if (metroDistance <= 500) transportScore += 10
    else if (metroDistance <= 1000) transportScore += 7
    else if (metroDistance <= 2000) transportScore += 4
  }
  if (busStops >= 3) transportScore += 5
  else if (busStops >= 1) transportScore += 3
  transportScore = clamp(transportScore, 0, 25)

  // Business density (0–20): more outlets → more activity, but cap
  const businessDensityScore = clamp(competitorCount * 3, 0, 20)

  // Infrastructure boost (0–15)
  const infraScore = clamp(infrastructureBoostPercent, 0, 15)

  // Visibility proxy from main road (0–10)
  let visibilityScore = 5
  if (mainRoadDistance != null) {
    if (mainRoadDistance <= 50) visibilityScore = 10
    else if (mainRoadDistance <= 200) visibilityScore = 8
    else if (mainRoadDistance <= 500) visibilityScore = 6
    else visibilityScore = 4
  }

  // Slight uplift for strong weekend boost
  const weekendBump = weekendBoostPercent >= 40 ? 3 : weekendBoostPercent >= 25 ? 1.5 : 0

  return clamp(
    areaDensityScore + transportScore + businessDensityScore + infraScore + visibilityScore + weekendBump,
    0,
    100,
  )
}

function computeCompetitionScore(input: ScoreInputs): number {
  const { competitorCount, competitorsTop5 } = input

  let base = clamp(100 - competitorCount * 5, 0, 100)

  const ratings = competitorsTop5.map((c) => c.rating).filter((r): r is number => typeof r === 'number')
  const avgRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : undefined

  if (avgRating != null) {
    if (avgRating < 3.5) base += 10
    else if (avgRating < 4) base += 5
    else if (avgRating >= 4.5) base -= 5 // high-quality neighbours
  }

  return clamp(base, 0, 100)
}

function computeAccessScore(input: ScoreInputs): number {
  const { transport } = input
  const { metroDistance, busStops, mainRoadDistance } = transport

  // Metro (0–40)
  let metroScore = 10
  if (metroDistance != null) {
    if (metroDistance <= 300) metroScore = 40
    else if (metroDistance <= 600) metroScore = 32
    else if (metroDistance <= 1000) metroScore = 26
    else if (metroDistance <= 2000) metroScore = 18
    else metroScore = 10
  }

  // Bus access (0–20)
  let busScore = 5
  if (busStops >= 5) busScore = 20
  else if (busStops >= 3) busScore = 15
  else if (busStops >= 1) busScore = 10

  // Road access (0–20)
  let roadScore = 10
  if (mainRoadDistance != null) {
    if (mainRoadDistance <= 50) roadScore = 20
    else if (mainRoadDistance <= 200) roadScore = 16
    else if (mainRoadDistance <= 500) roadScore = 12
    else roadScore = 8
  }

  // Parking & pedestrian are not yet modeled – assume mid score (10 each)
  const parkingScore = 10
  const pedestrianScore = 10

  return clamp(metroScore + busScore + roadScore + parkingScore + pedestrianScore, 0, 100)
}

function computeDemographicScore(input: ScoreInputs): number {
  const { ward, census, area, propertyType } = input

  // Prefer ward-level demographics when available (Census + 2026 projection)
  if (ward) {
    const age25_44 = ward.age25_34 + ward.age35_44
    const band = mapPropertyTypeToPriceBand(propertyType)

    let score = 0

    // Age match (25 points)
    if (age25_44 > 60) score += 25
    else if (age25_44 > 50) score += 20
    else if (age25_44 > 40) score += 15
    else score += 8

    // Income match (30 points)
    if (band === 'premium' && ward.medianIncome > 1_500_000) score += 30
    else if (band === 'mid-range' && ward.medianIncome > 800_000) score += 30
    else score += 15

    // Working population (12 points)
    if (ward.workingPopulation > 75) score += 12
    else if (ward.workingPopulation > 65) score += 8
    else score += 4

    // Dining habits (13 points)
    if (ward.diningOutPerWeek > 5) score += 13
    else if (ward.diningOutPerWeek > 3.5) score += 10
    else score += 5

    // Census enrichment: education + lifestyle bonus (up to 20 points)
    // This is the richer data pulled dynamically from census_data
    if (census) {
      // Education quality (0–8): graduates + postgrads indicate higher spending power
      const educationPct = (census.graduatePercent ?? 0) + (census.postGradPercent ?? 0)
      if (educationPct > 70) score += 8
      else if (educationPct > 50) score += 6
      else if (educationPct > 30) score += 3
      else score += 1

      // Lifestyle indicators (0–7): gym membership as health-consciousness proxy
      if ((census.gymMembershipRate ?? 0) > 20) score += 7
      else if ((census.gymMembershipRate ?? 0) > 12) score += 5
      else score += 2

      // Vehicle ownership / mobility (0–5): higher = more commuter footfall
      if ((census.fourWheelerPercent ?? 0) > 35) score += 5
      else if ((census.fourWheelerPercent ?? 0) > 20) score += 3
      else score += 1
    }

    return clamp(score, 0, 100)
  }

  // Fallback: area-level projections if ward data missing
  if (!area) return 50

  const age = typeof area.age25_44_2026 === 'number' ? area.age25_44_2026 : 35
  const working = typeof area.workingPop2026 === 'number' ? area.workingPop2026 : 65
  const highIncome = typeof area.highIncome2026 === 'number' ? area.highIncome2026 : 20
  const diningOut = typeof area.diningOutPerWeek === 'number' ? area.diningOutPerWeek : 3
  const cafeVisits = typeof area.cafeVisitsPerWeek === 'number' ? area.cafeVisitsPerWeek : 1.5

  const ageScore = clamp(((age - 20) / (50 - 20)) * 30, 0, 30)
  const incomeScore = clamp((highIncome / 40) * 30, 0, 30)
  const workingScore = clamp(((working - 50) / (80 - 50)) * 20, 0, 20)
  const lifestyleIndex = diningOut * 0.7 + cafeVisits * 1.2
  const lifestyleScore = clamp((lifestyleIndex / 8) * 20, 0, 20)

  return clamp(ageScore + incomeScore + workingScore + lifestyleScore, 0, 100)
}

function computeRevenueScore(input: ScoreInputs, demographicScore: number, competitionScore: number) {
  const { dailyFootfall, monthlyRevenueMid, monthlyRent, competitorCount } = input

  // Income match: proxy from demographicScore
  const incomeMatchScore = demographicScore * 0.6

  // Footfall volume (0–30)
  const footfallScore = clamp((dailyFootfall / 5000) * 30, 0, 30)

  // Category fit (0–20): if revenue far above rent, strong score
  let categoryFitScore = 10
  if (monthlyRent && monthlyRent > 0 && monthlyRevenueMid > 0) {
    const rentPct = (monthlyRent / monthlyRevenueMid) * 100
    if (rentPct <= 10) categoryFitScore = 20
    else if (rentPct <= 15) categoryFitScore = 17
    else if (rentPct <= 20) categoryFitScore = 14
    else if (rentPct <= 25) categoryFitScore = 10
    else categoryFitScore = 6
  }

  // Competition level contribution (0–15): use competitionScore and raw count
  let competitionComponent = competitionScore * 0.15
  if (competitorCount <= 2) competitionComponent += 3

  return clamp(incomeMatchScore + footfallScore + categoryFitScore + competitionComponent, 0, 100)
}

function computeRiskScore(
  revenueScore: number,
  competitionScore: number,
  demographicScore: number,
): number {
  // Higher scores → lower risk. Map to 0–100 risk where higher = more risk.
  const opportunity = 0.5 * revenueScore + 0.25 * competitionScore + 0.25 * demographicScore
  const risk = 100 - opportunity
  return clamp(risk, 0, 100)
}

export function calculateScores(input: ScoreInputs): ScoreOutputs {
  const footfallScore = computeFootfallScore(input)
  const competitionScore = computeCompetitionScore(input)
  const accessScore = computeAccessScore(input)
  const demographicScore = computeDemographicScore(input)
  const revenueScore = computeRevenueScore(input, demographicScore, competitionScore)
  const riskScore = computeRiskScore(revenueScore, competitionScore, demographicScore)

  const overallScore = clamp(
    revenueScore * 0.3 +
      footfallScore * 0.25 +
      competitionScore * 0.2 +
      demographicScore * 0.15 +
      accessScore * 0.1,
    0,
    100,
  )

  return {
    footfallScore: Math.round(footfallScore),
    revenueScore: Math.round(revenueScore),
    competitionScore: Math.round(competitionScore),
    accessScore: Math.round(accessScore),
    demographicScore: Math.round(demographicScore),
    riskScore: Math.round(riskScore),
    overallScore: Math.round(overallScore),
  }
}

