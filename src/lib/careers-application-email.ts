import { sendEmail } from '@/lib/email-service'

const DEFAULT_ADMIN_EMAIL = 'ngventuresonline@gmail.com'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type PamApplicationEmailPayload = {
  full_name: string
  email: string
  phone: string
  current_city: string
  current_company: string | null
  current_ctc: string | null
  expected_ctc: string | null
  experience_years: string
  languages: string[]
  has_two_wheeler: boolean
  why_this_role: string | null
  resume_url: string
  resumeFilename: string
  resumeBuffer: Buffer
  resumeContentType: string
}

function safeAttachmentFilename(name: string, contentType: string): string {
  const base =
    name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 120) || 'resume'
  if (base.toLowerCase().endsWith('.pdf') || base.toLowerCase().endsWith('.doc')) return base
  return contentType.includes('pdf') ? `${base}.pdf` : `${base}.doc`
}

/**
 * Sends applicant confirmation and admin notification (with resume attachment) for PAM careers form.
 * Uses RESEND_API_KEY / RESEND_FROM. Admin inbox: CAREERS_ADMIN_EMAIL or ngventuresonline@gmail.com.
 */
export async function sendPamCareersApplicationEmails(
  p: PamApplicationEmailPayload
): Promise<{ applicantOk: boolean; adminOk: boolean }> {
  const adminTo = (process.env.CAREERS_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim()
  const firstName = p.full_name.split(/\s+/)[0] || 'there'

  const candidateHtml = `<!DOCTYPE html><html><body style="font-family:system-ui,Segoe UI,sans-serif;background:#0f0e0d;color:#f5f5f4;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#1a1917;border:1px solid #2c2c2a;border-radius:12px;padding:28px;">
    <p style="color:#FF5200;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 16px;">Lokazen Careers</p>
    <h1 style="color:#fff;font-size:22px;margin:0 0 12px;">Hi ${esc(firstName)}, we received your application</h1>
    <p style="color:#a3a3a3;line-height:1.6;margin:0 0 16px;">Thank you for applying for the <strong style="color:#fff;">Property Acquisition Manager</strong> role in Bangalore. Our team will review your profile and resume.</p>
    <p style="color:#a3a3a3;line-height:1.6;margin:0;">We aim to respond within <strong style="color:#fff;">3 working days</strong>. Questions? Reply to this email or write to <a href="mailto:support@lokazen.in" style="color:#FF5200;">support@lokazen.in</a>.</p>
    <p style="color:#737373;font-size:13px;margin:24px 0 0;">— Lokazen · N&amp;G Ventures</p>
  </div>
</body></html>`

  const candidateText = `Hi ${firstName},

Thank you for applying for the Property Acquisition Manager role at Lokazen. We received your application and will review it shortly.

We aim to respond within 3 working days.

— Lokazen
support@lokazen.in`

  const rows: [string, string][] = [
    ['Full name', p.full_name],
    ['Email', p.email],
    ['Phone', p.phone],
    ['Current city', p.current_city],
    ['Current company', p.current_company ?? '—'],
    ['Current CTC', p.current_ctc ?? '—'],
    ['Expected CTC', p.expected_ctc ?? '—'],
    ['Experience (sales / RE / BD)', p.experience_years],
    ['Languages', p.languages.join(', ')],
    ['Two-wheeler', p.has_two_wheeler ? 'Yes' : 'No'],
    ['Why this role', p.why_this_role ?? '—'],
    ['Resume file (Supabase)', p.resume_url],
  ]

  const adminRowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 14px;border:1px solid #2c2c2a;color:#a3a3a3;width:38%;vertical-align:top;">${esc(k)}</td><td style="padding:10px 14px;border:1px solid #2c2c2a;color:#fafaf9;word-break:break-word;">${esc(v)}</td></tr>`
    )
    .join('')

  const adminHtml = `<!DOCTYPE html><html><body style="font-family:system-ui,Segoe UI,sans-serif;background:#0f0e0d;color:#f5f5f4;padding:20px;">
<h1 style="color:#fff;font-size:18px;margin:0 0 4px;">New PAM application</h1>
<p style="color:#a3a3a3;font-size:14px;margin:0 0 16px;">Property Acquisition Manager · careers form</p>
<table style="border-collapse:collapse;width:100%;max-width:720px;margin-top:8px;font-size:14px;">${adminRowsHtml}</table>
<p style="color:#a3a3a3;font-size:13px;margin-top:16px;">Resume is attached. Storage URL: <a href="${esc(p.resume_url)}" style="color:#FF5200;">${esc(p.resume_url)}</a></p>
</body></html>`

  const adminText =
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nResume (download if needed): ${p.resume_url}\nAttached file: ${p.resumeFilename}`

  const attachmentFilename = safeAttachmentFilename(p.resumeFilename, p.resumeContentType)

  const [applicantRes, adminRes] = await Promise.all([
    sendEmail({
      to: p.email,
      subject: 'We received your Lokazen application — Property Acquisition Manager',
      html: candidateHtml,
      text: candidateText,
      replyTo: 'support@lokazen.in',
    }),
    sendEmail({
      to: adminTo,
      subject: `[Lokazen Careers] PAM application — ${p.full_name}`,
      html: adminHtml,
      text: adminText,
      replyTo: p.email,
      attachments: [
        {
          filename: attachmentFilename,
          content: p.resumeBuffer,
          contentType: p.resumeContentType,
        },
      ],
    }),
  ])

  if (!applicantRes.success) {
    console.error('[careers-email] Applicant confirmation failed:', applicantRes.error)
  }
  if (!adminRes.success) {
    console.error('[careers-email] Admin notification failed:', adminRes.error)
  }

  return { applicantOk: applicantRes.success, adminOk: adminRes.success }
}
