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
}

/**
 * Send email via Resend when RESEND_API_KEY is set; otherwise log only (dev-friendly).
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      const from = process.env.EMAIL_FROM || 'Lokazen <onboarding@resend.dev>'
      const { error } = await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      if (error) {
        console.error('[Email Service] Resend error:', error)
        return { success: false, error: error.message || 'Resend send failed' }
      }
      return { success: true }
    }

    console.log('📧 Email (no RESEND_API_KEY — not sent):', {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 120) + '...',
    })

    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_EMAIL_LOGGING === 'true') {
      console.log('📧 Email Content:', {
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
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
    return `₹${(price / 100000).toFixed(1)}L/year`
  }
  return `₹${(price / 1000).toFixed(0)}K/month`
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

/**
 * Send CRM digest: matched properties for one brand (admin → brand).
 */
export async function sendBrandMatchDigestEmail(params: {
  to: string
  brandName: string
  matches: AdminMatchRow[]
  adminNote?: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, brandName, matches, adminNote } = params
  const base = buildAppBaseUrl().replace(/\/$/, '')

  const rowsHtml = matches
    .slice(0, 25)
    .map((m) => {
      const score = m.bfiScore ?? m.pfiScore
      const slug = encodePropertyId(m.property.id)
      const url = `${base}/properties/${slug}/match`
      const title = m.property.title || 'Property'
      const city = m.property.city || ''
      const size = m.property.size != null ? `${m.property.size.toLocaleString()} sqft` : '—'
      const rent = formatRent(m.property.price, m.property.priceType)
      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
            <strong style="color:#111827;">${escapeHtml(title)}</strong><br/>
            <span style="color:#6b7280;font-size:13px;">${escapeHtml(city)} · ${escapeHtml(size)} · ${escapeHtml(rent)}</span><br/>
            <span style="color:#6b7280;font-size:12px;">BFI ${score}% · ${escapeHtml(m.matchQuality)}</span>
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:middle;">
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#FF5200 0%,#E4002B 100%);color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;font-size:13px;">View match</a>
          </td>
        </tr>`
    })
    .join('')

  const noteBlock =
    adminNote && adminNote.length > 0
      ? `<div style="background:#fff7ed;border-left:4px solid #FF5200;padding:16px;margin:0 0 24px;border-radius:4px;">
           <p style="margin:0;font-size:14px;color:#374151;"><strong>Message from Lokazen:</strong><br/>${escapeHtml(adminNote)}</p>
         </div>`
      : ''

  const subject = `Properties matched for you on Lokazen — ${brandName}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:640px;margin:0 auto;padding:24px;">
  <div style="background:linear-gradient(135deg,#FF5200 0%,#E4002B 100%);padding:24px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Your matched properties</h1>
    <p style="color:#fff;margin:8px 0 0;font-size:14px;opacity:0.95;">${escapeHtml(brandName)}</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;">
    <p style="font-size:15px;margin-top:0;">Hi ${escapeHtml(brandName)} team,</p>
    <p style="font-size:15px;">Here are commercial spaces on Lokazen that fit your profile (BFI / PFI scoring).</p>
    ${noteBlock}
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">${rowsHtml}</table>
    ${
      matches.length > 25
        ? `<p style="font-size:13px;color:#6b7280;margin-top:16px;">Showing top 25 of ${matches.length} matches.</p>`
        : ''
    }
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
    <p style="font-size:12px;color:#9ca3af;margin:0;">Sent by Lokazen on behalf of our partner team. Reply to this email if you have questions.</p>
  </div>
</body>
</html>`

  const textLines = matches.slice(0, 25).map((m) => {
    const score = m.bfiScore ?? m.pfiScore
    const slug = encodePropertyId(m.property.id)
    const url = `${base}/properties/${slug}/match`
    return `- ${m.property.title || 'Property'} (${m.property.city}) BFI ${score}% — ${url}`
  })

  const text = [
    `Hi ${brandName} team,`,
    '',
    'Here are properties matched to your profile on Lokazen:',
    '',
    ...textLines,
    adminNote ? `\n\nNote from Lokazen:\n${adminNote}` : '',
    '',
    '— Lokazen',
  ].join('\n')

  return sendEmail({ to, subject, html, text })
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










