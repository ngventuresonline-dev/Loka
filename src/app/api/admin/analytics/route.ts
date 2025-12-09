import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireUserType(request, ['admin'])

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('range') || '30d' // today, 7d, 30d, all

    // Calculate date filters
    const now = new Date()
    let startDate: Date | null = null
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case '7d':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        break
      default:
        startDate = null
    }

    const dateFilter = startDate ? { gte: startDate } : undefined

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get analytics data
    const [
      userRegistrations,
      propertyListings,
      inquiryCreation,
      searchHistory,
      topLocations,
      propertyTypes,
      brandOwnerRatio
    ] = await Promise.all([
      // User registrations over time
      prisma.user.findMany({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
        select: { createdAt: true, userType: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),

      // Property listings over time
      prisma.property.findMany({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),

      // Inquiry creation over time
      prisma.inquiry.findMany({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),

      // Search history analytics (model not in current schema)
      Promise.resolve([] as any[]),

      // Top locations
      prisma.property.groupBy({
        by: ['city'],
        _count: true,
        where: dateFilter ? { createdAt: dateFilter } : undefined
      }).catch(() => []),

      // Property types distribution
      prisma.property.groupBy({
        by: ['propertyType'],
        _count: true,
        where: dateFilter ? { createdAt: dateFilter } : undefined
      }).catch(() => []),

      // Brand vs Owner ratio
      prisma.user.groupBy({
        by: ['userType'],
        _count: true,
        where: dateFilter ? { createdAt: dateFilter } : undefined
      }).catch(() => [])
    ])

    // Process data for charts
    const processTimeSeries = (data: any[], dateField: string = 'createdAt') => {
      const grouped: { [key: string]: number } = {}
      data.forEach((item: any) => {
        const date = new Date(item[dateField]).toISOString().split('T')[0]
        grouped[date] = (grouped[date] || 0) + 1
      })
      return Object.entries(grouped)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    const analytics = {
      userRegistrations: processTimeSeries(userRegistrations),
      propertyListings: processTimeSeries(propertyListings),
      inquiryCreation: processTimeSeries(inquiryCreation),
      searchAnalytics: {
        totalSearches: searchHistory.length,
        buttonFlow: searchHistory.filter((s: any) => s.queryType === 'button-flow').length,
        textSearch: searchHistory.filter((s: any) => s.queryType === 'text-search').length,
        averageResults: searchHistory.length > 0
          ? searchHistory.reduce((sum: number, s: any) => sum + (s.resultsCount || 0), 0) / searchHistory.length
          : 0,
        conversionRate: searchHistory.length > 0
          ? (searchHistory.filter((s: any) => s.clickedPropertyId).length / searchHistory.length) * 100
          : 0
      },
      topLocations: topLocations
        .map((l: any) => ({ location: l.city, count: l._count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10),
      propertyTypes: propertyTypes.map((pt: any) => ({
        type: pt.propertyType,
        count: pt._count
      })),
      brandOwnerRatio: {
        brands: brandOwnerRatio.find((r: any) => r.userType === 'brand')?._count || 0,
        owners: brandOwnerRatio.find((r: any) => r.userType === 'owner')?._count || 0,
        admins: brandOwnerRatio.find((r: any) => r.userType === 'admin')?._count || 0
      },
      inquiriesByStatus: (() => {
        const statusCounts: Record<string, number> = {}
        inquiryCreation.forEach((item: any) => {
          const status = item.status || 'pending'
          statusCounts[status] = (statusCounts[status] || 0) + 1
        })
        return statusCounts
      })()
    }

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

