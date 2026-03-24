/**
 * Convert base64 data URLs to hosted URLs before property PATCH.
 * Uses admin API upload endpoint to avoid browser Supabase auth/RLS issues.
 */

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',')
  if (arr.length < 2) {
    throw new Error('Invalid image data')
  }
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], filename, { type: mime })
}

export async function uploadImagesViaAdminApi(files: File[], propertyId: string): Promise<string[]> {
  if (files.length === 0) return []
  const formData = new FormData()
  formData.append('propertyId', propertyId)
  files.forEach((f) => formData.append('files', f))

  const response = await fetch('/api/admin/properties/upload-images', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok || !Array.isArray(json.urls)) {
    throw new Error(json?.error || 'Failed to upload files')
  }
  return json.urls as string[]
}

export async function uploadImagesViaAdminApiWithAuth(
  files: File[],
  propertyId: string,
  user?: { id?: string; email?: string }
): Promise<string[]> {
  if (files.length === 0) return []
  const formData = new FormData()
  formData.append('propertyId', propertyId)
  files.forEach((f) => formData.append('files', f))

  const params = new URLSearchParams()
  if (user?.id) params.set('userId', user.id)
  if (user?.email) params.set('userEmail', encodeURIComponent(user.email))
  const qs = params.toString()

  const response = await fetch(
    `/api/admin/properties/upload-images${qs ? `?${qs}` : ''}`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include',
    }
  )
  const json = await response.json().catch(() => ({}))
  if (!response.ok || !Array.isArray(json.urls)) {
    throw new Error(json?.error || `Failed to upload files (${response.status})`)
  }
  return json.urls as string[]
}

/**
 * Replace any data: URLs with Supabase public URLs; keep http(s) URLs as-is.
 */
export async function resolvePropertyImagesForSave(
  images: string[],
  propertyId: string
): Promise<string[]> {
  const out: string[] = []
  const pendingFiles: File[] = []

  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    if (!img?.trim()) continue

    if (img.startsWith('data:')) {
      pendingFiles.push(dataUrlToFile(img, `img-${i}-${Date.now()}.jpg`))
    } else {
      out.push(img)
    }
  }

  if (pendingFiles.length > 0) {
    const uploaded = await uploadImagesViaAdminApi(pendingFiles, propertyId)
    out.push(...uploaded)
  }

  return out.filter(Boolean)
}
