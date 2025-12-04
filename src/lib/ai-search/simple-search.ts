/**
 * SIMPLE, ROBUST AI SEARCH
 * No complex state management - just works
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

interface SimpleContext {
  entityType: 'brand' | 'owner' | null
  collectedDetails: Record<string, any>
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * Simple, reliable entity type detection
 */
function detectEntityType(query: string, history: string): 'brand' | 'owner' | null {
  const lower = query.toLowerCase().trim()
  const historyLower = history.toLowerCase()
  
  // Check history first - CRITICAL: Check for brand indicators FIRST
  if (historyLower.includes('im a brand') || historyLower.includes('i am a brand') ||
      historyLower.includes('i\'m a brand') || historyLower.includes('i need space') ||
      historyLower.includes('looking for space') || historyLower.includes('want space') ||
      historyLower.includes('brand') || historyLower.includes('1') || 
      historyLower.includes('option 1') || historyLower.includes('tenant') ||
      historyLower.includes('occupier')) {
    return 'brand'
  }
  if (historyLower.includes('property owner') || historyLower.includes('i have property') || 
      historyLower.includes('2') || historyLower.includes('option 2') ||
      historyLower.includes('landlord') || historyLower.includes('listing')) {
    return 'owner'
  }
  
  // Check current query - CRITICAL: Brand indicators FIRST
  if (lower.includes('im a brand') || lower.includes('i am a brand') ||
      lower.includes('i\'m a brand') || lower.includes('i need space') ||
      lower.includes('need space') || lower.includes('want space') ||
      lower === '1' || lower === 'option 1' || lower.includes('brand') || 
      lower.includes('looking for') || lower.includes('tenant') ||
      lower.includes('occupier')) {
    return 'brand'
  }
  if (lower === '2' || lower === 'option 2' || lower.includes('property owner') || 
      lower.includes('i have') || lower.includes('available') || lower.includes('for rent') ||
      lower.includes('landlord') || lower.includes('listing')) {
    return 'owner'
  }
  
  return null
}

/**
 * Extract details from natural language - CONTEXT-AWARE VERSION
 */
function extractDetailsSimple(
  query: string, 
  entityType: 'brand' | 'owner',
  context?: SimpleContext
): Record<string, any> {
  const details: any = {}
  const lower = query.toLowerCase().trim()
  const queryTrimmed = query.trim()
  
  // Check what was asked last (context-aware extraction)
  const lastQuestion = context?.conversationHistory && context.conversationHistory.length > 0
    ? context.conversationHistory[context.conversationHistory.length - 1]?.content.toLowerCase() || ''
    : ''
  const isRentContext = lastQuestion.includes('rent') || lastQuestion.includes('budget') || lastQuestion.includes('monthly')
  const isSizeContext = lastQuestion.includes('size') || lastQuestion.includes('sqft') || lastQuestion.includes('area')
  const isLocationContext = lastQuestion.includes('location') || lastQuestion.includes('where') || lastQuestion.includes('city')
  
  // Extract location - improved patterns (case-insensitive)
  // First try: match locations after "in", "at", "space in", etc.
  let locationMatch = query.match(/(?:in|on|at|location|space in|looking for|need space in)[\s:]+([a-zA-Z][a-zA-Z\s,]+)/i)
  
  // Second try: match common Bangalore locations directly
  if (!locationMatch) {
    locationMatch = query.match(/\b(koramangala|whitefield|indiranagar|hbr|hsr|marathahalli|btm|jayanagar|malleshwaram|rajajinagar|basavanagudi|vijayanagar|yeshwanthpur|hebbal|electronic city|bommanahalli|kundalahalli|sarjapur|bellandur|varthur|kadubeesanahalli|domlur|ulsoor|richmond town|lavelle road|mg road|brigade road|commercial street|church street|st marks road|residency road|cunningham road|sadashivanagar|malleswaram|rt nagar|mathikere|peenya|chamrajpet|gandhinagar|sampangiramnagar|shivajinagar|frazer town|langford town|ashok nagar|sadashivnagar|banashankari|jayalakshmipuram|bangalore|bengaluru)\b/i)
  }
  
  // Third try: match if location context
  if (!locationMatch && isLocationContext) {
    locationMatch = query.match(/([a-zA-Z][a-zA-Z\s,]+)/)
  }
  
  if (locationMatch && !isRentContext && !isSizeContext) {
    const loc = locationMatch[1]?.trim() || locationMatch[0]?.trim()
    // Filter out common false positives
    if (loc && !loc.match(/^(rent|monthly|deposit|size|sqft|\d+|im|a|brand|need|space|looking|for|i|am)$/i)) {
      // Capitalize first letter of each word
      details.location = loc.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }
  }
  
  // Extract size
  const sizeMatch = query.match(/(\d+)\s*(?:sqft|sq\.?ft\.?|square\s*feet)/i) ||
                    (isSizeContext && query.match(/^(\d+)$/))
  if (sizeMatch) {
    details.size = parseInt(sizeMatch[1])
  }
  
  // Extract rent/budget - CONTEXT-AWARE: If last question was about rent/budget, ANY number is rent/budget
  // CRITICAL: Also check if query is a plain number - if so and last question was about budget/rent, extract it
  const isPlainNumber = /^\d+$/.test(query.trim())
  const lastQuestionHasBudget = lastQuestion.includes('budget') || lastQuestion.includes('rent') || lastQuestion.includes('monthly')
  
  if (isRentContext || (isPlainNumber && lastQuestionHasBudget)) {
    // If asking for rent/budget and user gives a number, it's rent/budget
    const numberMatch = query.match(/^(\d+)$/) || query.match(/(\d+)/)
    if (numberMatch) {
      const num = parseInt(numberMatch[1])
      console.log('[ExtractDetails] Extracting rent/budget:', { num, entityType, isRentContext, isPlainNumber, lastQuestionHasBudget })
      // For brands, use "budget", for owners use "rent"
      if (entityType === 'brand') {
        // Smart interpretation: large numbers (>= 10000) are exact amounts (e.g., 98000, 980000)
        // Medium numbers (100-9999) might be thousands (e.g., 50 = 50,000)
        // Small numbers (< 100) are lakhs (e.g., 3 = 300,000)
        if (num >= 10000) {
          details.budget = num // Exact amount (e.g., 98000, 980000)
        } else if (num >= 100) {
          details.budget = num * 1000 // Assume thousands (e.g., 50 = 50,000)
        } else {
          details.budget = num * 100000 // Assume lakhs (e.g., 3 = 300,000)
        }
      } else {
        // Owner rent - same logic
        if (num >= 10000) {
          details.rent = num // Exact amount
        } else if (num >= 100) {
          details.rent = num * 1000 // Assume thousands
        } else {
          details.rent = num * 100000 // Assume lakhs
        }
      }
      console.log('[ExtractDetails] Extracted:', entityType === 'brand' ? `budget=${details.budget}` : `rent=${details.rent}`)
    }
  } else {
    // Extract rent/budget from explicit mentions
    const rentMatch = query.match(/(\d+)\s*(?:lakh|lakhs|lac|lacs)/i) || 
                       query.match(/₹?\s*(\d+)\s*(?:thousand|k)/i) ||
                       query.match(/rent[\s:]+₹?\s*(\d+)/i) ||
                       query.match(/budget[\s:]+₹?\s*(\d+)/i)
    if (rentMatch) {
      const num = parseInt(rentMatch[1])
      const amount = lower.includes('lakh') ? num * 100000 : (lower.includes('k') || lower.includes('thousand') ? num * 1000 : num)
      if (entityType === 'brand') {
        details.budget = amount
      } else {
        details.rent = amount
      }
    }
  }
  
  return details
}

/**
 * Generate intelligent response using Claude - SIMPLE VERSION
 */
async function generateResponse(
  query: string,
  entityType: 'brand' | 'owner',
  context: SimpleContext
): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === '') {
      console.warn('[SimpleSearch] ANTHROPIC_API_KEY not configured, using fallback')
      throw new Error('API key not configured')
    }

    const history = (context.conversationHistory || [])
      .slice(-6) // Last 6 messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    const systemPrompt = entityType === 'owner' 
      ? `You are a helpful assistant helping property owners list their commercial properties. 
Be conversational, friendly, and ask ONE question at a time. 
You've collected: ${JSON.stringify(context.collectedDetails)}
Ask for the NEXT missing detail. If you have location, size, and rent, guide them to the listing form.
NEVER ask about budget - owners have rent, not budget.`
      : `You are a helpful assistant helping brands find commercial properties.
Be conversational, friendly, and ask ONE question at a time.
You've collected: ${JSON.stringify(context.collectedDetails)}
Ask for the NEXT missing detail: location, size, or budget.
NEVER ask about "rent you're expecting" - brands have budget, not rent. Ask "What's your monthly budget for rent?" instead.`

    const userPrompt = `User said: "${query}"

${history ? `Previous conversation:\n${history}\n` : ''}

Generate a helpful, conversational response (2-3 sentences max). Ask ONE question if you need more info.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
    })

    const response = message.content?.[0]
    if (response && response.type === 'text') {
      return response.text.trim()
    }
    
    console.warn('[SimpleSearch] Invalid API response format:', JSON.stringify(message.content, null, 2))
    throw new Error('Invalid response from API')
  } catch (error: any) {
    console.error('[SimpleSearch] API error:', error.message)
    
    // Fallback to rule-based response
    return generateFallbackResponse(query, entityType, context)
  }
}

/**
 * Fallback response when API fails - CONTEXT-AWARE
 */
function generateFallbackResponse(
  query: string,
  entityType: 'brand' | 'owner',
  context: SimpleContext
): string {
  const details = context.collectedDetails || {}
  const lastQuestion = context.conversationHistory && context.conversationHistory.length > 0
    ? context.conversationHistory[context.conversationHistory.length - 1]?.content.toLowerCase() || ''
    : ''
  
  // Check if we just collected rent/budget
  if ((lastQuestion.includes('rent') || lastQuestion.includes('budget')) && /^\d+$/.test(query.trim())) {
    // User just provided rent/budget - acknowledge and check what's next
    if (entityType === 'owner') {
      const rent = details.rent
      if (!details.location) {
        return `Perfect! I've noted ₹${rent?.toLocaleString('en-IN') || query}/month. Where is your property located?`
      }
      if (!details.size) {
        return `Great! Rent noted. What's the size of your property? (e.g., 500 sqft)`
      }
      return `Excellent! I have all the details. Let me take you to the listing form!`
    } else {
      // Brand
      const budget = details.budget
      if (!details.location) {
        return `Perfect! Budget noted: ₹${budget?.toLocaleString('en-IN') || query}/month. Where are you looking for space?`
      }
      if (!details.size) {
        return `Great! Budget noted. What size space are you looking for? (e.g., 500 sqft)`
      }
      return `Excellent! I have all the details. Let me search for the best matches for you!`
    }
  }
  
  // Check if we just collected size
  if (lastQuestion.includes('size') && (details.size || /^\d+$/.test(query.trim()))) {
    if (entityType === 'owner') {
      if (!details.rent) {
        return `Perfect! Size noted: ${details.size || query} sqft. What's the monthly rent you're expecting?`
      }
    } else {
      if (!details.budget) {
        return `Perfect! Size noted: ${details.size || query} sqft. What's your monthly budget for rent?`
      }
    }
  }
  
  // Check if we just collected location
  if ((lastQuestion.includes('location') || lastQuestion.includes('where')) && details.location) {
    if (entityType === 'owner') {
      if (!details.size) {
        return `Perfect! Location noted: ${details.location}. What's the size of your property? (e.g., 500 sqft)`
      }
    } else {
      if (!details.size) {
        return `Perfect! Location noted: ${details.location}. What size space are you looking for? (e.g., 500 sqft)`
      }
    }
  }
  
  // Normal flow
  if (entityType === 'owner') {
    if (!details.location) {
      return "Great! I'd love to help you list your property. Where is your property located? (Please share the city and area)"
    }
    if (!details.size) {
      return "Perfect! What's the size of your property? (e.g., 500 sqft, 1000 sqft)"
    }
    if (!details.rent) {
      return "Excellent! What's the monthly rent you're expecting for this property?"
    }
    return "Perfect! I have all the key details. Let me take you to the listing form where everything will be pre-filled."
  } else {
    if (!details.location) {
      return "Great! Where are you looking for space? (Please share the city and area)"
    }
    if (!details.size) {
      return "Perfect! What size space are you looking for? (e.g., 500 sqft, 1000 sqft)"
    }
    if (!details.budget) {
      return "Excellent! What's your monthly budget for rent?"
    }
    return "Perfect! I have all the details. Let me search for the best matches for you."
  }
}

/**
 * Main search function - SIMPLE AND ROBUST
 */
export async function simpleSearch(
  query: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  previousContext?: SimpleContext
): Promise<{
  message: string
  entityType: 'brand' | 'owner' | null
  collectedDetails: Record<string, any>
  readyToRedirect?: boolean
}> {
  // Build history string (handle empty arrays)
  const historyString = (conversationHistory || [])
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  // Detect entity type
  let entityType = previousContext?.entityType || detectEntityType(query, historyString)
  
  // If still null, ask for clarification
  if (!entityType) {
    return {
      message: "I'd love to help! Are you:\n\n1. A brand/business looking for space to lease? 🏪\n2. A property owner looking for tenants? 🏢",
      entityType: null,
      collectedDetails: {}
    }
  }

  // Build context for extraction
  const extractionContext: SimpleContext = {
    entityType,
    collectedDetails: previousContext?.collectedDetails || {},
    conversationHistory: conversationHistory || []
  }
  
  // Extract simple details (with context awareness)
  let newDetails: Record<string, any> = {}
  try {
    newDetails = extractDetailsSimple(query, entityType, extractionContext)
  } catch (error: any) {
    console.error('[SimpleSearch] Error extracting details:', error.message)
    // Continue with empty details
  }
  
  // Merge with previous details (don't overwrite existing non-empty values)
  const collectedDetails: Record<string, any> = {
    ...(previousContext?.collectedDetails || {})
  }
  
  // Only add new details if they're not empty
  Object.keys(newDetails).forEach(key => {
    if (newDetails[key] !== undefined && newDetails[key] !== null && newDetails[key] !== '') {
      collectedDetails[key] = newDetails[key]
    }
  })
  
  console.log('[SimpleSearch] Extracted:', newDetails)
  console.log('[SimpleSearch] Collected so far:', collectedDetails)

  // Check if we have enough for owner redirect
  if (entityType === 'owner' && collectedDetails.location && collectedDetails.size && collectedDetails.rent) {
    return {
      message: `Perfect! I have all the key details:\n\n📍 Location: ${collectedDetails.location}\n📐 Size: ${collectedDetails.size} sqft\n💰 Rent: ₹${collectedDetails.rent.toLocaleString('en-IN')}/month\n\nLet me take you to the listing form!`,
      entityType,
      collectedDetails,
      readyToRedirect: true
    }
  }

  // Update conversation history
  const updatedHistory = [
    ...(conversationHistory || []),
    { role: 'user' as const, content: query }
  ]

  // Generate response
  const context: SimpleContext = {
    entityType,
    collectedDetails,
    conversationHistory: updatedHistory
  }

  // CRITICAL: Check if we just collected a value that was asked for
  // If so, use fallback response immediately (don't call Claude)
  const lastAssistantMessage = conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1]?.role === 'assistant'
    ? conversationHistory[conversationHistory.length - 1].content.toLowerCase()
    : ''
  
  console.log('[SimpleSearch] Last assistant message:', lastAssistantMessage.substring(0, 50))
  console.log('[SimpleSearch] Query:', query)
  console.log('[SimpleSearch] Collected details:', collectedDetails)
  
  // Check if query is a plain number (likely answer to a question)
  const isPlainNumber = /^\d+$/.test(query.trim())
  const askedForBudget = lastAssistantMessage.includes('budget') || lastAssistantMessage.includes('rent')
  const askedForSize = lastAssistantMessage.includes('size')
  const askedForLocation = lastAssistantMessage.includes('location') || lastAssistantMessage.includes('where')
  
  // If user gave a number after being asked for budget/rent, we should have extracted it
  const justCollectedBudget = askedForBudget && isPlainNumber && (collectedDetails.budget || collectedDetails.rent)
  const justCollectedSize = askedForSize && (collectedDetails.size || isPlainNumber)
  const justCollectedLocation = askedForLocation && collectedDetails.location

  console.log('[SimpleSearch] Checks:', {
    isPlainNumber,
    askedForBudget,
    askedForSize,
    askedForLocation,
    justCollectedBudget,
    justCollectedSize,
    justCollectedLocation,
    hasBudget: !!collectedDetails.budget,
    hasRent: !!collectedDetails.rent,
    hasSize: !!collectedDetails.size,
    hasLocation: !!collectedDetails.location
  })

  // If we just collected something, use fallback to acknowledge and move forward
  if (justCollectedBudget || justCollectedSize || justCollectedLocation) {
    console.log('[SimpleSearch] Just collected value, using fallback response')
    const message = generateFallbackResponse(query, entityType, context)
    return {
      message,
      entityType,
      collectedDetails
    }
  }
  
  // Also check: if we asked for budget and got a number, but extraction failed, still use fallback
  if (askedForBudget && isPlainNumber && !collectedDetails.budget && !collectedDetails.rent) {
    console.log('[SimpleSearch] WARNING: Asked for budget but extraction failed, forcing extraction')
    // Force extract the number as budget/rent
    const num = parseInt(query.trim())
    if (entityType === 'brand') {
      collectedDetails.budget = num >= 100000 ? num : (num < 100 ? num * 100000 : num * 1000)
    } else {
      collectedDetails.rent = num >= 100000 ? num : (num < 100 ? num * 100000 : num * 1000)
    }
    const message = generateFallbackResponse(query, entityType, {
      ...context,
      collectedDetails
    })
    return {
      message,
      entityType,
      collectedDetails
    }
  }

  // Otherwise, call Claude for intelligent response
  let message: string
  try {
    message = await generateResponse(query, entityType, context)
  } catch (error: any) {
    console.error('[SimpleSearch] Error generating response:', error.message)
    // Use fallback
    message = generateFallbackResponse(query, entityType, context)
  }

  return {
    message,
    entityType,
    collectedDetails
  }
}

