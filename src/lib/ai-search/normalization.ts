/**
 * COMPREHENSIVE NORMALIZATION SYSTEM
 * Handles ALL formats from training datasets
 */

// ============================================================================
// BUDGET/RENT NORMALIZATION
// ============================================================================

interface BudgetResult {
  value?: number
  min?: number
  max?: number
  preferred?: number
  unit: 'INR'
  frequency: 'monthly' | 'one-time'
  confidence: number
  needsClarification?: boolean
  displayValue?: string
}

/**
 * Normalize ANY budget/rent format
 * Handles: lakhs, crores, K, absolute, ranges, casual formats
 */
export function normalizeBudget(input: string, context?: { currentTopic?: string }): BudgetResult {
  const cleaned = input.toLowerCase()
    .replace(/,/g, '')
    .replace(/₹|rs\.?|inr/gi, '')
    .replace(/\/-/g, '')
    .trim()

  // Pattern 1: Lakhs format (most common)
  const lakhsMatch = cleaned.match(/(\d+\.?\d*)\s*(lakh|lac|lax|l(?!\w))/i)
  if (lakhsMatch) {
    const value = parseFloat(lakhsMatch[1]) * 100000
    return {
      min: value * 0.9,
      max: value * 1.1,
      preferred: value,
      unit: 'INR',
      frequency: 'monthly',
      confidence: 0.95,
      displayValue: `₹${lakhsMatch[1]} lakhs`
    }
  }

  // Pattern 2: Crores format
  const croresMatch = cleaned.match(/(\d+\.?\d*)\s*(crore|cr(?!\w))/i)
  if (croresMatch) {
    const value = parseFloat(croresMatch[1]) * 10000000
    return {
      value,
      unit: 'INR',
      frequency: 'one-time',
      confidence: 0.95,
      displayValue: `₹${croresMatch[1]} crore`
    }
  }

  // Pattern 3: Thousands format (K)
  const thousandsMatch = cleaned.match(/(\d+\.?\d*)\s*k(?!\w)/i)
  if (thousandsMatch) {
    const value = parseFloat(thousandsMatch[1]) * 1000
    return {
      min: value * 0.9,
      max: value * 1.1,
      preferred: value,
      unit: 'INR',
      frequency: 'monthly',
      confidence: 0.90,
      displayValue: `₹${thousandsMatch[1]}k`
    }
  }

  // Pattern 4: Range format
  const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*(?:to|-)\s*(\d+\.?\d*)/)
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1])
    let max = parseFloat(rangeMatch[2])
    
    // Check if in lakhs
    if (/lakh|lac|lax|l(?!\w)/.test(cleaned)) {
      min *= 100000
      max *= 100000
    } else if (/k(?!\w)/.test(cleaned)) {
      min *= 1000
      max *= 1000
    } else if (/crore|cr(?!\w)/.test(cleaned)) {
      min *= 10000000
      max *= 10000000
    }
    
    return {
      min,
      max,
      preferred: (min + max) / 2,
      unit: 'INR',
      frequency: 'monthly',
      confidence: 0.90
    }
  }

  // Pattern 5: Absolute number (large)
  const numericMatch = cleaned.match(/\d+/)
  if (numericMatch) {
    const value = parseFloat(numericMatch[0])
    
    // If very large, probably absolute
    if (value >= 50000) {
      return {
        min: value * 0.9,
        max: value * 1.1,
        preferred: value,
        unit: 'INR',
        frequency: 'monthly',
        confidence: 0.75
      }
    }
    
    // If small and context is budget, probably lakhs
    if (value >= 1 && value <= 50 && context?.currentTopic?.includes('budget')) {
      return {
        min: value * 100000 * 0.9,
        max: value * 100000 * 1.1,
        preferred: value * 100000,
        unit: 'INR',
        frequency: 'monthly',
        confidence: 0.65,
        displayValue: `₹${value} lakhs`
      }
    }
  }

  return {
    value: undefined,
    unit: 'INR',
    frequency: 'monthly',
    confidence: 0.3,
    needsClarification: true
  }
}

// ============================================================================
// SIZE/AREA NORMALIZATION
// ============================================================================

interface AreaResult {
  value?: number
  min?: number
  max?: number
  preferred?: number
  unit: 'sqft'
  confidence: number
  needsClarification?: boolean
  originalUnit?: string
  originalValue?: number
}

/**
 * Normalize ANY size/area format
 * Handles: sqft, sqm, acres, guntas, cents, ranges
 */
export function normalizeArea(input: string, context?: { currentTopic?: string }): AreaResult {
  const cleaned = input.toLowerCase()
    .replace(/,/g, '')
    .trim()

  // Pattern 1: Square feet explicit
  const sqftMatch = cleaned.match(/(\d+\.?\d*)\s*(sqft|sq\.?\s*ft|square\s*feet?|sft|sf)/i)
  if (sqftMatch) {
    const value = parseFloat(sqftMatch[1])
    return {
      min: value * 0.9,
      max: value * 1.1,
      preferred: value,
      unit: 'sqft',
      confidence: 1.0
    }
  }

  // Pattern 2: Square meters (convert to sqft)
  const sqmMatch = cleaned.match(/(\d+\.?\d*)\s*(sqm|sq\.?\s*m|square\s*meters?|m²|m2)/i)
  if (sqmMatch) {
    const value = parseFloat(sqmMatch[1]) * 10.764 // Convert to sqft
    return {
      min: value * 0.9,
      max: value * 1.1,
      preferred: value,
      unit: 'sqft',
      originalUnit: 'sqm',
      originalValue: parseFloat(sqmMatch[1]),
      confidence: 0.95
    }
  }

  // Pattern 3: Acres (convert to sqft)
  const acresMatch = cleaned.match(/(\d+\.?\d*)\s*acre/i)
  if (acresMatch) {
    const value = parseFloat(acresMatch[1]) * 43560 // 1 acre = 43560 sqft
    return {
      min: value * 0.9,
      max: value * 1.1,
      preferred: value,
      unit: 'sqft',
      originalUnit: 'acre',
      originalValue: parseFloat(acresMatch[1]),
      confidence: 0.95
    }
  }

  // Pattern 4: Guntas (convert to sqft)
  const guntasMatch = cleaned.match(/(\d+\.?\d*)\s*gunta/i)
  if (guntasMatch) {
    const value = parseFloat(guntasMatch[1]) * 1089 // 1 gunta = 1089 sqft
    return {
      min: value * 0.9,
      max: value * 1.1,
      preferred: value,
      unit: 'sqft',
      originalUnit: 'gunta',
      originalValue: parseFloat(guntasMatch[1]),
      confidence: 0.95
    }
  }

  // Pattern 5: Cents (convert to sqft)
  const centsMatch = cleaned.match(/(\d+\.?\d*)\s*cent/i)
  if (centsMatch) {
    const value = parseFloat(centsMatch[1]) * 435.6 // 1 cent = 435.6 sqft
    return {
      min: value * 0.9,
      max: value * 1.1,
      preferred: value,
      unit: 'sqft',
      originalUnit: 'cent',
      originalValue: parseFloat(centsMatch[1]),
      confidence: 0.95
    }
  }

  // Pattern 6: Range format
  const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*(?:to|-)\s*(\d+\.?\d*)/)
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1])
    const max = parseFloat(rangeMatch[2])
    
    return {
      min,
      max,
      preferred: (min + max) / 2,
      unit: 'sqft',
      confidence: 0.85
    }
  }

  // Pattern 7: Standalone number (context dependent)
  const numericMatch = cleaned.match(/\d+/)
  if (numericMatch) {
    const value = parseFloat(numericMatch[0])
    
    // Reasonable sqft range
    if (value >= 100 && value <= 50000) {
      return {
        min: value * 0.9,
        max: value * 1.1,
        preferred: value,
        unit: 'sqft',
        confidence: context?.currentTopic?.includes('area') ? 0.80 : 0.70,
        needsClarification: !context?.currentTopic?.includes('area')
      }
    }
  }

  return {
    unit: 'sqft',
    confidence: 0.3,
    needsClarification: true
  }
}

// ============================================================================
// LOCATION NORMALIZATION
// ============================================================================

interface LocationResult {
  official: string
  zone?: string
  type?: string[]
  confidence: number
  matchedVia?: string
  needsClarification?: boolean
  suggestions?: string[]
}

/**
 * Complete Bangalore location database
 */
const BANGALORE_LOCATIONS = [
  {
    official: 'Koramangala',
    variations: ['koramangala', 'koramangla', 'kormangala', 'koramangla', 'koramgala', 'koramngala', 'koramanagala', 'koramngla', 'koromangala', 'koramangalla', "k'gala", 'k mangala', 'k-mangala'],
    zone: 'South Bangalore',
    type: ['Commercial', 'Residential', 'IT Hub']
  },
  {
    official: 'Indiranagar',
    variations: ['indiranagar', 'indira nagar', 'indranagar', 'indiranagr', 'indira nagr', 'indirnagar', 'indra nagar', 'indranagr', "i'nagar", 'i nagar'],
    zone: 'East Bangalore',
    type: ['Commercial', 'Premium Residential', 'F&B Hub']
  },
  {
    official: 'Whitefield',
    variations: ['whitefield', 'white field', 'whitefeild', 'whitefeld', 'whitefld', 'whitefeeld', 'whitfeild', "w'field", 'wf'],
    zone: 'East Bangalore',
    type: ['IT Hub', 'Commercial', 'Residential']
  },
  {
    official: 'HSR Layout',
    variations: ['hsr layout', 'hsr', 'h s r layout', 'h.s.r layout', 'hsr lay out', 'hsr layt', 'haralur siddapura layout'],
    zone: 'South East Bangalore',
    type: ['Residential', 'Commercial', 'Mixed']
  },
  {
    official: 'Marathahalli',
    variations: ['marathahalli', 'marathalli', 'marathhalli', 'marthahalli', 'marathali', 'maratahalli', 'marrathahalli', "m'halli"],
    zone: 'East Bangalore',
    type: ['IT Hub', 'Commercial', 'Residential']
  },
  {
    official: 'Bellandur',
    variations: ['bellandur', 'bellndur', 'bellandoor', 'bellandhur', 'beelandur', 'bellanduru'],
    zone: 'South East Bangalore',
    type: ['IT Hub', 'Commercial', 'Residential']
  },
  {
    official: 'Sarjapur Road',
    variations: ['sarjapur road', 'sarjapur', 'sarjapura road', 'sarjpur road', 'sarjapura', 'sarjpur', 'sarjapur rd'],
    zone: 'South East Bangalore',
    type: ['IT Corridor', 'Residential', 'Commercial']
  },
  {
    official: 'MG Road',
    variations: ['mg road', 'm g road', 'mahatma gandhi road', 'm.g. road', 'm.g road', 'mgroad', 'mg rd'],
    zone: 'Central Bangalore',
    type: ['Commercial', 'Premium Shopping', 'Business District']
  },
  {
    official: 'Brigade Road',
    variations: ['brigade road', 'brigade rd', 'brigaderoad', 'brigade'],
    zone: 'Central Bangalore',
    type: ['Shopping District', 'Commercial', 'Entertainment']
  },
  {
    official: 'Jayanagar',
    variations: ['jayanagar', 'jaya nagar', 'jaynagar', 'jayanagr', 'jaya nagr', 'jayanaagar', "j'nagar", "j nagar"],
    zone: 'South Bangalore',
    type: ['Residential', 'Commercial', 'Traditional']
  },
  {
    official: 'BTM Layout',
    variations: ['btm layout', 'btm', 'b t m layout', 'b.t.m layout', 'btm lay out', 'btm layt'],
    zone: 'South Bangalore',
    type: ['Residential', 'Commercial', 'Mixed']
  },
  {
    official: 'JP Nagar',
    variations: ['jp nagar', 'j p nagar', 'j.p. nagar', 'jp nagr', 'jpnagar', 'jay prakash nagar', 'jayprakash nagar'],
    zone: 'South Bangalore',
    type: ['Residential', 'Commercial', 'Educational Hub']
  },
  {
    official: 'Electronic City',
    variations: ['electronic city', 'electroniccity', 'ecity', 'e-city', 'electronics city', 'electronic cty', 'elec city', 'ec'],
    zone: 'South Bangalore',
    type: ['IT Hub', 'Industrial', 'Commercial']
  },
  {
    official: 'Malleshwaram',
    variations: ['malleshwaram', 'malleswaram', 'malleshwaram', 'maleshwaram', 'malleshwram'],
    zone: 'North Bangalore',
    type: ['Residential', 'Commercial', 'Traditional']
  },
  {
    official: 'Yeshwanthpur',
    variations: ['yeshwanthpur', 'yeshwantpur', 'yeswanthpur', 'yeshawanthpur', 'yeshvanthpur'],
    zone: 'North Bangalore',
    type: ['Industrial', 'Commercial', 'Transport Hub']
  },
  {
    official: 'Rajajinagar',
    variations: ['rajajinagar', 'raja jinagar', 'rajarajinagar', 'rajaji nagar', 'raja ji nagar', 'rj nagar'],
    zone: 'West Bangalore',
    type: ['Residential', 'Commercial', 'Industrial']
  },
  {
    official: 'Hebbal',
    variations: ['hebbal', 'hebal', 'hebball', 'hebbl'],
    zone: 'North Bangalore',
    type: ['Residential', 'Commercial', 'IT Corridor']
  },
  {
    official: 'Commercial Street',
    variations: ['commercial street', 'commercial st', 'comm street'],
    zone: 'Central Bangalore',
    type: ['Shopping', 'Retail', 'Commercial']
  },
  {
    official: 'Church Street',
    variations: ['church street', 'church st', 'churchstreet'],
    zone: 'Central Bangalore',
    type: ['Commercial', 'Dining', 'Shopping']
  },
  {
    official: 'UB City',
    variations: ['ub city', 'ubcity', 'u b city', 'united breweries city'],
    zone: 'Central Bangalore',
    type: ['Premium Mall', 'Commercial', 'Luxury']
  }
]

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

/**
 * Normalize location with fuzzy matching
 */
export function normalizeLocation(input: string): LocationResult {
  const cleaned = input.toLowerCase().trim()

  // 1. Exact match
  for (const loc of BANGALORE_LOCATIONS) {
    if (cleaned === loc.official.toLowerCase()) {
      return {
        official: loc.official,
        zone: loc.zone,
        type: loc.type,
        confidence: 1.0
      }
    }
  }

  // 2. Variation match
  for (const loc of BANGALORE_LOCATIONS) {
    for (const variation of loc.variations) {
      if (cleaned === variation.toLowerCase()) {
        return {
          official: loc.official,
          zone: loc.zone,
          type: loc.type,
          matchedVia: variation,
          confidence: 0.95
        }
      }
    }
  }

  // 3. Fuzzy match (Levenshtein distance <= 2)
  let bestMatch: typeof BANGALORE_LOCATIONS[0] | null = null
  let bestDistance = Infinity
  for (const loc of BANGALORE_LOCATIONS) {
    const distance = levenshteinDistance(cleaned, loc.official.toLowerCase())
    if (distance <= 2 && distance < bestDistance) {
      bestDistance = distance
      bestMatch = loc
    }
  }
  if (bestMatch) {
    return {
      official: bestMatch.official,
      zone: bestMatch.zone,
      type: bestMatch.type,
      matchedVia: 'fuzzy',
      confidence: 0.80
    }
  }

  // 4. Partial match (contains)
  for (const loc of BANGALORE_LOCATIONS) {
    if (cleaned.includes(loc.official.toLowerCase()) || 
        loc.official.toLowerCase().includes(cleaned)) {
      return {
        official: loc.official,
        zone: loc.zone,
        type: loc.type,
        matchedVia: 'partial',
        confidence: 0.70
      }
    }
  }

  // 5. No match - return suggestions
  const suggestions = BANGALORE_LOCATIONS
    .map(loc => ({
      name: loc.official,
      distance: levenshteinDistance(cleaned, loc.official.toLowerCase())
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(d => d.name)

  return {
    official: input, // Keep original
    confidence: 0.3,
    needsClarification: true,
    suggestions
  }
}

// ============================================================================
// DISAMBIGUATION
// ============================================================================

interface DisambiguationResult {
  type: 'AREA' | 'BUDGET' | 'AMBIGUOUS'
  value?: number
  confidence: number
  needsClarification: boolean
  clarificationQuestion?: string
  alternatives?: Array<{ type: string; value: number; display: string }>
}

/**
 * Intelligent disambiguation for standalone numbers
 */
export function disambiguateNumber(
  input: string,
  context: {
    currentTopic?: string
    recentEntities?: { area?: number; budget?: number }
    previousMessages?: string[]
  }
): DisambiguationResult {
  const cleaned = input.toLowerCase().trim()
  const number = parseFloat(cleaned.replace(/[^0-9.]/g, ''))

  // Rule 1: Explicit unit indicators (100% confidence)
  if (/sqft|sq\.?\s*ft|square\s*feet?|sft|sf|sqm|sq\.?\s*m|m²/i.test(cleaned)) {
    return {
      type: 'AREA',
      value: number,
      confidence: 1.0,
      needsClarification: false
    }
  }

  if (/lakh|lac|lax|l(?!\w)|crore|cr(?!\w)|k(?!\w)|₹|rs\.?|inr/i.test(cleaned)) {
    return {
      type: 'BUDGET',
      value: number, // Will be processed by normalizeBudget
      confidence: 1.0,
      needsClarification: false
    }
  }

  // Rule 2: Context-based (80% confidence)
  if (context.currentTopic === 'discussing_area' || 
      /size|space|area|carpet|built/.test(context.previousMessages?.join(' ') || '')) {
    if (number >= 100 && number <= 50000) {
      return {
        type: 'AREA',
        value: number,
        confidence: 0.80,
        needsClarification: true
      }
    }
  }

  if (context.currentTopic === 'discussing_budget' || 
      /budget|rent|monthly|pay|afford/.test(context.previousMessages?.join(' ') || '')) {
    // Small number = lakhs
    if (number >= 1 && number <= 50) {
      return {
        type: 'BUDGET',
        value: number * 100000,
        confidence: 0.75,
        needsClarification: true
      }
    }
    // Large number = absolute
    if (number >= 50000) {
      return {
        type: 'BUDGET',
        value: number,
        confidence: 0.80,
        needsClarification: false
      }
    }
  }

  // Rule 3: Magnitude analysis (60% confidence)
  if (number >= 100 && number <= 50000) {
    return {
      type: 'AREA',
      value: number,
      confidence: 0.60,
      needsClarification: true,
      alternatives: [
        { type: 'BUDGET', value: number * 100000, display: `₹${number} lakhs` }
      ]
    }
  }

  if (number >= 1 && number <= 50) {
    return {
      type: 'BUDGET',
      value: number * 100000,
      confidence: 0.60,
      needsClarification: true,
      alternatives: [
        { type: 'AREA', value: number, display: `${number} sqft` }
      ]
    }
  }

  // Rule 4: Ambiguous - ask clarification
  return {
    type: 'AMBIGUOUS',
    confidence: 0.30,
    needsClarification: true,
    clarificationQuestion: `I see "${input}". Did you mean:\n1. ${number} sqft (area)\n2. ₹${number} lakhs (budget)\n3. ₹${number.toLocaleString('en-IN')} (exact amount)\n\nPlease specify.`,
    alternatives: [
      { type: 'AREA', value: number, display: `${number} sqft` },
      { type: 'BUDGET', value: number * 100000, display: `₹${number} lakhs` },
      { type: 'BUDGET', value: number, display: `₹${number.toLocaleString('en-IN')}` }
    ]
  }
}

