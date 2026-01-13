import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import {
  requireOwnerOrAdmin,
  getAuthenticatedUser,
  checkPropertyOwnership,
} from '@/lib/api-auth'
import { UpdatePropertySchema } from '@/lib/validations/property'
import { getCacheHeaders, CACHE_CONFIGS } from '@/lib/api-cache'

/**
 * GET /api/properties/[id]
 * Get a single property by ID
 * Public endpoint (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const propertyId = id

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

    // IMPORTANT:
    // - This endpoint is used by both public property pages AND the admin edit page.
    // - If we filter by status=approved here, admins won't be able to edit pending properties (404).
    // - Public visibility is already controlled by the list endpoint (/api/properties) and frontend logic.
    //
    // So we ONLY filter by id here, and keep status filtering in the list API.
    // Handle missing map_link column gracefully
    // Also ensure status field is included if it exists
    let property
    try {
      // Try to include status field if column exists
      const includeFields: any = {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            userType: true,
          },
        },
        _count: {
          select: {
            savedBy: true,
            inquiries: true,
          },
        },
      }
      
      // Check if status column exists and include it
      try {
        await prisma.$queryRawUnsafe(`SELECT status FROM properties WHERE id = $1 LIMIT 1`, propertyId)
        // Status column exists, Prisma will include it automatically in findUnique
      } catch {
        // Status column doesn't exist, that's fine
      }
      
      property = await prisma.property.findUnique({
        where: { 
          id: propertyId,
        },
        include: includeFields,
      })
    } catch (error: any) {
      // If map_link column doesn't exist, query without it using raw SQL
      if (error.message?.includes('map_link') || error.message?.includes('does not exist')) {
        try {
          // First, try to add the column if it doesn't exist
          await prisma.$executeRawUnsafe(`
            ALTER TABLE properties 
            ADD COLUMN IF NOT EXISTS map_link VARCHAR(1000)
          `)
          
          // Retry the original query after adding the column
          property = await prisma.property.findUnique({
            where: { 
              id: propertyId,
            },
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  userType: true,
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
        } catch (alterError: any) {
          // If we can't add the column, query without it using raw SQL
          console.warn('[Properties API] Could not add map_link column, using fallback query:', alterError.message)
          const rawProperty = await prisma.$queryRawUnsafe<Array<any>>(
            `SELECT p.*, 
              json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone, 'userType', u.user_type) as owner,
              (SELECT COUNT(*) FROM saved_properties WHERE property_id = p.id) as saved_count,
              (SELECT COUNT(*) FROM inquiries WHERE property_id = p.id) as inquiry_count
              FROM properties p
              LEFT JOIN users u ON p.owner_id = u.id
              WHERE p.id = $1`,
            propertyId
          )
          
          if (rawProperty && rawProperty.length > 0) {
            const prop = rawProperty[0]
            // Map the raw result to Prisma format
            property = {
              ...prop,
              mapLink: null, // Column doesn't exist, set to null
              owner: typeof prop.owner === 'object' ? prop.owner : null,
              _count: {
                savedBy: Number(prop.saved_count) || 0,
                inquiries: Number(prop.inquiry_count) || 0,
              },
            } as any
          } else {
            property = null
          }
        }
      } else {
        throw error
      }
    }

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
        },
        { status: 404 }
      )
    }

    // Increment view count (async, don't wait)
    prisma.property
      .update({
        where: { id: propertyId },
        data: { views: { increment: 1 } },
      })
      .catch((err) => console.error('[Properties API] Error incrementing views:', err))

    // Convert Decimal/BigInt to safe JSON-serializable values
    const safeProperty = property ? {
      ...property,
      price: typeof property.price === 'object' && property.price !== null && 'toNumber' in property.price
        ? (property.price as any).toNumber()
        : typeof property.price === 'bigint'
        ? Number(property.price)
        : Number(property.price) || 0,
      securityDeposit: property.securityDeposit 
        ? (typeof property.securityDeposit === 'object' && property.securityDeposit !== null && 'toNumber' in property.securityDeposit
          ? (property.securityDeposit as any).toNumber()
          : typeof property.securityDeposit === 'bigint'
          ? Number(property.securityDeposit)
          : Number(property.securityDeposit))
        : null,
      rentEscalation: property.rentEscalation
        ? (typeof property.rentEscalation === 'object' && property.rentEscalation !== null && 'toNumber' in property.rentEscalation
          ? (property.rentEscalation as any).toNumber()
          : typeof property.rentEscalation === 'bigint'
          ? Number(property.rentEscalation)
          : Number(property.rentEscalation))
        : null,
    } : null

    // Add caching headers for faster subsequent requests
    const headers = getCacheHeaders(CACHE_CONFIGS.PROPERTY_LISTINGS)
    
    return NextResponse.json({
      success: true,
      property: safeProperty,
    }, { headers })
  } catch (error: any) {
    console.error('[Properties API] Error fetching property:', error)

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
        error: error.message || 'Failed to fetch property',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/properties/[id]
 * Update a property
 * Requires: Owner of the property or Admin
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const propertyId = id

    // Authenticate user
    const user = await requireOwnerOrAdmin(request)

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

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })

    if (!existingProperty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
        },
        { status: 404 }
      )
    }

    // Check ownership (unless admin)
    if (user.userType !== 'admin' && existingProperty.ownerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You do not own this property',
        },
        { status: 403 }
      )
    }

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

    // Remove fields that shouldn't be updated
    delete body.id
    delete body.ownerId // Don't allow changing owner
    delete body.createdAt
    delete body.updatedAt
    delete body.views // Views are auto-managed

    // Validate input
    const validationResult = UpdatePropertySchema.safeParse(body)
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
    const updateData: any = { ...data }
    if (updateData.availableFrom) {
      updateData.availableFrom = new Date(updateData.availableFrom)
    } else if (updateData.availableFrom === null) {
      updateData.availableFrom = null
    }

    // Update property
    const property = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
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


    return NextResponse.json({
      success: true,
      property,
      message: 'Property updated successfully',
    })
  } catch (error: any) {
    console.error('[Properties API] Error updating property:', error)

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
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update property',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/properties/[id]
 * Delete a property
 * Requires: Owner of the property or Admin
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const propertyId = id

    // Authenticate user
    const user = await requireOwnerOrAdmin(request)

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

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })

    if (!existingProperty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
        },
        { status: 404 }
      )
    }

    // Check ownership (unless admin)
    if (user.userType !== 'admin' && existingProperty.ownerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You do not own this property',
        },
        { status: 403 }
      )
    }

    // Delete property (cascade will handle related records)
    await prisma.property.delete({
      where: { id: propertyId },
    })


    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
    })
  } catch (error: any) {
    console.error('[Properties API] Error deleting property:', error)

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
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete property',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

