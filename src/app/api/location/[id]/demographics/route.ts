import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

/** GET /api/location/:id/demographics */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const demographics = await prisma.locationDemographics.findUnique({
      where: { locationId: id },
    })

    if (!demographics) {
      return NextResponse.json({ error: 'Demographics not found for location' }, { status: 404 })
    }

    return NextResponse.json({ success: true, demographics })
  } catch (error: any) {
    console.error('[Location Demographics API] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch demographics' },
      { status: 500 }
    )
  }
}
