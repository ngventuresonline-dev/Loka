import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { sendPamCareersApplicationEmails } from '@/lib/careers-application-email'
import { supabaseAdmin } from '@/lib/supabase'
import type { Database } from '@/lib/supabase/client'

const MAX_BYTES = 5 * 1024 * 1024

function extFromFilename(name: string): 'pdf' | 'doc' | null {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.doc')) return 'doc'
  return null
}

function isAllowedResume(ext: 'pdf' | 'doc', mime: string): boolean {
  const m = mime.toLowerCase()
  if (m === 'application/octet-stream' || m === '') return true
  if (ext === 'pdf') return m === 'application/pdf'
  return m === 'application/msword'
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Expected multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await request.formData()

    const full_name = String(formData.get('full_name') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const current_city = String(formData.get('current_city') || '').trim()
    const experience_years = String(formData.get('experience_years') || '').trim()
    const why_this_role = String(formData.get('why_this_role') || '').trim()
    const hasTwo = formData.get('has_two_wheeler')
    const languagesRaw = formData.getAll('languages').map((v) => String(v).trim()).filter(Boolean)
    const current_company = String(formData.get('current_company') || '').trim()
    const current_ctc = String(formData.get('current_ctc') || '').trim()
    const expected_ctc = String(formData.get('expected_ctc') || '').trim()

    const resume = formData.get('resume')
    if (!(resume instanceof File)) {
      return NextResponse.json({ success: false, error: 'Resume file is required' }, { status: 400 })
    }

    if (
      !full_name ||
      !email ||
      !phone ||
      !current_city ||
      !current_company ||
      !current_ctc ||
      !expected_ctc ||
      !experience_years ||
      !why_this_role
    ) {
      return NextResponse.json({ success: false, error: 'Please fill all required fields' }, { status: 400 })
    }

    if (languagesRaw.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Select at least one language' },
        { status: 400 }
      )
    }

    if (hasTwo !== 'yes' && hasTwo !== 'no') {
      return NextResponse.json(
        { success: false, error: 'Please indicate if you have a two-wheeler' },
        { status: 400 }
      )
    }

    const has_two_wheeler = hasTwo === 'yes'

    if (resume.size === 0) {
      return NextResponse.json({ success: false, error: 'Resume file is empty' }, { status: 400 })
    }

    if (resume.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Resume must be 5MB or smaller' },
        { status: 400 }
      )
    }

    const ext = extFromFilename(resume.name)
    if (!ext) {
      return NextResponse.json(
        { success: false, error: 'Resume must be a PDF or DOC file' },
        { status: 400 }
      )
    }
    if (!isAllowedResume(ext, resume.type)) {
      return NextResponse.json(
        { success: false, error: 'Resume must be a PDF or DOC file' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()
    const filePath = `pam/${randomUUID()}.${ext}`
    const buffer = Buffer.from(await resume.arrayBuffer())

    const uploadContentType =
      ext === 'pdf' ? 'application/pdf' : resume.type === 'application/msword' ? resume.type : 'application/msword'

    const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, buffer, {
      contentType: uploadContentType,
      upsert: false,
    })

    if (uploadError) {
      console.error('[careers/apply] Storage upload failed:', uploadError.message)
      return NextResponse.json(
        { success: false, error: 'Could not upload resume. Please try again.' },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl: resume_url },
    } = supabase.storage.from('resumes').getPublicUrl(filePath)

    const row: Database['public']['Tables']['job_applications']['Insert'] = {
      full_name,
      email,
      phone,
      current_city,
      current_company,
      current_ctc,
      expected_ctc,
      experience_years,
      languages: languagesRaw,
      has_two_wheeler,
      why_this_role,
      resume_url,
    }

    const { error: insertError } = await supabase.from('job_applications').insert(row)

    if (insertError) {
      console.error('[careers/apply] DB insert failed:', insertError.message)
      await supabase.storage.from('resumes').remove([filePath]).catch(() => {})
      return NextResponse.json(
        { success: false, error: 'Could not save application. Please try again.' },
        { status: 500 }
      )
    }

    try {
      await sendPamCareersApplicationEmails({
        full_name,
        email,
        phone,
        current_city,
        current_company,
        current_ctc,
        expected_ctc,
        experience_years,
        languages: languagesRaw,
        has_two_wheeler,
        why_this_role,
        resume_url,
        resumeFilename: resume.name,
        resumeBuffer: buffer,
        resumeContentType: uploadContentType,
      })
    } catch (err) {
      console.error('[careers/apply] Email send error:', err)
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { success: false, error: 'Applications are temporarily unavailable.' },
        { status: 503 }
      )
    }
    console.error('[careers/apply]', message)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}
