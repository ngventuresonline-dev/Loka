import type { SupabaseClient } from '@supabase/supabase-js'

export type ResumeFileExt = 'pdf' | 'doc' | 'docx'

/** Extension from filename only (lowercased). */
export function resumeExtFromFilename(name: string): ResumeFileExt | null {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'
  if (lower.endsWith('.doc')) return 'doc'
  return null
}

/** Canonical Content-Type for Storage — always derived from extension so mobile octet-stream uploads still work. */
export function canonicalResumeContentType(ext: ResumeFileExt): string {
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return 'application/msword'
}

/** Client/browser declared MIME is allowed for this extension (loose for mobile). */
export function resumeDeclaredMimeOk(ext: ResumeFileExt, fileType: string): boolean {
  const m = fileType.toLowerCase()
  if (m === 'application/octet-stream' || m === '') return true
  if (ext === 'pdf') return m === 'application/pdf'
  if (ext === 'docx') {
    return (
      m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      m === 'application/zip' ||
      m === 'application/x-zip-compressed'
    )
  }
  return m === 'application/msword'
}

/**
 * Body for Supabase Storage upload: File/Blob with explicit MIME so Storage does not infer wrong type from Buffer.
 */
export function buildResumeUploadBody(
  buffer: Buffer,
  originalName: string,
  ext: ResumeFileExt,
  contentType: string
): Blob | File {
  const safeName = (originalName || `resume.${ext}`).replace(/[^\w.\-()+ ]/g, '_').slice(0, 180) || `resume.${ext}`
  const slice = Buffer.from(buffer)
  if (typeof File !== 'undefined') {
    try {
      return new File([slice], safeName, { type: contentType })
    } catch {
      /* older runtimes */
    }
  }
  return new Blob([slice], { type: contentType })
}

const RESUMES_BUCKET = 'resumes'

/**
 * Best-effort: relax bucket MIME allowlist (fixes mobile uploads) and create bucket if missing.
 * `allowedMimeTypes: null` matches Supabase default “allow all”; the API still validates extensions.
 */
export async function ensureResumesBucket(supabase: SupabaseClient, maxBytes: number): Promise<void> {
  const { error: updErr } = await supabase.storage.updateBucket(RESUMES_BUCKET, {
    public: false,
    allowedMimeTypes: null,
    fileSizeLimit: maxBytes,
  })
  if (updErr && !/not\s*found|does not exist/i.test(updErr.message || '')) {
    console.warn('[careers-resume-storage] updateBucket resumes:', updErr.message)
  }

  const { error } = await supabase.storage.createBucket(RESUMES_BUCKET, {
    public: false,
    fileSizeLimit: maxBytes,
  })
  if (!error) return
  const msg = (error.message || '').toLowerCase()
  if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('resource already')) return
  console.warn('[careers-resume-storage] createBucket resumes:', error.message)
}

export async function uploadResumeToPamFolder(
  supabase: SupabaseClient,
  params: {
    filePath: string
    buffer: Buffer
    originalName: string
    ext: ResumeFileExt
    maxBytes: number
  }
): Promise<{ error: { message: string; status?: string } | null }> {
  await ensureResumesBucket(supabase, params.maxBytes)

  const contentType = canonicalResumeContentType(params.ext)
  const body = buildResumeUploadBody(params.buffer, params.originalName, params.ext, contentType)

  const first = await supabase.storage.from(RESUMES_BUCKET).upload(params.filePath, body, {
    contentType,
    upsert: false,
  })

  if (!first.error) return { error: null }

  const msg = first.error.message || ''
  const lower = msg.toLowerCase()
  if (lower.includes('bucket') && lower.includes('not found')) {
    await ensureResumesBucket(supabase, params.maxBytes)
    const second = await supabase.storage.from(RESUMES_BUCKET).upload(params.filePath, body, {
      contentType,
      upsert: false,
    })
    return { error: second.error }
  }

  return { error: first.error }
}

export function resumesPublicUrl(supabase: SupabaseClient, filePath: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(RESUMES_BUCKET).getPublicUrl(filePath)
  return publicUrl
}

export async function deleteResumeIfExists(supabase: SupabaseClient, filePath: string): Promise<void> {
  await supabase.storage.from(RESUMES_BUCKET).remove([filePath]).catch(() => {})
}
