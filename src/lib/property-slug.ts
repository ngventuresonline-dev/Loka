/**
 * Property slug utilities - encode/decode property IDs for user-facing URLs.
 * Hides internal IDs (e.g. prop-037) from public URLs.
 */

function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = (typeof btoa !== 'undefined' ? btoa(binary) : '')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(base64url: string): string {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  const padded = padding ? base64 + '='.repeat(4 - padding) : base64
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf-8')
  }
  const binary = typeof atob !== 'undefined' ? atob(padded) : ''
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

/**
 * Encode a property ID for use in public URLs.
 * prop-037 -> "cHJvcC0wMzc"
 */
export function encodePropertyId(id: string): string {
  if (!id) return ''
  try {
    return toBase64Url(id)
  } catch {
    return id
  }
}

/**
 * Decode a slug from URL back to the internal property ID.
 * Accepts both encoded slugs and raw ids (for backwards compatibility).
 */
export function decodePropertySlug(slugOrId: string): string {
  if (!slugOrId) return ''
  if (slugOrId.startsWith('prop-') || isValidUuid(slugOrId)) {
    return slugOrId
  }
  try {
    return fromBase64Url(slugOrId)
  } catch {
    return slugOrId
  }
}

function isValidUuid(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}
