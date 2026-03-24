/**
 * Convert base64 data URLs to hosted URLs before property PATCH.
 * Large data:image/... strings in JSON exceed typical host limits (413 Payload Too Large).
 */

import { uploadPropertyImage } from '@/lib/supabase/storage'

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

/**
 * Replace any data: URLs with Supabase public URLs; keep http(s) URLs as-is.
 */
export async function resolvePropertyImagesForSave(
  images: string[],
  propertyId: string
): Promise<string[]> {
  const out: string[] = []
  let uploadIndex = 0

  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    if (!img?.trim()) continue

    if (img.startsWith('data:')) {
      const file = dataUrlToFile(img, `img-${i}-${Date.now()}.jpg`)
      const r = await uploadPropertyImage(file, propertyId, uploadIndex++)
      if (!r.success || !r.url) {
        throw new Error(r.error || 'Failed to upload image')
      }
      out.push(r.url)
    } else {
      out.push(img)
    }
  }

  return out
}
