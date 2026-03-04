import { NextRequest, NextResponse } from 'next/server'
import { sendVisitScheduleWebhook } from '@/lib/pabbly-webhook'
import { createPayment } from '@/lib/phonepe'
import { getPrisma } from '@/lib/get-prisma'

/**
 * Schedule a visit with PhonePe payment for visit fee.
 * Expects: { propertyId, dateTime, note, name, email, phone, company, userId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, dateTime, note, name, email, phone, company, userId } = body

    if (!propertyId || !dateTime || !name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'propertyId, dateTime, name, email, and phone are required' },
        { status: 400 }
      )
    }

    // Create visit reference id (visit_<propertyId>_<timestamp>)
    const visitRefId = `visit_${propertyId}_${Date.now()}`

    // Send webhook to Pabbly
    sendVisitScheduleWebhook({
      propertyId,
      dateTime,
      note,
      name,
      email,
      phone,
      company,
    }).catch(err => console.warn('[Visit Schedule] Failed to send webhook:', err))

    // Create PhonePe payment for visit fee (₹499)
    const payment = await createPayment({
      flow: 'visit',
      referenceId: visitRefId,
      userId: userId || undefined,
      amountInr: 499,
      meta: { propertyId, dateTime, name, email, phone },
    })

    const prisma = await getPrisma()
    if (prisma) {
      try {
        await prisma.expertRequest.create({
          data: {
            propertyId,
            brandName: name,
            email,
            phone,
            scheduleDateTime: new Date(dateTime),
            notes: note || `Visit for property ${propertyId}. Payment: ${payment.merchantOrderId}`,
            status: 'pending',
          },
        })
      } catch (dbErr) {
        console.warn('[Visit Schedule] DB create failed:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Visit requested. Complete payment to confirm.',
      paymentUrl: payment.redirectUrl,
      merchantOrderId: payment.merchantOrderId,
    })
  } catch (error: any) {
    console.error('Error scheduling visit:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule visit' },
      { status: 500 }
    )
  }
}

