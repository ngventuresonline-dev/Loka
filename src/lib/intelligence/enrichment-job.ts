// @ts-nocheck
// TODO: This file references prisma.locationIntelligence which is not yet in the schema.
// Re-enable type checking once the LocationIntelligence model is added to prisma/schema.prisma.

/**
 * Background enrichment job for Location Intelligence
 */

import { getPrisma } from '@/lib/get-prisma'
import { geocodeAddress } from '@/lib/property-coordinates'
import { getPropertyCoordinatesFromRow } from '@/lib/property-coordinates'
import { enrichWithGoogleData } from './google-enrichment'
import { enrichWithCensusData } from './census-enrichment'
import { enrich2026Projections } from './enrichment-2026'
import { calculateAllScores } from './scoring-engine'

export async function enrichProperty(propertyId: string) {
  const prisma = await getPrisma()
  if (!prisma) throw new Error('Prisma not available')

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      propertyType: true,
      amenities: true,
    },
  })

  if (!property) throw new Error('Property not found')

  let lat: number
  let lng: number

  const fromMap = getPropertyCoordinatesFromRow({
    amenities: property.amenities,
    address: property.address,
    city: property.city,
    state: property.state,
    title: null,
  })

  if (fromMap) {
    lat = fromMap.lat
    lng = fromMap.lng
  } else {
    const geocoded = await geocodeAddress(
      property.address,
      property.city,
      property.state
    )
    if (!geocoded) throw new Error('Could not geocode property address')
    lat = geocoded.lat
    lng = geocoded.lng
  }

  await prisma.locationIntelligence.upsert({
    where: { propertyId },
    update: { enrichmentStatus: 'processing' },
    create: {
      propertyId,
      enrichmentStatus: 'processing',
    },
  })

  try {
    await enrichWithGoogleData(
      propertyId,
      { latitude: lat, longitude: lng },
      property.propertyType
    )

    await enrichWithCensusData(propertyId, { latitude: lat, longitude: lng })

    await enrich2026Projections(propertyId).catch(() => {})

    const scores = await calculateAllScores(propertyId)

    const intel = await prisma.locationIntelligence.findUnique({
      where: { propertyId },
    })
    const dataQuality = calculateDataQuality(intel)

    await prisma.locationIntelligence.update({
      where: { propertyId },
      data: { dataQuality, lastEnriched: new Date() },
    })

    return { success: true, scores, dataQuality }
  } catch (error) {
    await prisma.locationIntelligence.update({
      where: { propertyId },
      data: { enrichmentStatus: 'failed' },
    }).catch(() => {})
    throw error
  }
}

function calculateDataQuality(intel: { [k: string]: unknown } | null): number {
  if (!intel) return 0
  let populated = 0
  const sections = [
    'propertyData',
    'microLocation',
    'mesoLocation',
    'macroLocation',
    'competition',
    'digitalSignals',
    'predictive',
  ]
  for (const s of sections) {
    const v = intel[s]
    if (v && typeof v === 'object' && Object.keys(v as object).length > 0) {
      populated += Object.keys(v as object).length
    }
  }
  return Math.min(100, Math.round((populated / 200) * 100))
}
