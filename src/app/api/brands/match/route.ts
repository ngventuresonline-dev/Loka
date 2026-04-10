import { NextRequest, NextResponse } from 'next/server'
import { brandProfileDisplayName } from '@/lib/brand-display-name'
import { getPrisma } from '@/lib/get-prisma'
import { getCacheHeaders, CACHE_CONFIGS, logQuerySize, estimateJsonSize } from '@/lib/api-cache'
import { calculateBFI } from '@/lib/matching-engine'
import type { Property } from '@/types/workflow'

function toWorkflowPropertyType(raw: string): Property['propertyType'] {
  const r = (raw || '').toLowerCase().trim()
  const allowed: Property['propertyType'][] = [
    'office',
    'retail',
    'warehouse',
    'restaurant',
    'other',
  ]
  if (allowed.includes(r as Property['propertyType'])) {
    return r as Property['propertyType']
  }
  if (
    r.includes('restaurant') ||
    r.includes('f&b') ||
    r.includes('cafe') ||
    r.includes('food')
  ) {
    return 'restaurant'
  }
  if (r.includes('retail') || r.includes('shop') || r.includes('showroom')) {
    return 'retail'
  }
  if (r.includes('office')) return 'office'
  if (r.includes('warehouse') || r.includes('industrial')) return 'warehouse'
  return 'other'
}

function amenitiesFromUnknown(a: unknown): string[] {
  if (!a) return []
  if (Array.isArray(a)) {
    return a.filter((x): x is string => typeof x === 'string')
  }
  if (typeof a === 'object' && a !== null && 'features' in a) {
    const f = (a as { features?: unknown }).features
    if (Array.isArray(f)) {
      return f.filter((x): x is string => typeof x === 'string')
    }
  }
  return []
}

function buildPropertyStub(params: {
  city: string
  address?: string
  size: number
  rent: number
  priceType: 'monthly' | 'yearly' | 'sqft'
  propertyType: string
  amenities?: unknown
}): Property {
  const now = new Date()
  return {
    id: 'match-preview',
    title: '',
    description: '',
    address: params.address || params.city || '',
    city: params.city || '',
    state: '',
    zipCode: '',
    price: params.rent,
    priceType: params.priceType,
    size: params.size,
    propertyType: toWorkflowPropertyType(params.propertyType),
    amenities: amenitiesFromUnknown(params.amenities),
    ownerId: '',
    createdAt: now,
    updatedAt: now,
    isAvailable: true,
  }
}

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
    priceType: 'monthly' | 'yearly' | 'sqft'
    city: string
    propertyType: string
  }
): number {
  try {
    // Validate inputs
    if (!property.size || property.size <= 0) return 20
    if (!property.price || property.price <= 0) return 20
    
    let totalScore = 0
    
    // Size match (30% weight)
    const sizeScore = calculateSizeMatch(property.size, brandRequirements.sizeMin, brandRequirements.sizeMax)
    totalScore += sizeScore * 0.3
    
    // Budget match (30% weight)
    const monthlyPrice =
      property.priceType === 'yearly'
        ? property.price / 12
        : property.priceType === 'sqft'
          ? property.price * property.size
          : property.price
    const budgetScore = calculateBudgetMatch(monthlyPrice, brandRequirements.budgetMin, brandRequirements.budgetMax)
    totalScore += budgetScore * 0.3
    
    // Location match (25% weight)
    const locationScore = calculateLocationMatch(property.city || '', brandRequirements.locations || [])
    totalScore += locationScore * 0.25
    
    // Property type match (15% weight)
    const typeScore = calculateTypeMatch(property.propertyType || '', brandRequirements.businessType || '')
    totalScore += typeScore * 0.15
    
    return Math.max(0, Math.min(100, Math.round(totalScore)))
  } catch (error) {
    console.error('[Brand Match API] Error in calculatePFI:', error)
    return 25 // Default score on error
  }
}

function calculateSizeMatch(propertySize: number, minSize: number, maxSize: number): number {
  // Validate inputs
  if (!propertySize || propertySize <= 0) return 30
  if (!minSize || minSize <= 0) minSize = 0
  if (!maxSize || maxSize <= 0 || maxSize === Number.MAX_SAFE_INTEGER) maxSize = Number.MAX_SAFE_INTEGER
  
  if (propertySize >= minSize && propertySize <= maxSize) {
    return 100 // Perfect match
  }
  
  if (propertySize < minSize && minSize > 0) {
    const diff = minSize - propertySize
    const percentDiff = minSize > 0 ? diff / minSize : 1
    if (percentDiff <= 0.1) return 80
    if (percentDiff <= 0.2) return 60
    return 30
  }
  
  // propertySize > maxSize - penalize heavily. 2000 sqft for 150-500 is not a match
  if (maxSize !== Number.MAX_SAFE_INTEGER && maxSize > 0) {
    const diff = propertySize - maxSize
    const percentOver = diff / maxSize
    if (percentOver <= 0.1) return 85
    if (percentOver <= 0.2) return 60
    if (percentOver <= 0.5) return 25
    return 0
  }
  
  // No upper limit, property is larger than min
  return 80
}

function calculateBudgetMatch(monthlyRent: number, budgetMin: number, budgetMax: number): number {
  // Validate inputs
  if (!monthlyRent || monthlyRent <= 0) return 20
  if (!budgetMin || budgetMin <= 0) budgetMin = 0
  if (!budgetMax || budgetMax <= 0 || budgetMax === Number.MAX_SAFE_INTEGER) budgetMax = Number.MAX_SAFE_INTEGER
  
  if (monthlyRent >= budgetMin && monthlyRent <= budgetMax) {
    return 100
  }
  
  if (monthlyRent < budgetMin && budgetMin > 0) {
    const diff = budgetMin - monthlyRent
    const percentDiff = budgetMin > 0 ? diff / budgetMin : 1
    if (percentDiff <= 0.1) return 90
    if (percentDiff <= 0.2) return 80
    return 50
  }
  
  // monthlyRent > budgetMax (and budgetMax is not infinite)
  if (budgetMax !== Number.MAX_SAFE_INTEGER && budgetMax > 0) {
    const diff = monthlyRent - budgetMax
    const percentDiff = diff / budgetMax
    if (percentDiff <= 0.1) return 70
    if (percentDiff <= 0.2) return 50
    return 20
  }
  
  // No upper limit, rent is higher than min
  return 70
}

function calculateLocationMatch(propertyCity: string, preferredLocations: string[]): number {
  try {
    if (!preferredLocations || preferredLocations.length === 0) {
      return 60 // Higher default if no location preference (more flexible)
    }
    
    if (!propertyCity || typeof propertyCity !== 'string' || propertyCity.trim() === '') {
      return 50 // No property location specified
    }
    
    const propertyCityLower = propertyCity.toLowerCase().trim()
    
    // Normalize location names (remove common suffixes/prefixes)
    const normalizeLocation = (loc: string): string => {
      if (!loc || typeof loc !== 'string') return ''
      return loc.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/^(area|locality|sector|block|road|street|layout|nagar)\s+/i, '')
        .replace(/\s+(area|locality|sector|block|road|street|layout|nagar)$/i, '')
        .trim()
    }
    
    const normalizedPropertyCity = normalizeLocation(propertyCityLower)
    
    if (!normalizedPropertyCity) {
      return 50
    }
    
    for (const location of preferredLocations) {
      if (!location || typeof location !== 'string') continue
      
      const normalizedLocation = normalizeLocation(location)
      if (!normalizedLocation) continue
      
      // Exact match
      if (normalizedPropertyCity === normalizedLocation) {
        return 100
      }
      
      // Contains match (either direction)
      if (normalizedPropertyCity.includes(normalizedLocation) || normalizedLocation.includes(normalizedPropertyCity)) {
        return 100
      }
      
      // Partial word match (e.g., "koramangala" matches "koramangala 5th block")
      const propertyWords = normalizedPropertyCity.split(/\s+/).filter(w => w.length > 0)
      const locationWords = normalizedLocation.split(/\s+/).filter(w => w.length > 0)
      
      if (propertyWords.length > 0 && locationWords.length > 0) {
        const matchingWords = propertyWords.filter(word => 
          locationWords.some(locWord => word === locWord || word.includes(locWord) || locWord.includes(word))
        )
        
        if (matchingWords.length > 0 && matchingWords.length >= Math.min(propertyWords.length, locationWords.length) * 0.5) {
          return 85 // Good partial match
        }
      }
    }
    
    // Check for city-level match (Bangalore, Bengaluru, etc.)
    const cityKeywords = ['bangalore', 'bengaluru', 'blore']
    const isCityMatch = cityKeywords.some(keyword => {
      if (propertyCityLower.includes(keyword)) return true
      return preferredLocations.some(loc => {
        if (typeof loc === 'string') {
          return loc.toLowerCase().includes(keyword)
        }
        return false
      })
    })
    
    if (isCityMatch) {
      return 60 // City-level match
    }
    
    // Partial match (nearby areas) - increased score
    return 50
  } catch (error) {
    console.error('[Brand Match API] Error in calculateLocationMatch:', error)
    return 50 // Default score on error
  }
}

function calculateTypeMatch(propertyType: string, businessType: string): number {
  if (!businessType || typeof businessType !== 'string') return 50
  if (!propertyType || typeof propertyType !== 'string') return 40
  
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
    let body: any
    try {
      body = await request.json()
    } catch (jsonError: any) {
      console.error('[Brand Match API] JSON parse error:', jsonError)
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          matches: []
        },
        { status: 400 }
      )
    }
    
    const { propertyType, location, size, rent, priceType: rawPriceType, address, amenities } =
      body

    const priceType: 'monthly' | 'yearly' | 'sqft' =
      rawPriceType === 'yearly' || rawPriceType === 'sqft' ? rawPriceType : 'monthly'

    if (!propertyType || !size || !rent) {
      console.warn('[Brand Match API] Missing required fields:', { propertyType, size, rent })
      return NextResponse.json(
        { error: 'Missing required fields: propertyType, size, rent' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      console.error('[Brand Match API] Database not available')
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Parse size and rent to numbers
    const propertySize = parseInt(size.toString().replace(/[^0-9]/g, ''))
    const propertyRent = parseInt(rent.toString().replace(/[^0-9]/g, ''))
    
    if (!propertySize || !propertyRent) {
      console.warn('[Brand Match API] Invalid size or rent:', { size, rent, propertySize, propertyRent })
      return NextResponse.json(
        { error: 'Invalid size or rent values' },
        { status: 400 }
      )
    }

    // Featured brands only (displayOrder set), same rule as GET /api/brands
    const dbBrands = await prisma.brand_profiles.findMany({
      where: {
        user: {
          userType: 'brand',
          isActive: true,
          displayOrder: { not: null },
        },
      },
      include: {
        user: { select: { name: true, email: true, displayOrder: true } },
      },
    })

    dbBrands.sort(
      (a, b) => (a.user?.displayOrder ?? 999) - (b.user?.displayOrder ?? 999)
    )

    if (dbBrands.length === 0) {
      console.warn('[Brand Match API] No brands found in database')
      return NextResponse.json(
        { matches: [] },
        { headers: getCacheHeaders(CACHE_CONFIGS.BRAND_MATCHES) }
      )
    }

    const propertyStub = buildPropertyStub({
      city: typeof location === 'string' ? location : '',
      address: typeof address === 'string' ? address : undefined,
      size: propertySize,
      rent: propertyRent,
      priceType,
      propertyType,
      amenities,
    })

    const matches = dbBrands
      .map((brand) => {
        try {
          const sizeMin = brand.min_size ?? 0
          const sizeMax = brand.max_size ?? Number.MAX_SAFE_INTEGER
          const budgetMin = brand.budget_min ? Number(brand.budget_min) : 0
          const budgetMax = brand.budget_max ? Number(brand.budget_max) : Number.MAX_SAFE_INTEGER
          const locations = Array.isArray(brand.preferred_locations)
            ? (brand.preferred_locations as string[])
            : typeof brand.preferred_locations === 'string'
              ? [brand.preferred_locations]
              : []
          const propertyTypes = Array.isArray(brand.preferred_property_types)
            ? (brand.preferred_property_types as string[])
            : typeof brand.preferred_property_types === 'string'
              ? [brand.preferred_property_types]
              : []

          const pfiScore = calculatePFI(
            {
              sizeMin,
              sizeMax,
              budgetMin,
              budgetMax,
              locations,
              businessType: brand.industry || '',
            },
            {
              size: propertySize,
              price: propertyRent,
              priceType,
              city: location || '',
              propertyType: propertyType,
            }
          )

          const bfiScore = calculateBFI(propertyStub, {
            locations,
            sizeMin,
            sizeMax,
            budgetMin,
            budgetMax,
            businessType: brand.industry || '',
          }).score

          return {
            id: brand.id,
            name: brandProfileDisplayName(brand, brand.user),
            businessType: brand.industry || 'Brand',
            matchScore: pfiScore,
            pfi: pfiScore,
            bfi: bfiScore,
            sizeRange:
              sizeMin > 0 && sizeMax !== Number.MAX_SAFE_INTEGER
                ? `${sizeMin.toLocaleString()} - ${sizeMax.toLocaleString()} sqft`
                : sizeMin > 0
                  ? `Min ${sizeMin.toLocaleString()} sqft`
                  : sizeMax !== Number.MAX_SAFE_INTEGER
                    ? `Up to ${sizeMax.toLocaleString()} sqft`
                    : 'Size flexible',
            budgetRange:
              budgetMin > 0 && budgetMax !== Number.MAX_SAFE_INTEGER
                ? `₹${(budgetMin / 1000).toFixed(0)}K - ₹${(budgetMax / 1000).toFixed(0)}K/month`
                : budgetMin > 0
                  ? `Min ₹${(budgetMin / 1000).toFixed(0)}K/month`
                  : budgetMax !== Number.MAX_SAFE_INTEGER
                    ? `Up to ₹${(budgetMax / 1000).toFixed(0)}K/month`
                    : 'Budget flexible',
            propertyTypes: propertyTypes.length > 0 ? propertyTypes : ['Any'],
            locations: locations.length > 0 ? locations : ['Any location'],
          }
        } catch (error) {
          console.error('[Brand Match API] Error processing brand:', brand.id, error)
          return null
        }
      })
      .filter(
        (match): match is NonNullable<typeof match> =>
          match !== null && match.matchScore >= 20
      )
      .sort((a, b) => b.matchScore - a.matchScore)

    const responseData = {
      matches: matches.slice(0, 5),
    }
    
    // Log query size for monitoring
    const responseSize = estimateJsonSize(responseData)
    logQuerySize('/api/brands/match', responseSize, responseData.matches.length)
    
    // Add caching headers
    const headers = getCacheHeaders(CACHE_CONFIGS.BRAND_MATCHES)
    
    return NextResponse.json(responseData, { headers })
  } catch (error: any) {
    console.error('[Brand Match API] Error:', error)
    console.error('[Brand Match API] Stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to find matching brands',
        matches: [] // Always return matches array even on error
      },
      { status: 500 }
    )
  }
}

