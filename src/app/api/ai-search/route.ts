import { NextRequest, NextResponse } from 'next/server'
import { simpleSearch } from '@/lib/ai-search/simple-search'

// Using simple, robust search system

// Legacy types (kept for backward compatibility with old functions)
type QueryIntent = 'brand_search' | 'owner_listing' | 'general_inquiry'

interface ParsedQuery {
  intent: QueryIntent
  queryType: 'search' | 'list' | 'inquiry'
  location?: {
    city?: string
    area?: string
  }
  propertyType?: string
  size?: number
  minSize?: number
  maxSize?: number
  budget?: number
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  summary: string
}

/**
 * LEGACY FUNCTION - NOT USED
 * Determine user intent with strict rules
 * OWNERS should NEVER see database properties - they're listing, not searching
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
async function determineIntent_LEGACY(
  query: string, 
  userType?: 'brand' | 'owner', 
  conversationHistory?: string
): Promise<QueryIntent> {
  console.log('[AI Search] Determining intent:', { query: query.substring(0, 50), userType, hasHistory: !!conversationHistory })
  
  const lowerQuery = query.toLowerCase().trim()
  
  // STRICT RULE 1: If user is an Owner, default to owner_listing unless explicitly searching
  if (userType === 'owner') {
    // Only allow brand_search if explicitly stated
    if (lowerQuery.includes('looking for') || 
        lowerQuery.includes('find') || 
        lowerQuery.includes('search') ||
        lowerQuery.includes('need a property')) {
      console.log('[AI Search] Owner explicitly searching - allowing brand_search')
      return 'brand_search'
    }
    // Everything else is owner_listing
    console.log('[AI Search] Owner user type - defaulting to owner_listing')
    return 'owner_listing'
  }
  
  // STRICT RULE 2: Analyze conversation history for established intent
  if (conversationHistory) {
    const historyLower = conversationHistory.toLowerCase()
    
    // If history shows owner listing context, maintain it STRONGLY
    const hasOwnerListingHistory = historyLower.includes('list your property') || 
        historyLower.includes('listing your') ||
        historyLower.includes('listing') ||
        historyLower.includes('i have') ||
        historyLower.includes('available') ||
        historyLower.includes('for rent') ||
        historyLower.includes('rent out') ||
        historyLower.includes('restaurant space') ||
        historyLower.includes('property available')
    
    if (hasOwnerListingHistory) {
      // If user explicitly says they're searching, allow it
      if (lowerQuery.includes('looking for') || lowerQuery.includes('find') || lowerQuery.includes('search')) {
        console.log('[AI Search] User explicitly searching despite listing history - allowing brand_search')
        return 'brand_search'
      }
      // Otherwise, maintain owner listing context for ANY response (not just short ones)
      console.log('[AI Search] Owner listing context in history - maintaining owner_listing')
      return 'owner_listing'
    }
    
    // If history shows brand search context, maintain it
    if (historyLower.includes('looking for') || 
        historyLower.includes('find') ||
        historyLower.includes('search')) {
      // If user explicitly says they're listing, allow it
      if (lowerQuery.includes('listing') || lowerQuery.includes('i have') || lowerQuery.includes('available')) {
        console.log('[AI Search] User explicitly listing despite search history - allowing owner_listing')
        return 'owner_listing'
      }
      // Otherwise maintain brand search
      console.log('[AI Search] Brand search context in history - maintaining brand_search')
      return 'brand_search'
    }
  }
  
  // STRICT RULE 3: Keyword-based detection
  const ownerKeywords = [
    'i have', 'i own', 'available', 'for rent', 'rent out', 
    'want to list', 'listing', 'list my', 'commercial space for rent',
    'property available', 'space available', 'for lease', 'lease out'
  ]
  
  const brandKeywords = [
    'looking for', 'need', 'want', 'searching for', 'find',
    'looking to rent', 'looking to lease', 'show me', 'i need'
  ]
  
  const hasOwnerKeywords = ownerKeywords.some(kw => lowerQuery.includes(kw))
  const hasBrandKeywords = brandKeywords.some(kw => lowerQuery.includes(kw))
  
  if (hasOwnerKeywords && !hasBrandKeywords) {
    console.log('[AI Search] Owner keywords detected - owner_listing')
    return 'owner_listing'
  }
  
  if (hasBrandKeywords && !hasOwnerKeywords) {
    console.log('[AI Search] Brand keywords detected - brand_search')
    return 'brand_search'
  }
  
  // Default based on user type
  if (userType === 'brand') {
    console.log('[AI Search] Defaulting to brand_search (brand user)')
    return 'brand_search'
  }
  
  // Default to general inquiry if ambiguous
  console.log('[AI Search] Ambiguous query - general_inquiry')
  return 'general_inquiry'
}

/**
 * LEGACY FUNCTION - NOT USED
 * Parse query parameters (only for brand searches)
 */
async function parseQueryForBrand_LEGACY(query: string, conversationHistory?: string): Promise<ParsedQuery> {
  console.log('[AI Search] Parsing query for brand search')
  
  const systemPrompt = `You are a real estate assistant that extracts search parameters from brand queries.
Extract: location (city/area), property type, size range, budget range, amenities.
Return JSON only.`

  const historyContext = conversationHistory ? `\n\nPrevious conversation:\n${conversationHistory}` : ''

  const userPrompt = `Extract search parameters from this query:
"${query}"${historyContext}

Return JSON:
{
  "location": { "city": "city or null", "area": "area or null" },
  "propertyType": "qsr|restaurant|retail|office|kiosk|warehouse or null",
  "minSize": number or null,
  "maxSize": number or null,
  "minPrice": number or null,
  "maxPrice": number or null,
  "amenities": ["amenity1"] or [],
  "summary": "brief summary"
}`

  // LEGACY FUNCTION - NOT USED - This will throw if called
  throw new Error('Legacy function parseQueryForBrand_LEGACY is deprecated. Use LokazenAISearch instead.')
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const completion = await (null as any) // Legacy OpenAI call - removed
    /* const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }) */

    const parsed = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      intent: 'brand_search',
      queryType: 'search',
      ...parsed
    } as ParsedQuery
  } catch (error) {
    console.error('[AI Search] Error parsing query:', error)
    return {
      intent: 'brand_search',
      queryType: 'search',
      summary: query
    }
  }
}

/**
 * LEGACY FUNCTION - NOT USED
 * Generate response for BRANDS (searching for properties)
 */
async function generateBrandResponse_LEGACY(
  query: string,
  properties: any[],
  conversationHistory?: string
): Promise<string> {
  console.log('[AI Search] Generating brand response for', properties.length, 'properties')
  
  const systemPrompt = `You are a helpful real estate assistant helping BRANDS find commercial properties to rent/lease.
Your role is to help brands find the perfect commercial space.
Be conversational, helpful, and highlight key features (location, foot traffic, amenities, price).
If properties are found, mention specific details about the best matches.
If no properties match, suggest alternatives or ask clarifying questions.
NEVER mention that you're searching a database - be natural and conversational.`

  const propertiesContext = properties.length > 0
    ? `\n\nFound ${properties.length} matching properties:\n${properties.slice(0, 5).map((p, i) => 
        `${i + 1}. ${p.title} - ${p.address}, ${p.city}\n   Size: ${p.size} sqft, Price: ₹${p.price.toLocaleString()}/${p.priceType}\n   Type: ${p.propertyType}, Amenities: ${p.amenities.join(', ')}`
      ).join('\n')}`
    : '\n\nNo matching properties found in the current database.'

  const historyContext = conversationHistory ? `\n\nPrevious conversation:\n${conversationHistory}` : ''

  const userPrompt = `User query: "${query}"${historyContext}${propertiesContext}

Generate a helpful, conversational response (2-3 sentences). Focus on helping them find the right property.`

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const completion = await (null as any) // Legacy OpenAI call - removed
    /* const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    }) */

    return completion.choices[0].message.content || 'I found some properties that might interest you. Let me know if you need more details!'
  } catch (error) {
    console.error('[AI Search] Error generating brand response:', error)
    
    if (properties.length > 0) {
      return `Great! I found ${properties.length} property${properties.length > 1 ? 'ies' : ''} that match your requirements. ${properties.slice(0, 3).map(p => p.title).join(', ')}. Would you like more details about any of these?`
    } else {
      return `I couldn't find exact matches for your search. Could you provide more details about your requirements? For example, what type of space, location, and budget are you looking for?`
    }
  }
}

/**
 * Convert text numbers to digits (e.g., "fifty thousand" -> "50000")
 */
function textToNumber(text: string): number | null {
  const lowerText = text.toLowerCase().trim()
  
  // Number word mappings
  const numberWords: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
    'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100,
    'thousand': 1000, 'lakh': 100000, 'lakhs': 100000, 'lac': 100000, 'lacs': 100000,
    'crore': 10000000, 'crores': 10000000
  }
  
  // Try to parse text numbers like "fifty thousand"
  const words = lowerText.split(/\s+/)
  let result = 0
  let current = 0
  
  for (const word of words) {
    const num = numberWords[word]
    if (num !== undefined) {
      if (num >= 1000) {
        result += current * num
        current = 0
      } else if (num >= 100) {
        current = (current || 1) * num
      } else {
        current += num
      }
    }
  }
  result += current
  
  return result > 0 ? result : null
}

/**
 * Extract and normalize numbers from text - handles all formats
 * SMART: Avoids extracting numbers from street addresses (12th, 1st, 2nd, etc.)
 */
function extractNumber(text: string, context?: string): string | null {
  const lowerText = text.toLowerCase()
  
  // CRITICAL: Don't extract numbers that are part of street addresses
  // Patterns like "12th main", "1st cross", "2nd block", "3rd floor" should be ignored
  const streetAddressPattern = /\b(\d+)(?:st|nd|rd|th)\s+(?:main|cross|block|road|street|layout|nagar|floor|avenue|drive|way)\b/i
  if (streetAddressPattern.test(text)) {
    // This looks like a street address, don't extract the number
    return null
  }
  
  // Remove common suffixes and clean
  const cleaned = text.replace(/[₹,\s\/-]/g, ' ').trim()
  
  // Pattern 1: Direct digits (50,000 or 50000) - but exclude if it's part of address
  const directMatch = cleaned.match(/(\d{1,3}(?:[,\s]\d{2,3})*)/)
  if (directMatch) {
    const number = directMatch[1].replace(/[,\s]/g, '')
    // If it's a small number (1-31) and followed by "th", "st", "nd", "rd", it's likely an address
    const numValue = parseInt(number)
    if (numValue <= 31 && /\d+(?:st|nd|rd|th)/i.test(text)) {
      return null // Likely street address
    }
    return number
  }
  
  // Pattern 2: With 'k' suffix (50k = 50000)
  const kMatch = lowerText.match(/(\d+)\s*k(?:ilo)?/i)
  if (kMatch) {
    return (parseInt(kMatch[1]) * 1000).toString()
  }
  
  // Pattern 3: Lakhs/lacs (5 lakhs = 500000)
  const lakhMatch = lowerText.match(/(\d+)\s*(?:lakh|lakhs|lac|lacs)/i)
  if (lakhMatch) {
    return (parseInt(lakhMatch[1]) * 100000).toString()
  }
  
  // Pattern 4: Crores (5 crores = 50000000)
  const croreMatch = lowerText.match(/(\d+)\s*(?:crore|crores)/i)
  if (croreMatch) {
    return (parseInt(croreMatch[1]) * 10000000).toString()
  }
  
  // Pattern 5: Text numbers (fifty thousand = 50000)
  const textNum = textToNumber(text)
  if (textNum) {
    return textNum.toString()
  }
  
  return null
}

/**
 * Extract property details from conversation - INTELLIGENT EXTRACTION
 * Handles all regional variations, formats, and contextual relationships
 */
function extractPropertyDetails(query: string, conversationHistory?: string, collectedRent?: string): {
  propertyType?: string
  location?: string
  size?: string
  rent?: string
  deposit?: string
  amenities?: string[]
} {
  const fullText = conversationHistory ? `${conversationHistory}\n${query}` : query
  const lowerText = fullText.toLowerCase()
  
  const details: any = {}
  
  // Extract size - handles: "500 sqft", "500sqft", "500 square feet", "five hundred sqft"
  const sizePatterns = [
    /(\d+)\s*(?:sqft|sq\.?ft\.?|square\s*feet|sq\.?\s*ft\.?)/i,
    /(?:size|area)[\s:]+(\d+)/i,
    /(?:size|area)[\s:]+(?:is\s*)?(?:about|around)?\s*(\d+)/i
  ]
  for (const pattern of sizePatterns) {
    const match = fullText.match(pattern)
    if (match) {
      details.size = match[1]
      break
    }
  }
  
  // Extract location - handles: "in Bangalore", "on MG Road", "at Indiranagar", "location: Koramangala"
  const locationPatterns = [
    /(?:in|on|at|location|address|area)[\s:]+([A-Z][a-zA-Z\s,]+?)(?:,|$|available|for rent|bangalore|mumbai|delhi|karnataka|maharashtra)/i,
    /([A-Z][a-zA-Z\s]+(?:road|street|layout|nagar|layout|block|sector))/i,
    /(?:bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata)[\s,]+([A-Z][a-zA-Z\s]+)/i
  ]
  for (const pattern of locationPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      const loc = match[1].trim()
      // Filter out common false positives
      if (!loc.match(/^(rent|monthly|deposit|security|size|sqft|type)$/i)) {
        details.location = loc
        break
      }
    }
  }
  
  // Extract property type - handles variations and typos
  const typePatterns = [
    /(?:type|property\s*type)[\s:]+(retail|restaurant|qsr|office|kiosk|warehouse|commercial|mall|standalone)/i,
    /(retail|restaurant|qsr|office|kiosk|warehouse|commercial|mall|standalone)\s*(?:space|property|shop|store)/i,
    /(?:is|it'?s|this\s*is)\s*(?:a\s*)?(retail|restaurant|qsr|office|kiosk|warehouse|commercial|mall|standalone)/i
  ]
  for (const pattern of typePatterns) {
    const match = lowerText.match(pattern)
    if (match) {
      const type = match[1].toLowerCase()
      if (type === 'qsr') details.propertyType = 'mall'
      else if (type === 'restaurant') details.propertyType = 'restaurant'
      else if (type === 'retail') details.propertyType = 'retail'
      else if (type === 'office') details.propertyType = 'office'
      else details.propertyType = type
      break
    }
  }
  
  // Extract rent - INTELLIGENT: handles all formats and contexts
  // CRITICAL: Only extract rent if CURRENT query mentions rent OR we're explicitly in rent context
  const currentQueryHasRent = lowerText.includes('rent') || lowerText.includes('monthly') || 
                               query.toLowerCase().includes('₹') || query.toLowerCase().includes('rupee')
  const historyHasRent = conversationHistory?.toLowerCase().includes('rent') ||
                         conversationHistory?.toLowerCase().includes('monthly') ||
                         conversationHistory?.toLowerCase().includes('how much')
  
  // Only extract rent if:
  // 1. Current query mentions rent/money, OR
  // 2. History has rent context AND current query is a number (likely answering rent question)
  const isRentContext = currentQueryHasRent || (historyHasRent && /^\s*[\d\s,]+(?:k|lakh|lakhs|lac|lacs|thousand)?\s*$/i.test(query.trim()))
  
  if (isRentContext || !collectedRent) {
    // Try multiple extraction methods
    let rentValue: string | null = null
    
    // Method 1: Pattern matching with keywords (MOST RELIABLE)
    const rentPatterns = [
      /(?:rent|monthly|price)[\s:]+(?:is\s*)?(?:₹|rs\.?|rupees?)?[\s]*([\d\s,]+(?:k|lakh|lakhs|lac|lacs|thousand)?)/i,
      /(?:₹|rs\.?|rupees?)[\s]*([\d\s,]+(?:k|lakh|lakhs|lac|lacs|thousand)?)\s*(?:per\s*month|monthly|pm)/i,
      /([\d\s,]+(?:k|lakh|lakhs|lac|lacs|thousand)?)\s*(?:per\s*month|monthly|pm|rent)/i
    ]
    
    for (const pattern of rentPatterns) {
      const match = fullText.match(pattern)
      if (match) {
        rentValue = extractNumber(match[1]) || match[1].replace(/[,\s]/g, '')
        break
      }
    }
    
    // Method 2: If current query explicitly mentions rent/money and has a number
    if (!rentValue && currentQueryHasRent) {
      const rentNumber = extractNumber(query)
      if (rentNumber) {
        rentValue = rentNumber
      }
    }
    
    // Method 3: If history asked about rent AND current query is JUST a number (answering the question)
    // BUT: Don't extract if it looks like an address (12th, 1st, etc.)
    if (!rentValue && historyHasRent && !currentQueryHasRent) {
      // Only if query is a simple number response (not a location with numbers)
      const isSimpleNumberResponse = /^\s*[\d\s,]+(?:k|lakh|lakhs|lac|lacs|thousand)?\s*$/i.test(query.trim()) &&
                                     !/\b\d+(?:st|nd|rd|th)\s+(?:main|cross|block|road|street)\b/i.test(query)
      if (isSimpleNumberResponse) {
        const simpleNumber = extractNumber(query)
        if (simpleNumber) {
          rentValue = simpleNumber
        }
      }
    }
    
    if (rentValue) {
      details.rent = rentValue
      console.log('[AI Search] Extracted rent:', rentValue, 'from:', query)
    }
  } else {
    // Use previously collected rent
    details.rent = collectedRent
  }
  
  // Extract deposit - INTELLIGENT: handles "6 months rental", "3 lakhs", "300000", relationships
  const isDepositContext = lowerText.includes('deposit') || lowerText.includes('security') ||
                           conversationHistory?.toLowerCase().includes('deposit') ||
                           conversationHistory?.toLowerCase().includes('security')
  
  if (isDepositContext || !details.deposit) {
    let depositValue: string | null = null
    
    // Method 1: "X months of rental" or "X months rent" - calculate from rent
    const monthsMatch = lowerText.match(/(\d+)\s*(?:months?|month'?s?)\s*(?:of\s*)?(?:rental|rent)/i)
    if (monthsMatch && (details.rent || collectedRent)) {
      const months = parseInt(monthsMatch[1])
      const rent = parseInt(details.rent || collectedRent || '0')
      if (rent > 0) {
        depositValue = (months * rent).toString()
        console.log('[AI Search] Calculated deposit:', depositValue, 'from', months, 'months of rent')
      }
    }
    
    // Method 2: Direct number extraction
    if (!depositValue) {
      depositValue = extractNumber(query)
    }
    
    // Method 3: Pattern matching
    if (!depositValue) {
      const depositPatterns = [
        /(?:deposit|security)[\s:]+(?:is\s*)?(?:₹|rs\.?|rupees?)?[\s]*([\d\s,]+(?:k|lakh|lakhs|lac|lacs|thousand)?)/i,
        /(?:₹|rs\.?|rupees?)[\s]*([\d\s,]+(?:k|lakh|lakhs|lac|lacs|thousand)?)\s*(?:deposit|security)/i
      ]
      
      for (const pattern of depositPatterns) {
        const match = fullText.match(pattern)
        if (match) {
          depositValue = extractNumber(match[1]) || match[1].replace(/[,\s]/g, '')
          break
        }
      }
    }
    
    // Method 4: If in deposit context and just a number, assume it's deposit
    if (!depositValue && isDepositContext) {
      const simpleNumber = extractNumber(query)
      if (simpleNumber) {
        depositValue = simpleNumber
      }
    }
    
    if (depositValue) {
      details.deposit = depositValue
      console.log('[AI Search] Extracted deposit:', depositValue, 'from:', query)
    }
  }
  
  // Extract amenities - handles variations
  const amenityMap: { [key: string]: string } = {
    'parking': 'Parking',
    'wifi': 'WiFi',
    'wi-fi': 'WiFi',
    'ac': 'Air Conditioning',
    'air conditioning': 'Air Conditioning',
    'security': 'Security',
    'kitchen': 'Kitchen',
    'storage': 'Storage',
    'washroom': 'Washroom',
    'toilet': 'Washroom',
    'fire safety': 'Fire Safety',
    'fire': 'Fire Safety',
    'lift': 'Lift',
    'elevator': 'Lift',
    'power backup': 'Power Backup',
    'generator': 'Power Backup'
  }
  
  const foundAmenities: string[] = []
  for (const [keyword, amenity] of Object.entries(amenityMap)) {
    if (lowerText.includes(keyword) && !foundAmenities.includes(amenity)) {
      foundAmenities.push(amenity)
    }
  }
  if (foundAmenities.length > 0) details.amenities = foundAmenities
  
  return details
}

/**
 * Generate response for OWNERS (listing their properties)
 * NEVER shows database properties - only helps them list
 * Returns both message and collected details
 */
async function generateOwnerResponse(
  query: string,
  conversationHistory?: string
): Promise<{ message: string; collectedDetails: any; readyToRedirect: boolean }> {
  console.log('[AI Search] Generating owner response - NO property search')
  
  // Extract details from conversation - pass previously collected rent for deposit calculation
  const previousDetails = conversationHistory ? extractPropertyDetails(conversationHistory) : {}
  const collectedDetails = extractPropertyDetails(query, conversationHistory, previousDetails.rent)
  
  // Merge with previous details (don't overwrite existing)
  const mergedDetails = { ...previousDetails, ...collectedDetails }
  const hasDetails = Object.keys(mergedDetails).length > 0
  
  // Check if we have enough details to redirect
  const requiredFields: (keyof typeof mergedDetails)[] = ['propertyType', 'location', 'size', 'rent']
  const hasRequiredFields = requiredFields.every(field => mergedDetails[field])
  const readyToRedirect = hasRequiredFields
  
  const systemPrompt = `You are an INTELLIGENT real estate assistant helping PROPERTY OWNERS list their commercial properties in India.
You understand Indian English, regional variations (Kannadiga, Bihari, etc.), and all number formats.

YOUR INTELLIGENCE:
- Understand ALL number formats: "50k", "50,000/-", "Fifty thousand", "50 thousand", "5 lakhs", "3 laks" (typo), "300000"
- Understand relationships: "6 months of rental" = rent × 6, "3 months deposit" = rent × 3
- Understand regional variations and typos
- Remember EVERYTHING from conversation history
- Extract information intelligently from natural language

CRITICAL RULES:
1. Ask ONE question at a time - never ask multiple questions
2. Remember EVERYTHING the user has told you - reference it naturally
3. NEVER ask for information you already have - acknowledge what you know
4. Understand context - if user says "5 lakhs" after you asked about rent, that's the rent
5. Be smart about number formats - "50k" = 50,000, "5 lakhs" = 500,000, "fifty thousand" = 50,000
6. Understand relationships - "6 months rental" means calculate from monthly rent
7. If you have all details (type, location, size, rent), guide them to the listing form
8. Maintain perfect context - never lose track of the conversation

Your goal: Collect property details intelligently, acknowledge what you know, ask for what's missing, guide them to create their listing.`

  const historyContext = conversationHistory ? `\n\n=== FULL CONVERSATION HISTORY ===\n${conversationHistory}\n\nCRITICAL: Read this entire conversation. The user's current response is answering YOUR LAST question. Understand the context completely.` : ''
  const detailsContext = hasDetails ? `\n\n=== DETAILS YOU HAVE COLLECTED ===\n${JSON.stringify(mergedDetails, null, 2)}\n\nUse this information. Don't ask for what you already have.` : ''

  // Determine what the user is likely responding to - be very specific
  let contextHint = ''
  if (conversationHistory) {
    const conversationLines = conversationHistory.split('\n')
    const lastAIQuestion = conversationLines.filter(line => line.startsWith('assistant:')).pop() || ''
    const lastUserMessage = conversationLines.filter(line => line.startsWith('user:')).pop() || ''
    
    if (lastAIQuestion.toLowerCase().includes('rent') || lastAIQuestion.toLowerCase().includes('monthly')) {
      contextHint = `\n\n=== CONTEXT ===\nYou just asked about monthly rent. The user's response "${query}" is giving you the rent amount.\nExtract the rent intelligently - it could be "50k", "50,000", "fifty thousand", "5 lakhs", "3 laks", etc.\nAcknowledge the rent amount clearly.`
    } else if (lastAIQuestion.toLowerCase().includes('deposit') || lastAIQuestion.toLowerCase().includes('security')) {
      contextHint = `\n\n=== CONTEXT ===\nYou just asked about deposit/security. The user's response "${query}" is giving you the deposit.\nIt could be: "6 months of rental" (calculate from rent), "3 lakhs", "300000", "3 laks", etc.\nExtract and acknowledge it.`
    } else if (lastAIQuestion.toLowerCase().includes('size') || lastAIQuestion.toLowerCase().includes('sqft')) {
      contextHint = `\n\n=== CONTEXT ===\nYou just asked about property size. The user's response "${query}" is giving you the size in sqft.\nExtract the number and acknowledge it.`
    } else if (lastAIQuestion.toLowerCase().includes('location') || lastAIQuestion.toLowerCase().includes('address') || lastAIQuestion.toLowerCase().includes('where')) {
      contextHint = `\n\n=== CONTEXT ===\nYou just asked about location/address. The user's response "${query}" is giving you the location.\nExtract the location (could be area name, full address, etc.) and acknowledge it.`
    } else if (lastAIQuestion.toLowerCase().includes('type') || lastAIQuestion.toLowerCase().includes('kind')) {
      contextHint = `\n\n=== CONTEXT ===\nYou just asked about property type. The user's response "${query}" is giving you the property type.\nExtract it (retail, restaurant, office, etc.) and acknowledge it.`
    }
  }

  const userPrompt = `User's current response: "${query}"${historyContext}${detailsContext}${contextHint}

${readyToRedirect ? '\n\n=== STATUS ===\nYou have collected ALL required details! Guide them to the listing form and mention their details will be pre-filled.' : ''}

=== YOUR TASK ===
1. Read the FULL conversation history - understand the complete context
2. Extract information from the user's current response intelligently
3. Acknowledge what they just told you SPECIFICALLY (e.g., "Perfect! I've noted ₹5,00,000 per month" or "Great! 1500 sqft noted")
4. Check what details you still need from the required fields: ${requiredFields.join(', ')}
5. Ask for the NEXT missing detail (only one question)
6. If you have all details, guide them to the form
7. Keep response to 2-3 sentences MAX
8. Be natural, conversational, and intelligent

Generate your intelligent response:`

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const completion = await (null as any) // Legacy OpenAI call - removed
    /* const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    }) */

    let message = completion.choices[0].message.content || 'I\'d be happy to help you list your property! What type of property do you have?'
    
    if (readyToRedirect) {
      message += '\n\nI have all the key details! I\'m taking you to our property listing form where all the information we discussed will be pre-filled. You can review everything, add any additional details, and submit your listing.'
    }

    return { message, collectedDetails: mergedDetails, readyToRedirect }
  } catch (error) {
    console.error('[AI Search] Error generating owner response:', error)
    
    // Use extracted details to generate smart fallback
    const lowerQuery = query.toLowerCase().trim()
    
    // Check what we just extracted
    const justExtractedRent = query.match(/(\d+)\s*(?:lakh|lakhs|lac|lacs)/i) || query.match(/^(\d+)\s*(?:lakh|lakhs|lac|lacs|thousand|k)?$/i)
    const justExtractedSize = query.match(/(\d+)\s*(?:sqft|sq\.?ft\.?|square feet)/i)
    const justExtractedLocation = query.match(/(?:in|on|at|location)[\s:]+([A-Z][a-zA-Z\s,]+)/i)
    const justExtractedType = query.match(/(retail|restaurant|qsr|office|kiosk|warehouse|commercial)/i)
    
    // Smart fallback - use extracted details intelligently
    // Check if this is rent context
    const isRentContextFallback = conversationHistory?.toLowerCase().includes('rent') || 
                                  conversationHistory?.toLowerCase().includes('monthly')
    
    // If user just provided rent (all formats)
    if (!mergedDetails.rent && (isRentContextFallback || query.match(/(\d+)\s*(?:lakh|lakhs|lac|lacs|k|thousand)/i) || extractNumber(query))) {
      const rentValue = extractNumber(query) || query.match(/(\d+)/)?.[1]
      if (rentValue) {
        mergedDetails.rent = rentValue
        const rentFormatted = parseInt(rentValue).toLocaleString('en-IN')
        
        // Re-check if we have all required fields now
        const nowHasAllFields = requiredFields.every(f => mergedDetails[f as keyof typeof mergedDetails])
        
        if (nowHasAllFields) {
          return {
            message: `Perfect! I've noted ₹${rentFormatted} per month. I have all the details now!\n\nI'm taking you to our property listing form where all the information we discussed will be pre-filled. You can review everything, add any additional details, and submit your listing.`,
            collectedDetails: mergedDetails,
            readyToRedirect: true
          }
        }
        
        return {
          message: `Perfect! I've noted ₹${rentFormatted} per month. What's the security deposit amount? (You can say the amount or "X months of rental")`,
          collectedDetails: mergedDetails,
          readyToRedirect: false
        }
      }
    }
    
    // If user just provided size
    if (justExtractedSize && !mergedDetails.size) {
      mergedDetails.size = justExtractedSize[1]
      return {
        message: `Great! ${justExtractedSize[1]} sqft noted. What's the monthly rent? (You can say "50k", "5 lakhs", "fifty thousand", etc.)`,
        collectedDetails: mergedDetails,
        readyToRedirect: false
      }
    }
    
    // If user just provided location
    if (justExtractedLocation && !mergedDetails.location) {
      mergedDetails.location = justExtractedLocation[1].trim()
      return {
        message: `Got it! Location ${justExtractedLocation[1].trim()} noted. What's the property size in sqft?`,
        collectedDetails: mergedDetails,
        readyToRedirect: false
      }
    }
    
    // If user just provided type
    if (justExtractedType && !mergedDetails.propertyType) {
      const type = justExtractedType[1].toLowerCase()
      mergedDetails.propertyType = type === 'qsr' ? 'mall' : type
      return {
        message: `Excellent! ${type} property noted. What's the location/address?`,
        collectedDetails: mergedDetails,
        readyToRedirect: false
      }
    }
    
    // Check what's missing - use mergedDetails
    const missing = requiredFields.filter(f => !mergedDetails[f as keyof typeof mergedDetails])
    if (missing.length > 0) {
      const firstMissing = missing[0]
      const question = firstMissing === 'propertyType' ? 'property type (Retail, Restaurant, Office, etc.)' : 
                      firstMissing === 'location' ? 'location/address' :
                      firstMissing === 'size' ? 'size in sqft' : 'monthly rent'
      
      // Acknowledge what we have intelligently
      let acknowledgment = ''
      if (mergedDetails.propertyType) acknowledgment += `I know it's a ${mergedDetails.propertyType} property. `
      if (mergedDetails.location) acknowledgment += `Location: ${mergedDetails.location}. `
      if (mergedDetails.size) acknowledgment += `Size: ${mergedDetails.size} sqft. `
      if (mergedDetails.rent) {
        const rentFormatted = parseInt(mergedDetails.rent).toLocaleString('en-IN')
        acknowledgment += `Rent: ₹${rentFormatted}/month. `
      }
      
      return {
        message: acknowledgment ? `${acknowledgment}What's the ${question}?` : `What's the ${question}?`,
        collectedDetails: mergedDetails,
        readyToRedirect: false
      }
    }
    
    // If we have everything, redirect
    if (readyToRedirect) {
      return {
        message: 'Perfect! I have all the details.\n\nI\'m taking you to our property listing form where all the information we discussed will be pre-filled. You can review everything, add any additional details (like photos), and submit your listing.',
        collectedDetails: mergedDetails,
        readyToRedirect: true
      }
    }
    
    return {
      message: 'I\'d be happy to help you list your property! What type of property do you have? (Retail, Restaurant, Office, etc.)',
      collectedDetails: mergedDetails,
      readyToRedirect: false
    }
  }
}

/**
 * Main API handler - SIMPLE & ROBUST
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  console.log('[AI Search] ===== New Request (Simple) =====')
  console.log('[AI Search] API Key configured:', !!process.env.ANTHROPIC_API_KEY)
  console.log('[AI Search] API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 10) || 'N/A')
  
  try {
    let body: any
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('[AI Search] JSON parse error:', parseError.message)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { query, conversationHistory, context: previousContext } = body
    
    console.log('[AI Search] Request:', {
      query: query?.substring(0, 100),
      hasHistory: !!conversationHistory,
      hasContext: !!previousContext
    })

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    // Parse conversation history
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (conversationHistory) {
      const lines = conversationHistory.split('\n')
      for (const line of lines) {
        if (line.startsWith('user:')) {
          history.push({ role: 'user', content: line.substring(5).trim() })
        } else if (line.startsWith('assistant:')) {
          history.push({ role: 'assistant', content: line.substring(10).trim() })
        }
      }
    }

    // Use simple, robust search
    let result
    try {
      result = await simpleSearch(query, history, previousContext)
    } catch (error: any) {
      console.error('[AI Search] Error in simpleSearch:', error.message)
      console.error('[AI Search] Stack:', error.stack)
      throw error
    }
    
    const totalTime = Date.now() - requestStartTime
    console.log('[AI Search] Completed in', totalTime + 'ms')
    console.log('[AI Search] Entity:', result.entityType)
    console.log('[AI Search] Details:', Object.keys(result.collectedDetails || {}))
    console.log('[AI Search] ===== Request Complete =====\n')
    
    // Handle owner redirect
    if (result.readyToRedirect) {
      return NextResponse.json({
        success: true,
        message: result.message,
        properties: [],
        searchParams: {},
        intent: 'owner_listing',
        count: 0,
        collectedDetails: result.collectedDetails,
        readyToRedirect: true,
        redirectTo: '/onboarding/owner',
        extractedRequirements: result.collectedDetails,
        confirmedEntityType: result.entityType
      })
    }
    
    // Regular response
    return NextResponse.json({
      success: true,
      message: result.message,
      properties: [],
      searchParams: {},
      intent: result.entityType === 'brand' ? 'brand_search' : 'owner_listing',
      count: 0,
      extractedRequirements: result.collectedDetails,
      confirmedEntityType: result.entityType
    })

  } catch (error: any) {
    console.error('[AI Search] ===== Error =====')
    console.error('[AI Search] Error:', error.message)
    console.error('[AI Search] Error name:', error.name)
    console.error('[AI Search] Stack:', error.stack)
    
    // Log more details if available
    if (error.status) {
      console.error('[AI Search] HTTP Status:', error.status)
    }
    if (error.statusText) {
      console.error('[AI Search] Status Text:', error.statusText)
    }
    if (error.response) {
      console.error('[AI Search] Response:', JSON.stringify(error.response, null, 2))
    }
    if (error.cause) {
      console.error('[AI Search] Cause:', error.cause)
    }
    
    console.error('[AI Search] ===== End Error =====\n')
    
    // Provide more helpful error message
    let errorMessage = 'An error occurred while processing your search'
    if (error.message?.includes('API key')) {
      errorMessage = 'API key issue. Please check your ANTHROPIC_API_KEY configuration.'
    } else if (error.message?.includes('model')) {
      errorMessage = 'Model configuration issue. Please check the model name.'
    } else if (error.status === 401) {
      errorMessage = 'Authentication failed. Please check your API key.'
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.'
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || errorMessage,
        message: `I apologize, but I encountered an error: ${errorMessage}. Please try again or rephrase your query.`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
