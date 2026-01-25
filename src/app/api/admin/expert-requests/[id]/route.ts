import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-security'
import { getPrisma } from '@/lib/get-prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const securityCheck = await requireAdminAuth(request, {
      checkRateLimit: true
    })

    if (!securityCheck.authorized) {
      await logAdminAction(request, 'UNAUTHORIZED_EXPERT_REQUEST_UPDATE_ATTEMPT', {
        error: securityCheck.error
      })
      
      return NextResponse.json(
        { error: securityCheck.error || 'Admin authentication required' },
        { status: securityCheck.statusCode || 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'contacted', 'scheduled', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, contacted, scheduled, completed, cancelled' },
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

    const expertRequest = await prisma.expertRequest.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true
          }
        }
      }
    })

    await logAdminAction(request, 'ADMIN_EXPERT_REQUEST_STATUS_UPDATED', {
      expertRequestId: id,
      newStatus: status
    })

    return NextResponse.json({
      success: true,
      expertRequest: {
        id: expertRequest.id,
        propertyId: expertRequest.propertyId,
        property: expertRequest.property,
        brandName: expertRequest.brandName,
        email: expertRequest.email,
        phone: expertRequest.phone,
        scheduleDateTime: expertRequest.scheduleDateTime,
        notes: expertRequest.notes,
        status: expertRequest.status,
        createdAt: expertRequest.createdAt,
        updatedAt: expertRequest.updatedAt
      }
    })
  } catch (error: any) {
    console.error('[Admin Expert Request Update] Error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Expert request not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update expert request' },
      { status: 500 }
    )
  }
}
