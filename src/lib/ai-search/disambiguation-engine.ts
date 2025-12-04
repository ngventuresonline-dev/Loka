/**
 * Intelligent Disambiguation Engine
 * Handles ambiguous numbers and reference resolution
 */

import { ConversationState, Entity } from './conversation-state'

export interface DisambiguationResult {
  type: 'area' | 'currency' | 'deposit' | 'unknown'
  value: number
  confidence: number
  needsClarification: boolean
  clarificationOptions?: string[]
}

/**
 * Disambiguate a number based on context
 * Handles: "500" → could be 500 sqft, ₹500, or ₹5 lakhs
 */
export function disambiguateNumber(
  number: string,
  state: ConversationState
): DisambiguationResult {
  const numValue = parseInt(number.replace(/[,\s]/g, ''))
  const lowerQuery = state.messageHistory[state.messageHistory.length - 1]?.content.toLowerCase() || ''
  
  // Check 1: Explicit unit in query
  if (lowerQuery.includes('sqft') || lowerQuery.includes('square feet') || lowerQuery.includes('sq ft')) {
    return {
      type: 'area',
      value: numValue,
      confidence: 0.95,
      needsClarification: false
    }
  }
  
  if (lowerQuery.includes('lakh') || lowerQuery.includes('lac') || lowerQuery.includes('₹') || lowerQuery.includes('rupee')) {
    const isLakhs = lowerQuery.includes('lakh') || lowerQuery.includes('lac')
    return {
      type: 'currency',
      value: isLakhs ? numValue * 100000 : numValue,
      confidence: 0.95,
      needsClarification: false
    }
  }
  
  // Check 2: Current topic
  const currentTopic = state.semanticContext.currentTopic
  if (currentTopic === 'discussing area') {
    return {
      type: 'area',
      value: numValue,
      confidence: 0.85,
      needsClarification: false
    }
  }
  
  if (currentTopic === 'discussing budget' || currentTopic === 'discussing rent') {
    // Check magnitude - small numbers (< 1000) are likely exact, large are likely lakhs
    if (numValue < 1000) {
      return {
        type: 'currency',
        value: numValue,
        confidence: 0.70,
        needsClarification: numValue < 100 // Very small numbers need clarification
      }
    } else if (numValue >= 1 && numValue <= 20) {
      // 1-20 could be lakhs
      return {
        type: 'currency',
        value: numValue * 100000,
        confidence: 0.75,
        needsClarification: false
      }
    } else {
      // Large numbers are likely exact currency
      return {
        type: 'currency',
        value: numValue,
        confidence: 0.80,
        needsClarification: false
      }
    }
  }
  
  // Check 3: Recent entities pattern
  const recentNumbers = state.semanticContext.recentEntities
    .filter(e => e.type === 'number')
    .slice(-3)
  
  if (recentNumbers.length > 0) {
    const lastNumber = recentNumbers[recentNumbers.length - 1]
    // If last number was area, this might be area too
    if (lastNumber.value.includes('sqft') || lastNumber.value.includes('area')) {
      return {
        type: 'area',
        value: numValue,
        confidence: 0.75,
        needsClarification: false
      }
    }
  }
  
  // Check 4: Magnitude-based heuristics
  if (numValue >= 1 && numValue <= 50) {
    // Could be lakhs (1-50 lakhs) or sqft (1-50 sqft is too small, but could be)
    // Check if user mentioned area before
    const hasAreaMentioned = state.messageHistory.some(m => 
      m.content.toLowerCase().includes('sqft') || 
      m.content.toLowerCase().includes('area') ||
      m.content.toLowerCase().includes('size')
    )
    
    if (hasAreaMentioned) {
      return {
        type: 'area',
        value: numValue,
        confidence: 0.70,
        needsClarification: numValue < 100 // Very small needs clarification
      }
    } else {
      // More likely to be lakhs
      return {
        type: 'currency',
        value: numValue * 100000,
        confidence: 0.70,
        needsClarification: true,
        clarificationOptions: [
          `${numValue} lakhs per month (₹${(numValue * 100000).toLocaleString('en-IN')})`,
          `${numValue} sqft (area)`
        ]
      }
    }
  }
  
  if (numValue >= 100 && numValue < 10000) {
    // Likely sqft (100-10000 sqft is common)
    return {
      type: 'area',
      value: numValue,
      confidence: 0.75,
      needsClarification: false
    }
  }
  
  if (numValue >= 10000 && numValue < 1000000) {
    // Could be exact currency or sqft (very large space)
    return {
      type: 'currency',
      value: numValue,
      confidence: 0.60,
      needsClarification: true,
      clarificationOptions: [
        `₹${numValue.toLocaleString('en-IN')} per month`,
        `${numValue} sqft`
      ]
    }
  }
  
  // Default: needs clarification
  return {
    type: 'unknown',
    value: numValue,
    confidence: 0.50,
    needsClarification: true,
    clarificationOptions: [
      `${numValue} sqft (area)`,
      `${numValue} lakhs per month (₹${(numValue * 100000).toLocaleString('en-IN')})`,
      `₹${numValue.toLocaleString('en-IN')} per month`
    ]
  }
}

/**
 * Resolve references like "it", "that", "same location"
 */
export function resolveReference(
  reference: string,
  state: ConversationState
): string | null {
  const lowerRef = reference.toLowerCase().trim()
  const currentTopic = state.semanticContext.currentTopic
  const recentEntities = state.semanticContext.recentEntities
  
  // Resolve "it", "that" based on current topic
  if (lowerRef === 'it' || lowerRef === 'that' || lowerRef === 'this') {
    if (currentTopic === 'discussing budget' || currentTopic === 'discussing rent') {
      // Find last mentioned budget/rent
      const lastBudget = recentEntities
        .filter(e => e.type === 'number')
        .reverse()
        .find(e => e.context.includes('rent') || e.context.includes('budget'))
      return lastBudget?.value || null
    }
    
    if (currentTopic === 'discussing area' || currentTopic === 'discussing size') {
      const lastArea = recentEntities
        .filter(e => e.type === 'number')
        .reverse()
        .find(e => e.context.includes('sqft') || e.context.includes('area') || e.context.includes('size'))
      return lastArea?.value || null
    }
    
    if (currentTopic === 'discussing location') {
      const lastLocation = recentEntities
        .filter(e => e.type === 'location')
        .reverse()[0]
      return lastLocation?.value || null
    }
  }
  
  // Resolve "same location", "same area", etc.
  if (lowerRef.includes('same')) {
    if (lowerRef.includes('location') || lowerRef.includes('area') || lowerRef.includes('place')) {
      const lastLocation = recentEntities
        .filter(e => e.type === 'location')
        .reverse()[0]
      return lastLocation?.value || null
    }
    
    if (lowerRef.includes('size') || lowerRef.includes('area') || lowerRef.includes('sqft')) {
      const lastArea = recentEntities
        .filter(e => e.type === 'number')
        .reverse()
        .find(e => e.context.includes('sqft') || e.context.includes('area'))
      return lastArea?.value || null
    }
  }
  
  return null
}

/**
 * Extract entities from query
 */
export function extractEntities(
  query: string,
  state: ConversationState
): Entity[] {
  const entities: Entity[] = []
  const lowerQuery = query.toLowerCase()
  
  // Extract locations
  const locationPatterns = [
    /(?:in|on|at|location|address)[\s:]+([A-Z][a-zA-Z\s,]+?)(?:,|$|available|for rent)/i,
    /([A-Z][a-zA-Z\s]+(?:road|street|layout|nagar|layout|block|sector))/i,
    /(?:bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata)[\s,]+([A-Z][a-zA-Z\s]+)/i
  ]
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern)
    if (match) {
      entities.push({
        type: 'location',
        value: match[1].trim(),
        confidence: 0.8,
        mentionedAt: state.conversationLength + 1,
        context: query
      })
    }
  }
  
  // Extract numbers
  const numberPatterns = [
    /(\d+)\s*(?:sqft|sq\.?ft\.?|square\s*feet)/i,
    /(\d+)\s*(?:lakh|lakhs|lac|lacs)/i,
    /(\d+)\s*k/i,
    /(\d{1,3}(?:[,\s]\d{2,3})*)/g
  ]
  
  for (const pattern of numberPatterns) {
    const matches = query.matchAll(pattern)
    for (const match of matches) {
      const numStr = match[1] || match[0]
      entities.push({
        type: 'number',
        value: numStr,
        confidence: 0.7,
        mentionedAt: state.conversationLength + 1,
        context: query
      })
    }
  }
  
  return entities
}

/**
 * Generate clarification question for ambiguous number
 */
export function generateClarificationQuestion(
  number: string,
  options: string[]
): string {
  return `Just to clarify, did you mean:\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nWhich one?`
}

