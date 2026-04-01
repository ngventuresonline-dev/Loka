import { NextRequest, NextResponse } from 'next/server'
import { findMatches } from '@/lib/matching-engine'
import { buildMatchReasonStrings } from '@/lib/property-match-reasons'
import { Property } from '@/types/workflow'
import { getPrisma } from '@/lib/get-prisma'
import { getCacheHeaders, CACHE_CONFIGS, logQuerySize, estimateJsonSize } from '@/lib/api-cache'
import { getPropertyCoordinatesFromRow, getMapLinkFromAmenities } from '@/lib/property-coordinates'

// Simple in-memory cache for match results — 5 minute TTL
const matchCache = new Map<string, { data: any; expires: number }>()

function getMatchCacheKey(body: any): string {
  const { businessType, locations, budgetRange, sizeRange } = body
  return JSON.stringify({ businessType, locations: (locations || []).sort(), budgetRange, sizeRange })
}

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

    const requestedPropertyIdRaw = body?.propertyId
    const hasSinglePropertyRequest =
      typeof requestedPropertyIdRaw === 'string' && requestedPropertyIdRaw.trim().length > 0

    // Check in-memory cache for repeated identical searches (skip for single-property lookups)
    if (!hasSinglePropertyRequest) {
      const cacheKey = getMatchCacheKey(body)
      const cached = matchCache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        return NextResponse.json(cached.data, {
          headers: { 'X-Cache': 'HIT', 'Cache-Control': 'private, max-age=300' }
        })
      }
    }

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

    // Size filter - keep flexible so we don't exclude viable options; BFI will score
    if (sizeRange && sizeRange.min > 0) {
      const sizeMinExpanded = Math.max(0, Math.floor(sizeRange.min * 0.4))
      const sizeMaxExpanded = sizeRange.max ? Math.ceil(sizeRange.max * 2) : 1000000
      
      where.size = {
        gte: sizeMinExpanded,
        lte: sizeMaxExpanded
      }
    }

    // Budget: do NOT hard-cut by max. We want to show properties in preferred areas even if over budget (score will reflect it).
    // Only enforce a minimum floor so we don't get irrelevant low-rent; allow up to 4x max so premium areas (e.g. Indiranagar) are included.
    if (budgetRange && (budgetRange.min > 0 || budgetRange.max > 0)) {
      const minBudget = budgetRange.min || 0
      const maxBudget = budgetRange.max || 20000000
      const minBudgetAdjusted = Math.max(0, Math.floor(minBudget * 0.8))
      const maxBudgetAdjusted = Math.ceil(maxBudget * 4) // Include premium areas; BFI will score down over-budget
      
      where.price = {
        gte: minBudgetAdjusted,
        lte: maxBudgetAdjusted
      }
    }

    // Property type filter - map businessType to propertyType so Office shows office, Fitness shows gym-relevant, not F&B
    const businessTypeStr = typeof businessType === 'string' ? businessType : (Array.isArray(businessType) ? businessType[0] : '')
    const bizLower = (businessTypeStr || '').toLowerCase()
    if (bizLower.includes('office') || bizLower.includes('coworking') || bizLower.includes('it park') || bizLower.includes('business park')) {
      where.propertyType = 'office'
    } else if (bizLower.includes('fitness') || bizLower.includes('gym') || bizLower.includes('sports facility') || bizLower.includes('yoga') || bizLower.includes('wellness')) {
      where.propertyType = { in: ['office', 'retail', 'other'] } // Exclude restaurant
    } else if (bizLower.includes('warehouse') || bizLower.includes('logistics') || bizLower.includes('storage')) {
      where.propertyType = { in: ['warehouse', 'other'] }
    }

    // Check if a specific propertyId is requested (for view match page optimization)
    const requestedPropertyId = hasSinglePropertyRequest
      ? String(requestedPropertyIdRaw).trim()
      : ''
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
      // Fetch more properties so we include preferred locations even when over budget
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
        take: 80,
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

    // Show all matches >= 30% so user sees options in their preferred area even if over budget (score reflects fit)
    const minScore = 30
    let filteredMatches = matchResults.filter(result => result.bfiScore.score >= minScore)
    console.log(`[API Match] Showing matches >= ${minScore}% (${filteredMatches.length} found)`)

    // Sort by highest match (BFI score) first; preferred-location properties still appear by score (we don't hide them)
    const sortedByBudget = [...filteredMatches].sort((a, b) => b.bfiScore.score - a.bfiScore.score)

    // Generate match reasons for each match (copy always derived from that row's property + breakdown)
    const matchesWithReasons = sortedByBudget.map(match => {
      const breakdown = match.bfiScore.breakdown
      const matchReasons = buildMatchReasonStrings(
        match.property,
        breakdown,
        typeof businessType === 'string' ? businessType : '',
      )

      return {
        property: match.property,
        bfiScore: match.bfiScore.score,
        matchReasons,
        breakdown,
      }
    })

    // Return top 50 matches (already filtered and sorted)
    const topMatches = matchesWithReasons.slice(0, 50)

    const responseData = {
      success: true,
      matches: topMatches,
      totalMatches: matchesWithReasons.length,
      minMatchScore: minScore
    }
    
    // Log query size for monitoring
    const responseSize = estimateJsonSize(responseData)
    logQuerySize('/api/properties/match', responseSize, topMatches.length)
    
    // Write to in-memory cache (skip for single-property lookups)
    if (!hasSinglePropertyRequest) {
      const cacheKey = getMatchCacheKey(body)
      matchCache.set(cacheKey, { data: responseData, expires: Date.now() + 5 * 60 * 1000 })
      // Cleanup expired entries when cache grows large
      if (matchCache.size > 100) {
        const now = Date.now()
        for (const [k, v] of matchCache) { if (v.expires < now) matchCache.delete(k) }
      }
    }

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

