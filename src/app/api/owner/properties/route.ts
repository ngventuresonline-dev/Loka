import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ownerId = searchParams.get('ownerId')

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId is required' },
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

    // Fetch properties for this owner - limit to 50 to reduce egress
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50)
    const skip = (page - 1) * limit
    
    const properties = await prisma.property.findMany({
      where: {
        ownerId,
      },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        size: true,
        price: true,
        propertyType: true,
        availability: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    const total = await prisma.property.count({ where: { ownerId } })

    return NextResponse.json({
      properties: properties.map(p => ({
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        size: p.size,
        price: Number(p.price),
        propertyType: p.propertyType,
        availability: p.availability ?? true,
        status: p.status || 'pending',
        createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Owner Properties API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

