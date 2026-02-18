import { NextRequest, NextResponse } from 'next/server'
import { findMatches } from '@/lib/matching-engine'
import { Property } from '@/types/workflow'
import { getPrisma } from '@/lib/get-prisma'
import { getCacheHeaders, CACHE_CONFIGS, logQuerySize, estimateJsonSize } from '@/lib/api-cache'
import { getPropertyCoordinatesFromRow, getMapLinkFromAmenities, geocodeAddress } from '@/lib/property-coordinates'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('[API Match] JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const {
      businessType,
      sizeRange,
      locations,
      budgetRange,
      timeline,
      propertyType
    } = body || {}

    const prisma = await getPrisma()
    if (!prisma) {
      console.error('[API Match] Prisma client not available')
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
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

    // Check if a specific propertyId is requested (for view match page optimization)
    const requestedPropertyId = body.propertyId
    let properties: any[]
    
    // If specific property requested, fetch only that property for faster response
    if (requestedPropertyId) {
      const property = await prisma.property.findUnique({
        where: { id: requestedPropertyId },
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
          ownerId: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      })
      
      properties = property ? [property] : []
    } else {
      // Fetch properties from database - limit to 30 for faster queries
      properties = await prisma.property.findMany({
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
          ownerId: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        take: 30,
        orderBy: {
          isFeatured: 'desc'
        }
      })
    }

    // Convert Prisma properties to Property type; attach coordinates from map_link so each property shows correct location
    const typedProperties: Property[] = properties.map((p: any) => {
      try {
        const amenitiesData = p.amenities
        const isAmenitiesObject = typeof amenitiesData === 'object' && amenitiesData !== null && !Array.isArray(amenitiesData)
        const amenitiesArray = Array.isArray(amenitiesData) ? amenitiesData : (isAmenitiesObject && Array.isArray((amenitiesData as any).features) ? (amenitiesData as any).features : [])
        const mapLink = getMapLinkFromAmenities(amenitiesData)
        const coords = getPropertyCoordinatesFromRow(p)

        const prop: Property & { latitude?: number; longitude?: number; mapLink?: string | null } = {
          id: p.id || '',
          title: p.title || 'Property',
          description: p.description || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          zipCode: p.zipCode || '',
          price: typeof p.price === 'object' && p.price !== null && 'toNumber' in p.price
            ? (p.price as any).toNumber()
            : typeof p.price === 'bigint'
            ? Number(p.price)
            : Number(p.price) || 0,
          priceType: (p.priceType as 'monthly' | 'yearly' | 'sqft') || 'monthly',
          size: Number(p.size) || 0,
          propertyType: (['office', 'retail', 'warehouse', 'restaurant', 'other'].includes(p.propertyType) 
            ? p.propertyType 
            : 'other') as 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other',
          condition: 'good' as const,
          amenities: amenitiesArray,
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
        if (mapLink) prop.mapLink = mapLink
        if (coords) {
          const lat = typeof coords.lat === 'number' ? coords.lat : Number(coords.lat)
          const lng = typeof coords.lng === 'number' ? coords.lng : Number(coords.lng)
          prop.latitude = lat
          prop.longitude = lng
          prop.coordinates = { lat, lng }
        }
        return prop
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

    // Geocode only when fetching a single property (match page); skip for full list to keep results page fast
    if (requestedPropertyId) {
      const needGeocode = typedProperties
        .map((prop, i) => ({ prop, row: properties[i] }))
        .filter(({ prop, row }) => {
          const hasCoords = (prop as any).latitude != null && (prop as any).longitude != null
          const hasAddress = (row?.address || row?.city || '').toString().trim()
          return !hasCoords && !!hasAddress
        })
      if (needGeocode.length > 0) {
        const geocodeResults = await Promise.all(
          needGeocode.map(({ row }) =>
            geocodeAddress(
              (row?.address ?? '').toString().trim(),
              (row?.city ?? '').toString().trim(),
              (row?.state ?? '').toString().trim(),
              (row?.title ?? '').toString().trim() || undefined
            )
          )
        )
        geocodeResults.forEach((coords, idx) => {
          if (coords && needGeocode[idx]) {
            const prop = needGeocode[idx].prop
            ;(prop as any).latitude = coords.lat
            ;(prop as any).longitude = coords.lng
            prop.coordinates = coords
          }
        })
      }
    }

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
      if (scores.length > 0) {
        console.log(`[API Match] Score range: ${Math.min(...scores)}% - ${Math.max(...scores)}%`)
      }
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
      if (breakdown.sizeScore >= 80 && match.property.size) {
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
      success: true,
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
    console.error('[API Match] Error stack:', error?.stack)
    console.error('[API Match] Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      body: error?.body
    })

    // Handle Prisma errors
    if (error?.code === 'P1001' || error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        },
        { status: 503 }
      )
    }

    // Handle Prisma schema errors
    if (error?.code === 'P2001' || error?.message?.includes('model') || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database schema error',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        },
        { status: 500 }
      )
    }

    // Return proper error response with success: false
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to find matches',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

