/**
 * Visit notification email to N&G (ngventuresonline@gmail.com)
 * Uses Gmail SMTP - set GMAIL_USER and GMAIL_APP_PASSWORD in env.
 * Create App Password: Google Account → Security → 2-Step Verification → App passwords
 */

import nodemailer from 'nodemailer'

const N_G_EMAIL = 'ngventuresonline@gmail.com'

function getTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user?.trim() || !pass?.trim()) return null
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  })
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
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('[Visit Email] GMAIL_USER or GMAIL_APP_PASSWORD not set.')
    return { ok: false, error: 'Gmail not configured' }
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
    <p style="font-size: 16px;">A brand has requested a site visit.</p>
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 4px;"><strong>Brand/Contact:</strong> ${brandName}</p>
      <p style="margin: 0 0 4px;"><strong>Email:</strong> ${brandEmail}</p>
      <p style="margin: 0 0 4px;"><strong>Phone:</strong> ${brandPhone}</p>
      ${company ? `<p style="margin: 0 0 4px;"><strong>Company:</strong> ${company}</p>` : ''}
      <p style="margin: 0 0 4px;"><strong>Property:</strong> ${propLabel} (ID: ${propertyId})</p>
      <p style="margin: 0 0 4px;"><strong>Date & Time:</strong> ${formattedDate}</p>
      ${notes ? `<p style="margin: 8px 0 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
    <p style="font-size: 12px; color: #9ca3af;">— Lokazen</p>
  </div>
</body>
</html>
  `.trim()

  const subject = `[Lokazen] Site Visit: ${brandName} – ${propLabel}`

  try {
    await transporter.sendMail({
      from: `Lokazen <${process.env.GMAIL_USER || N_G_EMAIL}>`,
      to: N_G_EMAIL,
      subject,
      html,
      text: `New site visit: ${brandName} (${brandEmail}, ${brandPhone}). Property: ${propLabel}. Date: ${formattedDate}. Notes: ${notes || '-'}`,
    })
    return { ok: true }
  } catch (err: any) {
    console.error('[Visit Email] Error:', err)
    return { ok: false, error: err?.message || 'Failed to send' }
  }
}
