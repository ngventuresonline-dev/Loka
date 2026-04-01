import type { Property } from '@/types/workflow'

const PLACEHOLDER_DESCRIPTIONS = new Set(['', 'details coming soon'])

/** True when the match page would show the synthetic fallback card instead of real listing data. */
export function isPlaceholderMatchProperty(p: Property | null | undefined): boolean {
  if (!p?.id) return true
  const title = (p.title || '').trim()
  const addr = (p.address || '').trim()
  const desc = (p.description || '').trim().toLowerCase()
  if (title === 'Property' || title === '') {
    if (!addr && PLACEHOLDER_DESCRIPTIONS.has(desc)) return true
  }
  return false
}

/** Convert a row from POST /api/properties/match into a full Property for the UI. */
export function propertyFromMatchPayload(raw: Record<string, unknown> | null | undefined): Property | null {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id || '')
  if (!id) return null

  const amenitiesRaw = raw.amenities
  let amenities: string[] = []
  if (Array.isArray(amenitiesRaw)) {
    amenities = amenitiesRaw.map((a) => String(a))
  } else if (amenitiesRaw && typeof amenitiesRaw === 'object' && Array.isArray((amenitiesRaw as { features?: unknown }).features)) {
    amenities = ((amenitiesRaw as { features: unknown[] }).features).map((a) => String(a))
  }

  let images: string[] = []
  const imgRaw = raw.images
  if (Array.isArray(imgRaw)) images = imgRaw.filter((x) => typeof x === 'string') as string[]

  const pt = String(raw.propertyType || 'other').toLowerCase()
  const propertyType = (['office', 'retail', 'warehouse', 'restaurant', 'other'].includes(pt) ? pt : 'other') as Property['propertyType']

  let price = 0
  const pr = raw.price
  if (typeof pr === 'number') price = pr
  else if (pr && typeof pr === 'object' && 'toNumber' in pr) price = (pr as { toNumber: () => number }).toNumber()
  else if (pr != null) price = Number(pr) || 0

  const priceTypeRaw = String(raw.priceType || 'monthly').toLowerCase()
  const priceType = (['monthly', 'yearly', 'sqft'].includes(priceTypeRaw) ? priceTypeRaw : 'monthly') as Property['priceType']

  return {
    id,
    title: String(raw.title || 'Listing'),
    description: String(raw.description || ''),
    address: String(raw.address || ''),
    city: String(raw.city || ''),
    state: String(raw.state || ''),
    zipCode: String(raw.zipCode || ''),
    price,
    priceType,
    size: Number(raw.size) || 0,
    propertyType,
    condition: 'good',
    amenities,
    accessibility: false,
    parking: false,
    publicTransport: false,
    ownerId: String(raw.ownerId || ''),
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)) : new Date(),
    updatedAt: raw.updatedAt ? new Date(String(raw.updatedAt)) : new Date(),
    isAvailable: raw.availability !== false && raw.isAvailable !== false,
    isFeatured: Boolean(raw.isFeatured),
    images,
    coordinates: (() => {
      const c = raw.coordinates
      if (!c || typeof c !== 'object') return undefined
      const lat = Number((c as { lat?: number }).lat)
      const lng = Number((c as { lng?: number }).lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
      return { lat, lng }
    })(),
  }
}

/** Join address parts for display; avoids ", Koramangala, ". */
export function formatPropertyAddressLine(p: Pick<Property, 'address' | 'city' | 'state'>): string {
  const parts = [p.address, p.city, p.state].map((s) => (s || '').trim()).filter(Boolean)
  return parts.join(', ')
}

/** Normalize GET /api/properties JSON into a client Property (handles Decimal, availability). */
export function propertyFromPublicApiJson(raw: Record<string, unknown> | null | undefined): Property | null {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id || '')
  if (!id) return null

  let price = 0
  const pr = raw.price
  if (typeof pr === 'number') price = pr
  else if (pr != null) price = Number(pr) || 0

  const priceTypeRaw = String(raw.priceType || 'monthly').toLowerCase()
  const priceType = (['monthly', 'yearly', 'sqft'].includes(priceTypeRaw) ? priceTypeRaw : 'monthly') as Property['priceType']

  const pt = String(raw.propertyType || 'other').toLowerCase()
  const propertyType = (['office', 'retail', 'warehouse', 'restaurant', 'other'].includes(pt) ? pt : 'other') as Property['propertyType']

  const amenitiesRaw = raw.amenities
  const amenities = Array.isArray(amenitiesRaw) ? amenitiesRaw.map((a) => String(a)) : []

  const imagesRaw = raw.images
  const images = Array.isArray(imagesRaw) ? (imagesRaw.filter((x) => typeof x === 'string') as string[]) : []

  const avail = raw.availability
  const isAvailable = avail !== false && raw.isAvailable !== false

  return {
    id,
    title: String(raw.title || 'Listing'),
    description: String(raw.description || ''),
    address: String(raw.address || ''),
    city: String(raw.city || ''),
    state: String(raw.state || ''),
    zipCode: String(raw.zipCode || ''),
    price,
    priceType,
    size: Number(raw.size) || 0,
    propertyType,
    condition: 'good',
    amenities,
    accessibility: false,
    parking: false,
    publicTransport: false,
    ownerId: String(raw.ownerId || ''),
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)) : new Date(),
    updatedAt: raw.updatedAt ? new Date(String(raw.updatedAt)) : new Date(),
    isAvailable,
    isFeatured: Boolean(raw.isFeatured),
    images,
    coordinates:
      raw.coordinates && typeof raw.coordinates === 'object'
        ? (() => {
            const lat = Number((raw.coordinates as { lat?: number }).lat)
            const lng = Number((raw.coordinates as { lng?: number }).lng)
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
            return { lat, lng }
          })()
        : undefined,
  }
}
