import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser } from '@/lib/owner-api-server'

const VISIT_STATUSES = new Set(['scheduled', 'completed', 'cancelled', 'no_show'])

const OUTCOMES = new Set([
  'Interested',
  'Not Interested',
  'Follow Up',
  'Offer Made',
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const { id: visitId } = await params
  let body: { status?: string; outcome?: string | null; notes?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const visit = await prisma.siteVisit.findFirst({
    where: { id: visitId, ownerId: user.id },
  })

  if (!visit) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data: { status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'; outcome?: string | null; notes?: string | null } =
    {}

  if (body.status !== undefined) {
    if (!VISIT_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid visit status' }, { status: 400 })
    }
    data.status = body.status as 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  }

  if (body.outcome !== undefined) {
    if (body.outcome === null || body.outcome === '') {
      data.outcome = null
    } else if (OUTCOMES.has(body.outcome)) {
      data.outcome = body.outcome
    } else {
      return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 })
    }
  }

  if (body.notes !== undefined) {
    data.notes = body.notes
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updates' }, { status: 400 })
  }

  try {
    const updated = await prisma.siteVisit.update({
      where: { id: visitId },
      data,
      select: {
        id: true,
        status: true,
        outcome: true,
        notes: true,
        scheduledAt: true,
      },
    })
    return NextResponse.json({
      success: true,
      visit: {
        ...updated,
        scheduledAt: updated.scheduledAt.toISOString(),
      },
    })
  } catch (e: any) {
    console.error('[owner/visits PATCH]', e)
    return NextResponse.json(
      { error: e?.message || 'Update failed' },
      { status: 500 }
    )
  }
}
