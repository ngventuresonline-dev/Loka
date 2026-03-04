/**
 * POST /api/location-reports/create-pending
 * Creates a pending location report (for payment flow).
 * Body: { location, category, userId? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, category, userId } = body

    if (!location || !category) {
      return NextResponse.json(
        { success: false, error: 'location and category are required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database unavailable' },
        { status: 503 }
      )
    }

    const effectiveUserId = userId || process.env.PHONEPE_GUEST_USER_ID
    if (!effectiveUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID required. Sign in or set PHONEPE_GUEST_USER_ID.' },
        { status: 400 }
      )
    }

    const report = await prisma.location_reports.create({
      data: {
        user_id: effectiveUserId,
        location: String(location).slice(0, 500),
        category: String(category).slice(0, 100),
        is_free: false,
        status: 'pending',
      },
      select: { id: true, location: true, category: true },
    })

    return NextResponse.json({
      success: true,
      reportId: report.id,
      location: report.location,
      category: report.category,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[location-reports create-pending]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create report' },
      { status: 500 }
    )
  }
}
