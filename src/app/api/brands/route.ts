import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

// Public endpoint to fetch brands (no authentication required)
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const brands = await prisma.user.findMany({
      where: { 
        userType: 'brand',
        isActive: true 
      },
      include: {
        brandProfiles: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedBrands = brands.map(brand => {
      const requirements = brand.brandProfiles?.must_have_amenities as any
      return {
        id: brand.id,
        name: brand.name,
        companyName: brand.brandProfiles?.company_name || null,
        industry: brand.brandProfiles?.industry || null,
        brandProfile: brand.brandProfiles ? {
          budgetMin: brand.brandProfiles.budget_min ? Number(brand.brandProfiles.budget_min) : null,
          budgetMax: brand.brandProfiles.budget_max ? Number(brand.brandProfiles.budget_max) : null,
          minSize: brand.brandProfiles.min_size || null,
          maxSize: brand.brandProfiles.max_size || null,
          preferredLocations: (brand.brandProfiles.preferred_locations as string[]) || [],
          timeline: requirements?.timeline || null,
          storeType: requirements?.storeType || null,
          targetAudience: requirements?.targetAudience || null,
          additionalRequirements: requirements?.additionalRequirements || null
        } : null
      }
    })

    return NextResponse.json({ brands: formattedBrands })
  } catch (error: any) {
    console.error('Public brands GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

