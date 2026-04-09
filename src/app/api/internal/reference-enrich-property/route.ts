import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { runPropertyReferenceEnrichment } from '@/lib/enrichment/property-reference-enrichment'

export const maxDuration = 120

/**
 * Internal: DB-only reference enrichment for one property (pocket + locality_intel).
 * Auth: same ADMIN_SECRET bearer as warm-intel-cache.
 * Optional body: { propertyId, geocodeIfMissing?: boolean }
 */
export async function POST(request: NextRequest) {
  const secret = (process.env.ADMIN_SECRET || 'lokazen-admin-secret').trim()
  const expected = `Bearer ${secret}`
  if (request.headers.get('authorization')?.trim() !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    propertyId?: string
    geocodeIfMissing?: boolean
  }
  const propertyId = body.propertyId?.trim()
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  }

  const result = await runPropertyReferenceEnrichment(prisma, propertyId, {
    geocodeIfMissing: body.geocodeIfMissing === true,
  })

  return NextResponse.json(result)
}
