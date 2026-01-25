import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit phone number required' },
        { status: 400 }
      )
    }

    // Search in users table by phone
    const user = await prisma.user.findFirst({
      where: { 
        phone: phone
      },
      include: {
        ownerProfiles: true,
        brandProfiles: true
      }
    })

    if (!user) {
      return NextResponse.json({
        found: false,
        message: 'No account found with this phone number'
      })
    }

    // Determine user type and gather profile data
    const userType = user.userType
    let profileData: any = {}

    if (userType === 'owner') {
      // Get owner's properties
      const properties = await prisma.property.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          city: true,
          size: true,
          createdAt: true,
          images: true,
          address: true,
          propertyType: true
        },
        orderBy: { createdAt: 'desc' }
      })

      profileData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyName: user.ownerProfiles?.companyName || null,
        totalProperties: properties.length,
        properties: properties,
        propertiesByStatus: {
          pending: properties.filter(p => p.status === 'pending').length,
          approved: properties.filter(p => p.status === 'approved').length,
          rejected: properties.filter(p => p.status === 'rejected').length
        }
      }

    } else if (userType === 'brand') {
      // Get brand's saved properties and inquiries
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
        take: 20
      })

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
        take: 20
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
        WHERE pv.user_id = ${user.id}
        ORDER BY pv.viewed_at DESC
        LIMIT 20
      `.catch(() => [])

      const recentViews = recentViewsRaw.map(view => ({
        id: view.id,
        viewedAt: view.viewed_at?.toISOString() || new Date().toISOString(),
        property: view.property
      }))

      profileData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyName: user.brandProfiles?.companyName || null,
        industry: user.brandProfiles?.industry || null,
        savedProperties: savedProperties.map(sp => ({
          id: sp.id,
          savedAt: sp.createdAt.toISOString(),
          notes: sp.notes,
          property: sp.property
        })),
        inquiries: inquiries.map(inq => ({
          id: inq.id,
          message: inq.message,
          status: inq.status,
          createdAt: inq.createdAt.toISOString(),
          property: inq.property,
          owner: inq.owner
        })),
        recentViews: recentViews.map(view => ({
          id: view.id,
          viewedAt: view.viewedAt?.toISOString() || new Date().toISOString(),
          property: view.property
        }))
      }
    }

    return NextResponse.json({
      found: true,
      userId: user.id,
      userType: userType,
      profile: profileData
    })

  } catch (error: any) {
    console.error('[Profile Lookup] Error:', error)
    return NextResponse.json(
      { 
        error: 'Lookup failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
