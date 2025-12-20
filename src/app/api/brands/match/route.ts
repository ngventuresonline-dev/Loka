import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { getCacheHeaders, CACHE_CONFIGS, logQuerySize, estimateJsonSize } from '@/lib/api-cache'

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
    return 100 // Perfect match
  }
  
  if (propertySize < minSize) {
    const diff = minSize - propertySize
    const percentDiff = diff / minSize
    if (percentDiff <= 0.1) return 80
    if (percentDiff <= 0.2) return 60
    return 30
  }
  
  // propertySize > maxSize
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
  
  // monthlyRent > budgetMax
  const diff = monthlyRent - budgetMax
  const percentDiff = diff / budgetMax
  if (percentDiff <= 0.1) return 70
  if (percentDiff <= 0.2) return 50
  return 20
}

function calculateLocationMatch(propertyCity: string, preferredLocations: string[]): number {
  if (!preferredLocations || preferredLocations.length === 0) {
    return 50 // Default if no location preference
  }
  
  const propertyCityLower = propertyCity.toLowerCase()
  for (const location of preferredLocations) {
    if (propertyCityLower.includes(location.toLowerCase()) || location.toLowerCase().includes(propertyCityLower)) {
      return 100
    }
  }
  
  // Partial match (nearby areas)
  return 40
}

function calculateTypeMatch(propertyType: string, businessType: string): number {
  if (!businessType) return 50
  
  const propertyLower = propertyType.toLowerCase()
  const businessLower = businessType.toLowerCase()
  
  // Perfect matches
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
  
  // Acceptable matches
  if (propertyLower.includes('retail') && (businessLower.includes('café') || businessLower.includes('cafe'))) {
    return 80
  }
  
  return 40
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyType, location, size, rent } = body

    if (!propertyType || !size || !rent) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyType, size, rent' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Fetch brands from database
    const dbBrands = await prisma.brand_profiles.findMany({
      take: 50, // limit
    })

    const matches = dbBrands
      .map(brand => {
        const sizeMin = brand.min_size ?? 0
        const sizeMax = brand.max_size ?? Number.MAX_SAFE_INTEGER
        const budgetMin = brand.budget_min ? Number(brand.budget_min) : 0
        const budgetMax = brand.budget_max ? Number(brand.budget_max) : Number.MAX_SAFE_INTEGER
        const locations = Array.isArray(brand.preferred_locations) ? brand.preferred_locations as string[] : []
        const propertyTypes = Array.isArray(brand.preferred_property_types) ? brand.preferred_property_types as string[] : []

        const pfiScore = calculatePFI(
          {
            sizeMin,
            sizeMax,
            budgetMin,
            budgetMax,
            locations,
            businessType: brand.industry || ''
          },
          {
            size: parseInt(size.toString().replace(/[^0-9]/g, '')),
            price: parseInt(rent.toString().replace(/[^0-9]/g, '')),
            priceType: 'monthly',
            city: location || '',
            propertyType: propertyType
          }
        )

        return {
          id: brand.id,
          name: brand.company_name,
          businessType: brand.industry || 'Brand',
          matchScore: pfiScore,
          sizeRange: sizeMin && sizeMax ? `${sizeMin.toLocaleString()} - ${sizeMax.toLocaleString()} sqft` : 'Size flexible',
          budgetRange: budgetMin && budgetMax && budgetMax !== Number.MAX_SAFE_INTEGER
            ? `₹${(budgetMin / 1000).toFixed(0)}K - ₹${(budgetMax / 1000).toFixed(0)}K/month`
            : 'Budget flexible',
          propertyTypes,
          locations
        }
      })
      .filter(match => match.matchScore >= 30) // Filter out poor matches
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by score

    const responseData = {
      matches: matches.slice(0, 5) // Return top 5 matches
    }
    
    // Log query size for monitoring
    const responseSize = estimateJsonSize(responseData)
    logQuerySize('/api/brands/match', responseSize, responseData.matches.length)
    
    // Add caching headers
    const headers = getCacheHeaders(CACHE_CONFIGS.BRAND_MATCHES)
    
    return NextResponse.json(responseData, { headers })
  } catch (error: any) {
    console.error('Brand matching error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to find matching brands' },
      { status: 500 }
    )
  }
}

