import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getFrom, getResend, NG_EMAIL } from '@/lib/lead-email'

const ALLOWED_CODES = new Set(['P1', 'P2', 'P3', 'P5', 'P6', 'BH-RD3'])

const RENT_OK = new Set(['yes', 'no', 'negotiate', 'unsure'])
const SIZE_OK = new Set(['yes', 'no', 'too_small', 'too_large', 'unsure'])
const VIS_OK = new Set(['yes', 'no', 'unsure'])
const OVERALL = new Set(['shortlist', 'maybe', 'pass'])

function optEnum<T extends string>(v: unknown, allowed: Set<string>): T | null {
  if (v === null || v === undefined || v === '') return null
  const s = String(v).trim().toLowerCase()
  if (!allowed.has(s)) return null
  return s as T
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function dash(v: string | null | undefined): string {
  return v == null || v === '' ? '—' : escapeHtml(v)
}

function buildFeedbackEmailHtml(params: {
  brand_slug: string
  property_code: string
  property_name: string
  submittedIst: string
  rent_ok: string | null
  size_ok: string | null
  visibility_ok: string | null
  overall_verdict: string | null
  feedback_html: string
  submitter_html: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:#111;line-height:1.5;">
  <h2 style="margin:0 0 16px;font-size:20px;">New brand feedback received</h2>
  <p style="margin:0 0 20px;"><strong>Brand:</strong> ${escapeHtml(params.brand_slug)}<br/>
     <strong>Property:</strong> ${escapeHtml(params.property_code)} — ${escapeHtml(params.property_name)}<br/>
     <strong>Submitted:</strong> ${escapeHtml(params.submittedIst)} IST</p>

  <h3 style="margin:24px 0 8px;font-size:16px;">Verdicts</h3>
  <ul style="margin:0;padding-left:20px;">
    <li>Rent: ${dash(params.rent_ok)}</li>
    <li>Size: ${dash(params.size_ok)}</li>
    <li>Visibility: ${dash(params.visibility_ok)}</li>
    <li>Overall: ${dash(params.overall_verdict)}</li>
  </ul>

  <h3 style="margin:24px 0 8px;font-size:16px;">Notes</h3>
  <p style="margin:0;">${params.feedback_html}</p>

  <h3 style="margin:24px 0 8px;font-size:16px;">Submitter</h3>
  <p style="margin:0;">${params.submitter_html}</p>

  <hr style="margin:28px 0 16px;border:none;border-top:1px solid #ddd"/>
  <p style="margin:0;font-size:12px;color:#888">
    Recorded in Supabase → brand_property_feedback. View all submissions in the Lokazen
    Supabase dashboard.
  </p>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const brand_slug = String(body.brand_slug ?? '').trim()
  const property_code = String(body.property_code ?? '').trim()
  const property_name = String(body.property_name ?? '').trim()

  if (!brand_slug) {
    return NextResponse.json({ success: false, error: 'brand_slug is required' }, { status: 400 })
  }
  if (!property_code || !ALLOWED_CODES.has(property_code)) {
    return NextResponse.json({ success: false, error: 'property_code is required' }, { status: 400 })
  }

  const rent_ok = optEnum(body.rent_ok, RENT_OK)
  const size_ok = optEnum(body.size_ok, SIZE_OK)
  const visibility_ok = optEnum(body.visibility_ok, VIS_OK)
  const overall_verdict = optEnum(body.overall_verdict, OVERALL)

  const feedback_text =
    typeof body.feedback_text === 'string' && body.feedback_text.trim()
      ? body.feedback_text.trim().slice(0, 8000)
      : null

  const submitter_name =
    typeof body.submitter_name === 'string' && body.submitter_name.trim()
      ? body.submitter_name.trim().slice(0, 200)
      : null
  const submitter_role =
    typeof body.submitter_role === 'string' && body.submitter_role.trim()
      ? body.submitter_role.trim().slice(0, 200)
      : null

  const submitter =
    submitter_name || submitter_role ? { name: submitter_name, role: submitter_role } : null

  const supabase = createServerClient(false)

  const row = {
    brand_slug,
    property_code,
    property_name: property_name || property_code,
    rent_ok,
    size_ok,
    visibility_ok,
    overall_verdict,
    feedback_text,
    submitter,
  }

  const { error } = await supabase.from('brand_property_feedback').insert(row)

  if (error) {
    console.error('[brand-feedback]', error)
    return NextResponse.json(
      { success: false, error: 'Could not save feedback. Please try again.' },
      { status: 500 }
    )
  }

  const property_name_display = property_name || property_code
  const submittedIst = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  const notesBody = feedback_text
    ? escapeHtml(feedback_text).replace(/\r?\n/g, '<br/>')
    : '—'

  const submitterBody = `${submitter_name ? escapeHtml(submitter_name) : 'Anonymous'}${
    submitter_role ? ` · ${escapeHtml(submitter_role)}` : ''
  }`

  const resend = getResend()
  if (resend) {
    try {
      const html = buildFeedbackEmailHtml({
        brand_slug,
        property_code,
        property_name: property_name_display,
        submittedIst,
        rent_ok,
        size_ok,
        visibility_ok,
        overall_verdict,
        feedback_html: notesBody,
        submitter_html: submitterBody,
      })
      const { error: emailErr } = await resend.emails.send({
        from: getFrom(),
        to: NG_EMAIL,
        subject: `Feedback · ${brand_slug} · ${property_code}`,
        html,
      })
      if (emailErr) {
        console.error('[brand-feedback] Resend notification failed:', emailErr)
      }
    } catch (emailEx) {
      console.error('[brand-feedback] Resend notification threw:', emailEx)
    }
  } else {
    console.warn('[brand-feedback] RESEND_API_KEY not set — email notification skipped')
  }

  return NextResponse.json({ success: true })
}
