import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { getCacheHeaders, CACHE_CONFIGS } from '@/lib/api-cache'

// Public endpoint to fetch brands (no authentication required)
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      // Return empty brands so the homepage can still load
      return NextResponse.json(
        { brands: [] },
        { headers: getCacheHeaders({ maxAge: 60, staleWhileRevalidate: 120 }) }
      )
    }

    // Only return featured brands (displayOrder set). Bulk-uploaded brands have displayOrder=null.
    const brands = await prisma.user.findMany({
      where: { 
        userType: 'brand',
        isActive: true,
        displayOrder: { not: null }
      },
      take: 100, // Increased limit to show all brands
      select: {
        id: true,
        name: true,
        email: true,
        displayOrder: true,
        createdAt: true,
        brandProfiles: {
          select: {
            company_name: true,
            industry: true,
            budget_min: true,
            budget_max: true,
            min_size: true,
            max_size: true,
            preferred_locations: true,
            must_have_amenities: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    const formattedBrands = brands.map(brand => {
      const requirements = brand.brandProfiles?.must_have_amenities as any
      const formatted = {
        id: brand.id,
        name: brand.name,
        email: brand.email,
        displayOrder: brand.displayOrder,
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
          targetAudienceTags: Array.isArray(requirements?.targetAudienceTags) ? requirements.targetAudienceTags : [],
          additionalRequirements: requirements?.additionalRequirements || null,
          badges: Array.isArray(requirements?.badges) ? requirements.badges : []
        } : null
      }
      return formatted
    })

    // Sort by displayOrder (nulls last), then by createdAt - stable sort
    const sortedBrands = formattedBrands.sort((a, b) => {
      // If both have displayOrder, sort by it (ascending - lower numbers first)
      if (a.displayOrder != null && b.displayOrder != null) {
        const orderDiff = a.displayOrder - b.displayOrder
        // If displayOrder is same, sort by createdAt (desc) for stability
        if (orderDiff === 0) {
          return 0 // Keep original order for stability
        }
        return orderDiff
      }
      // If only a has displayOrder, it comes first
      if (a.displayOrder != null) return -1
      // If only b has displayOrder, it comes first
      if (b.displayOrder != null) return 1
      // If neither has displayOrder, maintain original order (already sorted by createdAt desc)
      return 0
    })

    // Add aggressive caching headers (10 minutes for performance)
    const headers = getCacheHeaders({
      maxAge: 600, // 10 minutes
      staleWhileRevalidate: 1200, // 20 minutes
    })
    
    return NextResponse.json({ brands: sortedBrands }, { headers })
  } catch (error: any) {
    console.error('Public brands GET error:', error)
    // Return empty brands instead of 500 so the homepage can still load
    const headers = getCacheHeaders({ maxAge: 60, staleWhileRevalidate: 120 })
    return NextResponse.json({ brands: [] }, { headers })
  }
}

