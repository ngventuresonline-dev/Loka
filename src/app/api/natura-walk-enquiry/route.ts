import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'Lokazen <noreply@support.lokazen.in>'
const TEAM_EMAILS = ['support@lokazen.in', 'ngventuresonline@gmail.com']

function teamEmailHtml(data: {
  brandName: string
  category: string
  unitSize: string
  contactName: string
  phone: string
  email: string
  enquiryType: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Enquiry — Natura Walk</title>
</head>
<body style="margin:0;padding:0;background:#FFF5F0;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E8500A,#FF6B2B);border-radius:12px 12px 0 0;padding:32px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:8px;padding:6px 12px;margin-bottom:14px;">
                    <span style="color:#fff;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;">
                      ${data.enquiryType === 'visit' ? 'Site Visit Request' : 'Brand Onboarding Enquiry'}
                    </span>
                  </div>
                  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;line-height:1.2;">
                    New Enquiry<br/>
                    <span style="font-size:18px;opacity:0.85;">Natura Walk Mall</span>
                  </h1>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px 16px;text-align:center;">
                    <div style="color:#fff;font-size:28px;font-weight:700;line-height:1;">84</div>
                    <div style="color:rgba(255,255,255,0.75);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;">Lokazen Score</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:36px;border-left:1px solid rgba(232,80,10,0.12);border-right:1px solid rgba(232,80,10,0.12);">

            <!-- Enquiry details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td colspan="2" style="padding-bottom:16px;border-bottom:1px solid #FFF0E8;margin-bottom:16px;">
                  <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#E8500A;font-weight:600;">Brand Details</p>
                </td>
              </tr>
              ${[
                ['Brand Name', data.brandName],
                ['Category', data.category],
                ['Unit Preference', data.unitSize],
                ['Contact Name', data.contactName],
                ['Phone / WhatsApp', data.phone],
                ['Email', data.email],
              ].map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? '#FFF5F0' : '#fff'};">
                <td style="padding:12px 14px;font-size:12px;color:#7A5540;font-weight:500;letter-spacing:0.04em;width:45%;border-radius:4px 0 0 4px;">${label}</td>
                <td style="padding:12px 14px;font-size:14px;color:#1A0800;font-weight:600;border-radius:0 4px 4px 0;">${value}</td>
              </tr>`).join('')}
            </table>

            <!-- Action prompt -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#FFF5F0;border-radius:8px;padding:20px 22px;border-left:3px solid #E8500A;">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1A0800;">Next step</p>
                  <p style="margin:0;font-size:13px;color:#7A5540;line-height:1.6;">
                    ${data.enquiryType === 'visit'
                      ? 'This brand has requested a site visit. Arrange it at the earliest and confirm with them directly.'
                      : 'This brand wants to onboard. Follow up to qualify, match to the right unit, and begin the placement process.'}
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A0800;border-radius:0 0 12px 12px;padding:24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="https://lokazen.in/lokazen-favicon.png" alt="Lokazen" width="32" height="32" style="display:block;margin-bottom:8px;border-radius:6px;" />
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#fff;">
                    <span style="color:#E8500A;">L</span><span style="color:#FF6B2B;">●</span>kazen
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.06em;">AI Powered Commercial Real Estate Platform · Bengaluru</p>
                </td>
                <td align="right" style="vertical-align:bottom;">
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">Natura Walk Mall · SH-35</p>
                  <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.35);">Sarjapur Road · 562125</p>
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

function userConfirmationHtml(data: {
  contactName: string
  brandName: string
  category: string
  unitSize: string
  enquiryType: string
}) {
  const isVisit = data.enquiryType === 'visit'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enquiry Confirmed — Lokazen</title>
</head>
<body style="margin:0;padding:0;background:#FFF5F0;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1A0800;border-radius:12px 12px 0 0;padding:28px 36px 24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:14px;">
                  <img src="https://lokazen.in/lokazen-favicon.png" alt="Lokazen" width="40" height="40" style="display:block;border-radius:8px;" />
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0 0 2px;font-size:22px;font-weight:700;color:#fff;line-height:1;">
                    <span style="color:#E8500A;">L</span><span style="color:#FF6B2B;">●</span>kazen
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;text-transform:uppercase;">AI Powered Commercial Real Estate Platform</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero message -->
        <tr>
          <td style="background:linear-gradient(135deg,#E8500A,#FF6B2B);padding:36px;">
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.75);">
              ${isVisit ? 'Site Visit Confirmed' : 'Onboarding Enquiry Received'}
            </p>
            <h1 style="margin:0 0 14px;font-size:28px;font-weight:700;color:#fff;line-height:1.15;">
              ${isVisit ? 'We\'ll arrange a site visit at the earliest.' : 'We\'ll be in touch within 24 hours.'}
            </h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.8);line-height:1.6;">
              Hi ${data.contactName}, your enquiry for <strong>${data.brandName}</strong> at Natura Walk Mall has been received by the Lokazen team.
            </p>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="background:#fff;padding:36px;border-left:1px solid rgba(232,80,10,0.12);border-right:1px solid rgba(232,80,10,0.12);">

            <p style="margin:0 0 18px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#E8500A;font-weight:600;">Your Enquiry Summary</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-radius:8px;overflow:hidden;">
              ${[
                ['Brand', data.brandName],
                ['Category', data.category],
                ['Unit Preference', data.unitSize],
              ].map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? '#FFF5F0' : '#fff'};">
                <td style="padding:11px 14px;font-size:12px;color:#7A5540;width:45%;">${label}</td>
                <td style="padding:11px 14px;font-size:13px;color:#1A0800;font-weight:600;">${value}</td>
              </tr>`).join('')}
            </table>

            <!-- What happens next -->
            <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#E8500A;font-weight:600;">What happens next</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${(isVisit ? [
                ['Within 48 hrs', 'Lokazen schedules your site visit at Natura Walk Mall'],
                ['On the visit', 'Walk the available units, assess the catchment first-hand'],
                ['Post-visit', 'Unit selection, LOI, and fitout guidance — all managed by Lokazen'],
              ] : [
                ['Within 24 hrs', 'Lokazen reviews your requirements and reaches out'],
                ['Unit matching', 'We match your brand to the right unit based on category and size'],
                ['Placement', 'LOI, fitout guidance, and brand onboarding — end-to-end'],
              ]).map(([step, desc], i) => `
              <tr>
                <td style="vertical-align:top;padding:10px 0;border-bottom:1px solid #FFF0E8;">
                  <span style="display:inline-block;background:linear-gradient(135deg,#E8500A,#FF6B2B);color:#fff;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:12px;white-space:nowrap;margin-right:12px;">${step}</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #FFF0E8;font-size:13px;color:#7A5540;line-height:1.55;">${desc}</td>
              </tr>`).join('')}
            </table>

            <div style="background:#FFF5F0;border-radius:8px;padding:20px 22px;margin-top:24px;border-left:3px solid #E8500A;">
              <p style="margin:0;font-size:13px;color:#1A0800;line-height:1.6;">
                Lokazen manages the placement end-to-end — unit negotiation, LOI, fitout guidance, brand onboarding. Success fee applies on deal closure.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A0800;border-radius:0 0 12px 12px;padding:24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td style="padding-right:10px;vertical-align:middle;">
                        <img src="https://lokazen.in/lokazen-favicon.png" alt="Lokazen" width="26" height="26" style="display:block;border-radius:5px;" />
                      </td>
                      <td style="vertical-align:middle;">
                        <span style="font-size:14px;font-weight:700;color:#fff;"><span style="color:#E8500A;">L</span><span style="color:#FF6B2B;">●</span>kazen</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.4);">Questions? Reply to this email or reach us at</p>
                  <a href="mailto:support@lokazen.in" style="color:#E8500A;font-size:13px;text-decoration:none;font-weight:600;">support@lokazen.in</a>
                </td>
                <td align="right" style="vertical-align:bottom;">
                  <a href="https://lokazen.in" style="color:rgba(255,255,255,0.35);font-size:11px;text-decoration:none;letter-spacing:0.06em;">lokazen.in</a>
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandName, category, unitSize, contactName, phone, email, enquiryType } = body

    if (!brandName || !contactName || !phone || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const subject = enquiryType === 'visit'
      ? `Site Visit Request — ${brandName} · Natura Walk`
      : `Brand Enquiry — ${brandName} · Natura Walk`

    const [teamResult, userResult] = await Promise.allSettled([
      // Email to Lokazen team
      resend.emails.send({
        from: FROM,
        to: TEAM_EMAILS,
        subject,
        html: teamEmailHtml({ brandName, category, unitSize, contactName, phone, email, enquiryType }),
      }),
      // Confirmation to brand/user
      resend.emails.send({
        from: FROM,
        to: [email],
        replyTo: TEAM_EMAIL,
        subject: enquiryType === 'visit'
          ? `Your site visit request is confirmed — Natura Walk Mall`
          : `Enquiry received — Natura Walk Mall · Lokazen`,
        html: userConfirmationHtml({ contactName, brandName, category, unitSize, enquiryType }),
      }),
    ])

    const errors: string[] = []
    if (teamResult.status === 'rejected') errors.push('team email failed')
    if (userResult.status === 'rejected') errors.push('user email failed')

    if (errors.length === 2) {
      console.error('[natura-walk-enquiry] Both emails failed:', teamResult, userResult)
      return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[natura-walk-enquiry]', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
