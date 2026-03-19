import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { sendContactTeamWebhook } from '@/lib/pabbly-webhook'
import {
  sendDualEmail,
  buildLeadNotificationHtml,
  buildUserConfirmationHtml,
  NG_EMAIL,
} from '@/lib/lead-email'
import { insertGeneralEnquiry } from '@/lib/general-enquiry-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, bestTime, additionalRequirements, searchCriteria } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    await getPrisma() // keep DB alive (non-critical)

    console.log('[Contact Team] Received request:', {
      name,
      phone,
      email: email || '(none)',
      bestTime,
      timestamp: new Date().toISOString(),
    })

    // ── Build lead fields ────────────────────────────────────────────────────
    const fields: [string, string][] = [
      ['Name', name],
      ['Phone / WhatsApp', phone],
    ]
    if (email) fields.push(['Email', email])
    if (bestTime) fields.push(['Best Time to Call', bestTime])
    if (additionalRequirements) fields.push(['Requirements', additionalRequirements])
    if (searchCriteria) {
      const sc = typeof searchCriteria === 'string' ? searchCriteria : JSON.stringify(searchCriteria)
      fields.push(['Search Criteria', sc])
    }

    const teamHtml = buildLeadNotificationHtml({
      subject: `New Contact Request — ${name} · Lokazen`,
      actionType: 'Contact Team Request',
      fields,
      nextStep: `${name} wants to be contacted${bestTime ? ` at ${bestTime}` : ''}. Call or WhatsApp ${phone} to follow up.`,
    })

    const userHtml = buildUserConfirmationHtml({
      contactName: name,
      subheading: 'Request Received',
      headline: 'Our team will call you within 24 hours.',
      summaryFields: fields.filter(([label]) => label !== 'Search Criteria'),
      nextSteps: [
        ['Within 24 hrs', 'A Lokazen expert will call or WhatsApp you to discuss your requirements'],
        ['Property matching', 'We shortlist properties that match your brief and budget'],
        ['Site visits', 'We arrange site visits and guide you through the placement process'],
      ],
    })

    // ── Fire both emails (non-blocking — don't hold up the response) ─────────
    sendDualEmail({
      userEmail: email || null,
      teamSubject: `New Contact Request — ${name} · Lokazen`,
      userSubject: `We received your request — Lokazen will call you within 24 hrs`,
      teamHtml,
      userHtml,
    }).then(({ ngOk, userOk }) => {
      console.log(`[Contact Team] Emails sent — ngOk:${ngOk} userOk:${userOk} name:${name}`)
    }).catch(err => console.error('[Contact Team] Email send error:', err))

    // ── Save to DB (non-blocking) ─────────────────────────────────────────────
    insertGeneralEnquiry({
      source: 'contact-team',
      brandName: name,
      contactName: name,
      email: email || null,
      phone,
      notes: [
        bestTime ? `Best time: ${bestTime}` : '',
        additionalRequirements ? `Requirements: ${additionalRequirements}` : '',
        searchCriteria ? `Search criteria: ${typeof searchCriteria === 'string' ? searchCriteria : JSON.stringify(searchCriteria)}` : '',
      ].filter(Boolean).join('\n') || null,
    }).catch(err => console.error('[Contact Team] DB save error:', err))

    // ── Pabbly webhook (non-blocking) ────────────────────────────────────────
    sendContactTeamWebhook({
      name,
      phone,
      bestTime,
      additionalRequirements,
      searchCriteria,
    }).catch(err => console.warn('[Contact Team] Pabbly webhook failed:', err))

    return NextResponse.json({
      success: true,
      message: 'Thank you! Our team will contact you within 24 hours.',
    })
  } catch (error: any) {
    console.error('[Contact Team] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit request' },
      { status: 500 }
    )
  }
}
