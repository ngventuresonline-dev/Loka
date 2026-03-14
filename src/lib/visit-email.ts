/**
 * Visit notification email to N&G (ngventuresonline@gmail.com)
 * Uses Resend - set RESEND_API_KEY and RESEND_FROM in env.
 */

import { Resend } from 'resend'

const N_G_EMAIL = 'ngventuresonline@gmail.com'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key?.trim()) return null
  return new Resend(key)
}

function getFrom() {
  return process.env.RESEND_FROM || 'Lokazen <noreply@lokazen.in>'
}

export async function sendNgVisitNotification(params: {
  brandName: string
  brandEmail: string
  brandPhone: string
  company?: string | null
  dateTime: string
  propertyTitle?: string
  propertyId: string
  notes?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const { brandName, brandEmail, brandPhone, company, dateTime, propertyTitle, propertyId, notes } =
    params
  const resend = getResend()
  if (!resend) {
    console.warn('[Visit Email] RESEND_API_KEY not set.')
    return { ok: false, error: 'RESEND_API_KEY not set' }
  }

  const formattedDate = new Date(dateTime).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const propLabel = propertyTitle || `Property ${propertyId}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF5200 0%, #E4002B 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Site Visit Request</h1>
  </div>
  <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">A brand has requested a site visit on Lokazen.</p>
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 6px;"><strong>Brand / Contact:</strong> ${brandName}</p>
      <p style="margin: 0 0 6px;"><strong>Email:</strong> ${brandEmail}</p>
      <p style="margin: 0 0 6px;"><strong>Phone:</strong> ${brandPhone}</p>
      ${company ? `<p style="margin: 0 0 6px;"><strong>Company:</strong> ${company}</p>` : ''}
      <p style="margin: 0 0 6px;"><strong>Property:</strong> ${propLabel} (ID: ${propertyId})</p>
      <p style="margin: 0 0 6px;"><strong>Date &amp; Time:</strong> ${formattedDate}</p>
      ${notes ? `<p style="margin: 8px 0 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
    <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">— Lokazen · N&amp;G Ventures</p>
  </div>
</body>
</html>
  `.trim()

  const subject = `[Lokazen] Site Visit: ${brandName} – ${propLabel}`

  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: N_G_EMAIL,
      subject,
      html,
    })
    if (error) {
      console.error('[Visit Email] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err: any) {
    console.error('[Visit Email] Error:', err)
    return { ok: false, error: err?.message || 'Failed to send' }
  }
}
