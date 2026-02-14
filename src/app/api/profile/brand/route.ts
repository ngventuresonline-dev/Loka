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

    // Fetch recent property views
    const recentViews = await prisma.$queryRaw<Array<{
      id: string
      property_id: string
      viewed_at: Date
      property: any
    }>>`
      SELECT 
        pv.id,
        pv.property_id,
        pv.viewed_at,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'address', p.address,
          'city', p.city,
          'state', p.state,
          'price', p.price,
          'price_type', p.price_type,
          'size', p.size,
          'property_type', p.property_type,
          'images', p.images,
          'status', p.status
        ) as property
      FROM property_views pv
      JOIN properties p ON pv.property_id = p.id
      WHERE pv.user_id = ${userId}
      ORDER BY pv.viewed_at DESC
      LIMIT 20
    `.catch(() => [] as Array<{
      id: string
      property_id: string
      viewed_at: Date
      property: any
    }>)

    // Fetch saved properties
    const savedProperties = await prisma.savedProperty.findMany({
      where: { userId },
      include: {
        property: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }).catch(() => [])

    // Fetch inquiries
    const inquiries = await prisma.inquiry.findMany({
      where: { brandId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            images: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }).catch(() => [])

    // Fetch search filters from brand session
    const brandSession = await prisma.$queryRaw<Array<{
      filter_step: any
    }>>`
      SELECT filter_step
      FROM brand_onboarding_sessions
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 1
    `.catch(() => [] as Array<{ filter_step: any }>)

    return NextResponse.json({
      recentViews: recentViews.map(v => ({
        id: v.id,
        propertyId: v.property_id,
        viewedAt: v.viewed_at,
        property: v.property
      })),
      savedProperties: savedProperties.map(sp => ({
        id: sp.id,
        property: sp.property,
        notes: sp.notes,
        savedAt: sp.createdAt
      })),
      inquiries: inquiries.map(i => ({
        id: i.id,
        property: i.property,
        owner: i.owner,
        message: i.message,
        status: i.status,
        createdAt: i.createdAt
      })),
      searchFilters: brandSession[0]?.filter_step || null
    })
  } catch (error: any) {
    console.error('Brand profile fetch error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch brand profile' },
      { status: 500 }
    )
  }
}
