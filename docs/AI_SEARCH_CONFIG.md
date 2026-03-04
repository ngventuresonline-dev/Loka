# AI Search System - Current Working Configuration

## Overview
This document contains the current working configuration of the AI-powered property search system. This is the stable, production-ready version.

## Architecture

### Core Components

1. **Simple Search Engine** (`src/lib/ai-search/simple-search.ts`)
   - Main AI search logic
   - Entity type detection (Brand vs Owner)
   - Context-aware detail extraction
   - Fallback response generation

2. **API Route** (`src/app/api/ai-search/route.ts`)
   - POST endpoint: `/api/ai-search`
   - Handles conversation history parsing
   - Context persistence
   - Error handling

3. **Frontend Component** (`src/components/AiSearchModal.tsx`)
   - Chat interface
   - Message streaming
   - Context management
   - Form redirection

## AI Integration

### Provider: Google Gemini
- **Model**: `gemini-2.0-flash`
- **SDK**: `@google/genai` v1.42+
- **API Key**: `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY` (environment variable)

### Configuration
```typescript
import { generateText, isGoogleAIConfigured } from '@/lib/google-ai'

// Check if configured
isGoogleAIConfigured()  // true if GOOGLE_AI_API_KEY or GEMINI_API_KEY is set

// Generate text
const response = await generateText(prompt, {
  systemInstruction: '...',
  maxTokens: 300,
  history: [{ role: 'user', content: '...' }, { role: 'model', content: '...' }],
})
```

## Key Features

### 1. Entity Type Detection
- **Brand Indicators**: "im a brand", "i need space", "looking for", "tenant", "occupier"
- **Owner Indicators**: "property owner", "i have property", "landlord", "listing", "available"
- **Clarification**: Asks user to choose if ambiguous

### 2. Context-Aware Extraction
- **Location**: Extracts from queries like "space in koramangala", "bangalore"
- **Size**: Extracts from "500 sqft", "1000 sqft" patterns
- **Budget/Rent**: 
  - Numbers >= 10000: Exact amount (e.g., 98000 = ₹98,000)
  - Numbers 100-9999: Thousands (e.g., 50 = ₹50,000)
  - Numbers < 100: Lakhs (e.g., 3 = ₹300,000)
  - Context-aware: If last question was about budget/rent, any number is treated as budget/rent

### 3. Conversation Flow
- **Brand Flow**: Location → Size → Budget → Search
- **Owner Flow**: Location → Size → Rent → Redirect to form
- **Memory**: Maintains context across conversation turns
- **No Repetition**: Checks if value was just collected before asking again

### 4. Response Generation
- **Primary**: Uses Google Gemini API for intelligent responses
- **Fallback**: Rule-based responses when API fails or when value just collected
- **System Prompts**: Entity-specific prompts for better responses

## Data Structures

### SimpleContext
```typescript
interface SimpleContext {
  entityType: 'brand' | 'owner' | null
  collectedDetails: Record<string, any>
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}
```

### API Request
```typescript
{
  query: string
  conversationHistory?: string  // Format: "user: ...\nassistant: ..."
  context?: {
    entityType: 'brand' | 'owner' | null
    collectedDetails: Record<string, any>
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  }
}
```

### API Response
```typescript
{
  success: boolean
  message: string
  properties: any[]
  intent: 'brand_search' | 'owner_listing' | 'general_inquiry'
  extractedRequirements: Record<string, any>
  confirmedEntityType: 'brand' | 'owner' | null
  readyToRedirect?: boolean
  redirectTo?: string
  collectedDetails?: Record<string, any>
}
```

## Environment Variables

Required:
- `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY`: Your Google AI (Gemini) API key from https://aistudio.google.com/apikey

## Current Working Logic

### Extraction Priority
1. Check if last question was about rent/budget → Extract any number as budget/rent
2. Check if last question was about size → Extract number as size
3. Check if last question was about location → Extract location name
4. Fallback: Extract from explicit patterns

### Response Priority
1. If just collected budget/rent → Use fallback to acknowledge and move forward
2. If just collected size → Use fallback to acknowledge and move forward
3. If just collected location → Use fallback to acknowledge and move forward
4. Otherwise → Call Google Gemini API for intelligent response

### Owner Redirect Logic
- Triggers when: `entityType === 'owner' && location && size && rent`
- Stores details in `localStorage` as `propertyListingDetails`
- Redirects to `/onboarding/owner`

## Error Handling

- API failures → Fallback to rule-based responses
- Missing API key → Clear error message
- Invalid JSON → 400 error
- Extraction errors → Logged, continue with empty details

## Console Logging

Key log prefixes:
- `[AI Search]`: Main API route logs
- `[SimpleSearch]`: Search engine logs
- `[ExtractDetails]`: Extraction logic logs
- `[Frontend]`: Frontend component logs

## Testing

To test the system:
1. Start dev server: `npm run dev`
2. Open homepage
3. Click search bar or type query
4. Test flows:
   - Brand: "im a brand" → "i need space in koramangala" → "500 sqft" → "98000"
   - Owner: "property owner" → "bangalore" → "1000 sqft" → "50000"

## Notes

- System uses simple, rule-based approach for reliability
- Claude API is used only for complex conversational responses
- Context is maintained in frontend state and passed with each request
- No database required for search (uses mock data if needed)
- Form pre-filling works via localStorage

