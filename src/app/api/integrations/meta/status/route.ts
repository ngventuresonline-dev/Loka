import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/integrations/meta/status
 * Confirms server-side env for Meta (no secrets returned). Use after deploy to verify Vercel/production config.
 */
export async function GET() {
  const publicPixelId = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim())
  const serverPixelId = Boolean(
    process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  )
  const capiToken = Boolean(process.env.META_ACCESS_TOKEN?.trim())

  return NextResponse.json({
    ok: true,
    /** Root layout will inject fbevents + PageView when this is true */
    pixelScriptWillLoadOnSite: publicPixelId,
    /** Conversions API can send server events when token + pixel id exist */
    conversionsApiReady: serverPixelId && capiToken,
    /** Set META_CAPI_TEST_EVENT_CODE while validating in Events Manager → Test events */
    capiTestMode: Boolean(process.env.META_CAPI_TEST_EVENT_CODE?.trim()),
  })
}
