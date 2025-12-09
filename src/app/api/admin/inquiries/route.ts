import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'

export async function GET(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
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
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { brand: { email: { contains: search, mode: 'insensitive' } } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { property: { address: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

    const orderBy: any = {}
    if (sortBy === 'date') {
      orderBy.createdAt = sortOrder
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: {
            select: {
              name: true,
              email: true,
            }
          },
          owner: {
            select: {
              name: true,
              email: true,
            }
          },
          property: {
            select: {
              title: true,
              address: true,
            }
          }
        }
      }),
      prisma.inquiry.count({ where })
    ])

    const formattedInquiries = inquiries.map(i => ({
      id: i.id,
      brand: {
        name: i.brand.name,
        email: i.brand.email,
      },
      property: {
        title: i.property.title,
        address: i.property.address,
      },
      owner: i.owner ? {
        name: i.owner.name,
        email: i.owner.email,
      } : null,
      status: i.status,
      createdAt: i.createdAt,
      message: i.message,
    }))

    return NextResponse.json({
      inquiries: formattedInquiries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('Admin inquiries error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inquiries' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
