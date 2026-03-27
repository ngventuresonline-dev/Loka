import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { enrichBrandLocationIntel, buildLocationIntelSnapshot } from '@/lib/intelligence/brand-intel-enrich'
import type { BrandContextForIntel, PropertyContextForIntel, MatchContextForIntel } from '@/lib/intelligence/brand-intel-enrichment.types'

/** Pro / Enterprise: up to 60s. Keeps synthesis under typical gateway limits when paired with a fast model. */
export const maxDuration = 60

/** Never surface raw upstream payloads or model identifiers to the brand dashboard. */
function publicIntelErrorMessage(raw: string, isTimeout: boolean): string {
  if (isTimeout) {
    return 'Location synthesis timed out. Please try again; if it persists, try another listing or contact support.'
  }
  const t = raw.trim()
  if (
    !t ||
    t.includes('"type":"error"') ||
    /not_found_error/i.test(t) ||
    /^404\s*\{/.test(t) ||
    (t.includes('request_id') && t.includes('{')) ||
    (t.length > 200 && /claude-[a-z0-9-]+/i.test(t))
  ) {
    return 'Location synthesis is temporarily unavailable. Please try again in a moment.'
  }
  if (t.length > 400 || (t.startsWith('{') && t.endsWith('}'))) {
    return 'Location synthesis is temporarily unavailable. Please try again in a moment.'
  }
  return t.length > 320 ? `${t.slice(0, 317)}…` : t
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Location synthesis is not configured on the server.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const brandId = body.brandId as string | undefined
    const rawIntel = body.rawIntel as Record<string, unknown> | undefined
    const brandPayload = body.brand as BrandContextForIntel | undefined
    const propertyPayload = body.property as PropertyContextForIntel | undefined
    const matchPayload = body.match as MatchContextForIntel | undefined

    if (!rawIntel || typeof rawIntel !== 'object') {
      return NextResponse.json({ success: false, error: 'rawIntel object is required' }, { status: 400 })
    }
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

    const intelSnapshot = buildLocationIntelSnapshot(rawIntel, matchPayload ?? null)
    const enrichment = await enrichBrandLocationIntel({
      brand: brandPayload,
      property: propertyPayload,
      intelSnapshot,
    })

    return NextResponse.json({ success: true, data: enrichment })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Intel enrichment failed'
    console.error('[Brand Intel Enrich]', e)
    const errName = e && typeof e === 'object' && 'name' in e ? String((e as { name: string }).name) : ''
    const timeout =
      /timeout|timed out|ETIMEDOUT|abort/i.test(msg) ||
      errName === 'APIConnectionTimeoutError' ||
      errName === 'AbortError'
    return NextResponse.json(
      {
        success: false,
        error: publicIntelErrorMessage(msg, timeout),
      },
      { status: timeout ? 504 : 500 }
    )
  }
}
