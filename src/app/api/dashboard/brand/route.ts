import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

type RawView = {
  id: string
  property_id: string
  viewed_at: Date
  title: string
  address: string
  city: string
  price: number
  price_type: string
  size: number
  property_type: string
  images: unknown
  status: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Fetch brand user + profile
    const user = await prisma.user
      .findUnique({
        where: { id: brandId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          brandProfiles: {
            select: {
              company_name: true,
              industry: true,
              category: true,
              preferred_locations: true,
              budget_min: true,
              budget_max: true,
              min_size: true,
              max_size: true,
            },
          },
        },
      })
      .catch(() => null)

    // Recent property views (last 20)
    const recentViews = await prisma.$queryRaw<RawView[]>`
      SELECT
        pv.id,
        pv.property_id,
        pv.viewed_at,
        p.title,
        p.address,
        p.city,
        p.price,
        p.price_type,
        p.size,
        p.property_type,
        p.images,
        p.status
      FROM property_views pv
      JOIN properties p ON pv.property_id = p.id
      WHERE pv.user_id = ${brandId}
      ORDER BY pv.viewed_at DESC
      LIMIT 20
    `.catch(() => [] as RawView[])

    // Saved properties
    const savedProperties = await prisma.savedProperty
      .findMany({
        where: { userId: brandId },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      .catch(() => [])

    // Inquiries sent
    const inquiries = await prisma.inquiry
      .findMany({
        where: { brandId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              images: true,
              price: true,
              priceType: true,
            },
          },
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      .catch(() => [])

    const totalViews = recentViews.length
    const totalSaved = savedProperties.length
    const totalInquiries = inquiries.length
    const pendingInquiries = inquiries.filter((i) => i.status === 'pending').length

    return NextResponse.json({
      brand: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            companyName: user.brandProfiles?.company_name ?? user.name,
            industry: user.brandProfiles?.industry ?? null,
            preferredLocations: user.brandProfiles?.preferred_locations ?? null,
            budgetMin: user.brandProfiles?.budget_min
              ? Number(user.brandProfiles.budget_min)
              : null,
            budgetMax: user.brandProfiles?.budget_max
              ? Number(user.brandProfiles.budget_max)
              : null,
            minSize: user.brandProfiles?.min_size ?? null,
            maxSize: user.brandProfiles?.max_size ?? null,
          }
        : null,
      stats: { totalViews, totalSaved, totalInquiries, pendingInquiries },
      recentViews: recentViews.map((v) => ({
        id: v.id,
        propertyId: v.property_id,
        viewedAt: v.viewed_at,
        property: {
          title: v.title,
          address: v.address,
          city: v.city,
          price: Number(v.price),
          priceType: v.price_type,
          size: v.size,
          propertyType: v.property_type,
          images: v.images,
          status: v.status,
        },
      })),
      savedProperties: savedProperties.map((sp) => ({
        id: sp.id,
        savedAt: sp.createdAt,
        property: sp.property,
      })),
      inquiries: inquiries.map((i) => ({
        id: i.id,
        message: i.message,
        status: i.status,
        createdAt: i.createdAt,
        property: i.property,
        owner: i.owner,
      })),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch brand dashboard'
    console.error('[Brand Dashboard API] Error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
