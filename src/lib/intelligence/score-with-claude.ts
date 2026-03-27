import claude, { CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude'

export type MatchRecommendation = 'strong_match' | 'good_match' | 'possible' | 'not_recommended'

export interface ClaudeMatchScore {
  bfiScore: number
  pfiScore: number
  matchScore: number
  reasoning: string
  keyStrengths: string[]
  keyRisks: string[]
  recommendation: MatchRecommendation
}

export interface BrandInput {
  name: string
  category: string
  minSize: number
  maxSize: number
  budgetMin: number
  budgetMax: number
  preferredLocalities: string[]
  targetAudience?: string
}

export interface PropertyForScoring {
  id: string
  title: string
  address: string
  city: string
  size: number
  price: number | string
  priceType: string
  propertyType: string
  footfallIndicators?: {
    dailyFootfall?: number
    peakHours?: string
    weekendBoost?: number
  } | null
  competitorDensity?: number | null
  demographics?: {
    medianIncome?: number
    age25_44Percent?: number
    workingPopPercent?: number
    diningOutPerWeek?: number
    spendingPowerIndex?: number | null
  } | null
}

function buildScoringPrompt(brand: BrandInput, property: PropertyForScoring): string {
  const monthlyRent = (() => {
    const price = Number(property.price)
    if (property.priceType === 'yearly') return Math.round(price / 12)
    if (property.priceType === 'sqft') return Math.round(price * property.size)
    return price
  })()

  const footfallStr = property.footfallIndicators
    ? `Daily footfall: ${property.footfallIndicators.dailyFootfall ?? 'N/A'}, Peak hours: ${property.footfallIndicators.peakHours ?? 'N/A'}, Weekend boost: ${property.footfallIndicators.weekendBoost ?? 'N/A'}%`
    : 'Footfall data not available'

  const demogStr = property.demographics
    ? `Median income: ₹${property.demographics.medianIncome?.toLocaleString() ?? 'N/A'}/yr, Age 25-44: ${property.demographics.age25_44Percent !== undefined ? `${(property.demographics.age25_44Percent * 100).toFixed(1)}%` : 'N/A'}, Working pop: ${property.demographics.workingPopPercent !== undefined ? `${(property.demographics.workingPopPercent * 100).toFixed(1)}%` : 'N/A'}, Dining out: ${property.demographics.diningOutPerWeek ?? 'N/A'}x/week, Spending power index: ${property.demographics.spendingPowerIndex ?? 'N/A'}`
    : 'Demographics data not available'

  return `You are a senior commercial real estate analyst for Lokazen. Score the match between the following brand and property.

BRAND PROFILE:
Name: ${brand.name}
Category: ${brand.category}
Required size: ${brand.minSize}–${brand.maxSize} sq ft
Monthly budget: ₹${brand.budgetMin.toLocaleString()}–₹${brand.budgetMax.toLocaleString()}
Preferred localities: ${brand.preferredLocalities.join(', ') || 'Flexible'}
Target audience: ${brand.targetAudience ?? 'Not specified'}

PROPERTY PROFILE:
Title: ${property.title}
Location: ${property.address}, ${property.city}
Type: ${property.propertyType}
Size: ${property.size} sq ft
Monthly rent: ₹${monthlyRent.toLocaleString()}
Competitor density within 1km: ${property.competitorDensity ?? 'N/A'} outlets
${footfallStr}
Catchment demographics: ${demogStr}

Score this match and return a JSON object:
{
  "bfiScore": <number 0-100: how well the property fits this brand's requirements>,
  "pfiScore": <number 0-100: how well this brand fits the property's catchment profile>,
  "matchScore": <number 0-100: overall compatibility score>,
  "reasoning": "<2-3 sentences explaining the core match rationale>",
  "keyStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "keyRisks": ["<risk 1>", "<risk 2>"],
  "recommendation": "<one of: strong_match | good_match | possible | not_recommended>"
}

Scoring guide:
- bfiScore: weight size fit 30%, budget fit 30%, location fit 25%, property type fit 15%
- pfiScore: weight catchment income vs brand's ticket size 30%, footfall vs brand's ideal 25%, competitor saturation (lower = better for new entrant) 25%, demographics match with target audience 20%
- matchScore: average of bfiScore and pfiScore, adjusted for any dealbreaker factors
- strong_match: matchScore >= 75. good_match: 55-74. possible: 40-54. not_recommended: < 40

Rules:
- Return ONLY the raw JSON object. No markdown, no code fences, no preamble.
- keyStrengths must have exactly 3 items. keyRisks must have exactly 2 items.
- Be precise and data-driven. Refer to specific numbers from the data above.`
}

export async function scoreWithClaude(
  brand: BrandInput,
  property: PropertyForScoring
): Promise<ClaudeMatchScore> {
  const prompt = buildScoringPrompt(brand, property)

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS.scoring,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  let parsed: ClaudeMatchScore
  try {
    parsed = JSON.parse(rawText)
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Claude did not return valid JSON for match scoring')
    }
    parsed = JSON.parse(jsonMatch[0])
  }

  return {
    bfiScore: Math.max(0, Math.min(100, Math.round(Number(parsed.bfiScore)))),
    pfiScore: Math.max(0, Math.min(100, Math.round(Number(parsed.pfiScore)))),
    matchScore: Math.max(0, Math.min(100, Math.round(Number(parsed.matchScore)))),
    reasoning: String(parsed.reasoning ?? ''),
    keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths.map(String) : [],
    keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks.map(String) : [],
    recommendation: parsed.recommendation ?? 'possible',
  }
}
