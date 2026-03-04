/**
 * GET /api/location-reports?propertyId=X
 * Returns report_data from location_reports for a property's location.
 * Falls back to live /api/location-intelligence when no stored report exists.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export async function GET(request: NextRequest) {
  try {
    // Legacy location_reports and /api/location-intelligence pipeline has been
    // superseded by the new PropertyIntelligence + /api/intelligence/[propertyId] system.
    // Keep this endpoint as a thin compatibility shim that tells callers to use the new API.

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId is required' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: false,
      error: 'This endpoint is deprecated. Use /api/intelligence/[propertyId] instead.',
      propertyId,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[location-reports] Error:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to fetch report' },
      { status: 500 },
    )
  }
}

// Helper functions from legacy pipeline removed – see /api/intelligence/[propertyId].
