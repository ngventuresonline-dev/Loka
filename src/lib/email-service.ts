/**
 * Email Service
 * Handles sending emails to users
 *
 * Production: set RESEND_API_KEY and EMAIL_FROM (verified domain in Resend).
 */

import { Resend } from 'resend'
import type { AdminMatchRow } from '@/lib/admin-matches-compute'
import { encodePropertyId } from '@/lib/property-slug'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Send email via Resend. Requires RESEND_API_KEY for delivery.
 * Uses RESEND_FROM or EMAIL_FROM; replyTo can be set per-call.
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      console.warn('[Email Service] RESEND_API_KEY not set — email not sent')
      return { success: false, error: 'RESEND_API_KEY not configured. Set it in environment for email delivery.' }
    }

    const resend = new Resend(apiKey)
    const from = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Lokazen <onboarding@resend.dev>'
    const { error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(options.replyTo && { reply_to: options.replyTo }),
    })
    if (error) {
      console.error('[Email Service] Resend error:', error)
      return { success: false, error: error.message || 'Resend send failed' }
    }
    return { success: true }
  } catch (error: any) {
    console.error('[Email Service] Error sending email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

function formatRent(price: number, priceType: string | null | undefined): string {
  const pt = (priceType || 'monthly').toLowerCase()
  if (pt === 'yearly') {
    const lakhs = price / 100000
    return lakhs >= 1 ? `₹${lakhs.toFixed(1)}L/year` : `₹${(price / 1000).toFixed(0)}k/year`
  }
  const lakhs = price / 100000
  return lakhs >= 1 ? `₹${lakhs.toFixed(1)}L/month` : `₹${(price / 1000).toFixed(0)}k/month`
}

function buildAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  const v = process.env.VERCEL_URL
  if (v) {
    return v.startsWith('http') ? v.replace(/\/$/, '') : `https://${v.replace(/\/$/, '')}`
  }
  return 'https://lokazen.in'
}

export interface BrandMatchDigestContent {
  subject: string
  html: string
  text: string
}

/**
 * Build email content for brand match digest (GVS Ventures / Lokazen style).
 * Supports custom subject and body intro overrides.
 */
export function buildBrandMatchDigestEmailContent(params: {
  brandName: string
  contactName?: string
  matches: AdminMatchRow[]
  adminNote?: string
  subjectOverride?: string
  bodyIntroOverride?: string
}): BrandMatchDigestContent {
  const { brandName, contactName, matches, adminNote = '', subjectOverride, bodyIntroOverride } = params
  const base = buildAppBaseUrl().replace(/\/$/, '')
  const brand = matches[0]?.brand
  const greetingName = contactName || brand?.contactName || brandName
  const spaceType = (brand?.preferredPropertyTypes?.length
    ? brand.preferredPropertyTypes.join(' / ')
    : brand?.businessType || 'Commercial') as string
  const sizeLine = brand?.sizeRange || 'Size flexible'
  const locationPref = (brand?.preferredLocations?.length
    ? brand.preferredLocations.join(', ')
    : 'Flexible') as string

  const propertyEntries = matches.slice(0, 25).map((m, idx) => {
    const slug = encodePropertyId(m.property.id)
    const url = `${base}/properties/${slug}/match`
    const title = m.property.title || 'Property'
    const location = [m.property.address, m.property.city].filter(Boolean).join(', ') || m.property.city || '—'
    const size = m.property.size != null ? `${m.property.size.toLocaleString()} sqft` : '—'
    const rent = formatRent(m.property.price, m.property.priceType)
    return { num: idx + 1, title, location, size, rent, url }
  })

  const rowsHtml = propertyEntries
    .map(
      (e) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;vertical-align:top;">
        <strong style="color:#111827;font-size:15px;">${e.num}. ${escapeHtml(e.title)}</strong><br/>
        <span style="color:#6b7280;font-size:14px;">Location: ${escapeHtml(e.location)}</span><br/>
        <span style="color:#6b7280;font-size:14px;">Size: ${escapeHtml(e.size)} &nbsp;|&nbsp; Rent: ${escapeHtml(e.rent)}</span><br/>
        <a href="${e.url}" style="color:#FF5200;font-size:13px;font-weight:600;">View Property: ${e.url.replace(/^https?:\/\//, '')}</a>
      </td>
    </tr>`
    )
    .join('')

  const noteBlock =
    adminNote && adminNote.length > 0
      ? `<div style="background:#fff7ed;border-left:4px solid #FF5200;padding:16px;margin:0 0 24px;border-radius:4px;">
           <p style="margin:0;font-size:14px;color:#374151;">${escapeHtml(adminNote)}</p>
         </div>`
      : ''

  const defaultSubject = `Matched commercial spaces for ${brandName} on Lokazen`
  const subject = subjectOverride
    ? subjectOverride.replace(/\{\{brandName\}\}/g, brandName).replace(/\{\{contactName\}\}/g, greetingName)
    : defaultSubject

  const brandReqsBlock = `<p style="margin:0 0 12px;">Space Type: ${escapeHtml(spaceType)}<br/>Size: ${escapeHtml(sizeLine)}<br/>Location Preference: ${escapeHtml(locationPref)}</p>
    <p style="margin:0 0 16px;font-weight:600;font-size:16px;">MATCHED SPACES FOR ${escapeHtml(brandName.toUpperCase())}</p>`

  const defaultNarrativeHtml = `<p style="margin:0 0 12px;">Hi ${escapeHtml(greetingName)},</p>
    <p style="margin:0 0 12px;">We came across your enquiry for a space in Bangalore and have put together a curated list of available commercial properties that match ${escapeHtml(brandName)}'s requirements.</p>`

  const narrativeHtml = bodyIntroOverride
    ? bodyIntroOverride
        .replace(/\{\{brandName\}\}/g, brandName)
        .replace(/\{\{contactName\}\}/g, greetingName)
        .split('\n\n')
        .map((p) => `<p style="margin:0 0 12px;">${escapeHtml(p.trim() || ' ').replace(/\n/g, '<br/>')}</p>`)
        .join('')
    : defaultNarrativeHtml

  const introHtml = `<div style="font-size:15px;line-height:1.7;margin-bottom:20px;">${narrativeHtml}${brandReqsBlock}</div>`

  const forbrandsUrl = `${base.replace(/\/$/, '')}/forbrands`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:640px;margin:0 auto;padding:24px;">
  <div style="background:#fff;padding:0;">
    <div style="font-size:15px;line-height:1.7;margin-bottom:24px;">
      ${introHtml}
    </div>
    ${noteBlock}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rowsHtml}</table>
    ${
      matches.length > 25
        ? `<p style="font-size:13px;color:#6b7280;margin-top:8px;">Showing top 25 of ${matches.length} matches.</p>`
        : ''
    }
    <p style="font-size:14px;margin:24px 0 16px;">All spaces are available for immediate take-up. GVS Ventures provides end-to-end leasing support — site visits, landlord negotiations, and documentation at no extra cost to you.</p>
    <p style="font-size:14px;margin:0 0 16px;">To know more about how we work with brands, visit: <a href="${forbrandsUrl}" style="color:#FF5200;">${forbrandsUrl}</a></p>
    <p style="font-size:14px;margin:0 0 24px;">Reply to this email to schedule a site visit or get more details.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
    <p style="font-size:14px;margin:0;color:#374151;">Warm regards,<br/><strong>GVS Ventures Team</strong><br/><a href="mailto:ngventuresonline@gmail.com" style="color:#FF5200;">ngventuresonline@gmail.com</a></p>
  </div>
</body>
</html>`

  const textLines = propertyEntries.map(
    (e) => `${e.num}. ${e.title}\nLocation: ${e.location}\nSize: ${e.size}  |  Rent: ${e.rent}\nView Property: ${e.url}`
  )

  const defaultTextNarrative = `Hi ${greetingName},

We came across your enquiry for a space in Bangalore and have put together a curated list of available commercial properties that match ${brandName}'s requirements.`
  const textNarrative = bodyIntroOverride
    ? bodyIntroOverride.replace(/\{\{brandName\}\}/g, brandName).replace(/\{\{contactName\}\}/g, greetingName)
    : defaultTextNarrative
  const textIntro = `${textNarrative}

Space Type: ${spaceType}
Size: ${sizeLine}
Location Preference: ${locationPref}

MATCHED SPACES FOR ${brandName.toUpperCase()}`

  const text = [
    textIntro,
    '',
    ...textLines,
    adminNote ? `\n\n${adminNote}` : '',
    '',
    'All spaces are available for immediate take-up. GVS Ventures provides end-to-end leasing support — site visits, landlord negotiations, and documentation at no extra cost to you.',
    '',
    `To know more about how we work with brands, visit: ${forbrandsUrl}`,
    '',
    'Reply to this email to schedule a site visit or get more details.',
    '',
    'Warm regards,',
    'GVS Ventures Team',
    'ngventuresonline@gmail.com',
  ].join('\n')

  return { subject, html, text }
}

/**
 * Send CRM digest: matched properties for one brand (admin → brand).
 */
export async function sendBrandMatchDigestEmail(params: {
  to: string
  brandName: string
  contactName?: string
  matches: AdminMatchRow[]
  adminNote?: string
  subjectOverride?: string
  bodyIntroOverride?: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, brandName, contactName, matches, adminNote, subjectOverride, bodyIntroOverride } = params
  const content = buildBrandMatchDigestEmailContent({
    brandName,
    contactName: contactName ?? matches[0]?.brand?.contactName,
    matches,
    adminNote,
    subjectOverride,
    bodyIntroOverride,
  })
  return sendEmail({
    to,
    ...content,
    replyTo: process.env.EMAIL_REPLY_TO || 'ngventuresonline@gmail.com',
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Send welcome email with login credentials to property owner
 */
export async function sendOwnerWelcomeEmail(
  email: string,
  name: string,
  userId: string,
  password: string,
  dashboardUrl: string = 'https://lokazen.com/dashboard/owner'
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Welcome to Lokazen - Your Property Dashboard Access'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Lokazen</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF5200 0%, #E4002B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Lokazen!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-top: 0;">Hi ${name},</p>
        
        <p style="font-size: 16px;">
          Thank you for listing your property with Lokazen! Your property is now under review and will be visible to brands once approved.
        </p>
        
        <div style="background: #f9fafb; border-left: 4px solid #FF5200; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Your Login Credentials</h2>
          <p style="margin-bottom: 10px; font-size: 14px; color: #6b7280;">Use these credentials to access your dashboard:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Email:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Password:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${password}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">User ID:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 12px;">${userId}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #FF5200 0%, #E4002B 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Access Your Dashboard
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          <strong>Security Note:</strong> Please change your password after your first login for security purposes.
        </p>
        
        <p style="font-size: 14px; color: #6b7280;">
          If you have any questions, feel free to reach out to our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          This is an automated email. Please do not reply to this message.<br>
          © ${new Date().getFullYear()} Lokazen. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to Lokazen!

Hi ${name},

Thank you for listing your property with Lokazen! Your property is now under review and will be visible to brands once approved.

Your Login Credentials:
Email: ${email}
Password: ${password}
User ID: ${userId}

Access your dashboard: ${dashboardUrl}

Security Note: Please change your password after your first login for security purposes.

If you have any questions, feel free to reach out to our support team.

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} Lokazen. All rights reserved.
  `

  return sendEmail({
    to: email,
    subject,
    html,
    text,
    replyTo: process.env.EMAIL_REPLY_TO || 'ngventuresonline@gmail.com',
  })
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%&*'
  const allChars = uppercase + lowercase + numbers + symbols

  // Ensure at least one character from each set
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}










