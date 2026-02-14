import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'test' }],
      }),
    },
  })),
}))

// Mock mockDatabase
jest.mock('@/lib/mockDatabase', () => ({
  getAllProperties: jest.fn(() => [
    { id: '1', title: 'Test Property' },
    { id: '2', title: 'Another Property' },
  ]),
}))

describe('/api/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
  })

  it('should return 200 status', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('should return {status: "ok", timestamp}', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    expect(data.status).toBeDefined()
    expect(data.timestamp).toBeDefined()
    expect(typeof data.timestamp).toBe('string')
  })

  it('should include system information', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    expect(data.system).toBeDefined()
    expect(data.system.nodeVersion).toBeDefined()
    expect(data.system.platform).toBeDefined()
    expect(data.system.timestamp).toBeDefined()
  })

  it('should include check results', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks).toBeDefined()
    expect(data.checks.anthropic).toBeDefined()
    expect(data.checks.database).toBeDefined()
    expect(data.checks.environment).toBeDefined()
  })

  it('should include response time', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    expect(data.responseTime).toBeDefined()
    expect(typeof data.responseTime).toBe('number')
  })

  it('should handle errors gracefully', async () => {
    // Mock a failure in one of the checks
    const { getAllProperties } = require('@/lib/mockDatabase')
    getAllProperties.mockImplementationOnce(() => {
      throw new Error('Database error')
    })

    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    // Should still return a response, possibly with degraded status
    expect(response.status).toBeGreaterThanOrEqual(200)
    expect(data).toBeDefined()
  })

  it('should check Anthropic API status', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks.anthropic).toBeDefined()
    expect(data.checks.anthropic.name).toBe('Anthropic Claude API')
    expect(['operational', 'degraded', 'down']).toContain(data.checks.anthropic.status)
  })

  it('should check database status', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks.database).toBeDefined()
    expect(data.checks.database.name).toBe('Database')
    expect(['operational', 'degraded', 'down']).toContain(data.checks.database.status)
  })

  it('should check environment variables', async () => {
    const request = new NextRequest('http://localhost:3000/api/status')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks.environment).toBeDefined()
    expect(data.checks.environment.name).toBe('Environment Variables')
    expect(['operational', 'degraded', 'down']).toContain(data.checks.environment.status)
  })
})
