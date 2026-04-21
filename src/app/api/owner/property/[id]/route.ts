import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { guessBangaloreLocalityLabel } from '@/lib/location-intelligence/bangalore-areas'
import { OWNER_VIDEO_MAX_COUNT } from '@/lib/image-base64'
import { ensurePropertiesOptionalColumns } from '@/lib/prisma-properties-schema-compat'
import { fireOwnerPropertyMetaConversion, monthlyPriceToNumber } from '@/lib/meta-capi'

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

    await ensurePropertiesOptionalColumns(prisma)

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
    if (body.latitude !== undefined) {
      const n = typeof body.latitude === 'number' ? body.latitude : parseFloat(String(body.latitude))
      updateData.latitude = Number.isFinite(n) ? n : null
    }
    if (body.longitude !== undefined) {
      const n = typeof body.longitude === 'number' ? body.longitude : parseFloat(String(body.longitude))
      updateData.longitude = Number.isFinite(n) ? n : null
    }
    if (body.mapLink !== undefined) {
      updateData.mapLink = body.mapLink != null && String(body.mapLink).trim() ? String(body.mapLink).trim() : null
    }
    if (body.locality !== undefined) {
      updateData.locality =
        body.locality != null && String(body.locality).trim() ? String(body.locality).trim() : null
    } else if (body.address !== undefined && typeof body.address === 'string') {
      const g = guessBangaloreLocalityLabel(body.address)
      if (g) updateData.locality = g
    }

    const existingRow = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { amenities: true },
    })
    const existingAmenities = existingRow?.amenities

    if (body.amenities !== undefined) {
      let features: string[] = []
      if (Array.isArray(body.amenities)) {
        features = body.amenities.map(String)
      } else if (
        typeof body.amenities === 'object' &&
        body.amenities !== null &&
        Array.isArray((body.amenities as { features?: unknown }).features)
      ) {
        features = ((body.amenities as { features: string[] }).features || []).map(String)
      }

      const merged: Record<string, unknown> = { features }
      if (
        existingAmenities &&
        typeof existingAmenities === 'object' &&
        !Array.isArray(existingAmenities)
      ) {
        const ex = existingAmenities as Record<string, unknown>
        if (typeof ex.map_link === 'string') merged.map_link = ex.map_link
        if (Array.isArray(ex.videos)) merged.videos = ex.videos
      }
      if (body.mapLink !== undefined) {
        if (body.mapLink && String(body.mapLink).trim()) merged.map_link = String(body.mapLink).trim()
        else delete merged.map_link
      }
      updateData.amenities = merged
    }

    if (body.mapLink !== undefined && updateData.amenities === undefined) {
      const amenitiesObj: Record<string, unknown> =
        existingAmenities && typeof existingAmenities === 'object' && !Array.isArray(existingAmenities)
          ? { ...(existingAmenities as Record<string, unknown>) }
          : { features: [] as string[] }
      if (!Array.isArray(amenitiesObj.features)) amenitiesObj.features = []
      if (body.mapLink && String(body.mapLink).trim()) amenitiesObj.map_link = String(body.mapLink).trim()
      else delete amenitiesObj.map_link
      updateData.amenities = amenitiesObj
    }

    if (body.videos !== undefined) {
      const base: Record<string, unknown> =
        updateData.amenities && typeof updateData.amenities === 'object' && !Array.isArray(updateData.amenities)
          ? { ...(updateData.amenities as Record<string, unknown>) }
          : existingAmenities &&
              typeof existingAmenities === 'object' &&
              !Array.isArray(existingAmenities)
            ? { ...(existingAmenities as Record<string, unknown>) }
            : { features: [] as string[] }
      if (!Array.isArray(base.features)) base.features = []
      const vids = Array.isArray(body.videos) ? body.videos.slice(0, OWNER_VIDEO_MAX_COUNT) : []
      if (vids.length > 0) base.videos = vids
      else delete base.videos
      updateData.amenities = base
    }

    if (body.images !== undefined) {
      updateData.images = Array.isArray(body.images) ? body.images : []
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        city: true,
        size: true,
        price: true,
        securityDeposit: true,
        propertyType: true,
        amenities: true,
        images: true,
        mapLink: true,
        latitude: true,
        longitude: true,
        locality: true,
        ownerId: true,
        status: true,
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

    const rent = monthlyPriceToNumber(updatedProperty.price)
    const metaEventId = fireOwnerPropertyMetaConversion(request, {
      kind: 'update',
      propertyId: updatedProperty.id,
      ownerUserId: updatedProperty.ownerId,
      priceMonthly: rent,
      ownerEmail: updatedProperty.owner?.email,
      ownerPhone: updatedProperty.owner?.phone,
      metaFbp: typeof body.metaFbp === 'string' ? body.metaFbp : undefined,
      metaFbc: typeof body.metaFbc === 'string' ? body.metaFbc : undefined,
    })

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      message: 'Property updated successfully',
      metaEventId,
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

