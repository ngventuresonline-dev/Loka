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
    const dateRange = searchParams.get('range') || 'all' // today, 7d, 30d, all

    // Calculate date filters
    const now = new Date()
    let startDate: Date | null = null
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30))
        break
      default:
        startDate = null
    }

    const dateFilter = startDate ? { gte: startDate } : undefined

    // Get statistics
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const [
      totalUsers,
      totalProperties,
      totalInquiries,
      totalMatches,
      usersByType,
      propertiesByStatus,
      inquiriesByStatus,
      recentUsers,
      recentProperties,
      recentInquiries
    ] = await Promise.all([
      // Total counts
      prisma.user.count({ where: dateFilter ? { createdAt: dateFilter } : undefined }).catch(() => 0),
      prisma.property.count({ where: dateFilter ? { createdAt: dateFilter } : undefined }).catch(() => 0),
      prisma.inquiry.count({ where: dateFilter ? { createdAt: dateFilter } : undefined }).catch(() => 0),
      prisma.searchHistory.count({ 
        where: dateFilter 
          ? { createdAt: dateFilter, matchedProperties: { not: null } }
          : { matchedProperties: { not: null } }
      }).catch(() => 0),

      // Users by type
      prisma.user.groupBy({
        by: ['userType'],
        _count: true,
        where: dateFilter ? { createdAt: dateFilter } : undefined
      }).catch(() => []),

      // Properties by status
      prisma.property.groupBy({
        by: ['availability'],
        _count: true,
        where: dateFilter ? { createdAt: dateFilter } : undefined
      }).catch(() => []),

      // Inquiries by status
      prisma.inquiry.groupBy({
        by: ['status'],
        _count: true,
        where: dateFilter ? { createdAt: dateFilter } : undefined
      }).catch(() => []),

      // Recent activity
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, userType: true, createdAt: true }
      }).catch(() => []),

      prisma.property.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, city: true, price: true, createdAt: true }
      }).catch(() => []),

      prisma.inquiry.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { name: true, email: true } },
          property: { select: { title: true, address: true } }
        }
      }).catch(() => [])
    ])

    // Calculate active matches (inquiries that came from matches)
    const activeMatches = totalInquiries

    // Format response
    const stats = {
      overview: {
        totalUsers,
        totalProperties,
        totalInquiries,
        activeMatches
      },
      breakdown: {
        usersByType: usersByType.reduce((acc: any, item: any) => {
          acc[item.userType] = item._count
          return acc
        }, {}),
        propertiesByStatus: {
          available: propertiesByStatus.find((p: any) => p.availability === true)?._count || 0,
          occupied: propertiesByStatus.find((p: any) => p.availability === false)?._count || 0
        },
        inquiriesByStatus: inquiriesByStatus.reduce((acc: any, item: any) => {
          acc[item.status] = item._count
          return acc
        }, {})
      },
      recentActivity: {
        users: recentUsers,
        properties: recentProperties,
        inquiries: recentInquiries
      }
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

