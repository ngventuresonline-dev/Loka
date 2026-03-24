/**
 * Context-grounded title/description generation for admin property tools (Gemini).
 * The legacy template helpers ignore most fields; this path uses full listing facts.
 */

import { generateText, isGoogleAIConfigured } from '@/lib/google-ai'
import { toAmenityArray } from '@/lib/property-description'

type DecimalLike = { toNumber: () => number }

export type PropertyFactsForListingAI = {
  title: string
  description: string | null
  address: string
  city: string
  state: string
  zipCode: string
  size: number
  propertyType: string
  price: DecimalLike | null
  priceType: string
  amenities: unknown
  availability: boolean | null
  powerBackup: boolean | null
  waterFacility: boolean | null
  storePowerCapacity: string | null
}

export { isGoogleAIConfigured }

function formatRent(price: DecimalLike | null, priceType: string): string {
  if (!price) return 'Not specified in data'
  const n = price.toNumber()
  if (priceType === 'yearly') {
    const perMonth = n / 12
    return `₹${Math.round(perMonth).toLocaleString('en-IN')}/month (yearly ₹${Math.round(n).toLocaleString('en-IN')})`
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}/month`
}

function buildFactsBlock(p: PropertyFactsForListingAI): string {
  const amenities = toAmenityArray(p.amenities as string[] | { features?: string[] } | null)
  const amenStr = amenities.length ? amenities.map((a) => String(a).trim()).join(', ') : 'None listed'

  const desc = (p.description || '').trim()
  const descSnippet = desc.length > 1200 ? `${desc.slice(0, 1200)}…` : desc || '(none)'

  return [
    `Current title: ${p.title}`,
    `Current description (may be empty; use for tone only, facts below win): ${descSnippet}`,
    `Address: ${p.address}`,
    `City: ${p.city}`,
    `State: ${p.state}`,
    `PIN: ${p.zipCode}`,
    `Property type: ${p.propertyType}`,
    `Size: ${p.size.toLocaleString('en-IN')} sq ft`,
    `Rent: ${formatRent(p.price, p.priceType)} (price type: ${p.priceType})`,
    `Listed as available: ${p.availability === false ? 'no' : 'yes'}`,
    `Amenities / notes: ${amenStr}`,
    `Power backup: ${p.powerBackup ? 'yes' : 'no'}`,
    `Water facility: ${p.waterFacility ? 'yes' : 'no'}`,
    `Store / electrical: ${p.storePowerCapacity?.trim() || 'not specified'}`,
  ].join('\n')
}

const TITLE_SYSTEM = `You write commercial real estate listing titles for Loka, an India-focused CRE platform.

Strict rules:
- Use ONLY information from the "Property facts" block. Do not invent road names, malls, metro stations, footfall numbers, or neighborhoods not present in those facts.
- You may combine address + city into a short location hint (e.g. area names that appear in the address line).
- Match the property type (retail, restaurant, office, warehouse, other) — do not call an office listing a "café".
- Length: 50–90 characters. Title case or sentence case. No ALL CAPS, no emoji, no hype words ("Amazing", "Best", "Don't miss").
- Output: a single line of plain text. No quotes, no JSON, no markdown.`

const DESC_SYSTEM = `You write commercial property listing descriptions for Loka, an India-focused CRE platform.

Strict rules:
- Ground every concrete claim in the "Property facts" block. Do not invent specific footfall, revenue, competitor names, or infrastructure not implied by the facts.
- You may use professional, generic language about suitability (e.g. "well suited for…") for the stated property type.
- Indian English, professional, 200–350 words. Use short paragraphs.
- Include size (sq ft), rent as stated, and location from address/city/state. If current description has useful detail, refine it without contradicting the facts.
- No markdown headings (#). Plain paragraphs and optional simple line breaks.`

function sanitizeTitle(raw: string): string {
  let t = raw.trim().replace(/^["']|["']$/g, '')
  const line = t.split(/\r?\n/)[0]?.trim() || t
  if (line.length > 255) return line.slice(0, 252).trim() + '…'
  return line
}

function sanitizeDescription(raw: string): string {
  let t = raw.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '')
  }
  return t.trim()
}

export async function generateAdminListingTitleAI(p: PropertyFactsForListingAI): Promise<string> {
  const facts = buildFactsBlock(p)
  const user = `Property facts:\n---\n${facts}\n---\n\nWrite one listing title following the rules.`
  const out = await generateText(user, {
    systemInstruction: TITLE_SYSTEM,
    maxTokens: 200,
    temperature: 0.4,
  })
  return sanitizeTitle(out)
}

export async function generateAdminListingDescriptionAI(p: PropertyFactsForListingAI): Promise<string> {
  const facts = buildFactsBlock(p)
  const user = `Property facts:\n---\n${facts}\n---\n\nWrite the listing description following the rules.`
  const out = await generateText(user, {
    systemInstruction: DESC_SYSTEM,
    maxTokens: 900,
    temperature: 0.55,
  })
  return sanitizeDescription(out)
}
