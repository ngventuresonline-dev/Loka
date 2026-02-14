import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock the simpleSearch function
jest.mock('@/lib/ai-search/simple-search', () => ({
  simpleSearch: jest.fn(),
}))

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe('/api/ai-search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
  })

  it('should return 200 with valid query', async () => {
    const { simpleSearch } = require('@/lib/ai-search/simple-search')
    simpleSearch.mockResolvedValue({
      message: 'I found some properties for you',
      entityType: 'brand',
      collectedDetails: {
        locations: ['Koramangala'],
        sizeRange: { min: 500, max: 1000 },
      },
    })

    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'cafe space in Koramangala',
        conversationHistory: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBeDefined()
    expect(simpleSearch).toHaveBeenCalled()
  })

  it('should return 400 for invalid query', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required 'query' field
        conversationHistory: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should detect entity type correctly', async () => {
    const { simpleSearch } = require('@/lib/ai-search/simple-search')
    simpleSearch.mockResolvedValue({
      message: 'I can help you list your property',
      entityType: 'owner',
      collectedDetails: {
        propertyType: 'retail',
        location: 'Koramangala',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'I have a property to list',
        conversationHistory: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.confirmedEntityType).toBe('owner')
    expect(data.intent).toBe('owner_listing')
  })

  it('should extract details from query', async () => {
    const { simpleSearch } = require('@/lib/ai-search/simple-search')
    const extractedDetails = {
      locations: ['Koramangala', 'Indiranagar'],
      sizeRange: { min: 500, max: 1000 },
      budgetRange: { min: 100000, max: 200000 },
    }

    simpleSearch.mockResolvedValue({
      message: 'Found properties',
      entityType: 'brand',
      collectedDetails: extractedDetails,
    })

    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'cafe space in Koramangala, 500-1000 sqft, budget 1-2 lakhs',
        conversationHistory: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.extractedRequirements).toEqual(extractedDetails)
  })

  it('should handle API errors and return 500', async () => {
    const { simpleSearch } = require('@/lib/ai-search/simple-search')
    simpleSearch.mockRejectedValue(new Error('API connection failed'))

    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'test query',
        conversationHistory: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should return 500 when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY

    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'test query',
        conversationHistory: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('API key')
  })

  it('should handle owner redirect correctly', async () => {
    const { simpleSearch } = require('@/lib/ai-search/simple-search')
    simpleSearch.mockResolvedValue({
      message: 'Redirecting to owner onboarding',
      entityType: 'owner',
      collectedDetails: {
        propertyType: 'retail',
      },
      readyToRedirect: true,
    })

    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'I want to list my property',
        conversationHistory: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.readyToRedirect).toBe(true)
    expect(data.redirectTo).toBe('/onboarding/owner')
  })

  it('should parse conversation history correctly', async () => {
    const { simpleSearch } = require('@/lib/ai-search/simple-search')
    simpleSearch.mockResolvedValue({
      message: 'Response',
      entityType: 'brand',
      collectedDetails: {},
    })

    const request = new NextRequest('http://localhost:3000/api/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'test',
        conversationHistory: 'user: Hello\nassistant: Hi there\nuser: I need a cafe space',
      }),
    })

    const response = await POST(request)
    
    expect(response.status).toBe(200)
    expect(simpleSearch).toHaveBeenCalledWith(
      'test',
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Hello' }),
        expect.objectContaining({ role: 'assistant', content: 'Hi there' }),
        expect.objectContaining({ role: 'user', content: 'I need a cafe space' }),
      ]),
      undefined
    )
  })
})
