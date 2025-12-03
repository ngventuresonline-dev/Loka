import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { searchProperties as mockSearchProperties, type MockProperty } from '@/lib/mockDatabase'

// Temporarily disable SSL verification for development (corporate proxy issue)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are a professional and helpful real estate assistant for N&G Ventures. Provide clear, informative responses.

IMPORTANT RESPONSE GUIDELINES:
1. Format all responses using proper HTML with semantic tags
2. Use <p> tags for paragraphs and <strong> for emphasis
3. NO emojis or special characters
4. Keep responses professional and conversational
5. Use proper spacing with Tailwind classes: space-y-3, space-y-4, ml-4, etc.

FOR PROPERTY OWNERS (LISTING):
- Ask ONE question at a time to gather information
- Track what information you already have from previous responses
- Required fields for database: location (city + area), size (sqft), property type, monthly rent, amenities
- After asking a question, acknowledge their answer in the next response
- Example flow:
  1st: "Great! Where is your property located? Please provide the city and area."
  2nd: "Perfect, [City, Area]. What's the total area in square feet?"
  3rd: "Got it, [size] sqft. What type of property is it? (retail, restaurant, office, QSR, etc.)"
  4th: "Excellent. What's your expected monthly rent?"
  5th: "Thank you. What amenities does your property offer? (parking, AC, WiFi, etc.)"
  Final: "Perfect! I have all the details. Your property listing is ready."

FOR BRANDS (SEARCHING):
- Show matching properties with descriptions
- Be helpful and informative

FORMATTING:
<div class="space-y-3">
  <p>Your response text here.</p>
  <p class="font-semibold">Follow-up question or next step.</p>
</div>

ALWAYS wrap content in proper HTML div containers with spacing classes.`

// Function to parse user query and extract search parameters
async function parseQuery(query: string): Promise<any> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze the user's query and determine if they are a BRAND looking for space or a PROPERTY OWNER listing space.

CRITICAL DISTINCTION:
BRAND (searching for properties to rent): "looking for a space", "need a retail space", "want to rent office", "searching for property", "find me a shop", "show me properties", "I need space for my business"
PROPERTY OWNER (listing their property to rent out): "I have a property", "I own a space", "my property is available", "listing my space", "for lease", "to let", "looking for tenant", "looking for a tenant", "need tenant for my property", "want to rent out my space"

IMPORTANT:
- "I have" + property details = OWNER
- "I need/want" + space/property = BRAND  
- "looking for tenant/tenants" = OWNER
- "looking for space/property/retail/office" = BRAND

Return JSON with:
{
  "queryType": "brand-search" or "owner-listing",
  "location": { "city": string, "area": string },
  "propertyType": string (retail/restaurant/qsr/office/kiosk/commercial),
  "size": { "min": number, "max": number } in sqft,
  "budget": { "min": number, "max": number } monthly rent,
  "amenities": string[],
  "summary": string (brief summary of requirements or property details)
}

IMPORTANT: 
- If queryType is "owner-listing", focus on extracting what they HAVE (their property details)
- If queryType is "brand-search", focus on extracting what they NEED (search requirements)
If information is missing, use null.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const parsed = JSON.parse(completion.choices[0].message.content || '{}')
    return parsed
  } catch (error: any) {
    console.warn('⚠️ OpenAI API error, using basic parsing:', error.message)
    // Fallback to basic keyword parsing if OpenAI fails
    return parseQueryBasic(query, '')
  }
}

// Basic query parser without AI (fallback)
function parseQueryBasic(query: string, conversationHistory?: string): any {
  const lowerQuery = query.toLowerCase()
  const historyLower = conversationHistory ? conversationHistory.toLowerCase() : ''
  
  // CRITICAL: Check conversation history first - if user was already identified as owner, keep them as owner
  const wasOwnerBefore = historyLower.includes('querytype') && historyLower.includes('owner-listing')
  const wasBrandBefore = historyLower.includes('querytype') && historyLower.includes('brand-search')
  
  // If already identified in conversation, maintain that identity
  if (wasOwnerBefore) {
    console.log('   ✓ Maintaining OWNER identity from conversation history')
  }
  if (wasBrandBefore) {
    console.log('   ✓ Maintaining BRAND identity from conversation history')
  }
  
  // Determine if owner or brand - CRITICAL: must check context carefully
  const ownerKeywords = [
    'i have a', 'i have an', 'i own', 'my property', 'my space', 'my shop', 'my building',
    'available for', 'for lease', 'for rent', 'to let', 'to rent out',
    'listing my', 'listing a property', 'want to list', 'list my property',
    'looking for tenant', 'looking for a tenant', 'need tenant', 'seeking tenant',
    'want to lease out', 'want to rent out'
  ]
  const brandKeywords = [
    'need a space', 'need space', 'want to rent a', 'want a space', 'searching for space',
    'find me a', 'show me properties', 'i need a', 'require space', 'looking to rent',
    'looking for a space', 'looking for space', 'looking for retail', 'looking for office',
    'looking for restaurant', 'looking for property to rent'
  ]
  
  // Check for owner keywords first (if they mention tenant/listing, they're definitely owner)
  const isOwner = wasOwnerBefore || (!wasBrandBefore && ownerKeywords.some(keyword => lowerQuery.includes(keyword)))
  const isBrand = wasBrandBefore || (!wasOwnerBefore && !isOwner && brandKeywords.some(keyword => lowerQuery.includes(keyword)))
  
  // Extract location
  const cities = ['bangalore', 'mumbai', 'delhi', 'pune', 'hyderabad', 'chennai']
  const areas = ['indiranagar', 'koramangala', 'whitefield', 'hsr', 'jayanagar', 'mg road']
  
  let city = null
  let area = null
  
  for (const c of cities) {
    if (lowerQuery.includes(c)) {
      city = c.charAt(0).toUpperCase() + c.slice(1)
      break
    }
  }
  
  for (const a of areas) {
    if (lowerQuery.includes(a)) {
      area = a
      break
    }
  }
  
  // Extract property type
  let propertyType = null
  if (lowerQuery.includes('retail') || lowerQuery.includes('shop')) propertyType = 'retail'
  else if (lowerQuery.includes('restaurant') || lowerQuery.includes('cafe')) propertyType = 'restaurant'
  else if (lowerQuery.includes('office')) propertyType = 'office'
  else if (lowerQuery.includes('qsr')) propertyType = 'qsr'
  else if (lowerQuery.includes('kiosk')) propertyType = 'kiosk'
  
  return {
    queryType: isOwner ? 'owner-listing' : 'brand-search',
    location: { city, area },
    propertyType,
    size: null,
    budget: null,
    amenities: [],
    summary: query
  }
}

// Function to search properties based on parsed parameters using Supabase
async function searchProperties(params: any) {
  try {
    console.log('🗄️ Querying Supabase database...')
    
    // Build the Supabase query
    let query = supabase
      .from('properties')
      .select('*')
      .eq('is_available', true)

    // Location filter
    if (params.location?.city) {
      console.log(`  📍 Filtering by city: ${params.location.city}`)
      query = query.ilike('city', `%${params.location.city}%`)
    }
    if (params.location?.area) {
      console.log(`  📍 Filtering by area: ${params.location.area}`)
      query = query.ilike('address', `%${params.location.area}%`)
    }

    // Property type filter
    if (params.propertyType) {
      console.log(`  🏢 Filtering by property type: ${params.propertyType}`)
      query = query.eq('property_type', params.propertyType.toLowerCase())
    }

    // Size filter
    if (params.size?.min) {
      console.log(`  📏 Min size: ${params.size.min} sqft`)
      query = query.gte('size', params.size.min)
    }
    if (params.size?.max) {
      console.log(`  📏 Max size: ${params.size.max} sqft`)
      query = query.lte('size', params.size.max)
    }

    // Budget filter
    if (params.budget?.min) {
      console.log(`  💰 Min budget: ₹${params.budget.min}`)
      query = query.gte('price', params.budget.min)
    }
    if (params.budget?.max) {
      console.log(`  💰 Max budget: ₹${params.budget.max}`)
      query = query.lte('price', params.budget.max)
    }

    // Limit results
    query = query.limit(10)

    const { data: properties, error } = await query

    if (error) {
      console.error('❌ Supabase query error:', error)
      console.log('⚠️ Falling back to mock database')
      return fallbackToMockSearch(params)
    }

    // If no results from Supabase, fallback to mock
    if (!properties || properties.length === 0) {
      console.log('⚠️ No results from Supabase, using mock database')
      return fallbackToMockSearch(params)
    }

    console.log(`✅ Supabase returned ${properties.length} properties`)
    
    // Transform Supabase results to match expected format
    return properties.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      address: p.address,
      city: p.city,
      state: p.state,
      zipCode: p.zip_code,
      price: Number(p.price),
      priceType: p.price_type,
      size: p.size,
      propertyType: p.property_type,
      amenities: p.amenities || [],
      images: p.images || [],
      isAvailable: p.is_available,
      isFeatured: p.is_featured,
      ownerId: p.owner_id,
    }))
  } catch (error) {
    console.error('❌ Search error:', error)
    console.log('⚠️ Falling back to mock database')
    return fallbackToMockSearch(params)
  }
}

// Fallback function to use mock database
function fallbackToMockSearch(params: any) {
  console.log('🔄 Using mock database fallback')
  const filters: any = {}

  if (params.location?.city) {
    filters.city = params.location.city
  } else if (params.location?.area) {
    filters.city = params.location.area
  }

  if (params.propertyType) {
    filters.propertyType = params.propertyType
  }

  if (params.size?.min) filters.minSize = params.size.min
  if (params.size?.max) filters.maxSize = params.size.max

  if (params.budget?.min) filters.minPrice = params.budget.min
  if (params.budget?.max) filters.maxPrice = params.budget.max

  if (params.amenities && params.amenities.length > 0) {
    filters.amenities = params.amenities
  }

  console.log('🔍 Mock search filters:', filters)
  const mockResults = mockSearchProperties(filters)
  console.log(`✅ Mock database returned ${mockResults.length} properties`)
  return mockResults
}

// Function to generate AI response with matched properties
async function generateAIResponse(query: string, params: any, properties: any[], conversationHistory?: string) {
  try {
    const isOwner = params.queryType === 'owner-listing'
    
    let contextMessage = ''
    if (isOwner) {
      // For property owners, guide them through one question at a time
      const historyContext = conversationHistory ? `\n\nConversation so far:\n${conversationHistory}` : ''
      
      contextMessage = `The user is a PROPERTY OWNER wanting to list their space. Current query: "${query}"${historyContext}

Respond in HTML format. Your job is to:
1. If this is their first message, warmly acknowledge they want to list a property
2. Ask ONE question at a time to collect: location, size, property type, rent, amenities
3. If they just answered a question, acknowledge their answer and ask the NEXT question
4. Track what info you already have - don't ask again
5. Be conversational and professional
6. After collecting all 5 required fields (location, size, type, rent, amenities), confirm you have everything

DO NOT show them properties - they want to LIST, not search!
DO NOT ask multiple questions at once - ONE question per response.
Use proper HTML formatting with <div class="space-y-3">, <p>, <strong> tags. NO emojis.`
    } else {
      // For brands, show matching properties
      const propertyContext = properties.length > 0
        ? `Found ${properties.length} matching properties:\n${properties
            .map(
              (p, i) =>
                `${i + 1}. ${p.title} - ${p.size} sqft in ${p.city}, ${p.address}. ₹${p.price.toLocaleString()}/month. ${p.amenities.join(', ')}`
            )
            .join('\n')}`
        : 'No exact matches found in the database.'
      
      contextMessage = `The user is a BRAND searching for space. Query: "${query}"

Search results: ${propertyContext}

Provide a professional response in HTML format showing them the properties. Use proper HTML formatting with <div>, <p>, <ul>, <strong> tags. NO emojis.`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: contextMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0].message.content
  } catch (error: any) {
    console.warn('⚠️ OpenAI API error, using basic response:', error.message)
    // Fallback to basic response if OpenAI fails
    return generateBasicResponse(query, properties, params.queryType, conversationHistory)
  }
}

// Basic response generator without AI (fallback)
function generateBasicResponse(query: string, properties: any[], queryType?: string, conversationHistory?: string): string {
  const isOwner = queryType === 'owner-listing'
  
  // Property owner response - ask ONE question at a time
  if (isOwner) {
    // First message - welcome and ask for location
    if (!conversationHistory || conversationHistory.trim() === '') {
      return `<div class="space-y-3">
<p class="text-lg font-semibold">That's great! I'd love to help you list your property.</p>
<p>Let's start with the basics. Where is your property located? Please provide the city and area.</p>
</div>`
    }
    
    // Parse what we already know from conversation
    const hasLocation = /location|city|area|bangalore|mumbai|delhi/i.test(conversationHistory)
    const hasSize = /sqft|square feet|size|\d+\s*sq/i.test(conversationHistory)
    const hasType = /retail|restaurant|office|qsr|kiosk|commercial/i.test(conversationHistory)
    const hasRent = /rent|price|₹|\d+k|\d+,\d+/i.test(conversationHistory)
    const hasAmenities = /amenities|parking|ac|wifi|facilities/i.test(conversationHistory)
    
    // Ask next question based on what's missing
    if (!hasLocation) {
      return `<div class="space-y-3">
<p>To get started, where is your property located? Please provide the city and area.</p>
</div>`
    }
    
    if (!hasSize) {
      return `<div class="space-y-3">
<p>Perfect! What's the total area of your property in square feet?</p>
</div>`
    }
    
    if (!hasType) {
      return `<div class="space-y-3">
<p>Got it! What type of property is it?</p>
<p class="text-sm text-gray-400">(Examples: retail shop, restaurant, office space, QSR, kiosk, etc.)</p>
</div>`
    }
    
    if (!hasRent) {
      return `<div class="space-y-3">
<p>Excellent! What's your expected monthly rent?</p>
</div>`
    }
    
    if (!hasAmenities) {
      return `<div class="space-y-3">
<p>Great! What amenities does your property offer?</p>
<p class="text-sm text-gray-400">(Examples: parking, AC, WiFi, security, etc.)</p>
</div>`
    }
    
    // All info collected
    return `<div class="space-y-3">
<p class="text-lg font-semibold">Perfect! I have all the details for your property listing.</p>
<p>Your property has been recorded and will be reviewed shortly. We'll match you with potential tenants looking for spaces like yours.</p>
<p>Thank you for listing with N&G Ventures!</p>
</div>`
  }
  
  // Brand search response - show properties or ask for more details
  if (properties.length === 0) {
    return `<div class="space-y-4">
<p>I searched through our entire database for "${query}" but couldn't find exact matches at the moment. However, don't worry! Our inventory updates regularly, and I'd love to help you find the perfect space.</p>

<p>Could you tell me more about what you're looking for?</p>

<ul class="list-disc list-inside space-y-1 ml-4">
  <li>What's your ideal location?</li>
  <li>How much space do you need?</li>
  <li>What's your budget range?</li>
  <li>What type of business are you setting up?</li>
</ul>

<p>This will help me find the best options for you.</p>
</div>`
  }
  
  const responses = [
    `<div class="space-y-3">
<p class="font-semibold">Great news! I found ${properties.length} ${properties.length === 1 ? 'space' : 'spaces'} that match your requirements.</p>
<p>Each one has been carefully selected based on what you're looking for. Take a look at the options below.</p>
</div>`,
    
    `<div class="space-y-3">
<p class="font-semibold">Excellent! I've discovered ${properties.length} ${properties.length === 1 ? 'property' : 'properties'} for you.</p>
<p>These are all in prime locations with great potential. Check them out below.</p>
</div>`,
    
    `<div class="space-y-3">
<p class="font-semibold">I found ${properties.length} outstanding ${properties.length === 1 ? 'space' : 'spaces'} that fit your requirements.</p>
<p>These properties are some of our best offerings in the area.</p>
</div>`
  ]
  
  // Randomly pick a response style for variety
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  
  return `${randomResponse}\n\n<p class="mt-3">Feel free to ask me anything about these properties. Want to know more about location, pricing, amenities, or anything else?</p>`
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, userId, conversationHistory } = body

    console.log('🔍 AI Search API called')
    console.log('📝 Query:', query)
    console.log('👤 User ID:', userId || 'guest')

    if (!query || typeof query !== 'string') {
      console.error('❌ Error: Query is required')
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Step 1: Parse the query using AI
    console.log('🤖 Step 1: Parsing query with OpenAI...')
    console.log('📜 Conversation history length:', conversationHistory?.length || 0)
    const params = await parseQuery(query)
    
    // If conversation history exists, check if user type was already determined
    if (conversationHistory && conversationHistory.includes('owner-listing')) {
      console.log('   ⚠️ Overriding detection: User is OWNER (from conversation history)')
      params.queryType = 'owner-listing'
    } else if (conversationHistory && conversationHistory.includes('brand-search')) {
      console.log('   ⚠️ Overriding detection: User is BRAND (from conversation history)')
      params.queryType = 'brand-search'
    }
    
    console.log('✅ Parsed parameters:', JSON.stringify(params, null, 2))

    // Step 2: Search properties in database (only for brand searches)
    let properties: any[] = []
    if (params.queryType === 'owner-listing') {
      console.log('🏢 DETECTED: Property owner - will ask for property details, NOT show properties')
      console.log('   Query Type:', params.queryType)
      console.log('   Skipping property search')
    } else {
      console.log('🔍 DETECTED: Brand searching - will show matching properties')
      console.log('   Query Type:', params.queryType)
      console.log('🔎 Step 2: Searching properties in database...')
      properties = await searchProperties(params)
      console.log(`✅ Found ${properties.length} properties`)
    }

    // Step 3: Generate AI response (with conversation history if provided)
    console.log('💬 Step 3: Generating AI response...')
    const aiResponse = await generateAIResponse(query, params, properties, conversationHistory || '')
    console.log('✅ AI response generated successfully')

    // Step 4: Save search history (skipped for mock database)
    console.log('📊 Search summary:', {
      query,
      queryType: params.queryType || 'brand-search',
      resultsCount: properties.length,
      userId: userId || null,
    })

    // Return response
    console.log('✅ Returning successful response')
    return NextResponse.json({
      success: true,
      message: aiResponse,
      properties,
      searchParams: params,
      count: properties.length,
    })
  } catch (error: any) {
    console.error('❌ AI Search Error Details:')
    console.error('Error Name:', error.name)
    console.error('Error Message:', error.message)
    console.error('Error Code:', error.code)
    console.error('Error Stack:', error.stack)
    
    if (error.cause) {
      console.error('Error Cause:', error.cause)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process search', 
        details: error.message,
        errorType: error.name,
        errorCode: error.code 
      },
      { status: 500 }
    )
  }
}
