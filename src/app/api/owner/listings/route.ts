import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser } from '@/lib/owner-api-server'

type ListingRow = {
  id: string
  title: string
  locality: string | null
  city: string
  address: string
  property_type: string
  size: number
  price: unknown
  price_type: string
  is_available: boolean
  description: string | null
  amenities: unknown
  images: unknown
  map_link: string | null
  approval_status: string
  views_30d: number
  lead_count: number
  visit_count: number
}

function isSiteVisitsMissingError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  const code = (e as { code?: string })?.code
  return (
    code === '42P01' ||
    /site_visits/i.test(msg) ||
    /does not exist/i.test(msg)
  )
}

async function queryListings(
  prisma: NonNullable<Awaited<ReturnType<typeof getPrisma>>>,
  ownerId: string,
  since: Date,
  topN: number | null,
  includeSiteVisits: boolean
): Promise<ListingRow[]> {
  if (!includeSiteVisits) {
    if (topN) {
      return prisma.$queryRaw<ListingRow[]>`
        SELECT
          p.id,
          p.title,
          p.locality,
          p.city,
          p.address,
          p.property_type::text AS property_type,
          p.size,
          p.price,
          p.price_type::text AS price_type,
          COALESCE(p.is_available, true) AS is_available,
          p.description,
          p.amenities,
          p.images,
          p.map_link,
          p.status::text AS approval_status,
          (
            SELECT COUNT(*)::int
            FROM property_views pv
            WHERE pv.property_id = p.id
              AND pv.viewed_at IS NOT NULL
              AND pv.viewed_at >= ${since}
          ) AS views_30d,
          (SELECT COUNT(*)::int FROM inquiries i WHERE i.property_id = p.id) AS lead_count,
          0::int AS visit_count
        FROM properties p
        WHERE p.owner_id = ${ownerId}
        ORDER BY views_30d DESC, p.updated_at DESC NULLS LAST
        LIMIT ${topN}
      `
    }
    return prisma.$queryRaw<ListingRow[]>`
      SELECT
        p.id,
        p.title,
        p.locality,
        p.city,
        p.address,
        p.property_type::text AS property_type,
        p.size,
        p.price,
        p.price_type::text AS price_type,
        COALESCE(p.is_available, true) AS is_available,
        p.description,
        p.amenities,
        p.images,
        p.map_link,
        p.status::text AS approval_status,
        (
          SELECT COUNT(*)::int
          FROM property_views pv
          WHERE pv.property_id = p.id
            AND pv.viewed_at IS NOT NULL
            AND pv.viewed_at >= ${since}
        ) AS views_30d,
        (SELECT COUNT(*)::int FROM inquiries i WHERE i.property_id = p.id) AS lead_count,
        0::int AS visit_count
      FROM properties p
      WHERE p.owner_id = ${ownerId}
      ORDER BY views_30d DESC, p.updated_at DESC NULLS LAST
    `
  }

  if (topN) {
    return prisma.$queryRaw<ListingRow[]>`
      SELECT
        p.id,
        p.title,
        p.locality,
        p.city,
        p.address,
        p.property_type::text AS property_type,
        p.size,
        p.price,
        p.price_type::text AS price_type,
        COALESCE(p.is_available, true) AS is_available,
        p.description,
        p.amenities,
        p.images,
        p.map_link,
        p.status::text AS approval_status,
        (
          SELECT COUNT(*)::int
          FROM property_views pv
          WHERE pv.property_id = p.id
            AND pv.viewed_at IS NOT NULL
            AND pv.viewed_at >= ${since}
        ) AS views_30d,
        (SELECT COUNT(*)::int FROM inquiries i WHERE i.property_id = p.id) AS lead_count,
        (SELECT COUNT(*)::int FROM site_visits sv WHERE sv.property_id = p.id) AS visit_count
      FROM properties p
      WHERE p.owner_id = ${ownerId}
      ORDER BY views_30d DESC, p.updated_at DESC NULLS LAST
      LIMIT ${topN}
    `
  }
  return prisma.$queryRaw<ListingRow[]>`
    SELECT
      p.id,
      p.title,
      p.locality,
      p.city,
      p.address,
      p.property_type::text AS property_type,
      p.size,
      p.price,
      p.price_type::text AS price_type,
      COALESCE(p.is_available, true) AS is_available,
      p.description,
      p.amenities,
      p.images,
      p.map_link,
      p.status::text AS approval_status,
      (
        SELECT COUNT(*)::int
        FROM property_views pv
        WHERE pv.property_id = p.id
          AND pv.viewed_at IS NOT NULL
          AND pv.viewed_at >= ${since}
      ) AS views_30d,
      (SELECT COUNT(*)::int FROM inquiries i WHERE i.property_id = p.id) AS lead_count,
      (SELECT COUNT(*)::int FROM site_visits sv WHERE sv.property_id = p.id) AS visit_count
    FROM properties p
    WHERE p.owner_id = ${ownerId}
    ORDER BY views_30d DESC, p.updated_at DESC NULLS LAST
  `
}

export async function GET(request: NextRequest) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const top = request.nextUrl.searchParams.get('top')
  const topN = top ? Math.min(50, Math.max(1, parseInt(top, 10) || 0)) : null
  const since = new Date()
  since.setDate(since.getDate() - 30)

  try {
    let safeRows: ListingRow[]
    try {
      safeRows = await queryListings(prisma, user.id, since, topN, true)
    } catch (e) {
      if (isSiteVisitsMissingError(e)) {
        safeRows = await queryListings(prisma, user.id, since, topN, false)
      } else {
        throw e
      }
    }

    const maxViews = safeRows.reduce((m, r) => Math.max(m, r.views_30d || 0), 0)

    const listings = safeRows.map((r) => ({
      id: r.id,
      title: r.title,
      locality: r.locality || r.city,
      city: r.city,
      address: r.address,
      propertyType: r.property_type,
      size: r.size,
      price: String(r.price),
      priceType: r.price_type,
      isAvailable: r.is_available,
      description: r.description,
      amenities: r.amenities,
      images: r.images,
      mapLink: r.map_link,
      approvalStatus: r.approval_status,
      views30d: r.views_30d,
      leadCount: r.lead_count,
      visitCount: r.visit_count,
      viewsBarMax: maxViews,
    }))

    return NextResponse.json({ listings })
  } catch (e: any) {
    console.error('[owner/listings GET]', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to load listings' },
      { status: 500 }
    )
  }
}
