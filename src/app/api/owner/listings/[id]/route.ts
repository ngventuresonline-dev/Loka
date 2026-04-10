import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser } from '@/lib/owner-api-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const { id: propertyId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const existing = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (existing.ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data: Record<string, unknown> = {}

  if (typeof body.isAvailable === 'boolean') {
    data.availability = body.isAvailable
  }
  if (typeof body.title === 'string') data.title = body.title
  if (typeof body.description === 'string') data.description = body.description
  if (typeof body.address === 'string') data.address = body.address
  if (typeof body.city === 'string') data.city = body.city
  if (typeof body.size === 'number') data.size = body.size
  if (body.price !== undefined) data.price = body.price
  if (typeof body.priceType === 'string') {
    const pt = body.priceType.toLowerCase()
    if (['monthly', 'yearly', 'sqft'].includes(pt)) data.priceType = pt
  }
  if (Array.isArray(body.images)) data.images = body.images
  if (body.amenities !== undefined) data.amenities = body.amenities
  if (typeof body.mapLink === 'string') data.mapLink = body.mapLink

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: data as any,
      select: {
        id: true,
        title: true,
        availability: true,
        images: true,
        updatedAt: true,
      },
    })
    return NextResponse.json({
      success: true,
      property: {
        id: updated.id,
        title: updated.title,
        isAvailable: updated.availability,
        images: updated.images,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (e: any) {
    console.error('[owner/listings PATCH]', e)
    return NextResponse.json(
      { error: e?.message || 'Update failed' },
      { status: 500 }
    )
  }
}
