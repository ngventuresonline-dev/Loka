/** Per-image cap for owner onboarding (inline base64). */
export const OWNER_IMAGE_MAX_BYTES = 5 * 1024 * 1024 // 5 MiB
/** Max photos per listing. */
export const OWNER_IMAGE_MAX_COUNT = 10
/** Total size cap across all photos (approximate, pre-encode). */
export const OWNER_IMAGE_TOTAL_MAX_BYTES = 50 * 1024 * 1024 // 50 MiB

/** Per-video cap (short clips as data URLs). */
export const OWNER_VIDEO_MAX_BYTES = 50 * 1024 * 1024 // 50 MiB
export const OWNER_VIDEO_MAX_COUNT = 2

export function readFileAsDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`File exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') resolve(r)
      else reject(new Error('Failed to read file'))
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function imageFilesToDataUrls(
  files: File[],
  maxBytes: number = OWNER_IMAGE_MAX_BYTES
): Promise<{ dataUrls: string[]; oversizeNames: string[] }> {
  const oversizeNames: string[] = []
  const eligible: File[] = []
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    if (f.size > maxBytes) {
      oversizeNames.push(f.name)
      continue
    }
    eligible.push(f)
  }
  const dataUrls = await Promise.all(eligible.map((f) => readFileAsDataUrl(f, maxBytes)))
  return { dataUrls, oversizeNames }
}

export async function videoFilesToDataUrls(
  files: File[],
  maxBytes: number = OWNER_VIDEO_MAX_BYTES
): Promise<{ dataUrls: string[]; oversizeNames: string[] }> {
  const oversizeNames: string[] = []
  const eligible: File[] = []
  for (const f of files) {
    if (!f.type.startsWith('video/')) continue
    if (f.size > maxBytes) {
      oversizeNames.push(f.name)
      continue
    }
    eligible.push(f)
  }
  const dataUrls = await Promise.all(eligible.map((f) => readFileAsDataUrl(f, maxBytes)))
  return { dataUrls, oversizeNames }
}
