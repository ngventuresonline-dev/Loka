import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser } from '@/lib/owner-api-server'

export async function GET(request: NextRequest) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  try {
    const visits = await prisma.siteVisit.findMany({
      where: { ownerId: user.id },
      orderBy: { scheduledAt: 'desc' },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            brandProfiles: { select: { company_name: true } },
          },
        },
        property: { select: { id: true, title: true } },
      },
    })

    const payload = visits.map((v) => ({
      id: v.id,
      status: v.status,
      outcome: v.outcome,
      notes: v.notes,
      scheduledAt: v.scheduledAt.toISOString(),
      brandId: v.brandId,
      brandName:
        v.brand.brandProfiles?.company_name?.trim() || v.brand.name || 'Brand',
      propertyId: v.propertyId,
      propertyTitle: v.property.title,
    }))

    return NextResponse.json({ visits: payload })
  } catch (e: any) {
    console.error('[owner/visits GET]', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to load visits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  let body: {
    propertyId?: string
    brandId?: string
    scheduledAt?: string
    notes?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.propertyId || !body.brandId || !body.scheduledAt) {
    return NextResponse.json(
      { error: 'propertyId, brandId, and scheduledAt are required' },
      { status: 400 }
    )
  }

  const scheduledAt = new Date(body.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduledAt' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const property = await prisma.property.findUnique({
    where: { id: body.propertyId },
    select: { ownerId: true },
  })
  if (!property || property.ownerId !== user.id) {
    return NextResponse.json({ error: 'Invalid property' }, { status: 403 })
  }

  const brand = await prisma.user.findUnique({
    where: { id: body.brandId },
    select: { id: true, userType: true },
  })
  if (!brand || brand.userType !== 'brand') {
    return NextResponse.json({ error: 'Invalid brand' }, { status: 400 })
  }

  try {
    const visit = await prisma.siteVisit.create({
      data: {
        ownerId: user.id,
        brandId: body.brandId,
        propertyId: body.propertyId,
        scheduledAt,
        status: 'scheduled',
        notes: body.notes?.trim() || null,
      },
      select: { id: true },
    })
    return NextResponse.json({ success: true, id: visit.id })
  } catch (e: any) {
    console.error('[owner/visits POST]', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to create visit' },
      { status: 500 }
    )
  }
}
