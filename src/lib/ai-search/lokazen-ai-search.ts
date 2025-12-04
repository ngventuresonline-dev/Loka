/**
 * Lokazen AI Search - Main Orchestrator
 * World-Class Commercial Real Estate Matching Engine
 */

import { 
  SearchInput, 
  SearchResponse, 
  BrandSearchResponse, 
  OwnerSearchResponse,
  ConversationContext,
  ScoredMatch,
  ConversationState
} from './types'
import { classifyEntityType, processQuery } from './nlu-engine'
import { 
  getOrCreateContext, 
  updateContext, 
  generateFollowUpQuestions, 
  isReadyToSearch,
  isReadyToRedirect
} from './conversation-manager'
import { calculateBFI, calculatePFI, calculateFinalMatchScore } from './scoring-engine'
import { searchProperties, MockProperty } from '@/lib/mockDatabase'
import { createConversationState } from './conversation-state'

/**
 * Serialize ConversationState for JSON transmission
 */
function serializeState(state: ConversationState | undefined): any {
  if (!state) return undefined
  
  try {
    return {
      ...state,
      startTime: state.startTime?.toISOString() || new Date().toISOString(),
      lastActivityTime: state.lastActivityTime?.toISOString() || new Date().toISOString(),
      messageHistory: (state.messageHistory || []).map(m => ({
        ...m,
        timestamp: m.timestamp?.toISOString() || new Date().toISOString()
      })),
      searchState: {
        ...state.searchState,
        lastSearchResults: state.searchState?.lastSearchResults ? {
          ...state.searchState.lastSearchResults,
          timestamp: state.searchState.lastSearchResults.timestamp?.toISOString() || new Date().toISOString()
        } : undefined,
        savedSearches: (state.searchState?.savedSearches || []).map(s => ({
          ...s,
          createdAt: s.createdAt?.toISOString() || new Date().toISOString()
        }))
      },
      learningData: {
        ...state.learningData,
        correctionsMade: (state.learningData?.correctionsMade || []).map(c => ({
          ...c,
          timestamp: c.timestamp?.toISOString() || new Date().toISOString()
        })),
        preferencesTaught: (state.learningData?.preferencesTaught || []).map(p => ({
          ...p,
          learnedAt: p.learnedAt?.toISOString() || new Date().toISOString()
        })),
        disambiguationsResolved: (state.learningData?.disambiguationsResolved || []).map(d => ({
          ...d,
          timestamp: d.timestamp?.toISOString() || new Date().toISOString()
        }))
      }
    }
  } catch (error) {
    console.error('[LokazenAI] Error serializing state:', error)
    return undefined
  }
}

/**
 * Deserialize ConversationState from JSON
 */
function deserializeState(data: any): ConversationState {
  if (!data) return createConversationState('unknown')
  
  try {
    return {
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : new Date(),
      lastActivityTime: data.lastActivityTime ? new Date(data.lastActivityTime) : new Date(),
      messageHistory: (data.messageHistory || []).map((m: any) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
      })),
      searchState: {
        ...data.searchState,
        lastSearchResults: data.searchState?.lastSearchResults ? {
          ...data.searchState.lastSearchResults,
          timestamp: data.searchState.lastSearchResults.timestamp ? new Date(data.searchState.lastSearchResults.timestamp) : new Date()
        } : undefined,
        savedSearches: (data.searchState?.savedSearches || []).map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date()
        }))
      },
      learningData: {
        ...data.learningData,
        correctionsMade: (data.learningData?.correctionsMade || []).map((c: any) => ({
          ...c,
          timestamp: c.timestamp ? new Date(c.timestamp) : new Date()
        })),
        preferencesTaught: (data.learningData?.preferencesTaught || []).map((p: any) => ({
          ...p,
          learnedAt: p.learnedAt ? new Date(p.learnedAt) : new Date()
        })),
        disambiguationsResolved: (data.learningData?.disambiguationsResolved || []).map((d: any) => ({
          ...d,
          timestamp: d.timestamp ? new Date(d.timestamp) : new Date()
        }))
      }
    }
  } catch (error) {
    console.error('[LokazenAI] Error deserializing state:', error)
    return createConversationState('unknown')
  }
}

/**
 * Deep merge objects - preserves existing values, only adds new ones
 */
function deepMerge(existing: any, newData: any): any {
  if (!existing && !newData) return {}
  if (!existing) return newData || {}
  if (!newData) return existing || {}
  
  const result = { ...existing }
  
  for (const key in newData) {
    if (newData[key] !== null && newData[key] !== undefined) {
      // Handle arrays - merge them
      if (Array.isArray(newData[key])) {
        result[key] = [...(existing[key] || []), ...newData[key]]
      }
      // Handle nested objects - recursively merge
      else if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
        result[key] = deepMerge(existing[key] || {}, newData[key])
      } 
      // Handle primitives - only overwrite if existing is empty/null/undefined
      else if (newData[key] !== '' && newData[key] !== null && newData[key] !== undefined) {
        if (!existing[key] || existing[key] === '' || existing[key] === null || existing[key] === undefined) {
          result[key] = newData[key]
        } else {
          // Keep existing value
          result[key] = existing[key]
        }
      }
    }
  }
  
  return result
}

export class LokazenAISearch {
  
  /**
   * Main search entry point
   */
  async search(input: SearchInput): Promise<SearchResponse> {
    console.log('[LokazenAI] Starting search:', { query: input.query.substring(0, 50) })
    
    // Step 1: Get or create conversation context
    const sessionId = input.userId || `session-${Date.now()}`
    
    // CRITICAL: Restore full state if provided, otherwise create new
    const restoredState = input.context?.fullState ? deserializeState(input.context.fullState) : undefined
    let context = getOrCreateContext(
      sessionId,
      input.context?.previousQueries || [],
      restoredState // Pass deserialized state if available
    )
    
    // CRITICAL: If we have previous context with requirements, use it
    if (input.context?.extractedRequirements && !input.context?.fullState) {
      context.extractedRequirements = input.context.extractedRequirements
      context.confirmedEntityType = input.context.confirmedEntityType
      console.log('[LokazenAI] Restored context with requirements:', Object.keys(context.extractedRequirements))
    }
    
    // Step 2: Classify entity type if not already known
    // CRITICAL: Pass conversation history to check for previous identification
    let entityType = input.entityType === 'auto' 
      ? await classifyEntityType(input.query, context, input.conversationHistory)
      : (input.entityType || context.confirmedEntityType || 'needs_clarification')
    
    // CRITICAL: If we detected entity type from history or query, confirm it in context
    if (entityType !== 'needs_clarification' && !context.confirmedEntityType) {
      context.confirmedEntityType = entityType
      console.log('[LokazenAI] Confirmed entity type:', entityType)
    }
    
    // If needs clarification AND we haven't asked before in this conversation, return clarification message
    if (entityType === 'needs_clarification') {
      // Check if we already asked in conversation history
      if (input.conversationHistory && input.conversationHistory.toLowerCase().includes('just to clarify')) {
        // We already asked - don't ask again, try to infer from query
        console.log('[LokazenAI] Already asked for clarification, trying to infer from query')
        // Try one more time with just the query
        entityType = await classifyEntityType(input.query, context, '')
        if (entityType !== 'needs_clarification') {
          context.confirmedEntityType = entityType
        } else {
          return this.askForClarification()
        }
      } else {
        return this.askForClarification()
      }
    }
    
    // Step 3: Process query and extract requirements
    // CRITICAL: Only extract requirements if user provided actual property details
    // Don't call API for simple responses like "2" or "property owner"
    const isSimpleResponse = input.query.trim().match(/^(1|2|option\s*[12]|property\s*owner|brand|owner)$/i)
    
    let processed: any = { requirements: {}, entityType, confidence: 0.9, missingCritical: [], intent: entityType === 'brand' ? 'seeking_space' : 'offering_space' }
    let mergedRequirements = context.extractedRequirements || {}
    
    if (!isSimpleResponse) {
      try {
        // CRITICAL: Extract from FULL conversation history, not just current query
        // This ensures we get all previously mentioned details
        // Pass full state for disambiguation and reference resolution
        processed = await processQuery(
          input.query,
          entityType,
          input.conversationHistory,
          context.fullState
        )
        
        // CRITICAL: Merge with existing requirements (don't overwrite what we already have)
        const existingRequirements = context.extractedRequirements || {}
        const newRequirements = processed.requirements || {}
        mergedRequirements = deepMerge(existingRequirements, newRequirements)
        console.log('[LokazenAI] Merged requirements:', { 
          existing: Object.keys(existingRequirements), 
          new: Object.keys(newRequirements),
          merged: Object.keys(mergedRequirements)
        })
      } catch (error: any) {
        console.error('[LokazenAI] Error processing query:', error.message)
        // Continue with empty requirements - we'll ask for details
        mergedRequirements = context.extractedRequirements || {}
      }
    } else {
      console.log('[LokazenAI] Simple response detected, skipping requirement extraction')
    }
    
    // Step 4: Update conversation context with merged requirements
    const updatedContext = await updateContext(
      context,
      input.query,
      mergedRequirements,
      entityType
    )
    
    // Step 5: Check if we have enough information
    if (!isReadyToSearch(updatedContext)) {
      const questions = generateFollowUpQuestions(updatedContext)
      return this.askFollowUpQuestions(questions, updatedContext, entityType)
    }
    
    // Step 6: Search database and score matches
    try {
      if (entityType === 'brand') {
        return await this.searchForBrands(mergedRequirements, updatedContext)
      } else {
        return await this.searchForOwners(mergedRequirements, updatedContext)
      }
    } catch (error: any) {
      console.error('[LokazenAI] Error in search:', error)
      // Return error response but maintain context
      return {
        matches: [],
        summary: {
          totalMatches: 0,
          showingTop: 0,
          averageMatchScore: 0,
          searchCompleteness: updatedContext.completionPercentage
        },
        message: `I encountered an error: ${error.message}. Please try again.`,
        extractedRequirements: updatedContext.extractedRequirements,
        confirmedEntityType: updatedContext.confirmedEntityType,
        fullState: updatedContext.fullState ? serializeState(updatedContext.fullState) : undefined
      } as any
    }
  }
  
  /**
   * Search for properties (Brand flow)
   */
  private async searchForBrands(
    requirements: any,
    context: ConversationContext
  ): Promise<BrandSearchResponse> {
    console.log('[LokazenAI] Searching for brands')
    
    // Build search filters from requirements
    const filters: any = {}
    if (requirements.location?.city) filters.city = requirements.location.city
    if (requirements.propertyType?.primary) {
      // Map property types
      const typeMap: any = {
        'retail_shop': 'retail',
        'restaurant_space': 'restaurant',
        'qsr': 'qsr',
        'kiosk': 'kiosk',
        'office': 'office'
      }
      filters.propertyType = typeMap[requirements.propertyType.primary] || requirements.propertyType.primary
    }
    if (requirements.budget?.monthlyRent?.min) filters.minPrice = requirements.budget.monthlyRent.min
    if (requirements.budget?.monthlyRent?.max) filters.maxPrice = requirements.budget.monthlyRent.max
    if (requirements.area?.min) filters.minSize = requirements.area.min
    if (requirements.area?.max) filters.maxSize = requirements.area.max
    
    // Search properties
    const properties = searchProperties(filters)
    console.log('[LokazenAI] Found', properties.length, 'properties')
    
    // Score and rank matches
    const scoredMatches = await this.scoreAndRankMatches(
      properties,
      requirements,
      'brand'
    )
    
    // Generate natural language response
    const message = await this.generateBrandResponse(
      requirements,
      scoredMatches,
      context
    )
    
    return {
      matches: scoredMatches,
      summary: {
        totalMatches: properties.length,
        showingTop: Math.min(5, scoredMatches.length),
        averageMatchScore: this.calculateAverageScore(scoredMatches),
        searchCompleteness: context.completionPercentage
      },
      message,
      // CRITICAL: Return extracted requirements to maintain context
      extractedRequirements: context.extractedRequirements,
      confirmedEntityType: context.confirmedEntityType,
      // Return full state (serialized)
      fullState: context.fullState ? serializeState(context.fullState) : undefined
    } as any
  }
  
  /**
   * Search for brands (Owner flow) - Currently simplified
   */
  private async searchForOwners(
    requirements: any,
    context: ConversationContext
  ): Promise<OwnerSearchResponse> {
    console.log('[LokazenAI] Processing owner listing')
    
    // For owners, we collect details and guide to listing form
    const readyToRedirect = isReadyToRedirect(context)
    
    // Generate response
    const message = await this.generateOwnerResponse(
      requirements,
      context,
      readyToRedirect
    )
    
    return {
      matches: [],  // Owners don't get property matches
      summary: {
        totalMatches: 0,
        showingTop: 0,
        averageMatchScore: 0
      },
      message,
      collectedDetails: requirements,
      readyToRedirect,
      // CRITICAL: Return extracted requirements to maintain context
      extractedRequirements: context.extractedRequirements,
      confirmedEntityType: context.confirmedEntityType,
      // Return full state (serialized)
      fullState: context.fullState ? serializeState(context.fullState) : undefined
    } as any
  }
  
  /**
   * Score and rank matches
   */
  private async scoreAndRankMatches(
    properties: MockProperty[],
    requirements: any,
    entityType: 'brand' | 'owner'
  ): Promise<ScoredMatch[]> {
    const scored: ScoredMatch[] = []
    
    for (const property of properties) {
      // Calculate BFI and PFI
      const bfi = calculateBFI(requirements, property)
      const pfi = calculatePFI(requirements as any, requirements)  // Simplified
      const finalScore = calculateFinalMatchScore(bfi, pfi, entityType)
      
      // Generate strengths and considerations
      const strengths = this.generateStrengths(bfi, property)
      const considerations = this.generateConsiderations(bfi, property)
      
      scored.push({
        propertyId: property.id,
        matchScore: finalScore,
        property: {
          id: property.id,
          title: property.title,
          address: property.address,
          size: property.size,
          price: property.price,
          propertyType: property.propertyType
        },
        strengths,
        considerations,
        financial: {
          monthlyRent: property.price,
          deposit: property.securityDeposit || property.price * 2,
          estimatedFitout: property.size * 500,  // Rough estimate
          totalInitialInvestment: property.price + (property.securityDeposit || property.price * 2) + (property.size * 500)
        }
      })
    }
    
    // Sort by match score
    return scored
      .sort((a, b) => b.matchScore.matchScore - a.matchScore.matchScore)
      .slice(0, 5)  // Top 5
  }
  
  /**
   * Generate strengths
   */
  private generateStrengths(bfi: any, property: MockProperty): string[] {
    const strengths: string[] = []
    
    if (bfi.areaMatch > 0.8) strengths.push('Perfect size match')
    if (bfi.locationMatch > 0.8) strengths.push('Excellent location')
    if (bfi.budgetMatch > 0.8) strengths.push('Within budget range')
    if (property.parking) strengths.push('Parking available')
    if (property.isFeatured) strengths.push('Featured property')
    
    return strengths.length > 0 ? strengths : ['Good overall match']
  }
  
  /**
   * Generate considerations
   */
  private generateConsiderations(bfi: any, property: MockProperty): string[] {
    const considerations: string[] = []
    
    if (bfi.areaMatch < 0.6) considerations.push('Size may not be ideal')
    if (bfi.budgetMatch < 0.6) considerations.push('Budget may need adjustment')
    if (!property.parking) considerations.push('Parking not available')
    
    return considerations
  }
  
  /**
   * Calculate average score
   */
  private calculateAverageScore(matches: ScoredMatch[]): number {
    if (matches.length === 0) return 0
    const sum = matches.reduce((acc, m) => acc + m.matchScore.matchScore, 0)
    return Math.round(sum / matches.length)
  }
  
  /**
   * Generate brand response
   */
  private async generateBrandResponse(
    requirements: any,
    matches: ScoredMatch[],
    context: ConversationContext
  ): Promise<string> {
    if (matches.length === 0) {
      return "I couldn't find exact matches for your requirements. Would you like to adjust your search criteria or explore alternative locations?"
    }
    
    const topMatch = matches[0]
    const matchCount = matches.length
    
    return `🎯 Found ${matchCount} excellent match${matchCount > 1 ? 'es' : ''} for you!

**Top Match: ${topMatch.property?.title}**
Match Score: ${topMatch.matchScore.matchScore}%

**Why this is a great fit:**
${topMatch.strengths.map(s => `✅ ${s}`).join('\n')}

${topMatch.considerations.length > 0 ? `\n⚠️ Consider: ${topMatch.considerations.join(', ')}` : ''}

💰 **Financial:** ₹${topMatch.financial?.monthlyRent.toLocaleString('en-IN')}/month + ₹${topMatch.financial?.deposit.toLocaleString('en-IN')} deposit

${matchCount > 1 ? `\nI found ${matchCount - 1} more match${matchCount > 2 ? 'es' : ''} that might interest you. Would you like to see them?` : ''}`
  }
  
  /**
   * Generate owner response
   */
  private async generateOwnerResponse(
    requirements: any,
    context: ConversationContext,
    readyToRedirect: boolean
  ): Promise<string> {
    if (readyToRedirect) {
      return `Perfect! I have all the key details about your property:

📍 **Location:** ${requirements.location?.area || 'N/A'}, ${requirements.location?.city || 'N/A'}
📐 **Size:** ${requirements.property?.area || 'N/A'} sqft
💰 **Rent:** ₹${requirements.rentExpectations?.monthlyRent?.toLocaleString('en-IN') || 'N/A'}/month

I'm ready to help you create your listing! Let me take you to the listing form where all these details will be pre-filled.`
    }
    
    // Ask for missing information
    const missing = context.missingCritical
    if (missing.includes('property_area')) {
      return "Great! I've noted your property details. What's the size of your property in sqft?"
    }
    if (missing.includes('location')) {
      return "Perfect! Where is your property located? (Please share the city and area)"
    }
    if (missing.includes('rent')) {
      return "Excellent! What's the monthly rent you're expecting for this property?"
    }
    
    return "I'm here to help you list your property! Could you share some details about your property - location, size, and expected rent?"
  }
  
  /**
   * Ask for clarification
   */
  private askForClarification(): SearchResponse {
    return {
      matches: [],
      summary: {
        totalMatches: 0,
        showingTop: 0,
        averageMatchScore: 0,
        searchCompleteness: 0
      },
      message: "I'd love to help you find the perfect match! Just to clarify - are you:\n\n1. A brand/business looking for space to lease? 🏪\n2. A property owner looking for tenants? 🏢\n\nThis helps me understand your requirements better.",
      extractedRequirements: null,
      confirmedEntityType: null
    } as any
  }
  
  /**
   * Ask follow-up questions
   */
  private askFollowUpQuestions(
    questions: string[],
    context: ConversationContext,
    entityType: 'brand' | 'owner'
  ): SearchResponse {
    // For owners, provide a helpful first question based on what's missing
    let message: string
    if (entityType === 'owner') {
      const missing = context.missingCritical || []
      const hasLocation = context.extractedRequirements?.location?.area || context.extractedRequirements?.location?.city
      const hasSize = context.extractedRequirements?.property?.area
      const hasRent = context.extractedRequirements?.rentExpectations?.monthlyRent
      
      if (!hasLocation) {
        message = "Great! I'd love to help you list your property. Where is your property located? (Please share the city and area)"
      } else if (!hasSize) {
        message = "Perfect! What's the size of your property? (e.g., 500 sqft, 1000 sqft)"
      } else if (!hasRent) {
        message = "Excellent! What's the monthly rent you're expecting for this property?"
      } else {
        message = questions.length > 0 ? questions[0] : "Could you share more details about your property?"
      }
    } else {
      message = questions.length > 0 
        ? questions[0]  // Ask one question at a time
        : "I need a bit more information to find the best matches for you. Could you share more details?"
    }
    
    return {
      matches: [],
      summary: {
        totalMatches: 0,
        showingTop: 0,
        averageMatchScore: 0,
        searchCompleteness: context.completionPercentage
      },
      message,
      // CRITICAL: Return extracted requirements so frontend can pass them back
      extractedRequirements: context.extractedRequirements || {},
      confirmedEntityType: context.confirmedEntityType || entityType,
      // Return full state (serialized)
      fullState: context.fullState ? serializeState(context.fullState) : undefined
    } as any
  }
}

