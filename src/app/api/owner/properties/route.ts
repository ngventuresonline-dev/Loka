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

    // Fetch properties for this owner
    const properties = await prisma.property.findMany({
      where: {
        ownerId,
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        size: true,
        price: true,
        propertyType: true,
        availability: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

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
        createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('[Owner Properties API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

