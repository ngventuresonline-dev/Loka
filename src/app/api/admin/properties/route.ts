import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import { generatePropertyId } from '@/lib/property-id-generator'

export async function GET(request: NextRequest) {
  try {
    // Handle authentication separately to return proper status codes
    let user
    try {
      user = await requireUserType(request, ['admin'])
    } catch (authError: any) {
      console.error('[Admin properties] Auth error:', authError?.message || authError)
      const status = authError?.message?.includes('Forbidden') ? 403 : 401
      return NextResponse.json(
        { error: authError?.message || 'Authentication required' },
        { status }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (location) {
      where.city = location
    }

    if (status === 'available') {
      where.availability = true
    } else if (status === 'occupied') {
      where.availability = false
    }

    const orderBy: any = {}
    if (sortBy === 'date') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'rent') {
      orderBy.price = sortOrder
    }

    // Fetch properties first - this is what the UI needs
    let properties
    try {
      properties = await prisma.property.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })
    } catch (dbError: any) {
      console.error('[Admin properties] Database query error:', dbError?.message || dbError)
      return NextResponse.json(
        { error: 'Database query failed', details: dbError?.message },
        { status: 500 }
      )
    }

    // Try to get total count, but don't fail request if the count query hits
    // connection limits in development (common with connection_limit=1).
    let total = properties.length
    try {
      total = await prisma.property.count({ where })
    } catch (countError: any) {
      console.error('[Admin properties] Count query failed, using page length as total:', countError?.message || countError)
      // Continue with properties.length as total
    }

    const formattedProperties = properties.map(p => ({
      id: p.id,
      title: p.title,
      address: p.address,
      city: p.city,
      owner: {
        name: p.owner.name,
        email: p.owner.email,
      },
      size: p.size,
      price: Number(p.price),
      priceType: p.priceType,
      availability: p.availability,
      createdAt: p.createdAt,
      isFeatured: p.isFeatured,
    }))

    return NextResponse.json({
      properties: formattedProperties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('[Admin properties] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json()

    const title = String(body.title || '').trim()
    const description = body.description ? String(body.description).trim() : ''
    const address = String(body.address || '').trim()
    const city = String(body.city || '').trim()
    const state = body.state ? String(body.state).trim() : ''
    const zipCode = body.zipCode ? String(body.zipCode).trim() : ''
    const rawPrice = body.price
    const rawPriceType = body.priceType
    const rawSecurityDeposit = body.securityDeposit
    const rawRentEscalation = body.rentEscalation
    const rawSize = body.size
    const rawPropertyType = body.propertyType
    const storePowerCapacity = body.storePowerCapacity ? String(body.storePowerCapacity).trim() : ''
    const powerBackup = Boolean(body.powerBackup)
    const waterFacility = Boolean(body.waterFacility)
    const amenities = Array.isArray(body.amenities) ? body.amenities : []
    const images = Array.isArray(body.images) ? body.images : []
    const ownerId = body.ownerId as string | undefined
    const availability = body.availability
    const isFeatured = body.isFeatured
    const displayOrder = body.displayOrder
    const addedBy = body.addedBy as string | undefined

    if (!title || !address || !city || rawPrice === undefined || rawSize === undefined || !rawPropertyType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Resolve owner based on addedBy flag (admin vs owner)
    let finalOwnerId = ownerId

    // If no ownerId provided or explicitly marked as admin, attach to admin user
    const addedByValue = addedBy?.toLowerCase() || 'admin'
    if (!finalOwnerId || addedByValue === 'admin') {
      const adminEmail = 'admin@ngventures.com'
      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          userType: 'admin',
        },
        create: {
          email: adminEmail,
          name: 'System Administrator',
          password: '$2b$10$placeholder_hash_change_in_production',
          userType: 'admin',
        },
      })
      finalOwnerId = adminUser.id
    }

    // Generate property ID in prop-XXX format
    const propertyId = await generatePropertyId()

    // Normalise property type to match Prisma enum
    const rawType = String(rawPropertyType || '').toLowerCase()
    const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other'] as const
    let normalizedType: (typeof validTypes)[number] = 'other'

    // Handle specific property type values
    if (rawType === 'office' || rawType.includes('business-park') || rawType.includes('it-park') || rawType.includes('co-working-space')) {
      normalizedType = 'office'
    } else if (rawType === 'retail' || rawType.includes('mall-space') || rawType.includes('showroom') || rawType.includes('kiosk')) {
      normalizedType = 'retail'
    } else if (rawType === 'warehouse' || rawType.includes('industrial-space')) {
      normalizedType = 'warehouse'
    } else if (rawType === 'restaurant' || rawType.includes('food-court') || rawType.includes('cafe-coffee-shop') || rawType.includes('qsr') || rawType.includes('dessert-bakery') || rawType.includes('food') || rawType.includes('restaurant')) {
      // Food court / F&B all map to restaurant
      normalizedType = 'restaurant'
    } else if (rawType.includes('bungalow') || rawType.includes('villa') || rawType.includes('standalone-building') || rawType.includes('commercial-complex') || rawType.includes('service-apartment') || rawType.includes('hotel-hospitality') || rawType.includes('land') || rawType === 'other') {
      normalizedType = 'other'
    } else if (validTypes.includes(rawType as any)) {
      normalizedType = rawType as (typeof validTypes)[number]
    }

    // Normalise price / size / decimals
    const numericPrice = Number(rawPrice)
    const price = Number.isFinite(numericPrice) ? numericPrice : 0

    const numericSize = Number(rawSize)
    const size = Number.isFinite(numericSize) ? Math.trunc(numericSize) : 0

    const securityDeposit =
      rawSecurityDeposit !== undefined && rawSecurityDeposit !== null && rawSecurityDeposit !== ''
        ? Number(rawSecurityDeposit)
        : null

    const rentEscalation =
      rawRentEscalation !== undefined && rawRentEscalation !== null && rawRentEscalation !== ''
        ? Number(rawRentEscalation)
        : null

    const priceTypeRaw = String(rawPriceType || 'monthly').toLowerCase()
    const allowedPriceTypes = ['monthly', 'yearly', 'sqft'] as const
    const priceType = (allowedPriceTypes.includes(priceTypeRaw as any) ? priceTypeRaw : 'monthly') as (typeof allowedPriceTypes)[number]

    const property = await prisma.property.create({
      data: {
        id: propertyId,
        title,
        description: description || null,
        address,
        city,
        // Prisma schema requires non-null state; fall back to empty string
        state: state || '',
        zipCode: zipCode || '',
        price,
        priceType,
        securityDeposit,
        rentEscalation,
        size,
        propertyType: normalizedType,
        storePowerCapacity: storePowerCapacity || null,
        powerBackup,
        waterFacility,
        amenities,
        images,
        ownerId: finalOwnerId!,
        availability: availability !== undefined ? Boolean(availability) : true,
        isFeatured: Boolean(isFeatured),
        displayOrder:
          displayOrder !== undefined && displayOrder !== null && String(displayOrder).trim() !== ''
            ? parseInt(String(displayOrder), 10)
            : null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      owner: {
        name: property.owner.name,
        email: property.owner.email,
      },
      size: property.size,
      price: Number(property.price),
      priceType: property.priceType,
      availability: property.availability,
      createdAt: property.createdAt,
      isFeatured: property.isFeatured,
    })
  } catch (error: any) {
    console.error('Admin create property error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create property' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json()
    const { propertyId, ...updateData } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Prepare update data
    const data: any = {}
    
    // Basic fields
    if (updateData.title !== undefined) data.title = updateData.title
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.address !== undefined) data.address = updateData.address
    if (updateData.city !== undefined) data.city = updateData.city
    if (updateData.state !== undefined) data.state = updateData.state
    if (updateData.zipCode !== undefined) data.zipCode = updateData.zipCode
    
    // Pricing
    if (updateData.price !== undefined) data.price = updateData.price
    if (updateData.priceType !== undefined) data.priceType = updateData.priceType
    if (updateData.securityDeposit !== undefined) data.securityDeposit = updateData.securityDeposit
    if (updateData.rentEscalation !== undefined) data.rentEscalation = updateData.rentEscalation
    
    // Property details
    if (updateData.size !== undefined) data.size = updateData.size
    if (updateData.propertyType !== undefined) {
      // Normalise property type to match Prisma enum
      const rawType = String(updateData.propertyType || '').toLowerCase()
      const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other'] as const
      let normalizedType: (typeof validTypes)[number] = 'other'

      // Handle specific property type values
      if (rawType === 'office' || rawType.includes('business-park') || rawType.includes('it-park') || rawType.includes('co-working-space')) {
        normalizedType = 'office'
      } else if (rawType === 'retail' || rawType.includes('mall-space') || rawType.includes('showroom') || rawType.includes('kiosk')) {
        normalizedType = 'retail'
      } else if (rawType === 'warehouse' || rawType.includes('industrial-space')) {
        normalizedType = 'warehouse'
      } else if (rawType === 'restaurant' || rawType.includes('food-court') || rawType.includes('cafe-coffee-shop') || rawType.includes('qsr') || rawType.includes('dessert-bakery') || rawType.includes('food') || rawType.includes('restaurant')) {
        normalizedType = 'restaurant'
      } else if (rawType.includes('bungalow') || rawType.includes('villa') || rawType.includes('standalone-building') || rawType.includes('commercial-complex') || rawType.includes('service-apartment') || rawType.includes('hotel-hospitality') || rawType.includes('land') || rawType === 'other') {
        normalizedType = 'other'
      } else if (validTypes.includes(rawType as any)) {
        normalizedType = rawType as (typeof validTypes)[number]
      }
      
      data.propertyType = normalizedType
    }
    if (updateData.storePowerCapacity !== undefined) data.storePowerCapacity = updateData.storePowerCapacity
    if (updateData.powerBackup !== undefined) data.powerBackup = updateData.powerBackup
    if (updateData.waterFacility !== undefined) data.waterFacility = updateData.waterFacility
    
    // Features
    if (updateData.amenities !== undefined) data.amenities = updateData.amenities
    if (updateData.images !== undefined) data.images = updateData.images
    
    // Status
    if (updateData.availability !== undefined) data.availability = updateData.availability
    if (updateData.isFeatured !== undefined) data.isFeatured = updateData.isFeatured
    if (updateData.displayOrder !== undefined) data.displayOrder = updateData.displayOrder !== null ? parseInt(String(updateData.displayOrder)) : null
    
    // Owner (only if provided and different)
    if (updateData.ownerId !== undefined && updateData.ownerId) {
      data.ownerId = updateData.ownerId
    }

    const property = await prisma.property.update({
      where: { id: propertyId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        owner: {
          name: property.owner.name,
          email: property.owner.email,
        },
        size: property.size,
        price: Number(property.price),
        priceType: property.priceType,
        availability: property.availability,
        createdAt: property.createdAt,
        isFeatured: property.isFeatured,
      }
    })
  } catch (error: any) {
    console.error('Admin update property error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update property' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    await prisma.property.delete({
      where: { id: propertyId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin delete property error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete property' },
      { status: 500 }
    )
  }
}
