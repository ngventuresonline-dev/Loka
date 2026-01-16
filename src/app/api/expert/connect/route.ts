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

    // Verify property exists (quick check, allow to fail gracefully)
    let propertyExists = true
    try {
      const property = await Promise.race([
        prisma.property.findUnique({
          where: { id: propertyId },
          select: { id: true }
        }),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Property check timeout')), 5000)
        )
      ])
      
      if (!property) {
        propertyExists = false
      }
    } catch (error: any) {
      // If property check times out or fails, continue anyway (non-blocking)
      // We'll still create the expert request to avoid losing the lead
      console.warn('[Expert Connect] Property verification skipped (non-blocking):', error.message)
      propertyExists = true
    }

    if (!propertyExists) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    // Create expert request record (with timeout protection)
    // If database save fails, we still return success - webhook will capture the lead
    let expertRequestId = `temp-${Date.now()}`
    try {
      const expertRequest = await Promise.race([
        prisma.expertRequest.create({
          data: {
            propertyId,
            brandName,
            email: email || null,
            phone,
            scheduleDateTime: new Date(scheduleDateTime),
            notes,
            status: 'pending'
          }
        }),
        new Promise<{ id: string }>((_, reject) => 
          setTimeout(() => reject(new Error('Database create timeout')), 10000)
        )
      ])
      
      expertRequestId = expertRequest.id
      console.log('[Expert Connect] Request created:', expertRequestId)
    } catch (error: any) {
      // If database creation fails, log but continue - webhook will still capture the lead
      console.warn('[Expert Connect] Database save failed (non-critical):', error.message)
      console.warn('[Expert Connect] Webhook will handle lead capture as fallback')
    }

    // Always send webhook to Pabbly (non-blocking, already async)
    // This ensures we capture the lead even if database save failed
    sendExpertConnectWebhook({
      propertyId,
      brandName,
      email,
      phone,
      scheduleDateTime,
      notes,
    }).catch(err => console.warn('[Expert Connect] Failed to send webhook:', err))

    // TODO: Send email/WhatsApp notifications to user and expert team
    // TODO: Assign expert based on property location/business type

    // Always return success - webhook will handle lead capture even if DB fails
    return NextResponse.json({
      success: true,
      message: 'Successfully submitted. We will connect soon.',
      requestId: expertRequestId
    })
  } catch (error: any) {
    console.error('[Expert Connect] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to connect with expert' },
      { status: 500 }
    )
  }
}

