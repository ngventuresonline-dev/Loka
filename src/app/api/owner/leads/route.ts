import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser, ownerInquiryFilter } from '@/lib/owner-api-server'
import type { Prisma } from '@prisma/client'

function leadStatusFilter(tab: string): Prisma.InquiryWhereInput {
  switch (tab) {
    case 'pending':
      return { status: 'pending' }
    case 'contacted':
      return { status: { in: ['contacted', 'responded'] } }
    case 'scheduled':
      return { status: 'scheduled' }
    case 'completed':
      return { status: { in: ['completed', 'closed', 'cancelled'] } }
    default:
      return {}
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const filter = request.nextUrl.searchParams.get('status') || 'all'

  const where = ownerInquiryFilter(user.id)
  const statusFilter = leadStatusFilter(filter === 'all' ? '' : filter)

  try {
    const inquiries = await prisma.inquiry.findMany({
      where: { AND: [where, statusFilter] },
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { id: true, title: true, ownerId: true } },
        brand: {
          select: {
            id: true,
            name: true,
            brandProfiles: { select: { company_name: true } },
          },
        },
      },
    })

    const leads = inquiries
      .filter((i) => i.property.ownerId === user.id)
      .map((i) => {
        const brandName =
          i.brand.brandProfiles?.company_name?.trim() || i.brand.name || 'Brand'
        return {
          id: i.id,
          status: i.status,
          message: i.message,
          createdAt: i.createdAt?.toISOString() ?? null,
          brandId: i.brandId,
          brandName,
          propertyId: i.propertyId,
          propertyTitle: i.property.title,
        }
      })

    return NextResponse.json({ leads })
  } catch (e: any) {
    console.error('[owner/leads GET]', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to load leads' },
      { status: 500 }
    )
  }
}
