import { createHash, randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'

const GRAPH_VERSION = 'v21.0'

let missingConfigLogged = false

function sha256HexUtf8(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase(), 'utf8').digest('hex')
}

/** Meta: normalize email (lowercase + trim) then SHA256 hex. */
export function hashEmailForMeta(email: string | null | undefined): string | null {
  if (!email) return null
  const e = email.trim().toLowerCase()
  if (!e || e.includes('@placeholder.email')) return null
  return sha256HexUtf8(e)
}

/** Meta: digits only; default India +91 for 10-digit local numbers. */
export function hashPhoneForMeta(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  const normalized = digits.length === 10 ? `91${digits}` : digits
  return createHash('sha256').update(normalized, 'utf8').digest('hex')
}

export function hashExternalIdForMeta(id: string | null | undefined): string | null {
  if (!id) return null
  return sha256HexUtf8(id)
}

export function getClientIpFromRequest(request: NextRequest): string | undefined {
  const xf = request.headers.get('x-forwarded-for')
  if (xf) {
    const first = xf.split(',')[0]?.trim()
    if (first) return first
  }
  const vercel = request.headers.get('x-vercel-forwarded-for')
  if (vercel) {
    const first = vercel.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  const cf = request.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf
  return undefined
}

export function eventSourceUrlFromRequest(request: NextRequest): string | undefined {
  const ref = request.headers.get('referer')?.trim()
  if (ref) return ref.slice(0, 512)
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (base) return `${base}/`
  return undefined
}

export type MetaPropertyListingKind = 'create' | 'update'

export function metaStandardEventForPropertyListing(
  kind: MetaPropertyListingKind,
  priceMonthly: number
): { event_name: 'Purchase' | 'Lead'; custom_data: Record<string, unknown> } {
  if (kind === 'update') {
    return {
      event_name: 'Lead',
      custom_data: {
        content_name: 'property_listing_updated',
        content_category: 'listing',
        content_type: 'product',
      },
    }
  }
  if (priceMonthly > 0) {
    return {
      event_name: 'Purchase',
      custom_data: {
        value: priceMonthly,
        currency: 'INR',
        content_type: 'product',
      },
    }
  }
  return {
    event_name: 'Lead',
    custom_data: {
      content_name: 'property_listed',
      content_category: 'listing',
      content_type: 'product',
    },
  }
}

export function buildMetaUserDataForRequest(
  request: NextRequest,
  input: {
    email?: string | null
    phone?: string | null
    ownerUserId?: string | null
    fbp?: string | null
    fbc?: string | null
  }
): Record<string, unknown> {
  const user_data: Record<string, unknown> = {}

  const ip = getClientIpFromRequest(request)
  if (ip) user_data.client_ip_address = ip

  const ua = request.headers.get('user-agent')
  if (ua) user_data.client_user_agent = ua.slice(0, 512)

  const em = hashEmailForMeta(input.email ?? undefined)
  if (em) user_data.em = [em]

  const ph = hashPhoneForMeta(input.phone ?? undefined)
  if (ph) user_data.ph = [ph]

  const ext = hashExternalIdForMeta(input.ownerUserId ?? undefined)
  if (ext) user_data.external_id = [ext]

  const fbp = (input.fbp || request.cookies.get('_fbp')?.value)?.trim()
  if (fbp) user_data.fbp = fbp.slice(0, 256)

  const fbc = (input.fbc || request.cookies.get('_fbc')?.value)?.trim()
  if (fbc) user_data.fbc = fbc.slice(0, 256)

  return user_data
}

/**
 * Sends one server event to Meta Conversions API (Graph).
 * Fire-and-forget from route handlers; await only in tests if needed.
 */
export async function sendMetaCapiEvent(params: {
  eventName: string
  eventId: string
  eventSourceUrl?: string
  userData: Record<string, unknown>
  customData?: Record<string, unknown>
}): Promise<{ ok: boolean; status?: number }> {
  const pixelId =
    process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  const accessToken = process.env.META_ACCESS_TOKEN?.trim()

  if (!pixelId || !accessToken) {
    if (!missingConfigLogged && process.env.NODE_ENV === 'development') {
      missingConfigLogged = true
      console.warn(
        '[Meta CAPI] Missing META_ACCESS_TOKEN and/or META_PIXEL_ID (or NEXT_PUBLIC_META_PIXEL_ID). Server conversions are skipped.'
      )
    }
    return { ok: false }
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: 'website',
        event_source_url: params.eventSourceUrl,
        user_data: params.userData,
        custom_data: params.customData,
      },
    ],
    access_token: accessToken,
  }

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim()
  if (testCode) {
    payload.test_event_code = testCode
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('[Meta CAPI] Graph error', res.status, text.slice(0, 500))
      return { ok: false, status: res.status }
    }
    return { ok: true, status: res.status }
  } catch (e) {
    console.warn('[Meta CAPI] Request failed', e)
    return { ok: false }
  }
}

export function newMetaEventId(): string {
  return randomUUID()
}

/** Prisma Decimal or number → monthly rent for CAPI `value` / matching logic. */
export function monthlyPriceToNumber(price: unknown): number {
  if (price == null) return 0
  if (typeof price === 'number' && Number.isFinite(price)) return price
  if (typeof price === 'object' && price !== null && 'toNumber' in price) {
    const n = (price as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(price)
  return Number.isFinite(n) ? n : 0
}

/**
 * Owner listing create/update — server-side conversion for Ads Manager + optional dedupe with browser pixel.
 */
export function fireOwnerPropertyMetaConversion(
  request: NextRequest,
  input: {
    kind: MetaPropertyListingKind
    propertyId: string
    ownerUserId: string
    priceMonthly: number
    ownerEmail?: string | null
    ownerPhone?: string | null
    metaFbp?: string | null
    metaFbc?: string | null
  }
): string {
  const eventId = newMetaEventId()
  const { event_name, custom_data } = metaStandardEventForPropertyListing(input.kind, input.priceMonthly)

  const userData = buildMetaUserDataForRequest(request, {
    email: input.ownerEmail,
    phone: input.ownerPhone,
    ownerUserId: input.ownerUserId,
    fbp: input.metaFbp,
    fbc: input.metaFbc,
  })

  const customData = {
    ...custom_data,
    content_ids: [input.propertyId],
  }

  void sendMetaCapiEvent({
    eventName: event_name,
    eventId,
    eventSourceUrl: eventSourceUrlFromRequest(request),
    userData,
    customData,
  })

  return eventId
}
