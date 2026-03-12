import { NextRequest, NextResponse } from 'next/server'
import { sendVisitScheduleWebhook } from '@/lib/pabbly-webhook'
import { getPrisma } from '@/lib/get-prisma'
import { createVisitCalendarEvent } from '@/lib/google-calendar'

/**
 * Schedule a visit (no payment) and notify N&G.
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
            notes: note || `Visit scheduled for property ${propertyId}.`,
            status: 'pending',
          },
        })
      } catch (dbErr) {
        console.warn('[Visit Schedule] DB create failed:', dbErr)
      }
    }

    // Create Google Calendar event (non-blocking for user flow)
    createVisitCalendarEvent({
      propertyId,
      dateTime,
      name,
      email,
      phone,
      company,
      note,
    }).catch(err => {
      console.warn('[Visit Schedule] Failed to create Google Calendar event:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Visit scheduled and N&G notified.',
    })
  } catch (error: any) {
    console.error('Error scheduling visit:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule visit' },
      { status: 500 }
    )
  }
}

