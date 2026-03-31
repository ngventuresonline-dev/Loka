import Anthropic from '@anthropic-ai/sdk'
import type { BrandInsightsStored } from '@/lib/ai/brand-insights-types'

export type { BrandInsightsStored } from '@/lib/ai/brand-insights-types'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620'

function parseInsightsJson(text: string): BrandInsightsStored | null {
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    const market_pulse = Array.isArray(o.market_pulse)
      ? o.market_pulse.map((x) => String(x)).filter(Boolean).slice(0, 5)
      : []
    const property_recommendations = Array.isArray(o.property_recommendations)
      ? (o.property_recommendations as unknown[])
          .map((r) => {
            if (!r || typeof r !== 'object') return null
            const p = r as Record<string, unknown>
            return {
              property_id: String(p.property_id ?? ''),
              title: String(p.title ?? ''),
              reasoning: String(p.reasoning ?? ''),
            }
          })
          .filter((x): x is NonNullable<typeof x> =>
            x !== null && Boolean(x.title || x.property_id)
          )
          .slice(0, 5)
      : []
    const za = o.zone_alerts
    let zone_alerts: BrandInsightsStored['zone_alerts'] = {
      type: 'new_listing',
      headline: 'Zone watch',
      detail: 'No alert parsed.',
    }
    if (za && typeof za === 'object') {
      const z = za as Record<string, unknown>
      zone_alerts = {
        type: String(z.type ?? 'new_listing'),
        headline: String(z.headline ?? ''),
        detail: String(z.detail ?? ''),
      }
    }
    return {
      market_pulse: market_pulse.length >= 3 ? market_pulse.slice(0, 3) : market_pulse,
      property_recommendations: property_recommendations.slice(0, 3),
      zone_alerts,
    }
  } catch {
    return null
  }
}

export async function generateBrandInsightsWithClaude(input: {
  brandContext: Record<string, unknown>
  propertiesContext: Array<Record<string, unknown>>
}): Promise<BrandInsightsStored | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    console.error('[BrandInsights] ANTHROPIC_API_KEY missing')
    return null
  }

  const anthropic = new Anthropic({ apiKey: key })

  const userPayload = JSON.stringify(
    {
      brand: input.brandContext,
      available_properties: input.propertiesContext,
    },
    null,
    2
  )

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are Lokazen’s retail real-estate intelligence assistant for brands expanding in India (especially Bengaluru).

Using ONLY the JSON data below (do not invent specific addresses or prices not implied by the data), produce a single JSON object with this exact shape and keys:
{
  "market_pulse": [ "string", "string", "string" ],
  "property_recommendations": [
    { "property_id": "id from list", "title": "short title", "reasoning": "why it fits this brand" }
  ],
  "zone_alerts": {
    "type": "new_listing" | "price_drop" | "competitor_opened",
    "headline": "one short headline",
    "detail": "one sentence"
  }
}

Rules:
- market_pulse: exactly 3 concise bullets about demand, competition, or footfall for the brand’s target zones (infer from preferred_locations and property cities).
- property_recommendations: exactly 3 items; property_id MUST be copied from available_properties[].id.
- zone_alerts: one plausible scenario given the listings (e.g. new supply in a zone, relative value, or competitive intensity). Use type competitor_opened if saturation/competition is the main signal.

Output ONLY valid JSON, no markdown fences.

DATA:
${userPayload}`,
      },
    ],
  })

  const block = message.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') return null
  return parseInsightsJson(block.text)
}
