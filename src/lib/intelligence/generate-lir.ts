import claude, { CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude'

export interface LIRReport {
  overviewSummary: string
  catchmentAnalysis: string
  marketLandscape: string
  competitorAnalysis: string
  riskAssessment: {
    risks: Array<{ title: string; description: string; severity: 'low' | 'medium' | 'high' }>
    opportunities: Array<{ title: string; description: string }>
  }
  recommendedCategories: string[]
  lokazensVerdict: string
  generatedAt: string
}

export interface PropertyInput {
  id: string
  title: string
  address: string
  city: string
  state: string
  size: number
  price: number | string
  priceType: string
  propertyType: string
  amenities?: unknown
  storePowerCapacity?: string | null
  powerBackup?: boolean | null
  waterFacility?: boolean | null
}

export interface WardDemographicsInput {
  wardCode?: string
  wardName?: string
  locality?: string
  city?: string
  population2021?: number
  population2026?: number
  populationDensity?: number
  populationGrowth?: number
  age25_34?: number
  age35_44?: number
  medianIncome?: number
  workingPopulation?: number
  itProfessionals?: number
  diningOutPerWeek?: number
  spendingPowerIndex?: number | null
  commercialRentMin?: number | null
  commercialRentMax?: number | null
  dominantAgeGroup?: string | null
  primaryResidentType?: string | null
}

export interface CompetitorInput {
  name: string
  category: string
  distance: number
  rating?: number | null
  reviewCount?: number | null
  priceLevel?: number | null
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function isCacheValid(generatedAt: Date | null | undefined): boolean {
  if (!generatedAt) return false
  return Date.now() - new Date(generatedAt).getTime() < SEVEN_DAYS_MS
}

function buildLIRPrompt(
  property: PropertyInput,
  demographics: WardDemographicsInput | null,
  competitors: CompetitorInput[]
): string {
  const amenitiesStr = (() => {
    try {
      if (!property.amenities) return 'Not specified'
      if (Array.isArray(property.amenities)) return property.amenities.join(', ')
      if (typeof property.amenities === 'object') {
        const a = property.amenities as Record<string, unknown>
        return Object.values(a).flat().join(', ')
      }
      return String(property.amenities)
    } catch {
      return 'Not specified'
    }
  })()

  const top10Competitors = competitors.slice(0, 10)
  const competitorLines = top10Competitors.length > 0
    ? top10Competitors.map(c =>
        `  - ${c.name} (${c.category}), ${c.distance}m away${c.rating ? `, rating: ${c.rating}` : ''}${c.priceLevel ? `, price level: ${c.priceLevel}/4` : ''}`
      ).join('\n')
    : '  No competitor data available'

  const demogLines = demographics ? `
Ward/Locality: ${demographics.wardName ?? 'N/A'}, ${demographics.locality ?? 'N/A'}
Population (2026 projected): ${demographics.population2026?.toLocaleString() ?? 'N/A'}
Population density: ${demographics.populationDensity?.toLocaleString() ?? 'N/A'} per sq km
Population growth rate: ${demographics.populationGrowth !== undefined ? `${demographics.populationGrowth}% per year` : 'N/A'}
Age 25-44 (prime customer bracket): ${demographics.age25_34 !== undefined && demographics.age35_44 !== undefined ? `${((demographics.age25_34 + demographics.age35_44) * 100).toFixed(1)}%` : 'N/A'}
Median household income: ₹${demographics.medianIncome?.toLocaleString() ?? 'N/A'} per year
Working population: ${demographics.workingPopulation !== undefined ? `${(demographics.workingPopulation * 100).toFixed(1)}%` : 'N/A'}
IT professionals: ${demographics.itProfessionals !== undefined ? `${(demographics.itProfessionals * 100).toFixed(1)}%` : 'N/A'}
Dining out frequency: ${demographics.diningOutPerWeek !== undefined ? `${demographics.diningOutPerWeek}x per week` : 'N/A'}
Spending power index: ${demographics.spendingPowerIndex ?? 'N/A'}
Commercial rent range: ₹${demographics.commercialRentMin ?? 'N/A'} - ₹${demographics.commercialRentMax ?? 'N/A'} per sq ft
Dominant age group: ${demographics.dominantAgeGroup ?? 'N/A'}
Primary resident type: ${demographics.primaryResidentType ?? 'N/A'}` : 'Demographics data not available for this locality.'

  return `You are a senior commercial real estate analyst for Lokazen, India's leading location intelligence platform. Analyse the following property and generate a comprehensive Location Intelligence Report (LIR).

PROPERTY DETAILS:
Title: ${property.title}
Address: ${property.address}, ${property.city}, ${property.state}
Type: ${property.propertyType}
Size: ${property.size} sq ft
Monthly Rent: ₹${Number(property.price).toLocaleString()} (${property.priceType})
Power Capacity: ${property.storePowerCapacity ?? 'Not specified'}
Power Backup: ${property.powerBackup ? 'Yes' : 'No'}
Water Facility: ${property.waterFacility ? 'Yes' : 'No'}
Amenities: ${amenitiesStr}

WARD/LOCALITY DEMOGRAPHICS:
${demogLines}

TOP COMPETITORS WITHIN 1KM:
${competitorLines}

Generate a Location Intelligence Report as a valid JSON object with exactly these fields:
{
  "overviewSummary": "2-3 sentences summarising the location's key commercial characteristics and potential",
  "catchmentAnalysis": "Description of who lives and works nearby — resident profiles, office workers, footfall sources",
  "marketLandscape": "Overall market conditions — rental trends, commercial activity level, demand-supply dynamics",
  "competitorAnalysis": "Analysis of the competitive landscape — key players, gaps, saturation level, differentiation opportunities",
  "riskAssessment": {
    "risks": [
      { "title": "Risk title", "description": "Explanation of the risk", "severity": "low|medium|high" }
    ],
    "opportunities": [
      { "title": "Opportunity title", "description": "Explanation of the opportunity" }
    ]
  },
  "recommendedCategories": ["Category 1", "Category 2", "Category 3"],
  "lokazensVerdict": "One sentence Lokazen GVS recommendation on whether to take this space"
}

Rules:
- Return ONLY the raw JSON object. No markdown, no code fences, no preamble, no explanation.
- risks array must have 2-4 items. opportunities array must have 2-3 items.
- recommendedCategories must have 3-5 specific F&B or retail category names (e.g. "Specialty Coffee", "QSR Chain", "Athleisure Retail").
- All values must be strings or arrays of strings/objects as defined — no nulls, no numbers.
- Write as a confident analyst, not as a disclaimer-filled AI.`
}

export async function generateLIR(
  property: PropertyInput,
  demographics: WardDemographicsInput | null,
  competitors: CompetitorInput[]
): Promise<LIRReport> {
  const prompt = buildLIRPrompt(property, demographics, competitors)

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS.reports,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  let parsed: Omit<LIRReport, 'generatedAt'>
  try {
    parsed = JSON.parse(rawText)
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Claude did not return valid JSON for LIR report')
    }
    parsed = JSON.parse(jsonMatch[0])
  }

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  }
}
