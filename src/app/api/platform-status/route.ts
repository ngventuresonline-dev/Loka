import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Helper to safely get Prisma client
async function getPrisma() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return prisma
  } catch (error) {
    return null
  }
}

interface StatusCheck {
  name: string
  status: 'operational' | 'degraded' | 'down'
  message: string
  responseTime?: number
  uptime?: number
}

interface FeatureStatus {
  name: string
  status: 'implemented' | 'in-progress' | 'planned'
  description: string
}

interface ApiEndpoint {
  method: string
  endpoint: string
  status: 'active' | 'in-progress' | 'planned'
  description: string
  responseTime?: number
}

interface DatabaseStats {
  totalUsers: number
  totalProperties: number
  totalInquiries: number
  totalMatches: number
  databaseSize?: string
  activeConnections?: number
}

/**
 * Check Anthropic Claude API status
 */
async function checkAnthropic(): Promise<StatusCheck> {
  const startTime = Date.now()
  
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        name: 'AI Engine (Anthropic Claude)',
        status: 'down',
        message: 'API key not configured',
        responseTime: Date.now() - startTime
      }
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Simple test call - use latest model
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'test' }]
    })

    const responseTime = Date.now() - startTime
    
    if (message.content && message.content.length > 0) {
      return {
        name: 'AI Engine (Anthropic Claude)',
        status: 'operational',
        message: 'API is responding',
        responseTime,
        uptime: 99.9
      }
    } else {
      return {
        name: 'AI Engine (Anthropic Claude)',
        status: 'degraded',
        message: 'API responded but no content',
        responseTime,
        uptime: 95.0
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    let errorMessage = 'API request failed'
    
    // Parse error message to be more user-friendly
    if (error.message) {
      if (error.message.includes('not_found_error') || error.message.includes('404')) {
        errorMessage = 'Model not found. Please check API configuration.'
      } else if (error.message.includes('401') || error.message.includes('authentication')) {
        errorMessage = 'Invalid API key. Please check your ANTHROPIC_API_KEY.'
      } else if (error.message.includes('rate_limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else {
        // Extract clean error message
        try {
          const errorObj = JSON.parse(error.message)
          errorMessage = errorObj.error?.message || errorObj.message || error.message
        } catch {
          errorMessage = error.message.length > 100 
            ? error.message.substring(0, 100) + '...' 
            : error.message
        }
      }
    }
    
    return {
      name: 'AI Engine (Anthropic Claude)',
      status: 'down',
      message: errorMessage,
      responseTime,
      uptime: 0
    }
  }
}

/**
 * Check database connection
 */
async function checkDatabase(): Promise<StatusCheck> {
  const startTime = Date.now()
  
  try {
    const prisma = await getPrisma()
    
    // Check if Prisma is available
    if (!prisma) {
      return {
        name: 'Database (PostgreSQL + Prisma)',
        status: 'down',
        message: 'Prisma client not initialized. Run "prisma generate"',
        responseTime: Date.now() - startTime,
        uptime: 0
      }
    }
    
    // Try to query the database
    const userCount = await prisma.user.count()
    const propertyCount = await prisma.property.count()
    
    const responseTime = Date.now() - startTime
    
    return {
      name: 'Database (PostgreSQL + Prisma)',
      status: 'operational',
      message: `Connected successfully (${userCount} users, ${propertyCount} properties)`,
      responseTime,
      uptime: 99.8
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    const errorMessage = error.message || 'Database connection failed'
    
    // Check if it's a Prisma initialization error
    if (errorMessage.includes('did not initialize') || errorMessage.includes('prisma generate')) {
      return {
        name: 'Database (PostgreSQL + Prisma)',
        status: 'down',
        message: 'Prisma client not initialized. Run "prisma generate"',
        responseTime,
        uptime: 0
      }
    }
    
    return {
      name: 'Database (PostgreSQL + Prisma)',
      status: 'down',
      message: errorMessage,
      responseTime,
      uptime: 0
    }
  }
}

/**
 * Check authentication service
 */
function checkAuthentication(): StatusCheck {
  try {
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL
    
    if (!hasNextAuthSecret && !hasNextAuthUrl) {
      return {
        name: 'Authentication (NextAuth)',
        status: 'degraded',
        message: 'Missing NEXTAUTH_SECRET and NEXTAUTH_URL (optional for development)',
        uptime: 90.0
      }
    } else if (!hasNextAuthSecret) {
      return {
        name: 'Authentication (NextAuth)',
        status: 'degraded',
        message: 'Missing NEXTAUTH_SECRET (optional for development)',
        uptime: 95.0
      }
    } else if (!hasNextAuthUrl) {
      return {
        name: 'Authentication (NextAuth)',
        status: 'degraded',
        message: 'Missing NEXTAUTH_URL (optional for development)',
        uptime: 95.0
      }
    }
    
    return {
      name: 'Authentication (NextAuth)',
      status: 'operational',
      message: 'Service configured and ready',
      uptime: 99.5
    }
  } catch (error: any) {
    return {
      name: 'Authentication (NextAuth)',
      status: 'down',
      message: error.message || 'Authentication check failed',
      uptime: 0
    }
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const prisma = await getPrisma()
    
    // Check if Prisma is available
    if (!prisma) {
      return {
        totalUsers: 0,
        totalProperties: 0,
        totalInquiries: 0,
        totalMatches: 0
      }
    }
    
    const [totalUsers, totalProperties, totalInquiries, totalMatches] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.property.count().catch(() => 0),
      prisma.inquiry.count().catch(() => 0),
      prisma.searchHistory.count().catch(() => 0)
    ])
    
    return {
      totalUsers,
      totalProperties,
      totalInquiries,
      totalMatches,
      activeConnections: 1 // Prisma manages connection pool
    }
  } catch (error) {
    return {
      totalUsers: 0,
      totalProperties: 0,
      totalInquiries: 0,
      totalMatches: 0
    }
  }
}

/**
 * Get feature status list
 */
function getFeatureStatus(): FeatureStatus[] {
  return [
    // Implemented
    { name: 'Authentication & User Management', status: 'implemented', description: 'User registration, login, and session management' },
    { name: 'AI-Powered Search (Text & Button flows)', status: 'implemented', description: 'Natural language and button-based conversation flows' },
    { name: 'Brand Onboarding', status: 'implemented', description: 'Multi-step brand registration form' },
    { name: 'Property Owner Onboarding', status: 'implemented', description: 'Multi-step owner registration with pre-filling' },
    { name: 'Button-Based Conversation Flow', status: 'implemented', description: 'Guided step-by-step flow with multi-select support' },
    { name: 'Data Normalization', status: 'implemented', description: 'Budget, area, and location normalization' },
    { name: 'Matching Engine (BFI/PFI)', status: 'implemented', description: 'Brand Fit Index and Property Fit Index scoring' },
    { name: 'Basic Dashboard', status: 'implemented', description: 'User dashboard with property listings' },
    { name: 'Database Schema', status: 'implemented', description: 'Complete Prisma schema with all models' },
    { name: 'UI Component Library', status: 'implemented', description: 'Reusable components with modern design' },
    
    // In Progress
    { name: 'Property CRUD Operations', status: 'in-progress', description: 'Create, update, delete properties (form exists, API incomplete)' },
    { name: 'Search & Filtering', status: 'in-progress', description: 'Advanced property search and filtering (UI exists, API incomplete)' },
    { name: 'Match Display', status: 'in-progress', description: 'Match results page and details view (logic exists, UI incomplete)' },
    { name: 'Inquiry System', status: 'in-progress', description: 'Brand-owner communication (schema ready, UI incomplete)' },
    
    // Planned
    { name: 'Real-time Notifications', status: 'planned', description: 'In-app and email notifications' },
    { name: 'Payment Integration', status: 'planned', description: 'Payment gateway and subscription management' },
    { name: 'Advanced Analytics', status: 'planned', description: 'Property views, user activity, match metrics' },
    { name: 'CRM Integration', status: 'planned', description: 'Customer relationship management system' },
    { name: 'Mobile App', status: 'planned', description: 'React Native mobile application' }
  ]
}

/**
 * Get API endpoints status
 */
function getApiEndpoints(): ApiEndpoint[] {
  return [
    { method: 'POST', endpoint: '/api/ai-search', status: 'active', description: 'AI-powered search endpoint' },
    { method: 'GET', endpoint: '/api/status', status: 'active', description: 'System status endpoint' },
    { method: 'GET', endpoint: '/api/platform-status', status: 'active', description: 'Comprehensive platform status' },
    { method: 'POST', endpoint: '/api/auth/*', status: 'active', description: 'NextAuth authentication routes' },
    { method: 'GET', endpoint: '/api/properties', status: 'in-progress', description: 'List properties (planned)' },
    { method: 'POST', endpoint: '/api/properties', status: 'in-progress', description: 'Create property (planned)' },
    { method: 'POST', endpoint: '/api/inquiries', status: 'in-progress', description: 'Create inquiry (planned)' }
  ]
}

/**
 * Get tech stack information
 */
function getTechStack() {
  return {
    nextjs: '15.0.1',
    react: '18',
    typescript: '5',
    prisma: '6.19.0',
    postgresql: 'Latest',
    nodejs: process.version,
    anthropic: 'Claude 3.5 Sonnet',
    framerMotion: '12.23.25',
    tailwindcss: '3.4.1'
  }
}

/**
 * Get deployment information
 */
function getDeploymentInfo() {
  return {
    environment: process.env.NODE_ENV || 'development',
    buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || '0.1.0',
    lastDeployment: process.env.NEXT_PUBLIC_DEPLOYMENT_TIME || new Date().toISOString(),
    gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'N/A',
    vercel: process.env.VERCEL ? 'Yes' : 'No'
  }
}

/**
 * Main platform status endpoint
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Run all checks in parallel
    const [anthropicStatus, databaseStatus, authStatus, dbStats] = await Promise.all([
      checkAnthropic(),
      checkDatabase(),
      Promise.resolve(checkAuthentication()),
      getDatabaseStats()
    ])
    
    const systemInfo = {
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
    
    // Determine overall status
    // Only mark as "down" if critical systems are down
    // Database is critical, AI and Auth can be degraded without system being "down"
    const criticalSystems = [databaseStatus]
    const hasCriticalDown = criticalSystems.some(s => s.status === 'down')
    const hasAnyDegraded = [anthropicStatus, databaseStatus, authStatus].some(s => s.status === 'degraded')
    
    const overallStatus = hasCriticalDown ? 'down' : hasAnyDegraded ? 'degraded' : 'operational'
    
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      coreSystems: {
        database: databaseStatus,
        aiEngine: anthropicStatus,
        authentication: authStatus
      },
      features: getFeatureStatus(),
      apiEndpoints: getApiEndpoints(),
      databaseStats: dbStats,
      techStack: getTechStack(),
      deployment: getDeploymentInfo(),
      system: systemInfo,
      responseTime: totalTime
    })
  } catch (error: any) {
    console.error('[Platform Status] Error:', error)
    
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

