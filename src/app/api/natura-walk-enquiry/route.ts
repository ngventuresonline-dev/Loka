import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { insertGeneralEnquiry } from '@/lib/general-enquiry-db'

const NG_EMAIL = 'ngventuresonline@gmail.com'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) {
    console.error('[natura-walk-enquiry] RESEND_API_KEY is not set in environment variables')
    return null
  }
  return new Resend(key)
}

function getFrom(): string {
  return process.env.RESEND_FROM || 'Lokazen <noreply@support.lokazen.in>'
}

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
                    New ${data.enquiryType === 'visit' ? 'Site Visit' : 'Brand'} Enquiry<br/>
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

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td colspan="2" style="padding-bottom:16px;border-bottom:1px solid #FFF0E8;margin-bottom:16px;">
                  <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#E8500A;font-weight:600;">Lead Details</p>
                </td>
              </tr>
              ${[
                ['Brand Name', data.brandName],
                ['Category', data.category],
                ['Unit Preference', data.unitSize],
                ['Contact Name', data.contactName],
                ['Phone / WhatsApp', data.phone],
                ['Email', data.email],
                ['Action Type', data.enquiryType === 'visit' ? 'Site Visit Request' : 'Brand Onboarding'],
              ].map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? '#FFF5F0' : '#fff'};">
                <td style="padding:12px 14px;font-size:12px;color:#7A5540;font-weight:500;letter-spacing:0.04em;width:45%;border-radius:4px 0 0 4px;">${label}</td>
                <td style="padding:12px 14px;font-size:14px;color:#1A0800;font-weight:600;border-radius:0 4px 4px 0;">${value}</td>
              </tr>`).join('')}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#FFF5F0;border-radius:8px;padding:20px 22px;border-left:3px solid #E8500A;">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1A0800;">Next step</p>
                  <p style="margin:0;font-size:13px;color:#7A5540;line-height:1.6;">
                    ${data.enquiryType === 'visit'
                      ? 'This brand has requested a site visit. Arrange it at the earliest and confirm with them directly.'
                      : 'This brand wants to onboard at Natura Walk Mall. Follow up to qualify, match to the right unit, and begin the placement process.'}
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
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#fff;">
                    <span style="color:#E8500A;">L</span><span style="color:#FF6B2B;">●</span>kazen
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.06em;">AI Powered Commercial Real Estate Platform · Bengaluru</p>
                </td>
                <td align="right" style="vertical-align:bottom;">
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">Natura Walk Mall · Sarjapur Road</p>
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
                <td style="vertical-align:middle;">
                  <p style="margin:0 0 2px;font-size:22px;font-weight:700;color:#fff;line-height:1;">
                    <span style="color:#E8500A;">L</span><span style="color:#FF6B2B;">●</span>kazen
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;text-transform:uppercase;">AI Powered Commercial Real Estate</p>
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
              ${isVisit ? "We'll arrange a site visit within 48 hours." : "We'll be in touch within 24 hours."}
            </h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.8);line-height:1.6;">
              Hi ${data.contactName}, your enquiry for <strong>${data.brandName}</strong> at <strong>Natura Walk Mall</strong> — GVS Ventures has been received.
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
              ]).map(([step, desc]) => `
              <tr>
                <td style="vertical-align:top;padding:10px 0;border-bottom:1px solid #FFF0E8;">
                  <span style="display:inline-block;background:linear-gradient(135deg,#E8500A,#FF6B2B);color:#fff;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:12px;white-space:nowrap;margin-right:12px;">${step}</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #FFF0E8;font-size:13px;color:#7A5540;line-height:1.55;">${desc}</td>
              </tr>`).join('')}
            </table>

            <div style="background:#FFF5F0;border-radius:8px;padding:20px 22px;margin-top:24px;border-left:3px solid #E8500A;">
              <p style="margin:0;font-size:13px;color:#1A0800;line-height:1.6;">
                Lokazen manages the placement end-to-end — unit negotiation, LOI, fitout guidance, brand onboarding.<br/>
                Questions? Reply to this email or reach us at <a href="mailto:support@lokazen.in" style="color:#E8500A;">support@lokazen.in</a>
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
                  <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.4);">Questions? Reach us at</p>
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

    const resend = getResend()
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
    }

    const from = getFrom()
    const actionLabel = enquiryType === 'visit' ? 'Site Visit Request' : 'Brand Enquiry'
    const teamSubject = `New Enquiry — ${brandName} · Natura Walk Mall`
    const userSubject = enquiryType === 'visit'
      ? `Your site visit request — Natura Walk Mall · GVS Ventures`
      : `Your enquiry at Natura Walk Mall — GVS Ventures`

    // Email 1: Lead notification to N&G team (sent immediately on form submit)
    let ngOk = false
    try {
      const { error: ngErr } = await resend.emails.send({
        from,
        to: NG_EMAIL,
        subject: teamSubject,
        html: teamEmailHtml({ brandName, category, unitSize, contactName, phone, email, enquiryType }),
      })
      if (ngErr) {
        console.error('[natura-walk-enquiry] N&G email failed:', ngErr)
      } else {
        ngOk = true
      }
    } catch (err) {
      console.error('[natura-walk-enquiry] N&G email threw:', err)
    }

    // Email 2: Confirmation to the user who submitted
    let userOk = false
    try {
      const { error: userErr } = await resend.emails.send({
        from,
        to: email,
        replyTo: NG_EMAIL,
        subject: userSubject,
        html: userConfirmationHtml({ contactName, brandName, category, unitSize, enquiryType }),
      })
      if (userErr) {
        console.error('[natura-walk-enquiry] User confirmation email failed:', userErr)
      } else {
        userOk = true
      }
    } catch (err) {
      console.error('[natura-walk-enquiry] User confirmation email threw:', err)
    }

    // ── Save to DB (non-blocking) ─────────────────────────────────────────────
    insertGeneralEnquiry({
      source: 'natura-walk',
      brandName,
      contactName,
      email,
      phone,
      category,
      unitSize,
      enquiryType,
      notes: `Natura Walk Mall enquiry — ${enquiryType === 'visit' ? 'Site Visit Request' : 'Brand Onboarding'}`,
    }).catch(err => console.error('[natura-walk-enquiry] DB save error:', err))

    // Return success as long as at least the team notification went out
    if (!ngOk && !userOk) {
      return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
    }

    console.log(`[natura-walk-enquiry] Emails sent — ngOk:${ngOk} userOk:${userOk} brand:${brandName} type:${enquiryType}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[natura-walk-enquiry] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
