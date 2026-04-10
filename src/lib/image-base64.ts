export const OWNER_IMAGE_MAX_BYTES = 1024 * 1024 // 1 MiB

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
