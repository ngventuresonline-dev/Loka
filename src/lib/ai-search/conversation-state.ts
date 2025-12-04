/**
 * FULL CONVERSATION STATE
 * Every single thing the user says is tracked, analyzed, and retained
 */

import { BrandRequirements, OwnerRequirements } from './types'

export interface Disambiguation {
  field: string
  question: string
  options: string[]
  userChoice?: string
  resolved: boolean
}

export interface Contradiction {
  field: string
  oldValue: any
  newValue: any
  confidence: number
  resolved: boolean
}

export interface Entity {
  type: 'location' | 'number' | 'brand' | 'property_type' | 'other'
  value: string
  confidence: number
  mentionedAt: number // turn number
  context: string
}

export interface Reference {
  type: 'pronoun' | 'demonstrative' | 'comparative'
  text: string
  refersTo: string
  turn: number
}

export interface Assumption {
  field: string
  value: any
  confidence: number
  shouldVerify: boolean
}

export interface SearchResults {
  query: string
  results: any[]
  timestamp: Date
  filters: any
}

export interface SavedSearch {
  id: string
  name: string
  criteria: any
  createdAt: Date
}

export interface Correction {
  field: string
  incorrectValue: any
  correctValue: any
  timestamp: Date
}

export interface Preference {
  field: string
  value: any
  strength: number
  learnedAt: Date
}

export interface DisambiguationResolution {
  field: string
  question: string
  userAnswer: string
  timestamp: Date
}

/**
 * FULL CONVERSATION STATE
 * Every single thing the user says is tracked, analyzed, and retained
 */
export interface ConversationState {
  // Session Management
  sessionId: string
  userId?: string
  startTime: Date
  lastActivityTime: Date
  conversationLength: number // number of turns

  // Entity Identity (NEVER CHANGES ONCE ESTABLISHED)
  entityIdentity: {
    type: 'brand' | 'owner' | null
    confidence: number
    establishedAt: number // which turn was this confirmed
    evidenceLog: string[] // what led to this conclusion
    userConfirmed: boolean // did user explicitly confirm
  }

  // Complete Message History
  messageHistory: Array<{
    turn: number
    timestamp: Date
    role: 'user' | 'assistant'
    content: string
    extractedData?: any
    interpretation?: string
    confidence?: number
    disambiguations?: Disambiguation[]
  }>

  // Accumulated Requirements (builds over conversation)
  requirements: {
    brand?: Partial<BrandRequirements>
    owner?: Partial<OwnerRequirements>
    confidence: Record<string, number> // confidence per field
    lastUpdatedFields: string[] // track what changed recently
    contradictions: Contradiction[]
  }

  // Context Understanding
  semanticContext: {
    currentTopic: string // "discussing area" | "discussing budget" | etc
    recentEntities: Entity[] // locations, numbers, brands mentioned
    implicitReferences: Reference[] // "it", "that", "same location", etc
    assumptions: Assumption[] // what we're assuming but should verify
  }

  // User Behavior Patterns
  userProfile: {
    communicationStyle: 'detailed' | 'brief' | 'conversational'
    preferredUnits: 'sqft' | 'sqm' | 'mixed'
    currencyFormat: 'lakhs' | 'exact' | 'mixed'
    responsivenessToQuestions: 'high' | 'medium' | 'low'
    technicalSavviness: number // 0-1
  }

  // Search State
  searchState: {
    hasSearchedBefore: boolean
    searchesInSession: number
    lastSearchResults?: SearchResults
    savedSearches: SavedSearch[]
    viewedProperties: string[]
    shortlistedProperties: string[]
  }

  // Clarifications & Confirmations Needed
  pendingClarifications: Array<{
    id: string
    question: string
    priority: 'critical' | 'important' | 'optional'
    field: string
    possibleValues?: any[]
    context: string
  }>

  // Learning & Adaptation
  learningData: {
    correctionsMade: Correction[]
    preferencesTaught: Preference[]
    disambiguationsResolved: DisambiguationResolution[]
  }
}

/**
 * Create a new conversation state
 */
export function createConversationState(
  sessionId: string,
  userId?: string
): ConversationState {
  return {
    sessionId,
    userId,
    startTime: new Date(),
    lastActivityTime: new Date(),
    conversationLength: 0,

    entityIdentity: {
      type: null,
      confidence: 0,
      establishedAt: 0,
      evidenceLog: [],
      userConfirmed: false
    },

    messageHistory: [],

    requirements: {
      confidence: {},
      lastUpdatedFields: [],
      contradictions: []
    },

    semanticContext: {
      currentTopic: 'initial',
      recentEntities: [],
      implicitReferences: [],
      assumptions: []
    },

    userProfile: {
      communicationStyle: 'conversational',
      preferredUnits: 'sqft',
      currencyFormat: 'mixed',
      responsivenessToQuestions: 'medium',
      technicalSavviness: 0.5
    },

    searchState: {
      hasSearchedBefore: false,
      searchesInSession: 0,
      savedSearches: [],
      viewedProperties: [],
      shortlistedProperties: []
    },

    pendingClarifications: [],

    learningData: {
      correctionsMade: [],
      preferencesTaught: [],
      disambiguationsResolved: []
    }
  }
}

/**
 * Add a message to conversation history
 */
export function addMessageToHistory(
  state: ConversationState,
  role: 'user' | 'assistant',
  content: string,
  extractedData?: any,
  interpretation?: string
): ConversationState {
  const turn = state.conversationLength + 1

  const newMessage = {
    turn,
    timestamp: new Date(),
    role,
    content,
    extractedData,
    interpretation,
    confidence: extractedData ? 0.8 : 0.5
  }

  return {
    ...state,
    conversationLength: turn,
    lastActivityTime: new Date(),
    messageHistory: [...state.messageHistory, newMessage]
  }
}

/**
 * Establish entity identity (NEVER CHANGES ONCE SET)
 */
export function establishEntityIdentity(
  state: ConversationState,
  type: 'brand' | 'owner',
  confidence: number,
  evidence: string,
  userConfirmed: boolean = false
): ConversationState {
  // CRITICAL: Once established, never change
  if (state.entityIdentity.type !== null && state.entityIdentity.type !== type) {
    console.warn('[ConversationState] Attempted to change entity identity - IGNORED')
    return state
  }

  // If already established, just update confidence and evidence
  if (state.entityIdentity.type === type) {
    return {
      ...state,
      entityIdentity: {
        ...state.entityIdentity,
        confidence: Math.max(state.entityIdentity.confidence, confidence),
        evidenceLog: [...state.entityIdentity.evidenceLog, evidence],
        userConfirmed: state.entityIdentity.userConfirmed || userConfirmed
      }
    }
  }

  // First time establishment
  return {
    ...state,
    entityIdentity: {
      type,
      confidence,
      establishedAt: state.conversationLength + 1,
      evidenceLog: [evidence],
      userConfirmed
    }
  }
}

/**
 * Update requirements with new data
 */
export function updateRequirements(
  state: ConversationState,
  newData: Partial<BrandRequirements | OwnerRequirements>,
  fieldConfidence: Record<string, number> = {}
): ConversationState {
  const entityType = state.entityIdentity.type
  if (!entityType) {
    console.warn('[ConversationState] Cannot update requirements without entity identity')
    return state
  }

  const currentRequirements = state.requirements[entityType] || {}
  const updatedRequirements = { ...currentRequirements, ...newData }

  // Track which fields were updated
  const updatedFields = Object.keys(newData)
  const lastUpdated = [...state.requirements.lastUpdatedFields, ...updatedFields].slice(-10) // Keep last 10

  // Update confidence scores
  const confidence = {
    ...state.requirements.confidence,
    ...fieldConfidence
  }

  // Check for contradictions
  const contradictions: Contradiction[] = []
  for (const field of updatedFields) {
    const oldValue = (currentRequirements as any)[field]
    const newValue = (newData as any)[field]
    if (oldValue && newValue && JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      contradictions.push({
        field,
        oldValue,
        newValue,
        confidence: fieldConfidence[field] || 0.5,
        resolved: false
      })
    }
  }

  return {
    ...state,
    requirements: {
      ...state.requirements,
      [entityType]: updatedRequirements,
      confidence,
      lastUpdatedFields: lastUpdated,
      contradictions: [...state.requirements.contradictions, ...contradictions]
    }
  }
}

/**
 * Update semantic context
 */
export function updateSemanticContext(
  state: ConversationState,
  currentTopic: string,
  entities?: Entity[],
  references?: Reference[]
): ConversationState {
  return {
    ...state,
    semanticContext: {
      currentTopic,
      recentEntities: entities 
        ? [...state.semanticContext.recentEntities, ...entities].slice(-20) // Keep last 20
        : state.semanticContext.recentEntities,
      implicitReferences: references
        ? [...state.semanticContext.implicitReferences, ...references].slice(-10) // Keep last 10
        : state.semanticContext.implicitReferences,
      assumptions: state.semanticContext.assumptions
    }
  }
}

/**
 * Add pending clarification
 */
export function addPendingClarification(
  state: ConversationState,
  question: string,
  priority: 'critical' | 'important' | 'optional',
  field: string,
  context: string,
  possibleValues?: any[]
): ConversationState {
  const clarification = {
    id: `clarify-${Date.now()}`,
    question,
    priority,
    field,
    possibleValues,
    context
  }

  return {
    ...state,
    pendingClarifications: [...state.pendingClarifications, clarification]
  }
}

/**
 * Resolve pending clarification
 */
export function resolvePendingClarification(
  state: ConversationState,
  clarificationId: string,
  answer: string
): ConversationState {
  const clarification = state.pendingClarifications.find(c => c.id === clarificationId)
  if (!clarification) return state

  // Remove from pending
  const pendingClarifications = state.pendingClarifications.filter(c => c.id !== clarificationId)

  // Add to learning data
  const disambiguationResolution: DisambiguationResolution = {
    field: clarification.field,
    question: clarification.question,
    userAnswer: answer,
    timestamp: new Date()
  }

  return {
    ...state,
    pendingClarifications,
    learningData: {
      ...state.learningData,
      disambiguationsResolved: [...state.learningData.disambiguationsResolved, disambiguationResolution]
    }
  }
}

/**
 * Update user profile based on behavior
 */
export function updateUserProfile(
  state: ConversationState,
  updates: Partial<ConversationState['userProfile']>
): ConversationState {
  return {
    ...state,
    userProfile: {
      ...state.userProfile,
      ...updates
    }
  }
}

/**
 * Get current requirements based on entity type
 */
export function getCurrentRequirements(state: ConversationState): Partial<BrandRequirements | OwnerRequirements> | null {
  const entityType = state.entityIdentity.type
  if (!entityType) return null

  return state.requirements[entityType] || null
}

/**
 * Check if entity identity is established
 */
export function isEntityIdentityEstablished(state: ConversationState): boolean {
  return state.entityIdentity.type !== null && state.entityIdentity.confidence > 0.7
}

/**
 * Get conversation summary
 */
export function getConversationSummary(state: ConversationState): string {
  const entityType = state.entityIdentity.type || 'unknown'
  const requirements = getCurrentRequirements(state)
  const reqCount = requirements ? Object.keys(requirements).length : 0

  return `Conversation: ${state.conversationLength} turns, Entity: ${entityType}, Requirements: ${reqCount} fields, Confidence: ${state.entityIdentity.confidence}`
}

