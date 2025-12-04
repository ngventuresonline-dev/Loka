import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchProperties } from '@/lib/mockDatabase'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Query intent types
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
 * Parse user query to determine intent and extract parameters
 */
async function parseQuery(query: string, userType?: 'brand' | 'owner'): Promise<ParsedQuery> {
  // Use userType as a hint for intent
  let intentHint = ''
  if (userType === 'brand') {
    intentHint = '\n\nNote: User is a BRAND (looking for properties to rent/lease). Default to "brand_search" unless query clearly indicates listing.'
  } else if (userType === 'owner') {
    intentHint = '\n\nNote: User is a PROPERTY OWNER (has properties to list). Default to "owner_listing" unless query clearly indicates searching.'
  }

  const systemPrompt = `You are a real estate assistant that categorizes queries into:
1. "brand_search" - When user is looking for/needing/wanting a property to rent/lease (e.g., "Looking for QSR space", "I need a restaurant", "Want office space")
2. "owner_listing" - When user has/wants to list/rent out their property (e.g., "I have a space", "I want to list my property", "Commercial space for rent")
3. "general_inquiry" - General questions about the platform

Extract structured data from the query. Return JSON only.${intentHint}`

  const userPrompt = `Analyze this query and extract information:
"${query}"

Return JSON in this exact format:
{
  "intent": "brand_search" | "owner_listing" | "general_inquiry",
  "queryType": "search" | "list" | "inquiry",
  "location": {
    "city": "city name or null",
    "area": "area/neighborhood or null"
  },
  "propertyType": "qsr|restaurant|retail|office|kiosk|warehouse or null",
  "size": number or null,
  "minSize": number or null,
  "maxSize": number or null,
  "budget": number or null,
  "minPrice": number or null,
  "maxPrice": number or null,
  "amenities": ["amenity1", "amenity2"] or [],
  "summary": "Brief summary of what user wants"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(completion.choices[0].message.content || '{}')
    return parsed as ParsedQuery
  } catch (error) {
    console.error('Error parsing query:', error)
    // Fallback parsing with userType hint
    const lowerQuery = query.toLowerCase()
    const hasOwnerKeywords = lowerQuery.includes('have') || 
                            lowerQuery.includes('list') || 
                            lowerQuery.includes('available') ||
                            lowerQuery.includes('rent out') ||
                            lowerQuery.includes('for rent')
    
    // Use userType as a strong hint if query is ambiguous
    let intent: QueryIntent = 'brand_search'
    if (userType === 'owner' && !lowerQuery.includes('looking for') && !lowerQuery.includes('need') && !lowerQuery.includes('want')) {
      intent = 'owner_listing'
    } else if (userType === 'brand' && !hasOwnerKeywords) {
      intent = 'brand_search'
    } else if (hasOwnerKeywords) {
      intent = 'owner_listing'
    }
    
    return {
      intent,
      queryType: intent === 'owner_listing' ? 'list' : 'search',
      summary: query
    }
  }
}

/**
 * Generate AI response based on intent and search results
 */
async function generateAIResponse(
  query: string,
  intent: QueryIntent,
  parsedQuery: ParsedQuery,
  properties: any[],
  conversationHistory?: string
): Promise<string> {
  const isBrandSearch = intent === 'brand_search'
  const isOwnerListing = intent === 'owner_listing'

  // Different system prompts for different user types
  let systemPrompt = ''
  if (isBrandSearch) {
    systemPrompt = `You are a helpful real estate assistant helping BRANDS find commercial properties to rent/lease.
Your role is to help brands find the perfect commercial space that matches their requirements.
Be conversational, helpful, and highlight key features that matter to brands (location, foot traffic, amenities, price).
If properties are found, mention specific details about each property.
If no properties match, suggest alternatives or ask clarifying questions.`
  } else if (isOwnerListing) {
    systemPrompt = `You are a helpful real estate assistant helping PROPERTY OWNERS list their commercial properties.
Your role is to help property owners understand how to list their property and what information is needed.
Be conversational, helpful, and guide them through the listing process.
If they're asking about listing, provide guidance on what information is needed.
If they're searching for something, redirect them appropriately.`
  } else {
    systemPrompt = `You are a helpful real estate assistant for a commercial property platform.
Help users with general questions about the platform, property search, or listing properties.`
  }

  const propertiesContext = properties.length > 0
    ? `\n\nFound ${properties.length} matching properties:\n${properties.map((p, i) => 
        `${i + 1}. ${p.title} - ${p.address}, ${p.city}\n   Size: ${p.size} sqft, Price: ₹${p.price.toLocaleString()}/${p.priceType}\n   Type: ${p.propertyType}, Amenities: ${p.amenities.join(', ')}`
      ).join('\n')}`
    : '\n\nNo matching properties found.'

  const historyContext = conversationHistory ? `\n\nPrevious conversation:\n${conversationHistory}` : ''

  const userPrompt = `User query: "${query}"
${historyContext}
${propertiesContext}

Generate a helpful, conversational response (2-3 sentences). ${isBrandSearch ? 'Focus on helping them find the right property.' : isOwnerListing ? 'Focus on helping them list their property.' : 'Answer their question helpfully.'}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return completion.choices[0].message.content || 'I apologize, but I could not generate a response.'
  } catch (error) {
    console.error('Error generating AI response:', error)
    
    // Fallback responses based on intent
    if (isBrandSearch) {
      if (properties.length > 0) {
        return `Great! I found ${properties.length} property${properties.length > 1 ? 'ies' : ''} that match your requirements. ${properties.map(p => p.title).join(', ')}. Would you like more details about any of these?`
      } else {
        return `I couldn't find exact matches for your search. Could you provide more details about your requirements? For example, what type of space, location, and budget are you looking for?`
      }
    } else if (isOwnerListing) {
      return `I'd be happy to help you list your property! To get started, please provide details like: property type, location, size, price, and amenities. You can also visit the property listing page to add your property.`
    } else {
      return `I'm here to help! Are you looking to find a commercial property, or do you want to list your property?`
    }
  }
}

/**
 * Main API handler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, userId, userType, conversationHistory } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured',
          message: 'AI search is not available. Please configure OPENAI_API_KEY in your environment variables.'
        },
        { status: 500 }
      )
    }

    // Step 1: Parse query to determine intent and extract parameters
    // Use userType as a hint for intent detection
    const parsedQuery = await parseQuery(query, userType)
    const { intent, location, propertyType, minSize, maxSize, minPrice, maxPrice, amenities } = parsedQuery

    // Step 2: Search properties (only for brand searches)
    let properties: any[] = []
    let searchParams: any = {}

    if (intent === 'brand_search') {
      // Build search filters
      const filters: any = {}
      
      if (location?.city) {
        filters.city = location.city
      }
      
      if (propertyType) {
        filters.propertyType = propertyType
      }
      
      if (minPrice || maxPrice) {
        if (minPrice) filters.minPrice = minPrice
        if (maxPrice) filters.maxPrice = maxPrice
      }
      
      if (minSize || maxSize) {
        if (minSize) filters.minSize = minSize
        if (maxSize) filters.maxSize = maxSize
      }
      
      if (amenities && amenities.length > 0) {
        filters.amenities = amenities
      }

      searchParams = filters
      properties = searchProperties(filters)
    } else if (intent === 'owner_listing') {
      // For owners listing properties, we might want to show them similar properties
      // or guide them to the listing page
      properties = []
    }

    // Step 3: Generate AI response based on intent
    const aiMessage = await generateAIResponse(
      query,
      intent,
      parsedQuery,
      properties,
      conversationHistory
    )

    // Step 4: Return response
    return NextResponse.json({
      success: true,
      message: aiMessage,
      properties: properties,
      searchParams: searchParams,
      intent: intent,
      count: properties.length
    })

  } catch (error: any) {
    console.error('AI Search API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while processing your search',
        message: 'I apologize, but I encountered an error. Please try again or rephrase your query.'
      },
      { status: 500 }
    )
  }
}

