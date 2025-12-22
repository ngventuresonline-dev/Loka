import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-security'
import { getPrisma } from '@/lib/get-prisma'

export async function GET(request: NextRequest) {
  try {
    const securityCheck = await requireAdminAuth(request, {
      checkRateLimit: true
    })

    if (!securityCheck.authorized) {
      await logAdminAction(request, 'UNAUTHORIZED_EXPERT_REQUESTS_ACCESS_ATTEMPT', {
        error: securityCheck.error
      })
      
      return NextResponse.json(
        { error: securityCheck.error || 'Admin authentication required' },
        { status: securityCheck.statusCode || 401 }
      )
    }

    await logAdminAction(request, 'ADMIN_EXPERT_REQUESTS_LIST_VIEW')

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    const where: any = {}
    
    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { property: { title: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [expertRequests, total] = await Promise.all([
      prisma.expertRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true
            }
          }
        }
      }),
      prisma.expertRequest.count({ where })
    ])

    return NextResponse.json({
      success: true,
      expertRequests: expertRequests.map(req => ({
        id: req.id,
        propertyId: req.propertyId,
        property: req.property,
        brandName: req.brandName,
        email: req.email,
        phone: req.phone,
        scheduleDateTime: req.scheduleDateTime,
        notes: req.notes,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Admin Expert Requests] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expert requests' },
      { status: 500 }
    )
  }
}

