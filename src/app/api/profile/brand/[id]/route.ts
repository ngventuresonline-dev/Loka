import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = id

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user with brand profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        brandProfiles: true
      }
    })

    if (!user || user.userType !== 'brand') {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      )
    }

    // Get brand's saved properties
    const savedProperties = await prisma.savedProperty.findMany({
      where: { userId: user.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            priceType: true,
            city: true,
            size: true,
            address: true,
            images: true,
            propertyType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Get brand's inquiries
    const inquiries = await prisma.inquiry.findMany({
      where: { brandId: user.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            address: true,
            images: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Get recent property views - use raw query since property_views uses snake_case
    const recentViewsRaw = await prisma.$queryRaw<Array<{
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
      LIMIT 50
    `.catch(() => [])

    const recentViews = recentViewsRaw.map(view => ({
      id: view.id,
      propertyId: view.property_id,
      viewedAt: view.viewed_at?.toISOString() || new Date().toISOString(),
      property: view.property
    }))

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyName: user.brandProfiles?.companyName || null,
      industry: user.brandProfiles?.industry || null,
      recentViews: recentViews.map(view => ({
        id: view.id,
        propertyId: view.property.id,
        viewedAt: view.viewedAt?.toISOString() || new Date().toISOString(),
        property: view.property
      })),
      savedProperties: savedProperties.map(sp => ({
        id: sp.id,
        property: sp.property,
        notes: sp.notes,
        savedAt: sp.createdAt.toISOString()
      })),
      inquiries: inquiries.map(inq => ({
        id: inq.id,
        property: inq.property,
        owner: inq.owner,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt.toISOString()
      })),
      searchFilters: null // Can be populated from sessions if needed
    })

  } catch (error: any) {
    console.error('[Profile Brand API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch brand profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
