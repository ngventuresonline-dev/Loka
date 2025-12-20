import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { getCacheHeaders, CACHE_CONFIGS } from '@/lib/api-cache'

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

    // Fetch all active brands (no limit to show all brands in modal)
    const brands = await prisma.user.findMany({
      where: { 
        userType: 'brand',
        isActive: true 
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/brands/route.ts:46',message:'Brands fetched from DB',data:{total:brands.length,brandIds:brands.map(b=>b.id),hasDisplayOrder:brands.filter(b=>b.displayOrder!=null).length,hasProfile:brands.filter(b=>b.brandProfiles!=null).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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
          additionalRequirements: requirements?.additionalRequirements || null
        } : null
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/brands/route.ts:69',message:'Brand formatted',data:{id:formatted.id,hasName:!!(formatted.companyName||formatted.name),hasProfile:!!formatted.brandProfile,displayOrder:formatted.displayOrder},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return formatted
    })

    // Sort by displayOrder (nulls last), then by createdAt
    const sortedBrands = formattedBrands.sort((a, b) => {
      // If both have displayOrder, sort by it
      if (a.displayOrder != null && b.displayOrder != null) {
        return a.displayOrder - b.displayOrder
      }
      // If only a has displayOrder, it comes first
      if (a.displayOrder != null) return -1
      // If only b has displayOrder, it comes first
      if (b.displayOrder != null) return 1
      // If neither has displayOrder, maintain original order (already sorted by createdAt desc)
      return 0
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e686af3-03c2-4da8-8d51-4d33695b9beb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/brands/route.ts:85',message:'Brands sorted and ready to return',data:{total:sortedBrands.length,first5Ids:sortedBrands.slice(0,5).map(b=>b.id),first5Names:sortedBrands.slice(0,5).map(b=>b.companyName||b.name),first5DisplayOrder:sortedBrands.slice(0,5).map(b=>b.displayOrder)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Add caching headers (3 minutes as per requirements)
    const headers = getCacheHeaders({
      maxAge: 180, // 3 minutes
      staleWhileRevalidate: 360, // 6 minutes
    })
    
    return NextResponse.json({ brands: sortedBrands }, { headers })
  } catch (error: any) {
    console.error('Public brands GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

