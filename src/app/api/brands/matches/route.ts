import { NextRequest, NextResponse } from 'next/server'
import { requireUserType, getAuthenticatedUser } from '@/lib/api-auth'
import { findMatchingPropertiesForBrand } from '@/lib/repositories/property-matching-repository'

/**
 * GET /api/brands/matches
 * Get matched properties for the authenticated brand
 * Requires: Brand authentication
 * Returns: Properties with >60% match score
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (must be brand)
    const user = await requireUserType(request, ['brand'])
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only brands can access matches' },
        { status: 401 }
      )
    }

    // Get minimum match score from query params (default: 60)
    const searchParams = request.nextUrl.searchParams
    const minScore = parseInt(searchParams.get('minScore') || '60', 10)

    // Find matching properties
    const matches = await findMatchingPropertiesForBrand(user.id, minScore)

    return NextResponse.json({
      success: true,
      matches,
      totalMatches: matches.length,
      brandId: user.id
    })
  } catch (error: any) {
    console.error('[Brand Matches API] Error:', error)

    // Handle specific errors
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Brand profile not found',
        },
        { status: 404 }
      )
    }

    // Handle authentication errors
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to find matches',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

