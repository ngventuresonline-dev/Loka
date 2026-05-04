import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { VISIT_SCHEDULE, VISIT_SCHEDULE_IST_DATE } from '@/app/how-it-works/hyderabad/visit-schedule-data'

export const dynamic = 'force-dynamic'

function istDayBounds(isoDate: string): { start: Date; end: Date } {
  const start = new Date(`${isoDate}T00:00:00+05:30`)
  const end = new Date(`${isoDate}T23:59:59.999+05:30`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid visit date')
  }
  return { start, end }
}

export async function GET() {
  const byRowId: Record<string, { confirmed: boolean; confirmedAt: string | null }> = {}
  for (const row of VISIT_SCHEDULE) {
    byRowId[row.rowId] = { confirmed: false, confirmedAt: null }
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ byRowId, day: VISIT_SCHEDULE_IST_DATE })
  }

  let start: Date
  let end: Date
  try {
    ;({ start, end } = istDayBounds(VISIT_SCHEDULE_IST_DATE))
  } catch {
    return NextResponse.json({ byRowId, day: VISIT_SCHEDULE_IST_DATE })
  }

  try {
    for (const row of VISIT_SCHEDULE) {
      if (!row.propertyId) continue
      const v = await prisma.siteVisit.findFirst({
        where: {
          propertyId: row.propertyId,
          scheduledAt: { gte: start, lte: end },
        },
        select: {
          visitConfirmedByBrand: true,
          brandConfirmedAt: true,
        },
      })
      if (v) {
        byRowId[row.rowId] = {
          confirmed: v.visitConfirmedByBrand,
          confirmedAt: v.brandConfirmedAt?.toISOString() ?? null,
        }
      }
    }
  } catch (e) {
    console.error('[hyderabad/site-visit-brand-status GET]', e)
  }

  return NextResponse.json({ byRowId, day: VISIT_SCHEDULE_IST_DATE })
}

export async function POST(request: NextRequest) {
  let body: { rowId?: string; confirmed?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rowId = String(body.rowId ?? '').trim()
  const confirmed = Boolean(body.confirmed)
  const row = VISIT_SCHEDULE.find((r) => r.rowId === rowId)
  if (!row) {
    return NextResponse.json({ error: 'Unknown row' }, { status: 400 })
  }
  if (!row.propertyId) {
    return NextResponse.json(
      {
        error:
          'No property_id for this row. Set NEXT_PUBLIC_KIND_HYD_P1_PROPERTY_ID (and P2, P3, P5, P6) to UUIDs that match your site_visits rows.',
      },
      { status: 400 }
    )
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  let start: Date
  let end: Date
  try {
    ;({ start, end } = istDayBounds(VISIT_SCHEDULE_IST_DATE))
  } catch {
    return NextResponse.json({ error: 'Invalid visit schedule date' }, { status: 500 })
  }

  try {
    const visit = await prisma.siteVisit.findFirst({
      where: {
        propertyId: row.propertyId,
        scheduledAt: { gte: start, lte: end },
      },
      select: { id: true },
    })
    if (!visit) {
      return NextResponse.json(
        { error: 'No matching site visit for this property and schedule date' },
        { status: 422 }
      )
    }

    const updated = await prisma.siteVisit.update({
      where: { id: visit.id },
      data: {
        visitConfirmedByBrand: confirmed,
        brandConfirmedAt: confirmed ? new Date() : null,
      },
      select: {
        visitConfirmedByBrand: true,
        brandConfirmedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      confirmed: updated.visitConfirmedByBrand,
      brandConfirmedAt: updated.brandConfirmedAt?.toISOString() ?? null,
    })
  } catch (e) {
    console.error('[hyderabad/site-visit-brand-status POST]', e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
