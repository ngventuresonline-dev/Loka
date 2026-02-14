import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Fetch all properties for this owner
    const properties = await prisma.property.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])

    // Count properties by status
    const statusCounts = await prisma.property.groupBy({
      by: ['status'],
      where: { ownerId: userId },
      _count: true
    }).catch(() => [])

    const counts = {
      approved: statusCounts.find(s => s.status === 'approved')?._count || 0,
      pending: statusCounts.find(s => s.status === 'pending')?._count || 0,
      rejected: statusCounts.find(s => s.status === 'rejected')?._count || 0
    }

    return NextResponse.json({
      properties: properties.map(p => ({
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        state: p.state,
        price: p.price,
        priceType: p.priceType,
        size: p.size,
        propertyType: p.propertyType,
        images: p.images,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      statusCounts: counts,
      total: properties.length
    })
  } catch (error: any) {
    console.error('Owner profile fetch error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch owner profile' },
      { status: 500 }
    )
  }
}
