import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrAdmin, getAuthenticatedUser } from '@/lib/api-auth'
import { CreatePropertySchema, PropertyQuerySchema } from '@/lib/validations/property'

/**
 * POST /api/properties
 * Create a new property
 * Requires: Owner or Admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Properties API] POST /api/properties - Creating property')

    // Authenticate user (must be owner or admin)
    const user = await requireOwnerOrAdmin(request)
    console.log('[Properties API] Authenticated user:', user.email, user.userType)

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
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Convert availableFrom string to Date if provided
    const availableFromDate = data.availableFrom
      ? new Date(data.availableFrom)
      : null

    // Create property
    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        zipCode: data.zipCode,
        latitude: data.latitude,
        longitude: data.longitude,
        size: data.size,
        propertyType: data.propertyType,
        condition: data.condition,
        price: data.price,
        priceType: data.priceType,
        securityDeposit: data.securityDeposit,
        negotiable: data.negotiable ?? true,
        amenities: data.amenities || [],
        images: data.images || [],
        availability: data.availability ?? true,
        availableFrom: availableFromDate,
        isVerified: data.isVerified ?? false,
        isFeatured: data.isFeatured ?? false,
        parking: data.parking ?? false,
        publicTransport: data.publicTransport ?? false,
        accessibility: data.accessibility ?? false,
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

    console.log('[Properties API] Property created:', property.id)

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
    console.log('[Properties API] GET /api/properties - Listing properties')

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
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const query = validationResult.data

    // Build Prisma where clause
    const where: any = {}

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

    // Boolean filters
    if (query.availability !== undefined) {
      where.availability = query.availability
    }
    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified
    }
    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured
    }
    if (query.parking !== undefined) {
      where.parking = query.parking
    }
    if (query.publicTransport !== undefined) {
      where.publicTransport = query.publicTransport
    }
    if (query.accessibility !== undefined) {
      where.accessibility = query.accessibility
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

    // Pagination
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 100) // Max 100 per page
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await prisma.property.count({ where })

    // Fetch properties
    const properties = await prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
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

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    console.log('[Properties API] Found', properties.length, 'properties (page', page, 'of', totalPages, ')')

    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('[Properties API] Error listing properties:', error)

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

