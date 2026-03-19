/**
 * Shared lead/enquiry email utility via Resend.
 *
 * Every form action (contact-team, expert-connect, brand onboarding, etc.)
 * should fire TWO separate emails:
 *   1. Lead notification  → ngventuresonline@gmail.com  (always)
 *   2. User confirmation  → the email the user submitted (when available)
 *
 * RESEND_API_KEY and optional RESEND_FROM must be set in environment variables.
 */

import { Resend } from 'resend'

export const NG_EMAIL = 'ngventuresonline@gmail.com'

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) {
    console.error('[lead-email] RESEND_API_KEY is not set — emails will not be sent')
    return null
  }
  return new Resend(key)
}

export function getFrom(): string {
  return process.env.RESEND_FROM || 'Lokazen <noreply@support.lokazen.in>'
}

// ─── Generic Lead Notification (to N&G) ──────────────────────────────────────

export function buildLeadNotificationHtml(params: {
  subject: string
  actionType: string
  fields: [string, string][]
  nextStep: string
}) {
  const rows = params.fields
    .map(
      ([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'};">
      <td style="padding:11px 14px;font-size:12px;color:#6b7280;width:42%;">${label}</td>
      <td style="padding:11px 14px;font-size:13px;color:#111;font-weight:600;">${value}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#FF5200,#E4002B);border-radius:10px 10px 0 0;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:6px;padding:4px 10px;margin-bottom:10px;">
                    <span style="color:#fff;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">${params.actionType}</span>
                  </div>
                  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;line-height:1.25;">${params.subject}</h1>
                </td>
                <td align="right" style="vertical-align:top;">
                  <span style="font-size:20px;font-weight:700;color:#fff;">L<span style="color:#FFB085;">●</span></span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            <p style="margin:0 0 18px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#FF5200;font-weight:600;">Lead Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:24px;">
              ${rows}
            </table>

            <div style="background:#fff7ed;border-radius:8px;padding:18px 20px;border-left:3px solid #FF5200;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1a1a1a;">Next step</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">${params.nextStep}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111;border-radius:0 0 10px 10px;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#fff;"><span style="color:#FF5200;">L</span><span style="color:#FF8C4A;">●</span>kazen</p>
                  <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.35);">AI Powered Commercial Real Estate · Bengaluru</p>
                </td>
                <td align="right">
                  <a href="https://lokazen.in" style="font-size:11px;color:rgba(255,255,255,0.35);text-decoration:none;">lokazen.in</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Generic User Confirmation ────────────────────────────────────────────────

export function buildUserConfirmationHtml(params: {
  contactName: string
  headline: string
  subheading: string
  summaryFields: [string, string][]
  nextSteps: [string, string][]
  propertyName?: string
}) {
  const summaryRows = params.summaryFields
    .map(
      ([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? '#FFF5F0' : '#fff'};">
      <td style="padding:11px 14px;font-size:12px;color:#7A5540;width:40%;">${label}</td>
      <td style="padding:11px 14px;font-size:13px;color:#1A0800;font-weight:600;">${value}</td>
    </tr>`
    )
    .join('')

  const nextRows = params.nextSteps
    .map(
      ([step, desc]) => `
    <tr>
      <td style="vertical-align:top;padding:10px 0;border-bottom:1px solid #FFF0E8;">
        <span style="display:inline-block;background:linear-gradient(135deg,#E8500A,#FF6B2B);color:#fff;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:12px;white-space:nowrap;margin-right:10px;">${step}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #FFF0E8;font-size:13px;color:#7A5540;line-height:1.55;">${desc}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FFF5F0;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo bar -->
        <tr>
          <td style="background:#1A0800;border-radius:12px 12px 0 0;padding:24px 36px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;"><span style="color:#E8500A;">L</span><span style="color:#FF6B2B;">●</span>kazen</p>
            <p style="margin:3px 0 0;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase;">AI Powered Commercial Real Estate</p>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#E8500A,#FF6B2B);padding:36px;">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.75);">${params.subheading}</p>
            <h1 style="margin:0 0 14px;font-size:26px;font-weight:700;color:#fff;line-height:1.2;">${params.headline}</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.65;">
              Hi ${params.contactName},${params.propertyName ? ` your enquiry for <strong>${params.propertyName}</strong>` : ' your request'} has been received by the Lokazen team.
            </p>
          </td>
        </tr>

        <!-- Summary -->
        <tr>
          <td style="background:#fff;padding:36px;border-left:1px solid rgba(232,80,10,0.12);border-right:1px solid rgba(232,80,10,0.12);">

            ${params.summaryFields.length > 0 ? `
            <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#E8500A;font-weight:600;">Your Request Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-radius:8px;overflow:hidden;">
              ${summaryRows}
            </table>` : ''}

            ${params.nextSteps.length > 0 ? `
            <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#E8500A;font-weight:600;">What happens next</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${nextRows}
            </table>` : ''}

            <div style="background:#FFF5F0;border-radius:8px;padding:18px 20px;border-left:3px solid #E8500A;">
              <p style="margin:0;font-size:13px;color:#1A0800;line-height:1.6;">
                Questions? Reply to this email or reach us at 
                <a href="mailto:support@lokazen.in" style="color:#E8500A;text-decoration:none;">support@lokazen.in</a>
                &nbsp;·&nbsp;
                <a href="https://lokazen.in" style="color:#E8500A;text-decoration:none;">lokazen.in</a>
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A0800;border-radius:0 0 12px 12px;padding:22px 36px;">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">© ${new Date().getFullYear()} Lokazen · GVS Ventures · Bengaluru</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── High-level send helper ───────────────────────────────────────────────────

export interface DualEmailParams {
  /** Email address the user submitted — user confirmation is skipped if absent */
  userEmail?: string | null
  /** Subject for the team lead-notification email */
  teamSubject: string
  /** Subject for the user confirmation email */
  userSubject: string
  /** HTML body for the team notification (ngventuresonline@gmail.com) */
  teamHtml: string
  /** HTML body for the user confirmation */
  userHtml: string
}

/**
 * Sends two guaranteed-separate emails:
 *   1. Lead notification to ngventuresonline@gmail.com
 *   2. Confirmation to the user (skipped if userEmail is absent)
 *
 * Returns `{ ngOk, userOk }`.
 */
export async function sendDualEmail(params: DualEmailParams): Promise<{ ngOk: boolean; userOk: boolean }> {
  const resend = getResend()
  if (!resend) {
    return { ngOk: false, userOk: false }
  }

  const from = getFrom()
  let ngOk = false
  let userOk = false

  // Email 1 — always to N&G
  try {
    const { error } = await resend.emails.send({
      from,
      to: NG_EMAIL,
      subject: params.teamSubject,
      html: params.teamHtml,
    })
    if (error) {
      console.error('[lead-email] N&G notification failed:', error)
    } else {
      ngOk = true
    }
  } catch (err) {
    console.error('[lead-email] N&G notification threw:', err)
  }

  // Email 2 — to the user who submitted (if email provided)
  if (params.userEmail) {
    try {
      const { error } = await resend.emails.send({
        from,
        to: params.userEmail,
        replyTo: NG_EMAIL,
        subject: params.userSubject,
        html: params.userHtml,
      })
      if (error) {
        console.error('[lead-email] User confirmation failed:', error)
      } else {
        userOk = true
      }
    } catch (err) {
      console.error('[lead-email] User confirmation threw:', err)
    }
  }

  return { ngOk, userOk }
}

// ─── Property Status Notification (owner + N&G copy) ─────────────────────────

const ORANGE = '#E8500A'
const ORANGE_2 = '#FF6B2B'
const DARK = '#1A0800'

function approvedEmailHtml(data: {
  ownerName: string
  propertyTitle: string
  propertyCity: string
  propertyUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FFF5F0;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo bar -->
        <tr>
          <td style="background:${DARK};border-radius:12px 12px 0 0;padding:24px 36px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">
              <span style="color:${ORANGE};">L</span><span style="color:${ORANGE_2};">●</span>kazen
            </p>
            <p style="margin:3px 0 0;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase;">AI Powered Commercial Real Estate</p>
          </td>
        </tr>

        <!-- Hero — green approved -->
        <tr>
          <td style="background:linear-gradient(135deg,#16A34A,#22C55E);padding:36px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.8);">Listing Status Update</p>
            <h1 style="margin:0 0 14px;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">
              🎉 Your listing is now live!
            </h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.88);line-height:1.65;">
              Hi ${data.ownerName}, your property <strong>${data.propertyTitle}</strong> in <strong>${data.propertyCity}</strong> has been <strong>approved</strong> and is now visible to brands on Lokazen.
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:36px;border-left:1px solid rgba(22,163,74,0.15);border-right:1px solid rgba(22,163,74,0.15);">

            <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#16A34A;font-weight:600;">What happens now</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ['Visible to brands', 'Your listing is searchable and being matched to qualified brands looking for commercial space.'],
                ['AI-powered matching', 'Lokazen actively matches your property to brands that fit your location, size, and category.'],
                ['Enquiries forwarded', 'Any brand that shortlists your property will be routed to you directly through the platform.'],
              ].map(([step, desc]) => `
              <tr>
                <td style="vertical-align:top;padding:10px 0;border-bottom:1px solid #F0FDF4;">
                  <span style="display:inline-block;background:#DCFCE7;color:#16A34A;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:12px;white-space:nowrap;font-weight:700;margin-right:12px;">${step}</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #F0FDF4;font-size:13px;color:#6b7280;line-height:1.6;">${desc}</td>
              </tr>`).join('')}
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 20px;">
                  <a href="${data.propertyUrl}" style="display:inline-block;background:linear-gradient(135deg,${ORANGE},${ORANGE_2});color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                    View Your Live Listing →
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#FFF5F0;border-radius:8px;padding:18px 20px;border-left:3px solid ${ORANGE};">
              <p style="margin:0;font-size:13px;color:${DARK};line-height:1.6;">
                Questions? Reply to this email or reach us at 
                <a href="mailto:support@lokazen.in" style="color:${ORANGE};text-decoration:none;">support@lokazen.in</a>
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${DARK};border-radius:0 0 12px 12px;padding:22px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">© ${new Date().getFullYear()} Lokazen · GVS Ventures · Bengaluru</p></td>
                <td align="right"><a href="https://lokazen.in" style="color:rgba(255,255,255,0.35);font-size:11px;text-decoration:none;">lokazen.in</a></td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function rejectedEmailHtml(data: {
  ownerName: string
  propertyTitle: string
  propertyCity: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FFF5F0;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo bar -->
        <tr>
          <td style="background:${DARK};border-radius:12px 12px 0 0;padding:24px 36px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">
              <span style="color:${ORANGE};">L</span><span style="color:${ORANGE_2};">●</span>kazen
            </p>
            <p style="margin:3px 0 0;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase;">AI Powered Commercial Real Estate</p>
          </td>
        </tr>

        <!-- Hero — neutral/warm tone -->
        <tr>
          <td style="background:linear-gradient(135deg,#78350F,#92400E);padding:36px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Listing Status Update</p>
            <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
              Your listing needs attention
            </h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.65;">
              Hi ${data.ownerName}, we reviewed <strong>${data.propertyTitle}</strong> in <strong>${data.propertyCity}</strong> and were unable to approve it at this time.
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:36px;border-left:1px solid rgba(120,53,15,0.12);border-right:1px solid rgba(120,53,15,0.12);">

            <div style="background:#FFF7ED;border-radius:8px;padding:20px 22px;border-left:3px solid #F97316;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${DARK};">What this means</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.65;">
                Your listing has been marked as <strong>not approved</strong> and is currently not visible to brands. This could be due to incomplete information, image quality, or a mismatch with our current platform criteria.
              </p>
            </div>

            <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ORANGE};font-weight:600;">What you can do</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ['Contact us', 'Reply to this email or write to support@lokazen.in to understand the specific reason.'],
                ['Update your listing', 'Log in to Lokazen, edit your property details, and re-submit for review.'],
                ['Add better images', 'Listings with clear, high-quality photos have a significantly higher approval rate.'],
              ].map(([step, desc]) => `
              <tr>
                <td style="vertical-align:top;padding:10px 0;border-bottom:1px solid #FFF5F0;">
                  <span style="display:inline-block;background:#FFF0E0;color:${ORANGE};font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:12px;white-space:nowrap;font-weight:700;margin-right:12px;">${step}</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #FFF5F0;font-size:13px;color:#6b7280;line-height:1.6;">${desc}</td>
              </tr>`).join('')}
            </table>

            <div style="background:#FFF5F0;border-radius:8px;padding:18px 20px;border-left:3px solid ${ORANGE};">
              <p style="margin:0;font-size:13px;color:${DARK};line-height:1.6;">
                We are happy to help you get your listing live. Reach us at 
                <a href="mailto:support@lokazen.in" style="color:${ORANGE};text-decoration:none;">support@lokazen.in</a>
                &nbsp;or reply to this email.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${DARK};border-radius:0 0 12px 12px;padding:22px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">© ${new Date().getFullYear()} Lokazen · GVS Ventures · Bengaluru</p></td>
                <td align="right"><a href="https://lokazen.in" style="color:rgba(255,255,255,0.35);font-size:11px;text-decoration:none;">lokazen.in</a></td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Sends a property status notification to the property owner.
 * - Approved: congratulations + live listing link + what happens next
 * - Rejected: explanation + what they can do + support contact
 *
 * Also sends a copy to ngventuresonline@gmail.com for team awareness.
 * Non-blocking by design — call with .catch() at the call-site.
 */
export async function sendPropertyStatusEmail(params: {
  status: 'approved' | 'rejected'
  ownerEmail: string
  ownerName: string
  propertyTitle: string
  propertyCity: string
  propertyId: string
}): Promise<{ ownerOk: boolean; ngOk: boolean }> {
  const resend = getResend()
  if (!resend) return { ownerOk: false, ngOk: false }

  const from = getFrom()
  const { status, ownerEmail, ownerName, propertyTitle, propertyCity, propertyId } = params

  // Build the public-facing property URL using the property ID directly
  // (encodePropertyId is not imported here to keep this file dependency-free)
  const propertyUrl = `https://lokazen.in/properties/${Buffer.from(propertyId).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}/match`

  const isApproved = status === 'approved'

  const ownerSubject = isApproved
    ? `🎉 Your listing "${propertyTitle}" is now live on Lokazen`
    : `Update on your listing "${propertyTitle}" — Lokazen`

  const teamSubject = isApproved
    ? `[Approved] ${propertyTitle} · ${propertyCity}`
    : `[Rejected] ${propertyTitle} · ${propertyCity}`

  const ownerHtml = isApproved
    ? approvedEmailHtml({ ownerName, propertyTitle, propertyCity, propertyUrl })
    : rejectedEmailHtml({ ownerName, propertyTitle, propertyCity })

  const teamHtml = `<p style="font-family:sans-serif;font-size:14px;">
    <strong>Property ${isApproved ? 'approved ✅' : 'rejected ❌'}</strong><br/><br/>
    Title: ${propertyTitle}<br/>
    City: ${propertyCity}<br/>
    Owner: ${ownerName} &lt;${ownerEmail}&gt;<br/>
    Property ID: ${propertyId}<br/><br/>
    Status email sent to owner at ${ownerEmail}.
  </p>`

  let ownerOk = false
  let ngOk = false

  // Email 1 — to the property owner
  try {
    const { error } = await resend.emails.send({
      from,
      to: ownerEmail,
      replyTo: NG_EMAIL,
      subject: ownerSubject,
      html: ownerHtml,
    })
    if (error) console.error('[property-status-email] Owner email failed:', error)
    else ownerOk = true
  } catch (err) {
    console.error('[property-status-email] Owner email threw:', err)
  }

  // Email 2 — internal copy to N&G
  try {
    const { error } = await resend.emails.send({
      from,
      to: NG_EMAIL,
      subject: teamSubject,
      html: teamHtml,
    })
    if (error) console.error('[property-status-email] N&G copy failed:', error)
    else ngOk = true
  } catch (err) {
    console.error('[property-status-email] N&G copy threw:', err)
  }

  return { ownerOk, ngOk }
}

// ─── New Property Upload Notification (to N&G only) ──────────────────────────

function newPropertyEmailHtml(data: {
  propertyId: string
  title: string
  propertyType: string
  size: number
  price: number
  priceType: string
  address: string
  city: string
  state: string
  mapUrl: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  imageUrl: string | null
}) {
  const priceLabel = data.priceType === 'sqft'
    ? `₹${data.price.toLocaleString('en-IN')}/sqft/mo`
    : data.priceType === 'yearly'
    ? `₹${(data.price / 100000).toFixed(1)}L/yr`
    : data.price >= 100000
    ? `₹${(data.price / 100000).toFixed(1)}L/mo`
    : `₹${data.price.toLocaleString('en-IN')}/mo`

  const typeLabel = data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1)
  const adminUrl = `https://lokazen.in/admin/properties/${data.propertyId}`

  const imageBlock = data.imageUrl
    ? `<tr><td colspan="2" style="padding-bottom:20px;"><img src="${data.imageUrl}" alt="${data.title}" width="100%" style="border-radius:8px;max-height:220px;object-fit:cover;display:block;"></td></tr>`
    : ''

  const row = (label: string, val: string) =>
    `<tr>
      <td style="padding:9px 0;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;width:38%;border-bottom:1px solid #F3F4F6;">${label}</td>
      <td style="padding:9px 0;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #F3F4F6;">${val}</td>
    </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FFF5F0;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo bar -->
        <tr>
          <td style="background:${DARK};border-radius:12px 12px 0 0;padding:24px 36px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">
              <span style="color:${ORANGE};">L</span><span style="color:${ORANGE_2};">●</span>kazen
            </p>
            <p style="margin:3px 0 0;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase;">New Property Listed — Admin Notification</p>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="background:linear-gradient(135deg,${ORANGE},${ORANGE_2});padding:32px 36px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.8);">🏢 New Listing — Pending Review</p>
            <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#fff;line-height:1.2;">${data.title}</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.9);">${data.address}, ${data.city}, ${data.state}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px 36px;border-left:1px solid rgba(232,80,10,0.12);border-right:1px solid rgba(232,80,10,0.12);">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${imageBlock}
              <tr>
                <td colspan="2" style="padding-bottom:16px;">
                  <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ORANGE};font-weight:600;">Property Details</p>
                </td>
              </tr>
              ${row('Type', typeLabel)}
              ${row('Size', `${data.size.toLocaleString('en-IN')} sqft`)}
              ${row('Rent', priceLabel)}
              ${row('City', `${data.city}, ${data.state}`)}
              ${row('Address', data.address)}
              ${row('Property ID', data.propertyId)}
              <tr><td colspan="2" style="padding-top:20px;padding-bottom:16px;">
                <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ORANGE};font-weight:600;">Owner / Contact Details</p>
              </td></tr>
              ${row('Name', data.ownerName || '—')}
              ${row('Email', `<a href="mailto:${data.ownerEmail}" style="color:${ORANGE};text-decoration:none;">${data.ownerEmail}</a>`)}
              ${row('Mobile', data.ownerPhone ? `<a href="tel:${data.ownerPhone}" style="color:${ORANGE};text-decoration:none;">${data.ownerPhone}</a>` : '—')}
              <tr><td colspan="2" style="padding-top:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px;">
                      <a href="${adminUrl}" style="display:block;text-align:center;background:${DARK};color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px;">
                        Review in Admin →
                      </a>
                    </td>
                    <td style="padding-left:8px;">
                      <a href="${data.mapUrl}" style="display:block;text-align:center;background:${ORANGE};color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px;">
                        Open Map Location →
                      </a>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${DARK};border-radius:0 0 12px 12px;padding:22px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">© ${new Date().getFullYear()} Lokazen · GVS Ventures · Bengaluru</p></td>
                <td align="right"><a href="https://lokazen.in/admin/properties" style="color:rgba(255,255,255,0.35);font-size:11px;text-decoration:none;">Admin Dashboard</a></td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Sends an internal new-property notification to ngventuresonline@gmail.com
 * immediately when a property is uploaded. Includes full details + map link.
 * Non-blocking by design — call with .catch() at the call-site.
 */
export async function sendNewPropertyNotification(params: {
  propertyId: string
  title: string
  propertyType: string
  size: number
  price: number
  priceType: string
  address: string
  city: string
  state: string
  mapLink?: string | null
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  imageUrl?: string | null
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const from = getFrom()

  // Build a reliable map URL: use the provided map link, or fallback to Google Maps search
  const mapUrl = params.mapLink?.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${params.address}, ${params.city}, ${params.state}`)}`

  const price = typeof params.price === 'number' ? params.price : Number(params.price) || 0

  try {
    const { error } = await resend.emails.send({
      from,
      to: NG_EMAIL,
      subject: `🏢 New Property Listed — ${params.title} · ${params.city}`,
      html: newPropertyEmailHtml({
        propertyId: params.propertyId,
        title: params.title,
        propertyType: params.propertyType,
        size: params.size,
        price,
        priceType: params.priceType,
        address: params.address,
        city: params.city,
        state: params.state,
        mapUrl,
        ownerName: params.ownerName,
        ownerEmail: params.ownerEmail,
        ownerPhone: params.ownerPhone,
        imageUrl: params.imageUrl ?? null,
      }),
    })
    if (error) {
      console.error('[new-property-email] Failed:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[new-property-email] Threw:', err)
    return false
  }
}
