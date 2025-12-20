import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerOrAdmin, getAuthenticatedUser } from '@/lib/api-auth'
import { CreatePropertySchema, PropertyQuerySchema } from '@/lib/validations/property'
import { generatePropertyId } from '@/lib/property-id-generator'
import { getCacheHeaders, CACHE_CONFIGS, logQuerySize, estimateJsonSize } from '@/lib/api-cache'

/**
 * POST /api/properties
 * Create a new property
 * Requires: Owner or Admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (must be owner or admin)
    const user = await requireOwnerOrAdmin(request)

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Set ownerId from authenticated user
    body.ownerId = user.id

    // Validate input
    const validationResult = CreatePropertySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Convert availableFrom string to Date if provided
    const availableFromDate = data.availableFrom
      ? new Date(data.availableFrom)
      : null

    // Map property type to database enum
    const propertyTypeMap: Record<string, 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other'> = {
      'office': 'office',
      'retail': 'retail',
      'warehouse': 'warehouse',
      'restaurant': 'restaurant',
      'qsr': 'restaurant',
      'kiosk': 'other',
      'commercial': 'other',
      'mixed_use': 'other',
      'other': 'other',
    }
    const mappedPropertyType = propertyTypeMap[data.propertyType] || 'other'

    // Get Prisma client
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    // Generate property ID in prop-XXX format
    const propertyId = await generatePropertyId()

    // Create property
    const property = await prisma.property.create({
      data: {
        id: propertyId,
        title: data.title,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        size: data.size,
        propertyType: mappedPropertyType,
        price: data.price,
        priceType: data.priceType as 'monthly' | 'yearly' | 'sqft',
        securityDeposit: data.securityDeposit,
        amenities: data.amenities || [],
        images: data.images || [],
        status: 'pending', // New properties start as pending
        availability: data.availability ?? false, // Start as unavailable until approved
        isFeatured: data.isFeatured ?? false,
        ownerId: user.id,
        views: 0,
      },
      include: {
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

    return NextResponse.json(
      {
        success: true,
        property,
        message: 'Property created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Properties API] Error creating property:', error)

    // Handle authentication errors
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      )
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Property with this identifier already exists',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create property',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/properties
 * List properties with filters, pagination, and search
 * Public endpoint (no auth required for listing)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams: Record<string, string | undefined> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    // Validate query parameters
    const validationResult = PropertyQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const query = validationResult.data

    // Build Prisma where clause
    const where: any = {}

    // IMPORTANT: Only show available properties on public API
    // Use availability instead of status since status column may not exist
    where.availability = true
    
    // Debug: Log query parameters for featured properties
    if (query.isFeatured === true) {
      console.log('[Properties API] Featured query params:', {
        isFeatured: query.isFeatured,
        type: typeof query.isFeatured,
        rawParams: request.nextUrl.searchParams.toString()
      })
    }

    // Location filters
    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' }
    }
    if (query.state) {
      where.state = { contains: query.state, mode: 'insensitive' }
    }

    // Property type filter
    if (query.propertyType) {
      where.propertyType = query.propertyType
    }

    // Size filters
    if (query.minSize || query.maxSize) {
      where.size = {}
      if (query.minSize) where.size.gte = query.minSize
      if (query.maxSize) where.size.lte = query.maxSize
    }

    // Price filters
    if (query.minPrice || query.maxPrice) {
      where.price = {}
      if (query.minPrice) where.price.gte = query.minPrice
      if (query.maxPrice) where.price.lte = query.maxPrice
    }
    if (query.priceType) {
      where.priceType = query.priceType
    }

    // Boolean filters (only fields that actually exist in the Prisma schema)
    // Note: For featured properties, we don't filter by availability - only status and isFeatured matter
    if (query.isFeatured !== true && query.availability !== undefined) {
      // Only apply availability filter if NOT filtering for featured properties
      where.availability = query.availability
    }
    // Featured filter: Only show properties that are BOTH approved AND featured
    // Availability is NOT considered for featured properties
    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured
    }

    // Owner filter
    if (query.ownerId) {
      where.ownerId = query.ownerId
    }

    // Full-text search
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (query.sortBy === 'relevance' && query.search) {
      // For relevance, we'll use createdAt as fallback
      // In production, you might want to use PostgreSQL full-text search ranking
      orderBy.createdAt = query.sortOrder || 'desc'
    } else {
      orderBy[query.sortBy || 'createdAt'] = query.sortOrder || 'desc'
    }

    // Get Prisma client
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please check your database configuration.',
        },
        { status: 503 }
      )
    }

    // Pagination - enforce max limit of 20 for performance
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 20) // Max 20 per page
    const skip = (page - 1) * limit

    // Debug logging for featured properties query
    if (query.isFeatured === true) {
      console.log('[Properties API] Featured properties WHERE clause:', JSON.stringify(where, null, 2))
      
      // Also check raw count of featured properties in DB
      // Use availability instead of status since status column may not exist
      try {
        const allFeaturedCount = await prisma.property.count({ where: { isFeatured: true } })
        const availableFeaturedCount = await prisma.property.count({ where: { isFeatured: true, availability: true } })
        const availableCount = await prisma.property.count({ where: { availability: true } })
        
        console.log('[Properties API] Database counts:', {
          allFeatured: allFeaturedCount,
          availableAndFeatured: availableFeaturedCount,
          allAvailable: availableCount,
          queryWillReturn: await prisma.property.count({ where })
        })
      } catch (countError) {
        console.warn('[Properties API] Could not get detailed counts:', countError)
      }
    }

    // Get total count for pagination
    let total = 0
    try {
      total = await prisma.property.count({ where })
    } catch (countError: any) {
      console.error('[Properties API] Count query error:', countError)
      // If count fails, try without where clause as fallback
      try {
        total = await prisma.property.count()
      } catch {
        total = 0
      }
    }

    // Fetch properties - only select needed columns to reduce egress
    let properties: any[] = []
    try {
      properties = await prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
          securityDeposit: true,
          amenities: true,
          images: true,
          availability: true,
          isFeatured: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              savedBy: true,
              inquiries: true,
            },
          },
        },
      })
    } catch (queryError: any) {
      console.error('[Properties API] Query error:', {
        message: queryError?.message,
        code: queryError?.code,
        name: queryError?.name,
      })
      
      // If query fails, return empty result instead of crashing
      properties = []
      total = 0
      
      // If it's a schema error, log it specifically
      if (queryError?.message?.includes('Unknown column') || 
          queryError?.message?.includes('does not exist') ||
          queryError?.code === 'P2009') {
        console.warn('[Properties API] Database schema issue - some columns may not exist')
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    // Debug logging for featured properties response
    if (query.isFeatured === true) {
      console.log('[Properties API] Featured properties response:', {
        total,
        count: properties.length,
        sampleIds: properties.slice(0, 3).map(p => ({ 
          id: p.id, 
          title: p.title, 
          isFeatured: p.isFeatured, 
          status: p.status,
          availability: p.availability
        }))
      })
    }

    const responseData = {
      success: true,
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    }
    
    // Log query size for monitoring
    const responseSize = estimateJsonSize(responseData)
    logQuerySize('/api/properties', responseSize, properties.length)
    
    // Add caching headers
    const headers = getCacheHeaders(CACHE_CONFIGS.PROPERTY_LISTINGS)
    
    return NextResponse.json(responseData, { headers })
  } catch (error: any) {
    console.error('[Properties API] Error listing properties:', error)

    // Handle database connection errors
    if (error.code === 'P1001' || error.message?.includes('connect') || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please check your database configuration.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch properties',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

