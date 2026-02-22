/**
 * POST /api/revenue/predict
 * Revenue projection for a location (DB or on-the-fly params)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { estimateMonthlyRevenue } from '@/lib/location-intelligence/scoring'

type RevenuePredictRequest = {
  locationId?: string
  footfall?: number
  captureRate?: number
  avgTicketSize?: number
  lat?: number
  lng?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevenuePredictRequest
    const {
      locationId,
      footfall: inputFootfall,
      captureRate = 2,
      avgTicketSize = 200,
    } = body

    let footfall = typeof inputFootfall === 'number' ? inputFootfall : undefined

    if (locationId) {
      const prisma = await getPrisma()
      if (!prisma) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
      }

      const location = await prisma.location.findUnique({
        where: { id: locationId },
        include: { mobility: true, scores: { take: 1, orderBy: { lastUpdated: 'desc' } } },
      })

      if (!location) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 })
      }

      footfall = location.mobility?.avgDailyFootfall ?? 2000

      const rev = estimateMonthlyRevenue(footfall, captureRate, avgTicketSize)
      const scoresRow = location.scores?.[0]

      return NextResponse.json({
        success: true,
        locationId,
        footfall,
        captureRate,
        avgTicketSize,
        monthlyRevenueProjection: rev,
        revenueProjectionFromScores: scoresRow?.revenueProjectionMid
          ? Number(scoresRow.revenueProjectionMid)
          : null,
      })
    }

    if (typeof footfall !== 'number' || footfall <= 0) {
      return NextResponse.json(
        { error: 'locationId or footfall is required' },
        { status: 400 }
      )
    }

    const rev = estimateMonthlyRevenue(footfall, captureRate, avgTicketSize)

    return NextResponse.json({
      success: true,
      footfall,
      captureRate,
      avgTicketSize,
      monthlyRevenueProjection: rev,
    })
  } catch (error: any) {
    console.error('[Revenue Predict API] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to predict revenue' },
      { status: 500 }
    )
  }
}
