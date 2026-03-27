import { getPrisma } from '@/lib/get-prisma'
import {
  generateLIR,
  isCacheValid,
  type PropertyInput,
  type WardDemographicsInput,
  type CompetitorInput,
} from '@/lib/intelligence/generate-lir'

/**
 * Fire-and-forget LIR generation. Call after property approval — does not block.
 * Errors are caught and logged internally; they never surface to the caller.
 */
export function triggerLIRGeneration(propertyId: string): void {
  runLIRGeneration(propertyId).catch(err => {
    console.error('[LIR Trigger] Unhandled error for property', propertyId, ':', err?.message ?? err)
  })
}

async function runLIRGeneration(propertyId: string): Promise<void> {
  const prisma = await getPrisma()
  if (!prisma) {
    console.warn('[LIR Trigger] Prisma not available, skipping LIR for property', propertyId)
    return
  }

  try {
    const intel = await prisma.propertyIntelligence.findUnique({
      where: { propertyId },
      select: {
        wardCode: true,
        claudeLirGeneratedAt: true,
      },
    })

    if (isCacheValid(intel?.claudeLirGeneratedAt ?? null)) {
      console.log('[LIR Trigger] Cache valid, skipping generation for property', propertyId)
      return
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        state: true,
        size: true,
        price: true,
        priceType: true,
        propertyType: true,
        amenities: true,
        storePowerCapacity: true,
        powerBackup: true,
        waterFacility: true,
      },
    })

    if (!property) {
      console.warn('[LIR Trigger] Property not found:', propertyId)
      return
    }

    let demographics: WardDemographicsInput | null = null
    if (intel?.wardCode) {
      const ward = await prisma.wardDemographics.findUnique({
        where: { wardCode: intel.wardCode },
        select: {
          wardCode: true,
          wardName: true,
          locality: true,
          city: true,
          population2021: true,
          population2026: true,
          populationDensity: true,
          populationGrowth: true,
          age25_34: true,
          age35_44: true,
          medianIncome: true,
          workingPopulation: true,
          itProfessionals: true,
          diningOutPerWeek: true,
          spendingPowerIndex: true,
          commercialRentMin: true,
          commercialRentMax: true,
          dominantAgeGroup: true,
          primaryResidentType: true,
        },
      })
      demographics = ward
    }

    const rawCompetitors = await prisma.competitor.findMany({
      where: { propertyId },
      orderBy: { distance: 'asc' },
      take: 10,
      select: {
        name: true,
        category: true,
        distance: true,
        rating: true,
        reviewCount: true,
        priceLevel: true,
      },
    })

    const competitors: CompetitorInput[] = rawCompetitors.map(c => ({
      name: c.name,
      category: c.category,
      distance: c.distance,
      rating: c.rating ?? null,
      reviewCount: c.reviewCount ?? null,
      priceLevel: c.priceLevel ?? null,
    }))

    const propertyInput: PropertyInput = {
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      state: property.state,
      size: property.size,
      price: property.price.toString(),
      priceType: property.priceType,
      propertyType: property.propertyType,
      amenities: property.amenities,
      storePowerCapacity: property.storePowerCapacity,
      powerBackup: property.powerBackup,
      waterFacility: property.waterFacility,
    }

    const report = await generateLIR(propertyInput, demographics, competitors)

    await prisma.propertyIntelligence.updateMany({
      where: { propertyId },
      data: {
        claudeLirReport: report as unknown as import('@prisma/client').Prisma.InputJsonValue,
        claudeLirGeneratedAt: new Date(report.generatedAt),
      },
    })

    console.log('[LIR Trigger] Successfully generated LIR for property', propertyId)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[LIR Trigger] Generation failed for property', propertyId, ':', message)

    try {
      await prisma.propertyIntelligence.updateMany({
        where: { propertyId },
        data: {
          claudeLirReport: {
            error: 'Generation failed',
            generatedAt: new Date().toISOString(),
          } as unknown as import('@prisma/client').Prisma.InputJsonValue,
          claudeLirGeneratedAt: new Date(),
        },
      })
    } catch {
      // Best-effort error recording
    }
  }
}
