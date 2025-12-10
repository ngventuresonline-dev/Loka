import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import { generatePropertyId } from '@/lib/property-id-generator'

export async function GET(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

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

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
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
      }),
      prisma.property.count({ where })
    ])

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
    console.error('Admin properties error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch properties' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json()
    const {
      title, description, address, city, state, zipCode,
      price, priceType, securityDeposit, rentEscalation,
      size, propertyType, storePowerCapacity, powerBackup,
      waterFacility, amenities, images, ownerId, availability, isFeatured, displayOrder
    } = body

    if (!title || !address || !city || !price || !size || !propertyType || !ownerId) {
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

    // Generate property ID in prop-XXX format
    const propertyId = await generatePropertyId()

    const property = await prisma.property.create({
      data: {
        id: propertyId,
        title,
        description: description || null,
        address,
        city,
        state: state || null,
        zipCode: zipCode || '',
        price: parseFloat(price),
        priceType: priceType || 'monthly',
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
        rentEscalation: rentEscalation ? parseFloat(rentEscalation) : null,
        size: parseInt(size),
        propertyType,
        storePowerCapacity: storePowerCapacity || null,
        powerBackup: powerBackup || false,
        waterFacility: waterFacility || false,
        amenities: amenities || [],
        images: images || [],
        ownerId,
        availability: availability !== undefined ? availability : true,
        isFeatured: isFeatured || false,
        displayOrder: displayOrder !== undefined && displayOrder !== null ? parseInt(String(displayOrder)) : null,
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
    if (updateData.latitude !== undefined) data.latitude = updateData.latitude
    if (updateData.longitude !== undefined) data.longitude = updateData.longitude
    
    // Pricing
    if (updateData.price !== undefined) data.price = updateData.price
    if (updateData.priceType !== undefined) data.priceType = updateData.priceType
    if (updateData.securityDeposit !== undefined) data.securityDeposit = updateData.securityDeposit
    if (updateData.rentEscalation !== undefined) data.rentEscalation = updateData.rentEscalation
    
    // Property details
    if (updateData.size !== undefined) data.size = updateData.size
    if (updateData.propertyType !== undefined) {
      // Validate property type matches enum
      const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other']
      data.propertyType = validTypes.includes(updateData.propertyType) 
        ? updateData.propertyType 
        : 'other'
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
