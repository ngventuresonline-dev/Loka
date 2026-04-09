/**
 * Supabase Edge Function — invoke Lokazen reference enrichment for a single property.
 *
 * Deploy: `supabase functions deploy property-reference-enrich`
 *
 * Secrets (set in Supabase dashboard):
 *   LOKAZEN_BASE_URL   — e.g. https://www.lokazen.in
 *   LOKAZEN_ADMIN_SECRET — must match app ADMIN_SECRET
 *
 * Invoke (Database Webhook on `properties` UPDATE → status = approved, or manual):
 *   POST /functions/v1/property-reference-enrich
 *   { "propertyId": "<uuid>" }
 *
 * The function forwards to Next.js POST /api/internal/reference-enrich-property
 * so all SQL stays in one codebase (no duplicate business logic in Deno).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const base = Deno.env.get('LOKAZEN_BASE_URL')?.replace(/\/$/, '')
    const secret = Deno.env.get('LOKAZEN_ADMIN_SECRET')?.trim()
    if (!base || !secret) {
      return new Response(JSON.stringify({ error: 'Missing LOKAZEN_BASE_URL or LOKAZEN_ADMIN_SECRET' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json().catch(() => ({}))) as { propertyId?: string; record?: { id?: string } }
    const propertyId = body.propertyId || body.record?.id
    if (!propertyId || typeof propertyId !== 'string') {
      return new Response(JSON.stringify({ error: 'propertyId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch(`${base}/api/internal/reference-enrich-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ propertyId }),
    })

    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
