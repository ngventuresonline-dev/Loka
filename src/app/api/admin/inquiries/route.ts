import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'

// Dynamic import for prisma
async function getPrisma() {
  try {
    const prismaModule = await import('@/lib/prisma')
    return prismaModule.prisma
  } catch (e) {
    console.error('Failed to import Prisma:', e)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireUserType(request, ['admin'])

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { property: { title: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get inquiries with pagination
    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              owner: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }).catch(() => []),
      prisma.inquiry.count({ where }).catch(() => 0)
    ])

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Admin inquiries error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inquiries' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

