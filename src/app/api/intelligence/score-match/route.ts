import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { calculateBFI } from '@/lib/matching-engine'
import { scoreWithClaude, type BrandInput, type PropertyForScoring } from '@/lib/intelligence/score-with-claude'

export async function POST(request: NextRequest) {
  let body: { brandId?: string; propertyId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { brandId, propertyId } = body
  if (!brandId || !propertyId) {
    return NextResponse.json({ error: 'brandId and propertyId are required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const [brandUser, property] = await Promise.all([
    prisma.user.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        name: true,
        brandProfiles: {
          select: {
            company_name: true,
            category: true,
            industry: true,
            budget_min: true,
            budget_max: true,
            min_size: true,
            max_size: true,
            preferred_locations: true,
            avg_ticket_size: true,
            preferred_income_bracket: true,
            ideal_footfall_min: true,
          },
        },
      },
    }),
    prisma.property.findUnique({
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
        propertyIntelligence: {
          select: {
            dailyFootfall: true,
            peakHours: true,
            weekendBoost: true,
            competitorCount: true,
            medianIncome: true,
            age25_44Percent: true,
            workingPopPercent: true,
            wardCode: true,
          },
        },
      },
    }),
  ])

  if (!brandUser) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  const profile = brandUser.brandProfiles
  const preferredLocalities: string[] = (() => {
    try {
      if (!profile?.preferred_locations) return []
      if (Array.isArray(profile.preferred_locations)) return profile.preferred_locations as string[]
      return []
    } catch {
      return []
    }
  })()

  // Fetch ward dining data if available
  let diningOutPerWeek: number | undefined
  let spendingPowerIndex: number | null = null
  if (property.propertyIntelligence?.wardCode) {
    try {
      const ward = await prisma.wardDemographics.findUnique({
        where: { wardCode: property.propertyIntelligence.wardCode },
        select: { diningOutPerWeek: true, spendingPowerIndex: true },
      })
      diningOutPerWeek = ward?.diningOutPerWeek
      spendingPowerIndex = ward?.spendingPowerIndex ?? null
    } catch {
      // Non-critical
    }
  }

  // Algorithmic BFI as baseline fallback
  const algorithmicBFI = calculateBFI(
    {
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      state: property.state,
      size: property.size,
      price: Number(property.price),
      priceType: property.priceType as 'monthly' | 'yearly' | 'sqft',
      propertyType: property.propertyType as 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other',
      amenities: [],
      isAvailable: true,
      description: '',
      zipCode: '',
      ownerId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      locations: preferredLocalities,
      sizeMin: profile?.min_size ?? 0,
      sizeMax: profile?.max_size ?? 99999,
      budgetMin: Number(profile?.budget_min ?? 0),
      budgetMax: Number(profile?.budget_max ?? 9999999),
      businessType: profile?.category ?? profile?.industry ?? '',
    }
  )

  const brandInput: BrandInput = {
    name: profile?.company_name ?? brandUser.name,
    category: profile?.category ?? profile?.industry ?? 'Retail',
    minSize: profile?.min_size ?? 0,
    maxSize: profile?.max_size ?? 99999,
    budgetMin: Number(profile?.budget_min ?? 0),
    budgetMax: Number(profile?.budget_max ?? 9999999),
    preferredLocalities,
    targetAudience: profile?.preferred_income_bracket ?? undefined,
  }

  const propertyInput: PropertyForScoring = {
    id: property.id,
    title: property.title,
    address: property.address,
    city: property.city,
    size: property.size,
    price: property.price.toString(),
    priceType: property.priceType,
    propertyType: property.propertyType,
    footfallIndicators: property.propertyIntelligence
      ? {
          dailyFootfall: property.propertyIntelligence.dailyFootfall,
          peakHours: property.propertyIntelligence.peakHours,
          weekendBoost: property.propertyIntelligence.weekendBoost,
        }
      : null,
    competitorDensity: property.propertyIntelligence?.competitorCount ?? null,
    demographics: property.propertyIntelligence
      ? {
          medianIncome: property.propertyIntelligence.medianIncome,
          age25_44Percent: property.propertyIntelligence.age25_44Percent,
          workingPopPercent: property.propertyIntelligence.workingPopPercent,
          diningOutPerWeek,
          spendingPowerIndex,
        }
      : null,
  }

  let claudeScores = null
  let claudeError: string | null = null

  try {
    claudeScores = await scoreWithClaude(brandInput, propertyInput)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Score Match] Claude scoring failed:', message)
    claudeError = 'Claude scoring unavailable — showing algorithmic score only'
  }

  return NextResponse.json({
    brandId,
    propertyId,
    algorithmic: {
      bfiScore: algorithmicBFI.score,
      breakdown: algorithmicBFI.breakdown,
    },
    claude: claudeScores
      ? {
          claudeBfiScore: claudeScores.bfiScore,
          claudePfiScore: claudeScores.pfiScore,
          claudeMatchScore: claudeScores.matchScore,
          claudeReasoning: claudeScores.reasoning,
          keyStrengths: claudeScores.keyStrengths,
          keyRisks: claudeScores.keyRisks,
          recommendation: claudeScores.recommendation,
        }
      : null,
    claudeError,
  })
}
