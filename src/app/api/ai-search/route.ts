import { NextRequest, NextResponse } from 'next/server'
import { simpleSearch } from '@/lib/ai-search/simple-search'

/**
 * AI Search API Route
 * Simple, robust search system using Anthropic Claude
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  console.log('[AI Search] ===== New Request =====')
  console.log('[AI Search] API Key configured:', !!process.env.ANTHROPIC_API_KEY)
  
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Anthropic API key not configured',
          message: 'AI search is not available. Please configure ANTHROPIC_API_KEY in your environment variables.'
        },
        { status: 500 }
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
      message: result.message || 'How can I help you today?',
      properties: [],
      searchParams: {},
      intent: result.entityType === 'brand' ? 'brand_search' : 'owner_listing',
      count: 0,
      extractedRequirements: result.collectedDetails || {},
      confirmedEntityType: result.entityType
    })

  } catch (error: any) {
    console.error('[AI Search] ===== Error =====')
    console.error('[AI Search] Error:', error.message)
    console.error('[AI Search] Error name:', error.name)
    console.error('[AI Search] Stack:', error.stack)
    
    if (error.status) {
      console.error('[AI Search] HTTP Status:', error.status)
    }
    if (error.statusText) {
      console.error('[AI Search] Status Text:', error.statusText)
    }
    
    console.error('[AI Search] ===== End Error =====\n')
    
    // Provide helpful error message
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
