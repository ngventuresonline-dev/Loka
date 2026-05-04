import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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

  return NextResponse.json({ success: true })
}
