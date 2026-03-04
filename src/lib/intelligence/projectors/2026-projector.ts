// @ts-nocheck
/**
 * 2026 demographic projections from Census 2021 baseline
 */

import { getPrisma } from '@/lib/get-prisma'
import { getGrowthPattern } from './growth-lookup'

export interface Census2021Data {
  totalPopulation: number
  age18_24: number
  age25_34: number
  age35_44: number
  age45_54?: number
  age55_64?: number
  age65Plus?: number
  medianIncome: number
  workingPopulation: number
}

export interface Projected2026Data extends Census2021Data {
  projectionSource: string
  confidence: number
}

function adjustForTrend(baseValue: number, trendPercent: number, years: number): number {
  return Math.round(baseValue + (baseValue * trendPercent * years) / 100)
}

function applyDefaultGrowth(census2021: Census2021Data): Projected2026Data {
  return {
    ...census2021,
    totalPopulation: Math.round(census2021.totalPopulation * 1.148),
    age18_24: Math.max(0, (census2021.age18_24 ?? 0) - 2),
    age25_34: Math.min(100, (census2021.age25_34 ?? 0) + 6),
    age35_44: Math.min(100, (census2021.age35_44 ?? 0) + 1),
    medianIncome: Math.round(census2021.medianIncome * 1.377),
    workingPopulation: Math.min(100, (census2021.workingPopulation ?? 0) + 7.5),
    projectionSource: 'Bangalore city average (2021–2026)',
    confidence: 0.7,
  }
}

export async function project2026Demographics(
  wardId: string,
  census2021: Census2021Data,
  wardName?: string
): Promise<Projected2026Data> {
  const prisma = await getPrisma()
  const growth = await getGrowthPattern(prisma, wardId, wardName)

  if (!growth) return applyDefaultGrowth(census2021)

  const years = 5
  const popGrowth = (growth.populationGrowth ?? 2.8) / 100
  const incomeGrowth = (growth.incomeGrowth ?? 6.5) / 100
  const youthTrend = growth.youth18_34Trend ?? 1.2
  const workingTrend = growth.workingPopTrend ?? 1.5

  return {
    totalPopulation: Math.round(census2021.totalPopulation * Math.pow(1 + popGrowth, years)),
    age18_24: Math.max(0, adjustForTrend(census2021.age18_24 ?? 0, -1, years)),
    age25_34: Math.min(100, adjustForTrend(census2021.age25_34 ?? 0, youthTrend, years)),
    age35_44: Math.min(100, adjustForTrend(census2021.age35_44 ?? 0, -youthTrend * 0.3, years)),
    age45_54: census2021.age45_54,
    age55_64: census2021.age55_64,
    age65Plus: census2021.age65Plus,
    medianIncome: Math.round(census2021.medianIncome * Math.pow(1 + incomeGrowth, years)),
    workingPopulation: Math.min(100, adjustForTrend(census2021.workingPopulation ?? 0, workingTrend, years)),
    projectionSource: 'Census 2021 + 5-year CAGR model',
    confidence: growth.projectionConfidence ?? 0.75,
  }
}
