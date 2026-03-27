import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { enrichBrandLocationIntel, buildLocationIntelSnapshot } from '@/lib/intelligence/brand-intel-enrich'
import type {
  BrandContextForIntel,
  PropertyContextForIntel,
  MatchContextForIntel,
} from '@/lib/intelligence/brand-intel-enrichment.types'

export const maxDuration = 45

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Claude is not configured (ANTHROPIC_API_KEY).' },
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
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
