import { NextRequest, NextResponse } from 'next/server'
import { sendVisitScheduleWebhook } from '@/lib/pabbly-webhook'

/**
 * Schedule a visit placeholder.
 * Expects: { propertyId, dateTime, note, name, email, phone, company }
 * TODO:
 *  - Persist to DB (brand requirements / visit requests)
 *  - Integrate Cashfree payment link/session
 *  - Send notifications to user and admin (email/WhatsApp)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, dateTime, note, name, email, phone, company } = body

    if (!propertyId || !dateTime || !name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'propertyId, dateTime, name, email, and phone are required' },
        { status: 400 }
      )
    }

    // Placeholder persistence: store in-memory log (replace with DB)
    console.log('[Visit Schedule]', { propertyId, dateTime, note, name, email, phone, company })

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

    // TODO: Create brand requirement record in DB here
    // TODO: Create Cashfree payment link/session and return URL to frontend
    // TODO: Send email/WhatsApp notifications to user and admin

    return NextResponse.json({
      success: true,
      message: 'Visit scheduled (placeholder). Payment & notifications pending integration.',
      paymentUrl: null
    })
  } catch (error: any) {
    console.error('Error scheduling visit:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule visit' },
      { status: 500 }
    )
  }
}

