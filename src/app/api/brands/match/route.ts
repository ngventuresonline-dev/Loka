import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

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

    // Fetch brands from database (you may need to adjust this based on your schema)
    // For now, we'll return mock data since brand schema might not exist
    const mockBrands = [
      {
        id: '1',
        name: 'Café Coffee Day',
        businessType: 'Café/QSR',
        sizeMin: 500,
        sizeMax: 2000,
        budgetMin: 50000,
        budgetMax: 150000,
        locations: ['Koramangala', 'Indiranagar', 'HSR'],
        logo: null
      },
      {
        id: '2',
        name: 'Pizza Hut',
        businessType: 'Restaurant',
        sizeMin: 1000,
        sizeMax: 3000,
        budgetMin: 80000,
        budgetMax: 200000,
        locations: ['Whitefield', 'MG Road', 'Jayanagar'],
        logo: null
      },
      {
        id: '3',
        name: 'Zara',
        businessType: 'Retail',
        sizeMin: 2000,
        sizeMax: 5000,
        budgetMin: 150000,
        budgetMax: 400000,
        locations: ['MG Road', 'Brigade Road', 'Indiranagar'],
        logo: null
      }
    ]

    // Calculate PFI scores for each brand
    const matches = mockBrands
      .map(brand => {
        const pfiScore = calculatePFI(
          {
            sizeMin: brand.sizeMin,
            sizeMax: brand.sizeMax,
            budgetMin: brand.budgetMin,
            budgetMax: brand.budgetMax,
            locations: brand.locations,
            businessType: brand.businessType
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
          ...brand,
          matchScore: pfiScore,
          sizeRange: `${brand.sizeMin.toLocaleString()} - ${brand.sizeMax.toLocaleString()} sqft`,
          budgetRange: `₹${(brand.budgetMin / 1000).toFixed(0)}K - ₹${(brand.budgetMax / 1000).toFixed(0)}K/month`
        }
      })
      .filter(match => match.matchScore >= 30) // Filter out poor matches
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by score

    return NextResponse.json({
      matches: matches.slice(0, 5) // Return top 5 matches
    })
  } catch (error: any) {
    console.error('Brand matching error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to find matching brands' },
      { status: 500 }
    )
  }
}

