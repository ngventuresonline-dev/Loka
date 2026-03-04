// @ts-nocheck
/**
 * Infrastructure development impact calculator for 2026 projections
 */

import { getPrisma } from '@/lib/get-prisma'
import { getGrowthPattern } from './projectors/growth-lookup'

// Placeholder: in production, use a metro/planned-stations dataset
async function getPlannedMetroStations(
  _coordinates: { latitude: number; longitude: number }
): Promise<{ nearest: number }> {
  // TODO: integrate planned metro stations GeoJSON/API
  return { nearest: 3000 }
}

export interface InfrastructureImpact {
  metroImpact: number
  roadImpact: number
  commercialImpact: number
  overallBoost: number
  footfallBoost: number
  rentPressure: number
  competitionIncrease: number
  timeline: string
  confidence: number
}

export async function calculateInfrastructureImpact(
  propertyCoordinates: { latitude: number; longitude: number },
  wardId: string,
  wardName?: string
): Promise<InfrastructureImpact | null> {
  const prisma = await getPrisma()
  const growth = await getGrowthPattern(prisma, wardId, wardName)
  if (!growth) return null

  const impacts = {
    metroImpact: 0,
    roadImpact: 0,
    commercialImpact: 0,
    overallBoost: 0,
  }

  const newMetro = growth.newMetroStations ?? 0
  if (newMetro > 0) {
    const plannedStations = await getPlannedMetroStations(propertyCoordinates)
    if (plannedStations.nearest < 1000) impacts.metroImpact = 25
    else if (plannedStations.nearest < 2000) impacts.metroImpact = 15
  }

  if (growth.roadExpansion) impacts.roadImpact = 10
  if ((growth.mallDevelopment ?? 0) > 0) {
    impacts.commercialImpact = (growth.mallDevelopment ?? 0) * 12
  }

  let overallBoost = impacts.metroImpact + impacts.roadImpact + impacts.commercialImpact
  if (growth.techParkGrowth) overallBoost += 20
  overallBoost = Math.round(overallBoost)

  return {
    ...impacts,
    overallBoost,
    footfallBoost: overallBoost,
    rentPressure: Math.round(overallBoost * 0.6),
    competitionIncrease: Math.round(overallBoost * 0.8),
    timeline: '2024–2026',
    confidence: growth.projectionConfidence ?? 0.75,
  }
}
