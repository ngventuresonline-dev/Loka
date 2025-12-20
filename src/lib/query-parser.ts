/**
 * Query Parser Utility
 * Extracts property requirements from natural language search queries
 */

// Property type mappings - keywords to filter values
// IMPORTANT: Order matters! Longer/more specific keywords should come first
// Also: More specific types should come before less specific ones
const propertyTypeKeywords: Array<{ keywords: string[]; type: string }> = [
  // Retail - check FIRST to avoid conflicts (retail is a common word)
  { keywords: ['retail store', 'retail shop', 'retail space', 'retail outlet'], type: 'Retail' },
  { keywords: ['retail'], type: 'Retail' }, // Standalone "retail" keyword
  { keywords: ['boutique', 'showroom'], type: 'Retail' },
  
  // Café/Coffee - check longer phrases first
  { keywords: ['coffee shop', 'coffeeshop', 'coffeehouse', 'coffee house'], type: 'Café/QSR' },
  { keywords: ['cafe', 'café', 'coffee'], type: 'Café/QSR' },
  
  // QSR - check longer phrases first
  { keywords: ['quick service restaurant', 'quick service', 'fast food restaurant'], type: 'Café/QSR' },
  { keywords: ['qsr', 'fast food'], type: 'Café/QSR' },
  
  // Restaurant - check longer phrases first
  { keywords: ['fine dining', 'casual dining', 'restaurant'], type: 'Restaurant' },
  { keywords: ['dining'], type: 'Restaurant' },
  
  // Bar/Brewery
  { keywords: ['bar', 'brewery', 'pub', 'lounge'], type: 'Bar/Brewery' },
  
  // Only match "store" or "shop" if not part of "coffee shop" or "retail store"
  // These come AFTER retail and cafe to avoid conflicts
  { keywords: ['store', 'shop'], type: 'Retail' },
  
  // Gym
  { keywords: ['gym', 'fitness center', 'fitness centre', 'fitness'], type: 'Gym' },
  { keywords: ['yoga studio', 'yoga'], type: 'Gym' },
  { keywords: ['studio'], type: 'Gym' },
  
  // Entertainment
  { keywords: ['entertainment', 'arcade', 'gaming zone', 'gaming'], type: 'Entertainment' },
  
  // Cloud Kitchen
  { keywords: ['cloud kitchen', 'cloudkitchen', 'dark kitchen'], type: 'Others' },
]

// Common property type patterns that should map to "Others" with custom value
const customTypePatterns = [
  { pattern: /salon\s*(?:and|\+)?\s*spa/gi, extract: (query: string) => {
    const match = query.match(/salon\s*(?:and|\+)?\s*spa/gi)
    return match ? match[0] : null
  }},
  { pattern: /sports\s+facility/gi, extract: (query: string) => {
    const match = query.match(/sports\s+facility/gi)
    return match ? match[0] : null
  }},
  { pattern: /sportswear/gi, extract: () => 'Sportswear' },
  { pattern: /warehouse/gi, extract: (query: string) => {
    const match = query.match(/warehouse/gi)
    return match ? match[0] : null
  }},
]

// Location mappings - common variations
const locationMap: Record<string, string> = {
  'indiranagar': 'Indiranagar',
  'indira nagar': 'Indiranagar',
  'koramangala': 'Koramangala',
  'koramangla': 'Koramangala',
  'whitefield': 'Whitefield',
  'white field': 'Whitefield',
  'hsr': 'HSR Layout',
  'hsr layout': 'HSR Layout',
  'jayanagar': 'Jayanagar',
  'jaya nagar': 'Jayanagar',
  'btm': 'BTM Layout',
  'btm layout': 'BTM Layout',
  'mg road': 'MG Road',
  'mg rd': 'MG Road',
  'brigade road': 'Brigade Road',
  'brigade rd': 'Brigade Road',
  'marathahalli': 'Marathahalli',
  'hebbal': 'Hebbal',
  'banashankari': 'Banashankari',
  'sarjapur': 'Sarjapur Road',
  'sarjapur road': 'Sarjapur Road',
  'electronic city': 'Electronic City',
  'bellandur': 'Bellandur',
  'bannerghatta': 'Bannerghatta Road',
  'bannerghatta road': 'Bannerghatta Road',
  'rajajinagar': 'Rajajinagar',
  'malleshwaram': 'Malleshwaram',
  'basavanagudi': 'Basavanagudi',
  'vijayanagar': 'Vijayanagar',
  'yelahanka': 'Yelahanka',
  'yeshwanthpur': 'Yeshwanthpur',
  'rt nagar': 'RT Nagar',
  'frazer town': 'Frazer Town',
  'richmond town': 'Richmond Town',
  'commercial street': 'Commercial Street',
  'church street': 'Church Street',
  'ub city': 'UB City',
  'jp nagar': 'JP Nagar',
  'manyata': 'Manyata Tech Park',
  'manyata tech park': 'Manyata Tech Park',
  'peenya': 'Peenya',
  'magadi road': 'Magadi Road',
  'mysore road': 'Mysore Road',
  'lavelle road': 'Lavelle Road',
  'sadashivanagar': 'Sadashivanagar',
  'rr nagar': 'RR Nagar',
  'kengeri': 'Kengeri',
  'devanahalli': 'Devanahalli',
  'old madras road': 'Old Madras Road',
  'kr puram': 'KR Puram',
}

export interface ParsedQuery {
  propertyTypes: string[]
  customPropertyType: string | null // For "Others" option
  sizeMin: number | null
  sizeMax: number | null
  locations: string[]
  budgetMin: number | null
  budgetMax: number | null
}

/**
 * Extract size from query (sqft numbers)
 */
function extractSize(query: string): { min: number | null; max: number | null } {
  const sizeRegex = /(\d+)\s*(?:to|-)?\s*(\d+)?\s*sqft|sq\s*ft|(\d+)\s*(?:to|-)?\s*(\d+)?\s*sq\s*ft/gi
  const matches = query.match(sizeRegex)
  
  if (!matches) {
    // Try to find standalone numbers that might be sizes
    const numberRegex = /\b(\d{3,5})\b/g
    const numbers = query.match(numberRegex)
    if (numbers && numbers.length > 0) {
      const size = parseInt(numbers[0])
      // If it's a reasonable size (300-50000), assume it's sqft
      if (size >= 300 && size <= 50000) {
        // Create a range around the number
        const min = Math.max(0, size - 200)
        const max = size + 500
        return { min, max }
      }
    }
    return { min: null, max: null }
  }
  
  const firstMatch = matches[0]
  const numbers = firstMatch.match(/\d+/g)
  
  if (!numbers || numbers.length === 0) {
    return { min: null, max: null }
  }
  
  if (numbers.length === 1) {
    const size = parseInt(numbers[0])
    // Create a range around the number
    const min = Math.max(0, size - 200)
    const max = size + 500
    return { min, max }
  }
  
  // Two numbers - range
  const min = parseInt(numbers[0])
  const max = parseInt(numbers[1])
  return { min, max }
}

/**
 * Extract property types from query
 * Returns both matched types and custom type (if any)
 */
function extractPropertyTypes(query: string): { types: string[]; customType: string | null } {
  const lowerQuery = query.toLowerCase()
  const foundTypes = new Set<string>()
  let customType: string | null = null
  
  // First, check for custom type patterns (salon and spa, sports facility, etc.)
  for (const { pattern, extract } of customTypePatterns) {
    if (pattern.test(query)) {
      const extracted = extract(query)
      if (extracted) {
        customType = extracted
        foundTypes.add('Others')
        // Don't check further - custom type takes precedence
        return { types: Array.from(foundTypes), customType }
      }
    }
  }
  
  // Check each property type keyword group (longer keywords first)
  // Track matched text to avoid double-matching
  const matchedText = new Set<string>()
  const matchedIndices: Array<{ start: number; end: number }> = []
  
  for (const { keywords, type } of propertyTypeKeywords) {
    let matched = false
    for (const keyword of keywords) {
      if (matched) break // Already matched in this group
      
      const keywordLower = keyword.toLowerCase()
      
      // Skip if this keyword is already matched as part of a longer phrase
      if (matchedText.has(keywordLower)) {
        continue
      }
      
      // Use word boundaries for single words to avoid partial matches
      // For multi-word phrases, use simple includes
      if (keyword.includes(' ')) {
        // Multi-word phrase - check if it exists and doesn't overlap with previous matches
        const index = lowerQuery.indexOf(keywordLower)
        if (index !== -1) {
          const end = index + keywordLower.length
          // Check if this overlaps with any previous match
          const overlaps = matchedIndices.some(mi => 
            (index >= mi.start && index < mi.end) || (mi.start >= index && mi.start < end)
          )
          if (!overlaps) {
            foundTypes.add(type)
            matchedText.add(keywordLower)
            matchedIndices.push({ start: index, end })
            matched = true
            break // Found a match in this group, move to next group
          }
        }
      } else {
        // Single word - use word boundary regex, but exclude if it's part of a matched phrase
        // Special handling for "shop" and "store" - don't match if they're part of "coffee shop" or "retail store"
        if ((keyword === 'shop' && lowerQuery.includes('coffee shop')) ||
            (keyword === 'store' && lowerQuery.includes('retail store'))) {
          continue // Skip this match
        }
        
        const regex = new RegExp(`\\b${keyword}\\b`, 'i')
        const match = regex.exec(query)
        if (match) {
          const start = match.index
          const end = start + keyword.length
          // Check if this overlaps with any previous match
          const overlaps = matchedIndices.some(mi => 
            (start >= mi.start && start < mi.end) || (mi.start >= start && mi.start < end)
          )
          if (!overlaps) {
            foundTypes.add(type)
            matchedText.add(keywordLower)
            matchedIndices.push({ start, end })
            matched = true
            break // Found a match in this group, move to next group
          }
        }
      }
    }
  }
  
  return { types: Array.from(foundTypes), customType }
}

/**
 * Extract locations from query
 */
function extractLocations(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const foundLocations = new Set<string>()
  
  // Check each location keyword
  for (const [keyword, location] of Object.entries(locationMap)) {
    if (lowerQuery.includes(keyword)) {
      foundLocations.add(location)
    }
  }
  
  return Array.from(foundLocations)
}

/**
 * Extract budget from query
 */
function extractBudget(query: string): { min: number | null; max: number | null } {
  // Look for budget patterns: ₹50K, ₹1L, ₹1.2L, ₹50,000, etc.
  const budgetRegex = /₹?\s*(\d+(?:\.\d+)?)\s*(K|L|Cr|k|l|cr|thousand|lakh|crore)/gi
  const matches = Array.from(query.matchAll(budgetRegex))
  
  if (matches.length === 0) {
    // Try to find plain numbers that might be budgets
    const numberRegex = /\b(\d{4,7})\b/g
    const numbers = query.match(numberRegex)
    if (numbers && numbers.length > 0) {
      const budget = parseInt(numbers[0])
      // If it's a reasonable budget (10000-10000000), assume it's monthly rent
      if (budget >= 10000 && budget <= 10000000) {
        const min = Math.max(0, budget - 20000)
        const max = budget + 50000
        return { min, max }
      }
    }
    return { min: null, max: null }
  }
  
  const budgets: number[] = []
  
  for (const match of matches) {
    const value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    
    let amount = 0
    if (unit === 'k' || unit === 'thousand') {
      amount = value * 1000
    } else if (unit === 'l' || unit === 'lakh') {
      amount = value * 100000
    } else if (unit === 'cr' || unit === 'crore') {
      amount = value * 10000000
    } else {
      amount = value
    }
    
    budgets.push(amount)
  }
  
  if (budgets.length === 0) {
    return { min: null, max: null }
  }
  
  if (budgets.length === 1) {
    const budget = budgets[0]
    const min = Math.max(0, budget - 20000)
    const max = budget + 50000
    return { min, max }
  }
  
  // Multiple budgets - use min and max
  const min = Math.min(...budgets)
  const max = Math.max(...budgets)
  return { min, max }
}

/**
 * Parse natural language query and extract requirements
 */
export function parseQuery(query: string): ParsedQuery {
  const normalizedQuery = query.trim()
  
  if (!normalizedQuery) {
    return {
      propertyTypes: [],
      customPropertyType: null,
      sizeMin: null,
      sizeMax: null,
      locations: [],
      budgetMin: null,
      budgetMax: null,
    }
  }
  
  const { types: propertyTypes, customType } = extractPropertyTypes(normalizedQuery)
  const size = extractSize(normalizedQuery.toLowerCase())
  const locations = extractLocations(normalizedQuery.toLowerCase())
  const budget = extractBudget(normalizedQuery.toLowerCase())
  
  return {
    propertyTypes,
    customPropertyType: customType,
    sizeMin: size.min,
    sizeMax: size.max,
    locations,
    budgetMin: budget.min,
    budgetMax: budget.max,
  }
}

/**
 * Convert parsed query to URL search params
 */
export function parsedQueryToParams(parsed: ParsedQuery): URLSearchParams {
  const params = new URLSearchParams()
  
  if (parsed.propertyTypes.length > 0) {
    // Support multiple types - join with comma
    params.set('type', parsed.propertyTypes.join(','))
  }
  
  // Add custom property type if present (for "Others" option)
  if (parsed.customPropertyType) {
    params.set('otherType', parsed.customPropertyType)
  }
  
  if (parsed.sizeMin !== null) {
    params.set('sizeMin', parsed.sizeMin.toString())
  }
  
  if (parsed.sizeMax !== null) {
    params.set('sizeMax', parsed.sizeMax.toString())
  }
  
  if (parsed.locations.length > 0) {
    // Support multiple locations - join with comma
    params.set('location', parsed.locations.join(','))
  }
  
  if (parsed.budgetMin !== null) {
    params.set('budgetMin', parsed.budgetMin.toString())
  }
  
  if (parsed.budgetMax !== null) {
    params.set('budgetMax', parsed.budgetMax.toString())
  }
  
  return params
}

