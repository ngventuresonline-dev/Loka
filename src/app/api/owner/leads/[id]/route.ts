import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser, ownerInquiryFilter } from '@/lib/owner-api-server'

const ALLOWED = new Set([
  'pending',
  'responded',
  'closed',
  'contacted',
  'scheduled',
  'completed',
  'cancelled',
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const { id: inquiryId } = await params
  let body: { status?: string; scheduledAt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.status || !ALLOWED.has(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      AND: [ownerInquiryFilter(user.id)],
    },
    include: { property: { select: { ownerId: true } } },
  })

  if (!inquiry || inquiry.property.ownerId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const status = body.status as
      | 'pending'
      | 'responded'
      | 'closed'
      | 'contacted'
      | 'scheduled'
      | 'completed'
      | 'cancelled'

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.inquiry.update({
        where: { id: inquiryId },
        data: { status },
        select: { id: true, status: true },
      })

      let siteVisitId: string | null = null
      if (status === 'scheduled' && body.scheduledAt) {
        const scheduledAt = new Date(body.scheduledAt)
        if (!Number.isNaN(scheduledAt.getTime())) {
          const visit = await tx.siteVisit.create({
            data: {
              ownerId: user.id,
              brandId: inquiry.brandId,
              propertyId: inquiry.propertyId,
              inquiryId: inquiry.id,
              scheduledAt,
              status: 'scheduled',
            },
            select: { id: true },
          })
          siteVisitId = visit.id
        }
      }

      return { updated, siteVisitId }
    })

    return NextResponse.json({
      success: true,
      inquiry: result.updated,
      siteVisitId: result.siteVisitId,
    })
  } catch (e: any) {
    console.error('[owner/leads PATCH]', e)
    return NextResponse.json(
      { error: e?.message || 'Update failed' },
      { status: 500 }
    )
  }
}
