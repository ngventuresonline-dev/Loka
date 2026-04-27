import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPrisma } from '@/lib/get-prisma'
import { toIndustryKey } from '@/lib/intelligence/industry-key'
import { INTEL_SYNTHESIS_MODEL } from '@/lib/claude'
import type { BrandContextForIntel, PropertyContextForIntel } from '@/lib/intelligence/brand-intel-enrichment.types'

/**
 * Brand dashboard: default path reads synthesis from DB (cron / warm cache).
 * Optional `useSimplePrompt` runs a short live Claude call for on-demand UI (e.g. competitor tab fallback).
 */
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const useSimplePrompt = body.useSimplePrompt === true
    const simplePrompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''

    if (useSimplePrompt && simplePrompt) {
      const bp = body.brand as { industry?: string; companyName?: string; name?: string } | undefined
      const pp = body.property as (PropertyContextForIntel & { id?: string }) | undefined
      if (!pp?.title?.trim()) {
        return NextResponse.json(
          { success: false, error: 'property.title is required for simple prompt' },
          { status: 400 }
        )
      }
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) {
        return NextResponse.json({ success: false, error: 'AI unavailable' }, { status: 503 })
      }
      try {
        const anthropic = new Anthropic({ apiKey: key, timeout: 120_000 })
        const message = await anthropic.messages.create({
          model: INTEL_SYNTHESIS_MODEL,
          max_tokens: 500,
          temperature: 0.35,
          messages: [{ role: 'user', content: simplePrompt }],
        })
        const text = message.content
          .filter((block) => block.type === 'text')
          .map((block) => (block as { type: 'text'; text: string }).text)
          .join('')
          .trim()
        return NextResponse.json({ success: true, narrative: text, data: { narrative: text } })
      } catch (e) {
        console.error('[intel-enrich] simple prompt error', e)
        return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 })
      }
    }

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

    const appBase =
      (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const adminSecret = process.env.ADMIN_SECRET
    if (adminSecret) {
      void fetch(`${appBase}/api/intelligence/synthesize`, {
        method: 'POST',
        body: JSON.stringify({ propertyId, industryKey }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSecret}`,
        },
      }).catch(() => {})
    }

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
