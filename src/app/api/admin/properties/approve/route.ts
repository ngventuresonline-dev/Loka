import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import { scheduleWarmIntelCacheForProperty } from '@/lib/intelligence/trigger-warm-intel-cache'
import { runPropertyReferenceEnrichment } from '@/lib/enrichment/property-reference-enrichment'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request)
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, action } = body // action: 'approve' | 'reject'

    if (!propertyId || !action) {
      return NextResponse.json(
        { error: 'Property ID and action are required' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Update property status: approve = 'approved', reject = 'rejected'
    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        availability: action === 'approve' ? true : false, // Approved properties are available
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (action === 'approve') {
      try {
        await runPropertyReferenceEnrichment(prisma, propertyId, { geocodeIfMissing: false })
      } catch (e) {
        console.warn('[Admin approve/reject] reference enrichment:', e)
      }
      scheduleWarmIntelCacheForProperty(propertyId, { forceRefresh: false })
    }

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title,
        availability: property.availability,
      },
      message: action === 'approve' 
        ? 'Property approved successfully' 
        : 'Property rejected'
    })
  } catch (error: any) {
    console.error('[Admin approve/reject] Error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update property status' },
      { status: 500 }
    )
  }
}

