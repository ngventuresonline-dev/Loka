/**
 * POST /api/brand/match
 * Location Intelligence: Match brand profile to locations
 * Uses scoring engine; supports locationIds (from DB) or coordinates (on-the-fly)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import {
  computeBrandFitScore,
  computeSaturationIndex,
  computeDemandGapScore,
  computeWhitespaceScore,
  estimateMonthlyRevenue,
} from '@/lib/location-intelligence/scoring'
import { getBrandFitWeights } from '@/lib/location-intelligence/weights'
import type { BrandFitWeights } from '@/lib/location-intelligence/weights'

type BrandMatchRequest = {
  brandId: string
  locationIds?: string[]
  coordinates?: { lat: number; lng: number }[]
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BrandMatchRequest
    const { brandId, locationIds = [], coordinates = [] } = body

    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId is required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const brand = await prisma.brand_profiles.findUnique({
      where: { id: brandId },
    })
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const weightOverrides = (brand as { weight_config_json?: Partial<BrandFitWeights> }).weight_config_json
      ? (brand as { weight_config_json: Partial<BrandFitWeights> }).weight_config_json as Partial<BrandFitWeights>
      : undefined
    const weights = getBrandFitWeights(weightOverrides)

    const results: Array<{
      locationId?: string
      lat?: number
      lng?: number
      brandFitScore: number
      whitespaceScore?: number
      demandGapScore?: number
      revenueProjection?: number
      meetsSaturationTolerance?: boolean
      explanation?: string
    }> = []

    // Match by location IDs (from DB)
    if (locationIds.length > 0) {
      const locations = await prisma.location.findMany({
        where: { id: { in: locationIds } },
        include: {
          demographics: true,
          commercial: true,
          mobility: true,
          scores: { take: 1, orderBy: { lastUpdated: 'desc' } },
        },
      })

      for (const loc of locations) {
        const demo = loc.demographics
        const commercial = loc.commercial as { saturation_indices?: Record<string, number>; competitor_brand_presence?: Record<string, number> } | null
        const mobility = loc.mobility
        const scoresRow = loc.scores?.[0]

        const populationDensity = demo?.populationDensity500m ? Number(demo.populationDensity500m) : 5000
        const competitorCount = commercial?.competitor_brand_presence
          ? (typeof commercial.competitor_brand_presence === 'object' && !Array.isArray(commercial.competitor_brand_presence))
            ? Object.keys(commercial.competitor_brand_presence).length
            : 0
          : 0
        const saturationIdx = computeSaturationIndex(competitorCount, populationDensity)
        const inverseSaturation = Math.max(0, 100 - saturationIdx)
        const footfall = mobility?.avgDailyFootfall ?? 2000
        const footfallScore = Math.min(100, Math.round((footfall / 5000) * 100))
        const populationWeighted = demo?.population500m ? Math.min(100, Number(demo.population500m) / 50) : 50
        const categorySupplyScore = Math.max(0, 100 - saturationIdx)
        const demandGap = computeDemandGapScore(populationWeighted, categorySupplyScore)
        const whitespace = computeWhitespaceScore(demandGap, inverseSaturation, footfallScore)

        const brandFitScore = computeBrandFitScore(
          {
            demographicScore: populationWeighted,
            footfallScore,
            affluenceScore: 70,
            competitionScore: inverseSaturation,
            accessibilityScore: 75,
          },
          weights
        )

        const avgTicket = brand.avg_ticket_size ? Number(brand.avg_ticket_size) : 240
        const maxSat = brand.max_saturation_tolerance ? Number(brand.max_saturation_tolerance) : 80
        const meetsSaturation = saturationIdx <= maxSat
        const revenue = estimateMonthlyRevenue(footfall, 1.2, avgTicket)

        results.push({
          locationId: loc.id,
          brandFitScore: meetsSaturation ? brandFitScore : Math.min(brandFitScore, 50),
          whitespaceScore: whitespace,
          demandGapScore: demandGap,
          revenueProjection: revenue,
          meetsSaturationTolerance: meetsSaturation,
          explanation: scoresRow?.explanationText ?? undefined,
        })
      }
    }

    // Match by coordinates (on-the-fly; simplified scoring without full DB)
    for (const coord of coordinates) {
      const { lat, lng } = coord
      if (typeof lat !== 'number' || typeof lng !== 'number') continue

      // Placeholder: use area-based heuristics (no DB fetch for coordinates)
      const baseFootfall = 2500
      const footfallScore = Math.min(100, Math.round((baseFootfall / 5000) * 100))
      const populationWeighted = 55
      const saturationIdx = 40
      const maxSat = brand.max_saturation_tolerance ? Number(brand.max_saturation_tolerance) : 80
      const meetsSaturation = saturationIdx <= maxSat
      const inverseSaturation = Math.max(0, 100 - saturationIdx)
      const demandGap = computeDemandGapScore(populationWeighted, 100 - saturationIdx)
      const whitespace = computeWhitespaceScore(demandGap, inverseSaturation, footfallScore)
      const rawBrandFit = computeBrandFitScore(
        {
          demographicScore: populationWeighted,
          footfallScore,
          affluenceScore: 70,
          competitionScore: inverseSaturation,
          accessibilityScore: 75,
        },
        weights
      )
      const avgTicket = brand.avg_ticket_size ? Number(brand.avg_ticket_size) : 240
      const revenue = estimateMonthlyRevenue(baseFootfall, 1.2, avgTicket)

      results.push({
        lat,
        lng,
        brandFitScore: meetsSaturation ? rawBrandFit : Math.min(rawBrandFit, 50),
        whitespaceScore: whitespace,
        demandGapScore: demandGap,
        revenueProjection: revenue,
        meetsSaturationTolerance: meetsSaturation,
      })
    }

    results.sort((a, b) => b.brandFitScore - a.brandFitScore)

    return NextResponse.json({
      success: true,
      brand: { id: brand.id, name: brand.company_name, industry: brand.industry },
      matches: results,
    })
  } catch (error: any) {
    console.error('[Brand Match API] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to match brand' },
      { status: 500 }
    )
  }
}
