import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

/**
 * PUT /api/owner/property/[id]
 * Update a property by owner
 * Verifies ownership via ownerId in request body
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const propertyId = id

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { ownerId } = body

    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'ownerId is required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check if property exists and verify ownership
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    if (existingProperty.ownerId !== ownerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not own this property' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.size !== undefined) updateData.size = body.size
    if (body.price !== undefined) updateData.price = body.price
    if (body.securityDeposit !== undefined) {
      updateData.securityDeposit = body.securityDeposit > 0 ? body.securityDeposit : null
    }
    if (body.propertyType !== undefined) {
      // Normalize property type
      const rawType = (body.propertyType || '').toLowerCase()
      const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other'] as const
      let normalizedType: (typeof validTypes)[number] = 'other'

      if (rawType === 'office' || rawType.includes('business-park') || rawType.includes('it-park') || rawType.includes('co-working-space')) {
        normalizedType = 'office'
      } else if (rawType === 'retail' || rawType.includes('mall-space') || rawType.includes('showroom') || rawType.includes('kiosk')) {
        normalizedType = 'retail'
      } else if (rawType === 'warehouse' || rawType.includes('industrial-space')) {
        normalizedType = 'warehouse'
      } else if (
        rawType === 'restaurant' ||
        rawType.includes('food-court') ||
        rawType.includes('cafe-coffee-shop') ||
        rawType.includes('qsr') ||
        rawType.includes('dessert-bakery') ||
        rawType.includes('food') ||
        rawType.includes('restaurant')
      ) {
        normalizedType = 'restaurant'
      } else if (validTypes.includes(rawType as any)) {
        normalizedType = rawType as (typeof validTypes)[number]
      }

      updateData.propertyType = normalizedType
    }
    // Note: latitude/longitude are not stored in the Property model currently
    // They are validated during creation but not persisted to the database
    if (body.amenities !== undefined) {
      updateData.amenities = Array.isArray(body.amenities) ? body.amenities : []
    }
    if (body.images !== undefined) {
      updateData.images = Array.isArray(body.images) ? body.images : []
    }

    // Update property
    const updatedProperty = await prisma.property.update({
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
      property: updatedProperty,
      message: 'Property updated successfully',
    })
  } catch (error: any) {
    console.error('[Owner Property Update API] Error:', error)

    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
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

