/**
 * Conversation Manager
 * Handles multi-turn conversations and context management
 */

import { ConversationContext, BrandRequirements, OwnerRequirements } from './types'
import { 
  ConversationState, 
  createConversationState, 
  addMessageToHistory,
  establishEntityIdentity,
  updateRequirements,
  getCurrentRequirements,
  isEntityIdentityEstablished,
  updateSemanticContext
} from './conversation-state'
import { extractEntities } from './disambiguation-engine'

/**
 * Get or create conversation context
 * Now uses full ConversationState for comprehensive tracking
 */
export function getOrCreateContext(
  sessionId: string,
  previousQueries: string[] = [],
  existingState?: ConversationState
): ConversationContext {
  // Use existing state if provided, otherwise create new
  const fullState = existingState || createConversationState(sessionId)
  
  // Extract requirements from full state
  const requirements = getCurrentRequirements(fullState) || {}
  
  return {
    sessionId,
    previousQueries,
    extractedRequirements: requirements,
    completionPercentage: calculateCompletionFromState(fullState),
    missingCritical: identifyMissingCriticalFromState(fullState),
    lastQuery: fullState.messageHistory[fullState.messageHistory.length - 1]?.content || '',
    suggestionsMade: [],
    confirmedEntityType: fullState.entityIdentity.type || undefined,
    fullState: fullState as ConversationState // Include full state for comprehensive tracking
  }
}

/**
 * Update context with new information
 * Now uses full ConversationState for comprehensive tracking
 */
export async function updateContext(
  context: ConversationContext,
  newQuery: string,
  requirements: Partial<BrandRequirements | OwnerRequirements>,
  entityType?: 'brand' | 'owner'
): Promise<ConversationContext> {
  // Get or create full state
  let fullState = context.fullState || createConversationState(context.sessionId || 'unknown')
  
  // Add user message to history
  fullState = addMessageToHistory(fullState, 'user', newQuery, requirements)
  
  // Establish entity identity if provided (NEVER CHANGES ONCE SET)
  if (entityType && (entityType === 'brand' || entityType === 'owner')) {
    const evidence = `User query: "${newQuery.substring(0, 50)}"`
    fullState = establishEntityIdentity(fullState, entityType, 0.9, evidence, false)
  }
  
  // Update requirements
  if (requirements && Object.keys(requirements).length > 0) {
    const fieldConfidence: Record<string, number> = {}
    Object.keys(requirements).forEach(key => {
      fieldConfidence[key] = 0.8 // Default confidence
    })
    fullState = updateRequirements(fullState, requirements, fieldConfidence)
  }
  
  // Update semantic context
  const currentTopic = determineCurrentTopic(newQuery, requirements)
  
  // Extract entities from query for reference resolution
  const entities = extractEntities(newQuery, fullState)
  
  fullState = updateSemanticContext(fullState, currentTopic, entities, undefined)
  
  // Get updated requirements
  const mergedRequirements = getCurrentRequirements(fullState) || {}
  
  // Update context
  const updated: ConversationContext = {
    ...context,
    previousQueries: [...context.previousQueries, newQuery],
    lastQuery: newQuery,
    extractedRequirements: mergedRequirements,
    confirmedEntityType: fullState.entityIdentity.type || entityType || context.confirmedEntityType,
    establishedIntent: context.establishedIntent || (entityType === 'brand' ? 'seeking_space' : 'offering_space'),
    fullState // Store full state
  }
  
  // Calculate completion percentage
  updated.completionPercentage = calculateCompletionFromState(fullState)
  
  // Identify missing critical fields
  updated.missingCritical = identifyMissingCriticalFromState(fullState)
  
  return updated
}

/**
 * Determine current topic from query and requirements
 */
function determineCurrentTopic(
  query: string,
  requirements: Partial<BrandRequirements | OwnerRequirements>
): string {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('size') || lowerQuery.includes('sqft') || lowerQuery.includes('area')) {
    return 'discussing area'
  }
  if (lowerQuery.includes('rent') || lowerQuery.includes('budget') || lowerQuery.includes('price') || lowerQuery.includes('lakh')) {
    return 'discussing budget'
  }
  if (lowerQuery.includes('location') || lowerQuery.includes('address') || lowerQuery.includes('where')) {
    return 'discussing location'
  }
  if (lowerQuery.includes('type') || lowerQuery.includes('property') || lowerQuery.includes('retail') || lowerQuery.includes('restaurant')) {
    return 'discussing property type'
  }
  
  return 'general discussion'
}

/**
 * Calculate completion from full state
 */
function calculateCompletionFromState(state: ConversationState): number {
  const requirements = getCurrentRequirements(state)
  if (!requirements) return 0
  
  const entityType = state.entityIdentity.type
  if (!entityType) return 0
  
  // Count fields based on entity type
  let totalFields = 0
  let completedFields = 0
  
  if (entityType === 'brand') {
    const req = requirements as Partial<BrandRequirements>
    if (req.area) { totalFields++; if (req.area.min || req.area.max || req.area.preferred) completedFields++ }
    if (req.location) { totalFields++; if (req.location.city) completedFields++ }
    if (req.propertyType) { totalFields++; if (req.propertyType.primary) completedFields++ }
    if (req.budget) { totalFields++; if (req.budget.monthlyRent?.min || req.budget.monthlyRent?.max) completedFields++ }
  } else {
    const req = requirements as Partial<OwnerRequirements>
    if (req.property) { totalFields++; if (req.property.area) completedFields++ }
    if (req.location) { totalFields++; if (req.location.city && req.location.area) completedFields++ }
    if (req.rentExpectations) { totalFields++; if (req.rentExpectations.monthlyRent) completedFields++ }
    if (req.property?.type) { totalFields++; completedFields++ }
  }
  
  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
}

/**
 * Identify missing critical fields from state
 */
function identifyMissingCriticalFromState(state: ConversationState): string[] {
  const missing: string[] = []
  const entityType = state.entityIdentity.type
  
  if (!entityType) {
    return ['entity_type']
  }
  
  const requirements = getCurrentRequirements(state)
  if (!requirements) {
    return entityType === 'brand' ? ['area', 'location', 'budget'] : ['property_area', 'location', 'rent']
  }
  
  if (entityType === 'brand') {
    const req = requirements as Partial<BrandRequirements>
    if (!req.area || (!req.area.min && !req.area.max && !req.area.preferred)) missing.push('area')
    if (!req.location?.city) missing.push('location')
    if (!req.budget?.monthlyRent?.min || !req.budget?.monthlyRent?.max) missing.push('budget')
  } else {
    const req = requirements as Partial<OwnerRequirements>
    if (!req.property?.area) missing.push('property_area')
    if (!req.location?.city || !req.location?.area) missing.push('location')
    if (!req.rentExpectations?.monthlyRent) missing.push('rent')
  }
  
  return missing
}

/**
 * Calculate completion percentage
 */
function calculateCompletion(
  requirements: Partial<BrandRequirements | OwnerRequirements>,
  entityType?: 'brand' | 'owner'
): number {
  if (!entityType) return 0
  
  if (entityType === 'brand') {
    const req = requirements as Partial<BrandRequirements>
    let fields = 0
    let completed = 0
    
    if (req.area) { fields++; if (req.area.min && req.area.max) completed++ }
    if (req.location) { fields++; if (req.location.city) completed++ }
    if (req.propertyType) { fields++; if (req.propertyType.primary) completed++ }
    if (req.budget) { fields++; if (req.budget.monthlyRent?.min && req.budget.monthlyRent?.max) completed++ }
    
    return fields > 0 ? Math.round((completed / fields) * 100) : 0
  } else {
    const req = requirements as Partial<OwnerRequirements>
    let fields = 0
    let completed = 0
    
    if (req.property) { fields++; if (req.property.area) completed++ }
    if (req.location) { fields++; if (req.location.city && req.location.area) completed++ }
    if (req.rentExpectations) { fields++; if (req.rentExpectations.monthlyRent) completed++ }
    if (req.property?.type) { fields++; completed++ }
    
    return fields > 0 ? Math.round((completed / fields) * 100) : 0
  }
}

/**
 * Identify missing critical fields
 */
function identifyMissingCritical(
  requirements: Partial<BrandRequirements | OwnerRequirements>,
  entityType?: 'brand' | 'owner'
): string[] {
  const missing: string[] = []
  
  if (!entityType) {
    return ['entity_type']
  }
  
  if (entityType === 'brand') {
    const req = requirements as Partial<BrandRequirements>
    // Check for area - can be min/max OR preferred
    if (!req.area || (!req.area.min && !req.area.max && !req.area.preferred)) {
      // Also check if size was mentioned in a simple format
      const hasSize = (req as any).size || (req as any).areaSize
      if (!hasSize) missing.push('area')
    }
    if (!req.location?.city) missing.push('location')
    if (!req.budget?.monthlyRent?.min || !req.budget?.monthlyRent?.max) missing.push('budget')
  } else {
    const req = requirements as Partial<OwnerRequirements>
    if (!req.property?.area) missing.push('property_area')
    if (!req.location?.city || !req.location?.area) missing.push('location')
    if (!req.rentExpectations?.monthlyRent) missing.push('rent')
  }
  
  return missing
}

/**
 * Generate follow-up questions
 */
export function generateFollowUpQuestions(
  context: ConversationContext
): string[] {
  const questions: string[] = []
  const entityType = context.confirmedEntityType
  
  if (!entityType || entityType === 'needs_clarification') {
    return [
      "I'd love to help you find the perfect match! Just to clarify - are you:\n\n1. A brand/business looking for space to lease? 🏪\n2. A property owner looking for tenants? 🏢\n\nThis helps me understand your requirements better."
    ]
  }
  
  const missing = context.missingCritical
  
  if (entityType === 'brand') {
    if (missing.includes('area')) {
      questions.push("What size space are you looking for? (e.g., 1000 sqft, 1200-1500 sqft)")
    }
    if (missing.includes('location')) {
      questions.push("Which city and area are you interested in? (e.g., Bangalore, Koramangala)")
    }
    if (missing.includes('budget')) {
      questions.push("What's your monthly budget range? (e.g., 2-3 lakhs per month)")
    }
    if (missing.length === 0 && context.completionPercentage < 70) {
      questions.push("Great! I have the basics. Would you like to share any specific requirements like parking, footfall, or lease duration?")
    }
  } else {
    if (missing.includes('property_area')) {
      questions.push("What's the size of your property in sqft?")
    }
    if (missing.includes('location')) {
      questions.push("Where is your property located? (city and area)")
    }
    if (missing.includes('rent')) {
      questions.push("What's the monthly rent you're expecting?")
    }
    if (missing.length === 0 && context.completionPercentage < 70) {
      questions.push("Perfect! I have the key details. Would you like to add information about infrastructure, footfall, or desired tenant type?")
    }
  }
  
  return questions.length > 0 ? questions : []
}

/**
 * Check if ready to search
 */
export function isReadyToSearch(context: ConversationContext): boolean {
  if (!context.confirmedEntityType || context.confirmedEntityType === 'needs_clarification') {
    return false
  }
  
  // Need at least 60% completion and no critical missing fields
  return context.completionPercentage >= 60 && context.missingCritical.length === 0
}

/**
 * Check if ready to redirect (for owners to listing form)
 */
export function isReadyToRedirect(context: ConversationContext): boolean {
  if (context.confirmedEntityType !== 'owner') {
    return false
  }
  
  const req = context.extractedRequirements as Partial<OwnerRequirements>
  
  // Need: property area, location, rent
  return !!(
    req.property?.area &&
    req.location?.city &&
    req.location?.area &&
    req.rentExpectations?.monthlyRent
  )
}

