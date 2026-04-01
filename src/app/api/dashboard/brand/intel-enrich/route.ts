import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { toIndustryKey } from '@/lib/intelligence/industry-key'
import type { BrandContextForIntel, PropertyContextForIntel } from '@/lib/intelligence/brand-intel-enrichment.types'

/**
 * Brand dashboard: synthesis is read-only from DB. No live Claude calls.
 * Populated by /api/ai/synthesize (cron) and admin warm-intel-cache (in-process worker).
 */
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const brandId = body.brandId as string | undefined
    const brandPayload = body.brand as BrandContextForIntel | undefined
    const propertyPayload = body.property as (PropertyContextForIntel & { id?: string }) | undefined
    const propertyId =
      (body.propertyId as string | undefined) ||
      (propertyPayload && typeof propertyPayload.id === 'string' ? propertyPayload.id : undefined)

    if (!brandPayload?.name || !propertyPayload?.title) {
      return NextResponse.json(
        { success: false, error: 'brand (with name) and property (with title) are required' },
        { status: 400 }
      )
    }

    if (brandId) {
      const prisma = await getPrisma()
      if (prisma) {
        const exists = await prisma.user.findUnique({ where: { id: brandId }, select: { id: true } }).catch(() => null)
        if (!exists) {
          return NextResponse.json({ success: false, error: 'Invalid brand' }, { status: 404 })
        }
      }
    }

    if (!propertyId) {
      console.warn('[intel-enrich] missing propertyId — returning pending (no live synthesis)')
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: 'Intelligence being prepared',
        },
        { status: 200 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const industryKey = toIndustryKey(brandPayload.industry)

    const rows = await prisma.$queryRaw<Array<{ synthesis: unknown }>>`
      SELECT synthesis
      FROM property_synthesis_cache
      WHERE property_id = ${propertyId}
        AND industry_key = ${industryKey}
        AND (cache_expires_at IS NULL OR cache_expires_at > NOW())
      LIMIT 1
    `

    const syn = rows[0]?.synthesis
    if (syn != null && typeof syn === 'object') {
      return NextResponse.json({ success: true, data: syn, cached: true })
    }

    console.log('[intel-enrich] cache miss (cron will fill)', { propertyId, industryKey })

    return NextResponse.json(
      {
        success: false,
        status: 'pending' as const,
        message: 'Intelligence being prepared',
      },
      { status: 200 }
    )
  } catch (e: unknown) {
    console.error('[Brand Intel Enrich]', e)
    return NextResponse.json(
      { success: false, error: 'Request failed' },
      { status: 500 }
    )
  }
}
