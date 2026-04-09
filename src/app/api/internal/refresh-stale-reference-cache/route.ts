import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { runPropertyReferenceEnrichment } from '@/lib/enrichment/property-reference-enrichment'

export const maxDuration = 300

/**
 * Weekly cron / operator: re-run reference enrichment for expired property_location_cache rows.
 * Auth: ADMIN_SECRET bearer.
 * Body: { limit?: number (default 40, max 200) }
 */
export async function POST(request: NextRequest) {
  const secret = (process.env.ADMIN_SECRET || 'lokazen-admin-secret').trim()
  if (request.headers.get('authorization')?.trim() !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number }
  const limit = Math.min(200, Math.max(1, Math.floor(Number(body.limit) || 40)))

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  }

  const rows = await prisma.$queryRaw<Array<{ property_id: string }>>`
    SELECT property_id FROM property_location_cache
    WHERE cache_expires_at IS NOT NULL AND cache_expires_at < NOW()
    ORDER BY cache_expires_at ASC
    LIMIT ${limit}
  `

  const results: Array<Record<string, unknown>> = []
  for (const r of rows) {
    const res = await runPropertyReferenceEnrichment(prisma, r.property_id, { geocodeIfMissing: false })
    results.push({ ...res, propertyId: r.property_id })
  }

  return NextResponse.json({
    processed: results.length,
    results,
  })
}
