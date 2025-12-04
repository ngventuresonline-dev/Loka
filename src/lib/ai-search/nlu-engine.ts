/**
 * Natural Language Understanding Engine
 * Handles entity classification and requirement extraction
 */

import Anthropic from '@anthropic-ai/sdk'
import { EntityType, BrandRequirements, OwnerRequirements, ProcessedQuery, ConversationContext } from './types'
import { disambiguateNumber, resolveReference, extractEntities } from './disambiguation-engine'
import { ConversationState } from './conversation-state'

// Initialize Anthropic client with error checking
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[NLU] CRITICAL: ANTHROPIC_API_KEY is not set in environment variables!')
  console.error('[NLU] Please check your .env.local file and restart the dev server.')
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Brand indicators (seeking space)
const BRAND_SIGNALS = [
  'looking for space', 'need retail shop', 'opening restaurant',
  'want to lease', 'searching for location', 'expanding our brand',
  'setting up outlet', 'require sqft for', 'we are', 'our restaurant needs',
  'planning to open', 'scouting locations', 'looking for', 'need', 'want',
  'looking to rent', 'looking to lease', 'show me', 'i need'
]

// Owner indicators (offering space)
const OWNER_SIGNALS = [
  'have property', 'space available', 'retail space for lease',
  'looking for tenants', 'property for rent', 'we own', 'our building has',
  'vacant space', 'seeking brands', 'property available in', 'landlord',
  'lessor', 'i have', 'available', 'for rent', 'rent out', 'listing'
]

/**
 * Classify entity type from query
 */
export async function classifyEntityType(
  query: string,
  context?: ConversationContext,
  conversationHistory?: string
): Promise<EntityType> {
  console.log('[NLU] Classifying entity type:', { query: query.substring(0, 50), hasContext: !!context, hasHistory: !!conversationHistory })
  
  // CRITICAL: Check conversation history FIRST for previous identification
  if (conversationHistory) {
    const historyLower = conversationHistory.toLowerCase()
    
    // Check if user already said they're an owner - MULTIPLE PATTERNS
    // Split by lines and check each user message
    const lines = conversationHistory.split('\n')
    for (const line of lines) {
      if (!line.toLowerCase().startsWith('user:')) continue
      
      const userMessage = line.substring(line.indexOf(':') + 1).trim().toLowerCase()
      
      // Check for owner indicators
      if (userMessage === '2' || 
          userMessage === 'option 2' ||
          userMessage.includes('property owner') ||
          userMessage.includes('proeprty owner') ||
          userMessage.includes('property owner looking for tenants') ||
          (userMessage.includes('owner') && !userMessage.includes('brand')) ||
          userMessage.includes('landlord') ||
          userMessage.includes('lessor') ||
          userMessage.includes('i have property') ||
          userMessage.includes('i own') ||
          userMessage.includes('looking for tenants') ||
          userMessage.includes('seeking brands') ||
          userMessage.includes('space available') ||
          userMessage.includes('for rent') ||
          userMessage.includes('listing')) {
        console.log('[NLU] Found owner identification in history:', userMessage.substring(0, 50))
        return 'owner'
      }
      
      // Check for brand indicators
      if (userMessage === '1' ||
          userMessage === 'option 1' ||
          userMessage.includes('brand') ||
          userMessage.includes('business looking for space') ||
          userMessage.includes('looking for space to lease') ||
          userMessage.includes('tenant') ||
          userMessage.includes('occupier') ||
          userMessage.includes('need space') ||
          userMessage.includes('want to lease')) {
        console.log('[NLU] Found brand identification in history:', userMessage.substring(0, 50))
        return 'brand'
      }
    }
  }
  
  // Context override (if user already identified)
  if (context?.confirmedEntityType && context.confirmedEntityType !== 'needs_clarification') {
    console.log('[NLU] Using confirmed entity type from context:', context.confirmedEntityType)
    return context.confirmedEntityType
  }
  
  const queryLower = query.toLowerCase().trim()
  
  // CRITICAL: Detect responses to clarification question
  // If conversation history contains the clarification question, check if this is a response to it
  if (conversationHistory && conversationHistory.toLowerCase().includes('just to clarify')) {
    // This is likely a response to the clarification question
    if (queryLower === '2' || queryLower === 'option 2' || 
        queryLower.includes('property owner') || queryLower.includes('proeprty owner') ||
        queryLower.includes('owner') || queryLower.includes('landlord')) {
      console.log('[NLU] User responded to clarification with owner selection - OWNER')
      return 'owner'
    }
    if (queryLower === '1' || queryLower === 'option 1' || 
        queryLower.includes('brand') || queryLower.includes('business looking') ||
        queryLower.includes('looking for space')) {
      console.log('[NLU] User responded to clarification with brand selection - BRAND')
      return 'brand'
    }
  }
  
  // CRITICAL: Detect "2" or "option 2" as owner selection (standalone)
  if (queryLower === '2' || queryLower === 'option 2' || 
      queryLower.includes('property owner') || queryLower.includes('proeprty owner')) {
    console.log('[NLU] User selected option 2 or said property owner - OWNER')
    return 'owner'
  }
  
  // CRITICAL: Detect "1" or "option 1" as brand selection (standalone)
  if (queryLower === '1' || queryLower === 'option 1' || 
      queryLower.includes('brand') || queryLower.includes('business looking')) {
    console.log('[NLU] User selected option 1 or said brand - BRAND')
    return 'brand'
  }
  
  // Explicit brand mentions
  const brandScore = BRAND_SIGNALS.filter(signal => queryLower.includes(signal)).length
  const ownerScore = OWNER_SIGNALS.filter(signal => queryLower.includes(signal)).length
  
  // Pattern analysis with confidence scoring
  const brandConfidence = brandScore / BRAND_SIGNALS.length
  const ownerConfidence = ownerScore / OWNER_SIGNALS.length
  
  console.log('[NLU] Classification scores:', { brandConfidence, ownerConfidence })
  
  // Confidence threshold: 0.3 difference required
  if (brandConfidence > ownerConfidence + 0.3) {
    console.log('[NLU] Classified as BRAND')
    return 'brand'
  } else if (ownerConfidence > brandConfidence + 0.3) {
    console.log('[NLU] Classified as OWNER')
    return 'owner'
  } else {
    // AMBIGUOUS - Ask for clarification
    console.log('[NLU] Ambiguous - needs clarification')
    return 'needs_clarification'
  }
}

/**
 * Extract brand requirements using AI
 */
export async function extractBrandRequirements(
  query: string,
  conversationHistory?: string
): Promise<Partial<BrandRequirements>> {
  console.log('[NLU] Extracting brand requirements from full conversation')
  
  const systemPrompt = `You are an expert at extracting commercial real estate requirements for BRANDS (tenants/occupiers).

CRITICAL: Extract from the ENTIRE conversation history, not just the last message. If the user mentioned "500 sqft" earlier, include it. If they mentioned location before, include it.

Extract structured requirements from natural language. Return ONLY valid JSON matching this structure:
{
  "area": { "min": number, "max": number, "preferred": number, "flexibility": "strict|moderate|flexible" },
  "location": { "city": string, "areas": string[], "landmarks": string[], "restrictions": string[] },
  "propertyType": { "primary": string, "acceptable": string[] },
  "budget": { "monthlyRent": { "min": number, "max": number, "currency": "INR" }, "deposit": { "maxMonths": number } },
  "footfall": { "minimumDaily": number, "targetDemographics": { "ageGroups": string[], "incomeLevel": string } },
  "accessibility": { "parkingRequired": boolean, "roadAccess": string },
  "infrastructure": { "electricity": { "phase": string }, "water": boolean, "drainage": boolean, "exhaust": boolean },
  "leaseTerms": { "duration": { "min": number, "preferred": number }, "lockInPeriod": number },
  "brandProfile": { "category": string, "subcategory": string }
}

UNDERSTAND:
- "50k" = 50,000, "5 lakhs" = 500,000, "fifty thousand" = 50,000
- "500 sqft" or "500sqft" = area.min: 400, area.max: 600, preferred: 500
- "6 months rental" for deposit = calculate from rent
- Regional variations: "laks" = "lakhs", understand typos
- READ THE ENTIRE CONVERSATION - extract ALL mentioned details

Return ONLY the JSON object, no other text.`

  // CRITICAL: Pass the FULL conversation history, not just context
  const fullHistory = conversationHistory || ''
  const historyContext = fullHistory ? `\n\n=== FULL CONVERSATION HISTORY ===\n${fullHistory}\n\nCRITICAL: Read the ENTIRE conversation above. Extract ALL requirements mentioned anywhere in the conversation, not just the last message. If size was mentioned earlier (like "500 sqft"), include it in the area field.` : ''
  
  const userPrompt = `Extract ALL requirements from the entire conversation: "${query}"${historyContext}\n\nRemember: Extract from the FULL conversation history, including previous messages.`
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
    })
    
    const response = message.content[0]
    if (!response || response.type !== 'text') {
      console.warn('[NLU] Empty or invalid response from Claude')
      console.warn('[NLU] Response:', JSON.stringify(message.content, null, 2))
      return {}
    }
    
    const text = response.text.trim()
    // Claude may wrap JSON in markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, text]
    const jsonText = jsonMatch[1] || text
    
    let extracted: any = {}
    try {
      extracted = JSON.parse(jsonText)
    } catch (parseError: any) {
      console.error('[NLU] JSON parse error:', parseError.message)
      console.error('[NLU] Text to parse:', jsonText.substring(0, 500))
      // Try to extract JSON object from text
      const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        try {
          extracted = JSON.parse(jsonObjectMatch[0])
        } catch (e) {
          console.error('[NLU] Failed to parse extracted JSON object')
          return {}
        }
      } else {
        return {}
      }
    }
    
    console.log('[NLU] Extracted brand requirements:', Object.keys(extracted))
    return extracted as Partial<BrandRequirements>
  } catch (error: any) {
    console.error('[NLU] Error extracting brand requirements:', error.message)
    console.error('[NLU] Error stack:', error.stack)
    if (error.status) {
      console.error('[NLU] API status:', error.status)
    }
    return {}
  }
}

/**
 * Extract owner requirements using AI
 */
export async function extractOwnerRequirements(
  query: string,
  conversationHistory?: string
): Promise<Partial<OwnerRequirements>> {
  console.log('[NLU] Extracting owner requirements')
  
  const systemPrompt = `You are an expert at extracting property details from PROPERTY OWNERS (landlords).

Extract structured requirements from natural language. Return ONLY valid JSON matching this structure:
{
  "property": { "area": number, "type": string, "configuration": { "floors": number } },
  "location": { "city": string, "area": string, "address": string, "landmark": string },
  "rentExpectations": { "monthlyRent": number, "deposit": number, "negotiable": boolean },
  "infrastructure": { "electricity": { "phase": string, "load": number }, "water": boolean, "drainage": boolean, "exhaust": boolean, "gasConnection": boolean },
  "accessibility": { "metroDistance": number, "mainRoad": boolean, "parking": { "available": boolean, "spaces": number } },
  "footfall": { "averageDaily": number, "demographics": { "dominantAgeGroup": string[], "incomeLevel": string } },
  "desiredTenant": { "categories": string[], "preferredBrands": string[] },
  "leaseTerms": { "minDuration": number, "lockInPeriod": number, "escalation": number, "rentFreePeriod": number },
  "availability": { "status": "immediate|upcoming|occupied" }
}

UNDERSTAND:
- "50k" = 50,000, "5 lakhs" = 500,000, "fifty thousand" = 50,000
- "6 months rental" for deposit = calculate from rent
- "12th main" is an address, NOT rent amount
- Regional variations: "laks" = "lakhs", understand typos
- Context from conversation history matters

Return ONLY the JSON object, no other text.`

  const historyContext = conversationHistory ? `\n\n=== CONVERSATION HISTORY ===\n${conversationHistory}\n\nUse this context to understand what the user is responding to.` : ''
  
  const userPrompt = `Extract requirements from: "${query}"${historyContext}`
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
    })
    
    const response = message.content[0]
    if (!response || response.type !== 'text') {
      console.warn('[NLU] Empty or invalid response from Claude')
      return {}
    }
    
    const text = response.text.trim()
    // Claude may wrap JSON in markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, text]
    const jsonText = jsonMatch[1] || text
    
    let extracted: any = {}
    try {
      extracted = JSON.parse(jsonText)
    } catch (parseError: any) {
      console.error('[NLU] JSON parse error:', parseError.message)
      console.error('[NLU] Text to parse:', jsonText.substring(0, 500))
      // Try to extract JSON object from text
      const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        try {
          extracted = JSON.parse(jsonObjectMatch[0])
        } catch (e) {
          console.error('[NLU] Failed to parse extracted JSON object')
          return {}
        }
      } else {
        return {}
      }
    }
    
    console.log('[NLU] Extracted owner requirements:', Object.keys(extracted))
    return extracted as Partial<OwnerRequirements>
  } catch (error: any) {
    console.error('[NLU] Error extracting owner requirements:', error.message)
    console.error('[NLU] Error stack:', error.stack)
    if (error.status) {
      console.error('[NLU] API status:', error.status)
    }
    return {}
  }
}

/**
 * Process query and extract requirements
 * Enhanced with disambiguation and reference resolution
 */
export async function processQuery(
  query: string,
  entityType: EntityType,
  conversationHistory?: string,
  fullState?: ConversationState
): Promise<ProcessedQuery> {
  console.log('[NLU] Processing query for entity type:', entityType)
  
  // CRITICAL: Resolve references first ("it", "that", "same location")
  let processedQuery = query
  if (fullState) {
    const references = ['it', 'that', 'this', 'same location', 'same area', 'same size']
    for (const ref of references) {
      if (query.toLowerCase().includes(ref)) {
        const resolved = resolveReference(ref, fullState)
        if (resolved) {
          processedQuery = query.replace(new RegExp(ref, 'gi'), resolved)
          console.log('[NLU] Resolved reference:', ref, '→', resolved)
        }
      }
    }
  }
  
  let requirements: Partial<BrandRequirements | OwnerRequirements> = {}
  let confidence = 0.8
  
  if (entityType === 'brand') {
    requirements = await extractBrandRequirements(processedQuery, conversationHistory)
    confidence = 0.9
  } else if (entityType === 'owner') {
    requirements = await extractOwnerRequirements(processedQuery, conversationHistory)
    confidence = 0.9
  } else {
    // Needs clarification
    return {
      entityType: 'needs_clarification',
      confidence: 0.5,
      requirements: {},
      missingCritical: [],
      intent: 'general_inquiry'
    }
  }
  
  // CRITICAL: Disambiguate ambiguous numbers in requirements
  if (fullState) {
    requirements = disambiguateRequirements(requirements, fullState)
  }
  
  // Determine intent
  const intent: 'seeking_space' | 'offering_space' = entityType === 'brand' ? 'seeking_space' : 'offering_space'
  
  // Identify missing critical fields (simplified for now)
  const missingCritical: string[] = []
  
  return {
    entityType,
    confidence,
    requirements,
    missingCritical,
    intent
  }
}

/**
 * Disambiguate ambiguous values in requirements
 */
function disambiguateRequirements(
  requirements: Partial<BrandRequirements | OwnerRequirements>,
  state: ConversationState
): Partial<BrandRequirements | OwnerRequirements> {
  const disambiguated = { ...requirements }
  
  // Check for ambiguous area values
  if ('area' in disambiguated && disambiguated.area) {
    const area = disambiguated.area as any
    if (area.preferred && area.preferred < 100 && !area.min && !area.max) {
      // Very small number - might be lakhs, not sqft
      const result = disambiguateNumber(area.preferred.toString(), state)
      if (result.type === 'currency') {
        // It's actually budget, not area
        delete disambiguated.area
        if (!disambiguated.budget) {
          disambiguated.budget = {
            monthlyRent: { min: result.value * 0.8, max: result.value * 1.2, currency: 'INR' },
            deposit: { maxMonths: 10 }
          } as any
        }
      }
    }
  }
  
  return disambiguated
}

