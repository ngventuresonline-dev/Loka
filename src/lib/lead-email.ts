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
