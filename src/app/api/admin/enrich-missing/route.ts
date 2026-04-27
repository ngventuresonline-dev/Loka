import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export const maxDuration = 300

/**
 * POST /api/admin/enrich-missing
 * Finds all approved properties that have no entry (or no coordinates) in
 * property_location_cache and triggers warm-intel-cache (locationOnly) for each.
 *
 * Body: { dryRun?: boolean, limit?: number }
 * Auth: Bearer <ADMIN_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = (process.env.ADMIN_SECRET ?? '').trim()
  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization')?.trim() !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    dryRun?: boolean
    limit?: number
  }
  const dryRun = body.dryRun === true
  const limit = Math.min(Number(body.limit ?? 50), 100)

  const prisma = await getPrisma()
  if (!prisma) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Find approved properties with no lat/lng in property_location_cache
  const missing = await prisma.$queryRaw<Array<{ id: string; title: string; address: string }>>`
    SELECT p.id, p.title, p.address
    FROM properties p
    LEFT JOIN property_location_cache plc ON plc.property_id = p.id
    WHERE p.status = 'approved'
      AND p.is_available = true
      AND (plc.id IS NULL OR plc.lat IS NULL OR plc.lng IS NULL)
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `.catch(() => [] as Array<{ id: string; title: string; address: string }>)

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      missingCount: missing.length,
      properties: missing.map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })),
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const warmUrl = `${baseUrl}/api/admin/warm-intel-cache`
  const authHeader = `Bearer ${secret}`

  const results = {
    triggered: 0,
    skipped: 0,
    errors: 0,
    propertyIds: [] as string[],
    messages: [] as string[],
  }

  for (const prop of missing) {
    try {
      const res = await fetch(warmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          propertyId: prop.id,
          locationOnly: true,
          forceRefresh: false,
        }),
        signal: AbortSignal.timeout(25_000),
      })

      if (res.ok) {
        results.triggered++
        results.propertyIds.push(prop.id)
      } else {
        results.errors++
        results.messages.push(`${prop.id}: HTTP ${res.status}`)
      }
    } catch (e) {
      results.errors++
      results.messages.push(`${prop.id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }

    // Rate-limit to avoid hammering Google Places API
    await new Promise((r) => setTimeout(r, 500))
  }

  return NextResponse.json({
    missingFound: missing.length,
    ...results,
  })
}

/**
 * GET /api/admin/enrich-missing
 * Returns a count + list of properties missing from property_location_cache.
 */
export async function GET(request: NextRequest) {
  const secret = (process.env.ADMIN_SECRET ?? '').trim()
  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization')?.trim() !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = await getPrisma()
  if (!prisma) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const [missing, total] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; title: string; address: string; city: string }>>`
      SELECT p.id, p.title, p.address, p.city
      FROM properties p
      LEFT JOIN property_location_cache plc ON plc.property_id = p.id
      WHERE p.status = 'approved'
        AND p.is_available = true
        AND (plc.id IS NULL OR plc.lat IS NULL OR plc.lng IS NULL)
      ORDER BY p.created_at DESC
      LIMIT 200
    `.catch(() => [] as Array<{ id: string; title: string; address: string; city: string }>),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM properties WHERE status = 'approved' AND is_available = true
    `.then((r: Array<{ count: bigint }>) => Number(r[0]?.count ?? 0)).catch(() => 0),
  ])

  return NextResponse.json({
    totalApproved: total,
    missingLocationCache: missing.length,
    properties: missing,
  })
}
