import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { logQuerySize, estimateJsonSize } from '@/lib/api-cache'
import { calculateBFI } from '@/lib/matching-engine'

/**
 * Calculate Property Fit Index (PFI) - reverse of BFI
 * Scores how well a brand's requirements match a property
 */
function calculatePFI(
  brandRequirements: {
    sizeMin: number
    sizeMax: number
    budgetMin: number
    budgetMax: number
    locations: string[]
    businessType: string
  },
  property: {
    size: number
    price: number
    priceType: 'monthly' | 'yearly'
    city: string
    propertyType: string
  }
): number {
  let totalScore = 0
  
  // Size match (30% weight)
  const sizeScore = calculateSizeMatch(property.size, brandRequirements.sizeMin, brandRequirements.sizeMax)
  totalScore += sizeScore * 0.3
  
  // Budget match (30% weight)
  const monthlyPrice = property.priceType === 'yearly' ? property.price / 12 : property.price
  const budgetScore = calculateBudgetMatch(monthlyPrice, brandRequirements.budgetMin, brandRequirements.budgetMax)
  totalScore += budgetScore * 0.3
  
  // Location match (25% weight)
  const locationScore = calculateLocationMatch(property.city, brandRequirements.locations)
  totalScore += locationScore * 0.25
  
  // Property type match (15% weight)
  const typeScore = calculateTypeMatch(property.propertyType, brandRequirements.businessType)
  totalScore += typeScore * 0.15
  
  return Math.round(totalScore)
}

function calculateSizeMatch(propertySize: number, minSize: number, maxSize: number): number {
  if (propertySize >= minSize && propertySize <= maxSize) {
    return 100
  }
  
  if (propertySize < minSize) {
    const diff = minSize - propertySize
    const percentDiff = diff / minSize
    if (percentDiff <= 0.1) return 80
    if (percentDiff <= 0.2) return 60
    return 30
  }
  
  const diff = propertySize - maxSize
  const percentDiff = diff / maxSize
  if (percentDiff <= 0.1) return 90
  if (percentDiff <= 0.2) return 70
  return 40
}

function calculateBudgetMatch(monthlyRent: number, budgetMin: number, budgetMax: number): number {
  if (monthlyRent >= budgetMin && monthlyRent <= budgetMax) {
    return 100
  }
  
  if (monthlyRent < budgetMin) {
    const diff = budgetMin - monthlyRent
    const percentDiff = diff / budgetMin
    if (percentDiff <= 0.1) return 90
    if (percentDiff <= 0.2) return 80
    return 50
  }
  
  const diff = monthlyRent - budgetMax
  const percentDiff = diff / budgetMax
  if (percentDiff <= 0.1) return 70
  if (percentDiff <= 0.2) return 50
  return 20
}

function calculateLocationMatch(propertyCity: string, preferredLocations: string[]): number {
  if (!preferredLocations || preferredLocations.length === 0) {
    return 50
  }
  
  const propertyCityLower = propertyCity.toLowerCase()
  for (const location of preferredLocations) {
    if (propertyCityLower.includes(location.toLowerCase()) || location.toLowerCase().includes(propertyCityLower)) {
      return 100
    }
  }
  
  return 40
}

function calculateTypeMatch(propertyType: string, businessType: string): number {
  if (!businessType) return 50
  
  const propertyLower = propertyType.toLowerCase()
  const businessLower = businessType.toLowerCase()
  
  if (businessLower.includes('café') || businessLower.includes('cafe') || businessLower.includes('qsr')) {
    if (propertyLower.includes('retail') || propertyLower.includes('restaurant')) {
      return 100
    }
  }
  
  if (businessLower.includes('restaurant')) {
    if (propertyLower.includes('restaurant') || propertyLower.includes('retail')) {
      return 100
    }
  }
  
  if (businessLower.includes('retail')) {
    if (propertyLower.includes('retail')) {
      return 100
    }
  }
  
  if (propertyLower.includes('retail') && (businessLower.includes('café') || businessLower.includes('cafe'))) {
    return 80
  }
  
  return 40
}

function getMatchQuality(score: number): 'Excellent' | 'Good' | 'Fair' {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  return 'Fair'
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'brand' // 'brand' or 'property'
    const brandId = searchParams.get('brandId')
    const propertyId = searchParams.get('propertyId')
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : 30
    const propertyType = searchParams.get('propertyType')
    const location = searchParams.get('location')
    const brandName = searchParams.get('brandName')

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Fetch brands - limit to 50 to reduce egress
    const brands = await prisma.brand_profiles.findMany({
      take: 50,
      select: {
        id: true,
        company_name: true,
        industry: true,
        min_size: true,
        max_size: true,
        budget_min: true,
        budget_max: true,
        preferred_locations: true,
        preferred_property_types: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Map property type filter to database enum values
    let propertyTypeFilter: any = undefined
    if (propertyType) {
      const normalizedType = propertyType.toLowerCase()
      // Map display names to database enum values
      if (normalizedType.includes('office') || normalizedType.includes('business park') || normalizedType.includes('it park') || normalizedType.includes('co-working')) {
        propertyTypeFilter = 'office'
      } else if (normalizedType.includes('retail') || normalizedType.includes('mall') || normalizedType.includes('showroom') || normalizedType.includes('kiosk')) {
        propertyTypeFilter = 'retail'
      } else if (normalizedType.includes('warehouse') || normalizedType.includes('industrial')) {
        propertyTypeFilter = 'warehouse'
      } else if (normalizedType.includes('restaurant') || normalizedType.includes('food court') || normalizedType.includes('café') || normalizedType.includes('cafe') || normalizedType.includes('qsr') || normalizedType.includes('dessert') || normalizedType.includes('bakery')) {
        propertyTypeFilter = 'restaurant'
      } else {
        propertyTypeFilter = 'other'
      }
    }

    // Fetch available properties - limit to 50 to reduce egress
    // Use availability instead of status since status column may not exist
    const properties = await prisma.property.findMany({
      where: {
        availability: true,
        ...(propertyId ? { id: propertyId } : {}),
        ...(propertyTypeFilter ? { propertyType: propertyTypeFilter } : {}),
        ...(location ? { city: { contains: location, mode: 'insensitive' } } : {}),
      },
      take: 50,
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        size: true,
        price: true,
        priceType: true,
        propertyType: true,
        amenities: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Calculate matches
    const allMatches: any[] = []

    for (const brand of brands) {
      // Filter by brand if specified
      if (brandId && brand.id !== brandId) continue
      if (brandName && !brand.company_name?.toLowerCase().includes(brandName.toLowerCase())) continue

      const sizeMin = brand.min_size ?? 0
      const sizeMax = brand.max_size ?? Number.MAX_SAFE_INTEGER
      const budgetMin = brand.budget_min ? Number(brand.budget_min) : 0
      const budgetMax = brand.budget_max ? Number(brand.budget_max) : Number.MAX_SAFE_INTEGER
      const locations = Array.isArray(brand.preferred_locations) ? brand.preferred_locations as string[] : []
      const propertyTypes = Array.isArray(brand.preferred_property_types) ? brand.preferred_property_types as string[] : []

      const brandRequirements = {
        locations,
        sizeMin,
        sizeMax,
        budgetMin,
        budgetMax,
        businessType: brand.industry || '',
      }

      for (const property of properties) {
        const pfiScore = calculatePFI(
          brandRequirements,
          {
            size: property.size,
            price: Number(property.price),
            priceType: property.priceType as 'monthly' | 'yearly',
            city: property.city || '',
            propertyType: property.propertyType || '',
          }
        )

        if (pfiScore >= minScore) {
          // BFI (Brand Fit Index): how well this property fits the brand's requirements
          const propertyForBFI = {
            id: property.id,
            title: property.title,
            description: '',
            address: property.address || '',
            city: property.city || '',
            state: (property as any).state || '',
            zipCode: (property as any).zipCode || '',
            price: Number(property.price),
            priceType: property.priceType as 'monthly' | 'yearly' | 'sqft',
            size: property.size,
            propertyType: property.propertyType as 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other',
            amenities: Array.isArray((property as any).amenities) ? (property as any).amenities as string[] : [],
            ownerId: property.owner?.id || '',
            createdAt: property.createdAt || new Date(),
            updatedAt: new Date(),
            isAvailable: true,
          }
          const bfiResult = calculateBFI(propertyForBFI, brandRequirements)

          allMatches.push({
            id: `${brand.id}-${property.id}`,
            brand: {
              id: brand.id,
              name: brand.company_name || 'Unknown Brand',
              businessType: brand.industry || 'Brand',
              email: brand.user?.email || '',
              phone: brand.user?.phone || '',
              sizeRange: sizeMin && sizeMax !== Number.MAX_SAFE_INTEGER
                ? `${sizeMin.toLocaleString()} - ${sizeMax.toLocaleString()} sqft`
                : 'Size flexible',
              budgetRange: budgetMin && budgetMax && budgetMax !== Number.MAX_SAFE_INTEGER
                ? `₹${(budgetMin / 1000).toFixed(0)}K - ₹${(budgetMax / 1000).toFixed(0)}K/month`
                : 'Budget flexible',
              preferredLocations: locations,
              preferredPropertyTypes: propertyTypes,
            },
            property: {
              id: property.id,
              title: property.title,
              address: property.address,
              city: property.city,
              size: property.size,
              price: Number(property.price),
              priceType: property.priceType,
              propertyType: property.propertyType,
              owner: property.owner,
            },
            pfiScore,
            bfiScore: bfiResult.score,
            bfiBreakdown: bfiResult.breakdown,
            matchQuality: getMatchQuality(pfiScore),
            createdAt: property.createdAt?.toISOString() || new Date().toISOString(),
          })
        }
      }
    }

    // Sort by score descending
    allMatches.sort((a, b) => b.pfiScore - a.pfiScore)

    // Group by view type
    if (view === 'property') {
      // Group by property
      const groupedByProperty: Record<string, any> = {}
      for (const match of allMatches) {
        if (!groupedByProperty[match.property.id]) {
          groupedByProperty[match.property.id] = {
            property: match.property,
            matches: [],
          }
        }
        groupedByProperty[match.property.id].matches.push(match)
      }
      const responseData = {
        view: 'property',
        matches: Object.values(groupedByProperty),
        total: allMatches.length,
      }
      
      // Log query size for monitoring
      const responseSize = estimateJsonSize(responseData)
      logQuerySize('/api/admin/matches?view=property', responseSize, allMatches.length)
      
      return NextResponse.json(responseData)
    } else {
      // Group by brand
      const groupedByBrand: Record<string, any> = {}
      for (const match of allMatches) {
        if (!groupedByBrand[match.brand.id]) {
          groupedByBrand[match.brand.id] = {
            brand: match.brand,
            matches: [],
          }
        }
        groupedByBrand[match.brand.id].matches.push(match)
      }
      
      const responseData = {
        view: 'brand',
        matches: Object.values(groupedByBrand),
        total: allMatches.length,
      }
      
      // Log query size for monitoring
      const responseSize = estimateJsonSize(responseData)
      logQuerySize('/api/admin/matches?view=brand', responseSize, allMatches.length)
      
      return NextResponse.json(responseData)
    }
  } catch (error: any) {
    console.error('[Admin Matches API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

