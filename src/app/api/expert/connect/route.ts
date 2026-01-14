import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { sendExpertConnectWebhook } from '@/lib/pabbly-webhook'

/**
 * Connect with expert - saves expert requests to database.
 * Expects: { propertyId, brandName, email (optional), phone, scheduleDateTime, notes }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, brandName, email, phone, scheduleDateTime, notes } = body

    if (!propertyId || !brandName || !phone || !scheduleDateTime || !notes) {
      return NextResponse.json(
        { success: false, error: 'propertyId, brandName, phone, scheduleDateTime, and notes are required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      console.error('[Expert Connect] Prisma client not available')
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true }
    })

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    // Create expert request record
    const expertRequest = await prisma.expertRequest.create({
      data: {
        propertyId,
        brandName,
        email: email || null,
        phone,
        scheduleDateTime: new Date(scheduleDateTime),
        notes,
        status: 'pending'
      }
    })

    console.log('[Expert Connect] Request created:', expertRequest.id)

    // TODO: Send email/WhatsApp notifications to user and expert team
    // TODO: Assign expert based on property location/business type

    // Send webhook to Pabbly
    sendExpertConnectWebhook({
      propertyId,
      brandName,
      email,
      phone,
      scheduleDateTime,
      notes,
      requestId: expertRequest.id
    }).catch(err => console.warn('[Expert Connect] Failed to send webhook:', err))

    return NextResponse.json({
      success: true,
      message: 'Expert connection request submitted. Our team will reach out within 24 hours.',
      requestId: expertRequest.id
    })
  } catch (error: any) {
    console.error('[Expert Connect] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to connect with expert' },
      { status: 500 }
    )
  }
}

