import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

/** GET /api/location/:id/scores */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const scores = await prisma.locationScores.findMany({
      where: { locationId: id },
      orderBy: { lastUpdated: 'desc' },
      take: 10,
    })

    return NextResponse.json({ success: true, scores: scores.length ? scores : [] })
  } catch (error: any) {
    console.error('[Location Scores API] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch scores' },
      { status: 500 }
    )
  }
}
