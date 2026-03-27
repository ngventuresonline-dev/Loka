import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import {
  generateLIR,
  isCacheValid,
  type PropertyInput,
  type WardDemographicsInput,
  type CompetitorInput,
} from '@/lib/intelligence/generate-lir'

export async function POST(request: NextRequest) {
  let body: { propertyId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { propertyId } = body
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
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
        propertyIntelligence: {
          select: {
            wardCode: true,
            claudeLirGeneratedAt: true,
          },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const existingGeneratedAt = property.propertyIntelligence?.claudeLirGeneratedAt ?? null
    if (isCacheValid(existingGeneratedAt)) {
      const cached = await prisma.propertyIntelligence.findUnique({
        where: { propertyId },
        select: { claudeLirReport: true, claudeLirGeneratedAt: true },
      })
      if (cached?.claudeLirReport) {
        return NextResponse.json({
          cached: true,
          propertyId,
          report: cached.claudeLirReport,
          generatedAt: cached.claudeLirGeneratedAt,
        })
      }
    }

    const wardCode = property.propertyIntelligence?.wardCode ?? null
    let demographics: WardDemographicsInput | null = null
    if (wardCode) {
      const ward = await prisma.wardDemographics.findUnique({
        where: { wardCode },
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

    return NextResponse.json({
      cached: false,
      propertyId,
      report,
      generatedAt: report.generatedAt,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[LIR] Generation failed for property', propertyId, ':', message)

    try {
      const prismaForError = await getPrisma()
      if (prismaForError) {
        await prismaForError.propertyIntelligence.updateMany({
          where: { propertyId },
          data: {
            claudeLirReport: {
              error: 'Generation failed',
              generatedAt: new Date().toISOString(),
            } as unknown as import('@prisma/client').Prisma.InputJsonValue,
            claudeLirGeneratedAt: new Date(),
          },
        })
      }
    } catch {
      // Non-critical — best-effort error recording
    }

    return NextResponse.json(
      { error: 'Failed to generate LIR report. Please try again.' },
      { status: 500 }
    )
  }
}
