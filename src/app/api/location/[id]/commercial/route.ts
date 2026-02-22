import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

/** GET /api/location/:id/commercial */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const commercial = await prisma.locationCommercial.findUnique({
      where: { locationId: id },
    })

    if (!commercial) {
      return NextResponse.json({ error: 'Commercial data not found for location' }, { status: 404 })
    }

    return NextResponse.json({ success: true, commercial })
  } catch (error: any) {
    console.error('[Location Commercial API] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch commercial data' },
      { status: 500 }
    )
  }
}
