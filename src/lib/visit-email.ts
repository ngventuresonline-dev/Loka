/**
 * Visit emails via Resend.
 * - N&G gets an internal alert with all lead details.
 * - Brand gets a friendly confirmation.
 * Set RESEND_API_KEY and RESEND_FROM in env.
 */

import { Resend } from 'resend'

const N_G_EMAIL = 'ngventuresonline@gmail.com'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key?.trim()) return null
  return new Resend(key)
}

function getFrom() {
  return process.env.RESEND_FROM || 'Lokazen <noreply@support.lokazen.in>'
}

export async function sendVisitEmails(params: {
  brandName: string
  brandEmail: string
  brandPhone: string
  company?: string | null
  dateTime: string
  propertyTitle?: string
  propertyId: string
  notes?: string | null
}): Promise<{ ngOk: boolean; brandOk: boolean; error?: string }> {
  const { brandName, brandEmail, brandPhone, company, dateTime, propertyTitle, propertyId, notes } =
    params

  const resend = getResend()
  if (!resend) {
    console.warn('[Visit Email] RESEND_API_KEY not set.')
    return { ngOk: false, brandOk: false, error: 'RESEND_API_KEY not set' }
  }

  const formattedDate = new Date(dateTime).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const propLabel = propertyTitle || `Property ${propertyId}`
  const from = getFrom()

  /* ─── Email 1: Internal alert to N&G ─────────────────────────────── */
  const ngHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF5200 0%, #E4002B 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Site Visit Request</h1>
  </div>
  <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">A brand has requested a site visit on Lokazen.</p>
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF5200;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #111;">Lead Details</p>
      <p style="margin: 0 0 6px;"><strong>Name:</strong> ${brandName}</p>
      <p style="margin: 0 0 6px;"><strong>Email:</strong> <a href="mailto:${brandEmail}" style="color: #FF5200;">${brandEmail}</a></p>
      <p style="margin: 0 0 6px;"><strong>Phone:</strong> <a href="tel:${brandPhone}" style="color: #FF5200;">${brandPhone}</a></p>
      ${company ? `<p style="margin: 0 0 6px;"><strong>Company:</strong> ${company}</p>` : ''}
    </div>
    <div style="background: #fff7ed; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f97316;">
      <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #111;">Visit Details</p>
      <p style="margin: 0 0 6px;"><strong>Property:</strong> ${propLabel}</p>
      <p style="margin: 0 0 6px;"><strong>Property ID:</strong> ${propertyId}</p>
      <p style="margin: 0 0 6px;"><strong>Requested Date &amp; Time:</strong> ${formattedDate}</p>
      ${notes ? `<p style="margin: 8px 0 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
    <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">Follow up with the brand to confirm the visit.</p>
    <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">— Lokazen Platform</p>
  </div>
</body>
</html>`.trim()

  /* ─── Email 2: Confirmation to brand ──────────────────────────────── */
  const brandHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF5200 0%, #E4002B 100%); padding: 32px 24px; text-align: center; border-radius: 10px 10px 0 0;">
    <div style="font-size: 36px; margin-bottom: 8px;">📍</div>
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">Site Visit Requested!</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">We've received your request and will confirm shortly.</p>
  </div>
  <div style="background: #fff; padding: 28px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${brandName},</p>
    <p style="font-size: 15px; color: #4b5563;">
      Thank you for your interest! We've received your site visit request and our team will reach out to confirm the appointment.
    </p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #e5e7eb;">
      <p style="margin: 0 0 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; font-weight: 600;">Your Visit Summary</p>
      <p style="margin: 12px 0 6px; font-size: 18px; font-weight: 700; color: #111;">${propLabel}</p>
      <p style="margin: 0 0 6px; color: #4b5563;">📅 <strong>${formattedDate}</strong></p>
      ${company ? `<p style="margin: 0 0 6px; color: #4b5563;">🏢 ${company}</p>` : ''}
      ${notes ? `<p style="margin: 12px 0 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 12px;">📝 ${notes}</p>` : ''}
    </div>

    <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>What's next?</strong> Our team will call or email you within 24 hours to confirm the visit details.
        If you need to reach us sooner, reply to this email or contact us at 
        <a href="mailto:ngventuresonline@gmail.com" style="color: #FF5200;">ngventuresonline@gmail.com</a>.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 20px;">
    <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} Lokazen · N&amp;G Ventures<br>
      Connecting Brands &amp; Prime Properties in Bangalore
    </p>
  </div>
</body>
</html>`.trim()

  let ngOk = false
  let brandOk = false

  try {
    const { error: ngErr } = await resend.emails.send({
      from,
      to: N_G_EMAIL,
      subject: `[Lokazen] New Visit: ${brandName} – ${propLabel}`,
      html: ngHtml,
    })
    if (ngErr) console.error('[Visit Email] N&G send error:', ngErr)
    else ngOk = true
  } catch (err) {
    console.error('[Visit Email] N&G send failed:', err)
  }

  try {
    const { error: brandErr } = await resend.emails.send({
      from,
      to: brandEmail,
      subject: `Your site visit request for ${propLabel} – Lokazen`,
      html: brandHtml,
    })
    if (brandErr) console.error('[Visit Email] Brand send error:', brandErr)
    else brandOk = true
  } catch (err) {
    console.error('[Visit Email] Brand send failed:', err)
  }

  return { ngOk, brandOk }
}
