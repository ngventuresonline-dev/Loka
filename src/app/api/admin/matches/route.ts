import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { logQuerySize, estimateJsonSize } from '@/lib/api-cache'
import {
  computeAdminMatches,
  groupMatchesByBrand,
  groupMatchesByProperty,
} from '@/lib/admin-matches-compute'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'brand'
    const brandId = searchParams.get('brandId')
    const propertyId = searchParams.get('propertyId')
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : 30
    const propertyType = searchParams.get('propertyType')
    const location = searchParams.get('location')
    const brandName = searchParams.get('brandName')

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const allMatches = await computeAdminMatches(prisma, {
      minScore,
      brandId,
      propertyId,
      propertyType,
      location,
      brandName,
    })

    if (view === 'property') {
      const groupedByProperty = groupMatchesByProperty(allMatches)
      const responseData = {
        view: 'property',
        matches: Object.values(groupedByProperty),
        total: allMatches.length,
      }
      const responseSize = estimateJsonSize(responseData)
      logQuerySize('/api/admin/matches?view=property', responseSize, allMatches.length)
      return NextResponse.json(responseData)
    }

    const groupedByBrand = groupMatchesByBrand(allMatches)
    const responseData = {
      view: 'brand',
      matches: Object.values(groupedByBrand),
      total: allMatches.length,
    }
    const responseSize = estimateJsonSize(responseData)
    logQuerySize('/api/admin/matches?view=brand', responseSize, allMatches.length)
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('[Admin Matches API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
