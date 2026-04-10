import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser, ownerInquiryFilter } from '@/lib/owner-api-server'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const ownerId = user.id
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const now = new Date()

  const inquiryWhere: Prisma.InquiryWhereInput = ownerInquiryFilter(ownerId)

  try {
    const [totalListings, views30dRow] = await Promise.all([
      prisma.property.count({ where: { ownerId } }),
      prisma.$queryRaw<[{ c: bigint }]>`
        SELECT COUNT(*)::bigint AS c
        FROM property_views pv
        INNER JOIN properties p ON p.id = pv.property_id
        WHERE p.owner_id = ${ownerId}
          AND pv.viewed_at IS NOT NULL
          AND pv.viewed_at >= ${since}
      `,
    ])

    let qualifiedLeads = 0
    try {
      qualifiedLeads = await prisma.inquiry.count({
        where: {
          AND: [
            inquiryWhere,
            { status: { in: ['contacted', 'scheduled', 'completed'] } },
          ],
        },
      })
    } catch {
      try {
        qualifiedLeads = await prisma.inquiry.count({
          where: {
            AND: [inquiryWhere, { status: { in: ['responded', 'closed'] } }],
          },
        })
      } catch {
        qualifiedLeads = 0
      }
    }

    let siteVisitsDone = 0
    type UpcomingVisitRow = {
      id: string
      scheduledAt: Date
      brand: {
        name: string
        brandProfiles: { company_name: string | null } | null
      }
      property: { id: string; title: string }
    }
    let upcomingVisits: UpcomingVisitRow[] = []
    try {
      siteVisitsDone = await prisma.siteVisit.count({
        where: { ownerId, status: 'completed' },
      })
      upcomingVisits = (await prisma.siteVisit.findMany({
        where: {
          ownerId,
          status: 'scheduled',
          scheduledAt: { gt: now },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
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
      })) as UpcomingVisitRow[]
    } catch {
      siteVisitsDone = 0
      upcomingVisits = []
    }

    type StatusGroupRow = { status: string | null; _count: { _all: number } }
    let statusGroups: StatusGroupRow[] = []
    try {
      const rows = await prisma.inquiry.groupBy({
        by: ['status'],
        where: inquiryWhere,
        _count: { _all: true },
      })
      statusGroups = rows as StatusGroupRow[]
    } catch {
      statusGroups = []
    }

    const byStatus = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all])
    ) as Record<string, number>

    const pipeline = {
      pending: byStatus.pending ?? 0,
      contacted: (byStatus.contacted ?? 0) + (byStatus.responded ?? 0),
      scheduled: byStatus.scheduled ?? 0,
      closed:
        (byStatus.completed ?? 0) +
        (byStatus.closed ?? 0) +
        (byStatus.cancelled ?? 0),
    }

    const upcoming = upcomingVisits.map((v) => {
      const brandName =
        v.brand.brandProfiles?.company_name?.trim() || v.brand.name || 'Brand'
      return {
        id: v.id,
        scheduledAt: v.scheduledAt.toISOString(),
        brandName,
        brandInitials:
          brandName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0]?.toUpperCase() ?? '')
            .join('') || 'B',
        propertyTitle: v.property.title,
        propertyId: v.property.id,
      }
    })

    return NextResponse.json({
      totalListings,
      views30d: Number(views30dRow[0]?.c ?? 0),
      qualifiedLeads,
      siteVisitsDone,
      pipeline,
      upcomingVisits: upcoming,
    })
  } catch (e: any) {
    console.error('[owner/summary]', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to load summary' },
      { status: 500 }
    )
  }
}
