import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-security'
import { computeAdminMatches, groupMatchesByBrand, type AdminMatchRow } from '@/lib/admin-matches-compute'
import { sendBrandMatchDigestEmail } from '@/lib/email-service'

const MAX_BRANDS_PER_REQUEST = 30

export async function POST(request: NextRequest) {
  const security = await requireAdminAuth(request, { checkRateLimit: true })
  if (!security.authorized) {
    return NextResponse.json(
      { error: security.error || 'Unauthorized' },
      { status: security.statusCode || 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      brandIds,
      minScore = 30,
      brandName = '',
      propertyType = '',
      location = '',
      propertyId = '',
      note = '',
    } = body as {
      brandIds?: string[]
      minScore?: number
      brandName?: string
      propertyType?: string
      location?: string
      propertyId?: string
      note?: string
    }

    if (!Array.isArray(brandIds) || brandIds.length === 0) {
      return NextResponse.json({ error: 'brandIds array is required' }, { status: 400 })
    }

    const uniqueIds = [...new Set(brandIds.map(String).filter(Boolean))]
    if (uniqueIds.length > MAX_BRANDS_PER_REQUEST) {
      return NextResponse.json(
        { error: `At most ${MAX_BRANDS_PER_REQUEST} brands per request` },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const allMatches = await computeAdminMatches(prisma, {
      minScore,
      brandIds: uniqueIds,
      propertyId: propertyId || null,
      propertyType: propertyType || null,
      location: location || null,
      brandName: brandName || null,
    })

    const grouped = groupMatchesByBrand(allMatches)
    const results: { brandId: string; email: string; ok: boolean; error?: string }[] = []

    for (const id of uniqueIds) {
      const group = grouped[id]
      if (!group) {
        results.push({
          brandId: id,
          email: '',
          ok: false,
          error: 'No matches for this brand with current filters',
        })
        continue
      }

      const to = group.brand.email?.trim()
      if (!to) {
        results.push({ brandId: id, email: '', ok: false, error: 'Brand has no email on file' })
        continue
      }

      const matchesForEmail: AdminMatchRow[] = [...group.matches].sort(
        (a, b) => (b.bfiScore ?? b.pfiScore) - (a.bfiScore ?? a.pfiScore)
      )

      const sendResult = await sendBrandMatchDigestEmail({
        to,
        brandName: group.brand.name,
        matches: matchesForEmail,
        adminNote: typeof note === 'string' ? note.trim() : '',
      })

      results.push({
        brandId: id,
        email: to,
        ok: sendResult.success,
        error: sendResult.error,
      })
    }

    await logAdminAction(request, 'admin.matches.email_bulk', {
      brandCount: uniqueIds.length,
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    })

    return NextResponse.json({
      ok: true,
      results,
      message: process.env.RESEND_API_KEY
        ? undefined
        : 'Emails logged only until RESEND_API_KEY is set (see EMAIL_FROM in env).',
    })
  } catch (error: any) {
    console.error('[Admin Matches Email] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    )
  }
}
