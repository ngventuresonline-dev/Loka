import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { runPropertySynthesisForIndustry } from '@/lib/intelligence/property-synthesis-worker'
import { INDUSTRY_KEYS, type IndustryKey } from '@/lib/intelligence/industry-key'

export const maxDuration = 300

function isAuthorizedSynthesisRequest(request: NextRequest): boolean {
  const expected = (process.env.ADMIN_SECRET || '').trim()
  if (!expected) return false
  const got = (request.headers.get('authorization')?.trim() ?? '').replace(/^Bearer\s+/i, '')
  return got === expected
}

/**
 * Warms a single property+industry row in property_synthesis_cache; requires ADMIN_SECRET.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorizedSynthesisRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    propertyId?: string
    industryKey?: string
  }

  const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : ''
  const rawKey = typeof body.industryKey === 'string' ? body.industryKey.trim() : ''
  const industryKey = rawKey as IndustryKey

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
  }
  if (!rawKey || !INDUSTRY_KEYS.includes(industryKey)) {
    return NextResponse.json(
      { error: `industryKey must be one of: ${INDUSTRY_KEYS.join(', ')}` },
      { status: 400 }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const r = await runPropertySynthesisForIndustry(prisma, {
    propertyId,
    industryKey,
    forceRefresh: true,
    cacheTtlDays: 3,
  })

  return NextResponse.json({ success: r.status === 'ok' || r.status === 'skipped_fresh', result: r })
}
