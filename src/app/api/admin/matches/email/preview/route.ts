import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireAdminAuth } from '@/lib/admin-security'
import { computeAdminMatches, groupMatchesByBrand } from '@/lib/admin-matches-compute'
import { buildBrandMatchDigestEmailContent } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  const security = await requireAdminAuth(request)
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
      subjectOverride,
      bodyIntroOverride,
    } = body as {
      brandIds?: string[]
      minScore?: number
      brandName?: string
      propertyType?: string
      location?: string
      propertyId?: string
      note?: string
      subjectOverride?: string
      bodyIntroOverride?: string
    }

    if (!Array.isArray(brandIds) || brandIds.length === 0) {
      return NextResponse.json({ error: 'brandIds array is required' }, { status: 400 })
    }

    const uniqueIds = [...new Set(brandIds.map(String).filter(Boolean))]
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const { rows: allMatches } = await computeAdminMatches(prisma, {
      minScore,
      brandIds: uniqueIds,
      propertyId: propertyId || null,
      propertyType: propertyType || null,
      location: location || null,
      brandName: brandName || null,
    })

    const grouped = groupMatchesByBrand(allMatches)
    const firstId = uniqueIds[0]
    const group = grouped[firstId]

    if (!group) {
      return NextResponse.json({
        subject: '',
        html: '',
        brandName: '',
        matchCount: 0,
        error: 'No matches for selected brand(s) with current filters',
      })
    }

    const matchesForEmail = [...group.matches].sort(
      (a, b) => (b.bfiScore ?? b.pfiScore) - (a.bfiScore ?? a.pfiScore)
    )

    const content = buildBrandMatchDigestEmailContent({
      brandName: group.brand.name,
      matches: matchesForEmail,
      adminNote: typeof note === 'string' ? note.trim() : '',
      subjectOverride: subjectOverride || undefined,
      bodyIntroOverride: bodyIntroOverride || undefined,
    })

    return NextResponse.json({
      subject: content.subject,
      html: content.html,
      brandName: group.brand.name,
      matchCount: matchesForEmail.length,
    })
  } catch (error: any) {
    console.error('[Admin Matches Email Preview] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to build preview' },
      { status: 500 }
    )
  }
}
