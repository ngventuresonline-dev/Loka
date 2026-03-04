import { NextResponse } from 'next/server'

import { testConnection, isGoogleAIConfigured } from '@/lib/google-ai'

interface StatusCheck {
  name: string
  status: 'operational' | 'degraded' | 'down'
  message: string
  responseTime?: number
}

/**
 * Check Google AI (Gemini) API status
 */
async function checkGoogleAI(): Promise<StatusCheck> {
  const startTime = Date.now()

  if (!isGoogleAIConfigured()) {
    return {
      name: 'Google Gemini API',
      status: 'down',
      message: 'API key not configured. Set GOOGLE_AI_API_KEY or GEMINI_API_KEY.',
      responseTime: Date.now() - startTime,
    }
  }

  const result = await testConnection()
  const responseTime = result.latencyMs ?? Date.now() - startTime

  if (result.ok) {
    return {
      name: 'Google Gemini API',
      status: 'operational',
      message: 'API is responding',
      responseTime,
    }
  }

  return {
    name: 'Google Gemini API',
    status: 'down',
    message: result.error || 'API request failed',
    responseTime,
  }
}

/**
 * Check database/mock database status
 */
async function checkDatabase(): Promise<StatusCheck> {
  const startTime = Date.now()
  
  try {
    // Check if mock database is accessible
    const { getAllProperties } = await import('@/lib/mockDatabase')
    const properties = getAllProperties()
    
    const responseTime = Date.now() - startTime
    
    return {
      name: 'Database',
      status: 'operational',
      message: `Mock database accessible (${properties.length} properties)`,
      responseTime
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return {
      name: 'Database',
      status: 'down',
      message: error.message || 'Database check failed',
      responseTime
    }
  }
}

/**
 * Check environment variables
 */
function checkEnvironment(): StatusCheck {
  const requiredVars = ['GOOGLE_AI_API_KEY']
  const missing: string[] = []
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  })
  
  if (missing.length > 0) {
    return {
      name: 'Environment Variables',
      status: 'degraded',
      message: `Missing: ${missing.join(', ')}`
    }
  }
  
  return {
    name: 'Environment Variables',
    status: 'operational',
    message: 'All required variables configured'
  }
}

/**
 * Get system information
 */
function getSystemInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      limit: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * Main status endpoint
 */
export async function GET() {
  const startTime = Date.now()
  
  console.log('[Status] Status check requested')
  
  try {
    // Run all checks in parallel
    const [aiStatus, databaseStatus, envStatus] = await Promise.all([
      checkGoogleAI(),
      checkDatabase(),
      Promise.resolve(checkEnvironment())
    ])
    
    const systemInfo = getSystemInfo()
    const totalTime = Date.now() - startTime
    
    // Determine overall status
    const statuses = [aiStatus, databaseStatus, envStatus]
    const hasDown = statuses.some(s => s.status === 'down')
    const hasDegraded = statuses.some(s => s.status === 'degraded')
    
    const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'operational'
    
    console.log('[Status] Status check completed:', {
      overallStatus,
      checks: statuses.length,
      totalTime
    })
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        anthropic: aiStatus,
        database: databaseStatus,
        environment: envStatus
      },
      system: systemInfo,
      responseTime: totalTime
    })
  } catch (error: any) {
    console.error('[Status] Error checking status:', error)
    
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error.message || 'Status check failed',
        responseTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

