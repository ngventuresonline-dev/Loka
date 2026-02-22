import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

/**
 * GET /api/location/:id
 * Full location profile (core + demographics + commercial + mobility + real estate + scores)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        demographics: true,
        commercial: true,
        mobility: true,
        realEstate: true,
        scores: { take: 1, orderBy: { lastUpdated: 'desc' } },
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      location: {
        ...location,
        scores: location.scores?.[0] ?? null,
      },
    })
  } catch (error: any) {
    console.error('[Location API] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch location' },
      { status: 500 }
    )
  }
}
