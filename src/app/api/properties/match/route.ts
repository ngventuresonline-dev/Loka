import { NextRequest, NextResponse } from 'next/server'
import { findMatches } from '@/lib/matching-engine'
import { Property } from '@/types/workflow'
import { getPrisma } from '@/lib/get-prisma'
import { getCacheHeaders, CACHE_CONFIGS, logQuerySize, estimateJsonSize } from '@/lib/api-cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessType,
      sizeRange,
      locations,
      budgetRange,
      timeline,
      propertyType
    } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build database query filters - optimized for performance
    // We'll use BFI scoring for matching, so we don't need strict filters
    const where: any = {
      availability: true // Only get available properties
    }

    // Size filter - make it more flexible (allow ±50% range) but still filter
    if (sizeRange && sizeRange.min > 0) {
      const sizeMinExpanded = Math.max(0, Math.floor(sizeRange.min * 0.5))
      const sizeMaxExpanded = sizeRange.max ? Math.ceil(sizeRange.max * 1.5) : 1000000
      
      where.size = {
        gte: sizeMinExpanded,
        lte: sizeMaxExpanded
      }
    }

    // Budget filter - filter within range (allow small buffer for flexibility)
    if (budgetRange && budgetRange.min > 0) {
      const minBudget = budgetRange.min || 0
      const maxBudget = budgetRange.max || 20000000
      // Allow small buffer: 10% under min and 20% over max for flexibility
      const minBudgetAdjusted = Math.max(0, Math.floor(minBudget * 0.9))
      const maxBudgetAdjusted = Math.ceil(maxBudget * 1.2)
      
      where.price = {
        gte: minBudgetAdjusted,
        lte: maxBudgetAdjusted
      }
    }

    // Property type filter - optional, BFI will score type matches
    // if (propertyType) {
    //   where.propertyType = propertyType
    // }

    // Fetch properties from database - limit to 50 to reduce egress
    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        size: true,
        propertyType: true,
        price: true,
        priceType: true,
        amenities: true,
        images: true,
        availability: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true, // Include ownerId for property mapping
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      take: 30, // Reduced to 30 for faster queries
      orderBy: {
        isFeatured: 'desc' // Prioritize featured properties
      }
    })

    // Convert Prisma properties to Property type
    // Be defensive about null/undefined fields so matching engine doesn't crash
    const typedProperties: Property[] = properties.map((p: any) => {
      try {
        return {
          id: p.id || '',
          title: p.title || 'Property',
          description: p.description || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          zipCode: p.zipCode || '',
          price: Number(p.price) || 0,
          priceType: (p.priceType as 'monthly' | 'yearly' | 'sqft') || 'monthly',
          size: Number(p.size) || 0,
          propertyType: (['office', 'retail', 'warehouse', 'restaurant', 'other'].includes(p.propertyType) 
            ? p.propertyType 
            : 'other') as 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other',
          condition: 'good' as const,
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          accessibility: false,
          parking: false,
          publicTransport: false,
          ownerId: p.ownerId || '',
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : (p.createdAt ? new Date(p.createdAt) : new Date()),
          isAvailable: p.availability !== false,
          isFeatured: Boolean(p.isFeatured),
          images: Array.isArray(p.images) ? p.images : []
        }
      } catch (error: any) {
        console.error('[API Match] Error mapping property:', p.id, error.message)
        // Return a minimal valid property object
        return {
          id: p.id || '',
          title: 'Property',
          description: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          price: 0,
          priceType: 'monthly',
          size: 0,
          propertyType: 'other',
          condition: 'good',
          amenities: [],
          accessibility: false,
          parking: false,
          publicTransport: false,
          ownerId: p.ownerId || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isAvailable: false,
          isFeatured: false,
          images: []
        }
      }
    })

    // Prepare brand requirements for BFI calculation
    const brandRequirements = {
      locations: locations || [],
      sizeMin: sizeRange?.min || 0,
      sizeMax: sizeRange?.max || 100000,
      budgetMin: budgetRange?.min || 0,
      budgetMax: budgetRange?.max || 10000000,
      businessType: businessType || ''
    }

    // Calculate BFI scores and rank using findMatches
    const matchResults = findMatches(typedProperties, brandRequirements)

    // Log matching info for debugging
    console.log(`[API Match] Total properties checked: ${typedProperties.length}`)
    console.log(`[API Match] Total matches found: ${matchResults.length}`)
    if (matchResults.length > 0) {
      const scores = matchResults.map(m => m.bfiScore.score)
      console.log(`[API Match] Score range: ${Math.min(...scores)}% - ${Math.max(...scores)}%`)
    }

    // Filter matches with >= 60% score (but show lower scores if no matches found)
    let filteredMatches = matchResults.filter(result => result.bfiScore.score >= 60)
    
    // If no matches >= 60%, progressively lower threshold to find any matches
    if (filteredMatches.length === 0 && matchResults.length > 0) {
      console.log(`[API Match] No matches >= 60%, checking lower thresholds...`)
      
      // Try >= 50%
      filteredMatches = matchResults.filter(result => result.bfiScore.score >= 50)
      if (filteredMatches.length === 0) {
        // Try >= 40%
        filteredMatches = matchResults.filter(result => result.bfiScore.score >= 40)
        if (filteredMatches.length === 0) {
          // Show all matches >= 30% (original minimum in findMatches)
          filteredMatches = matchResults.filter(result => result.bfiScore.score >= 30)
          console.log(`[API Match] Showing matches >= 30% (${filteredMatches.length} found)`)
        } else {
          console.log(`[API Match] Showing matches >= 40% (${filteredMatches.length} found)`)
        }
      } else {
        console.log(`[API Match] Showing matches >= 50% (${filteredMatches.length} found)`)
      }
    } else {
      console.log(`[API Match] Found ${filteredMatches.length} matches >= 60%`)
    }

    // Sort by budget score first (to prioritize closest budget matches), then overall BFI score
    const sortedByBudget = [...filteredMatches].sort((a, b) => {
      // First sort by budget score (descending)
      if (b.bfiScore.breakdown.budgetScore !== a.bfiScore.breakdown.budgetScore) {
        return b.bfiScore.breakdown.budgetScore - a.bfiScore.breakdown.budgetScore
      }
      // Then by overall BFI score
      return b.bfiScore.score - a.bfiScore.score
    })

    // Generate match reasons for each match
    const matchesWithReasons = sortedByBudget.map(match => {
      const reasons: string[] = []
      const breakdown = match.bfiScore.breakdown
      
      // Location reasons
      if (breakdown.locationScore === 100) {
        reasons.push(`Perfect location match - in ${match.property.city}`)
      } else if (breakdown.locationScore >= 70) {
        reasons.push(`Good location - nearby your preferred areas`)
      }

      // Budget reasons
      const monthlyPrice = match.property.priceType === 'yearly' 
        ? match.property.price / 12 
        : match.property.price
      if (breakdown.budgetScore >= 80) {
        reasons.push(`Great value - ₹${Math.round(monthlyPrice).toLocaleString()}/month within your budget`)
      }

      // Size reasons
      if (breakdown.sizeScore >= 80) {
        reasons.push(`Ideal size - ${match.property.size.toLocaleString()} sqft perfect for ${businessType || 'your business'}`)
      }

      // Property features
      if (match.property.amenities.some(a => a.toLowerCase().includes('parking'))) {
        reasons.push(`Parking available`)
      }
      if (match.property.amenities.some(a => a.toLowerCase().includes('ground'))) {
        reasons.push(`Ground floor - high visibility`)
      }

      return {
        property: match.property,
        bfiScore: match.bfiScore.score,
        matchReasons: reasons.slice(0, 5),
        breakdown: breakdown
      }
    })

    // Return top 50 matches (already filtered and sorted)
    const topMatches = matchesWithReasons.slice(0, 50)

    const responseData = {
      matches: topMatches,
      totalMatches: matchesWithReasons.length,
      minMatchScore: 60
    }
    
    // Log query size for monitoring
    const responseSize = estimateJsonSize(responseData)
    logQuerySize('/api/properties/match', responseSize, topMatches.length)
    
    // Add caching headers
    const headers = getCacheHeaders(CACHE_CONFIGS.PROPERTY_MATCHES)
    
    return NextResponse.json(responseData, { headers })
  } catch (error: any) {
    console.error('[API Match] Property matching error:', error)
    console.error('[API Match] Error stack:', error.stack)
    console.error('[API Match] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    })
    return NextResponse.json(
      { 
        error: error.message || 'Failed to find matches',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

