import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireOwnerOrAdmin,
  getAuthenticatedUser,
  checkPropertyOwnership,
} from '@/lib/api-auth'
import { UpdatePropertySchema } from '@/lib/validations/property'

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

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
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

    return NextResponse.json({
      success: true,
      property,
    })
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

