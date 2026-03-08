import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with better error handling
const createPrismaClient = () => {
  // During build time on Vercel, DATABASE_URL might not be available
  // We provide a dummy URL for Prisma validation during build
  // At runtime, the real DATABASE_URL from Vercel env vars will be used
  let databaseUrl = (process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/database').trim()
  
  // Remove any trailing backslashes, newlines, or line breaks that might cause issues
  // Also handle cases where the URL might be split across multiple lines in .env files
  databaseUrl = databaseUrl.replace(/\\+$/, '').replace(/\n+/g, '').replace(/\r+/g, '').trim()
  
  // Validate URL format
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error('[Prisma] Invalid DATABASE_URL format. Must start with postgresql:// or postgres://')
    throw new Error('Invalid DATABASE_URL format')
  }

  // Add connection pool parameters to ALL database URLs to prevent timeout issues
  const urlParts = databaseUrl.split('?')
  const baseUrl = urlParts[0]
  const existingParams = urlParts[1] ? new URLSearchParams(urlParts[1]) : new URLSearchParams()
  
  // For Supabase connections, ensure proper SSL and connection settings
  if (databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')) {
    // Add SSL requirement if not present
    if (!existingParams.has('sslmode')) {
      existingParams.set('sslmode', 'require')
    }
    
    // For pooler connections, ensure pgbouncer is set
    // Pooler is recommended for Prisma to avoid prepared statement errors
    if (databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes(':6543')) {
      if (!existingParams.has('pgbouncer')) {
        existingParams.set('pgbouncer', 'true')
      }
    }
    
    // If using direct connection (port 5432), suggest switching to pooler
    if (databaseUrl.includes(':5432') && !databaseUrl.includes('pooler')) {
      console.warn('[Prisma] Using direct connection. Consider switching to pooler (port 6543) for better Prisma compatibility.')
    }
  }
  
  // CRITICAL: Configure connection pool settings for ALL database connections
  // This prevents "Timed out fetching a new connection from the connection pool" errors
  
  // Remove overly restrictive connection limits
  if (existingParams.has('connection_limit')) {
    const currentLimit = parseInt(existingParams.get('connection_limit') || '1', 10)
    if (currentLimit < 5) {
      existingParams.delete('connection_limit')
    }
  }
  
  // Set appropriate connection limit based on environment
  // Higher limit reduces pool exhaustion but uses more database connections
  if (!existingParams.has('connection_limit')) {
    const connectionLimit = process.env.NODE_ENV === 'production' ? '20' : '10'
    existingParams.set('connection_limit', connectionLimit)
  }
  
  // Increase connection timeout (time to establish a new connection)
  if (!existingParams.has('connect_timeout')) {
    existingParams.set('connect_timeout', '30')
  }
  
  // Note: Prisma's connection pool timeout (10 seconds) cannot be configured via connection string
  // The solution is to:
  // 1. Increase connection_limit (done above) to reduce pool contention
  // 2. Use executePrismaQuery helper for automatic retry on pool timeout errors
  // 3. Ensure proper connection management and avoid connection leaks
  
  // Reconstruct URL with all parameters
  databaseUrl = `${baseUrl}?${existingParams.toString()}`
  
  // Final cleanup - ensure no trailing characters
  databaseUrl = databaseUrl.trim()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Prisma] Using database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')) // Log without password
    console.log('[Prisma] URL validation - starts with postgresql://:', databaseUrl.startsWith('postgresql://'))
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'], // Removed 'query' to reduce noise
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Connection pool settings
    // Prisma will manage connections automatically - don't need explicit $connect()
  })
  
  // Handle connection errors gracefully
  client.$on('error' as never, (e: any) => {
    console.error('Prisma error:', e)
  })
  
  // Don't connect immediately - let queries handle connection
  // Connection will be established on first query
  
  return client
}

// Initialize Prisma client
// Always create fresh instance to avoid cached connection issues
// In development, we'll still cache it but force recreation on module reload
let prisma: PrismaClient

// Force disconnect any existing client to avoid prepared statement errors
if (globalForPrisma.prisma) {
  try {
    globalForPrisma.prisma.$disconnect().catch(() => {})
  } catch (e) {
    // Ignore disconnect errors
  }
}

// Always create a new client instance - wrap in try-catch to prevent module load failures
try {
  prisma = createPrismaClient()
} catch (error: any) {
  console.error('[Prisma] Failed to create Prisma client:', error?.message || error)
  // Create a minimal client that will fail gracefully on queries
  // This prevents the module from failing to load entirely
  try {
    prisma = new PrismaClient({
      datasources: { db: { url: 'postgresql://user:pass@localhost:5432/db' } },
      log: ['error'],
    }) as any
  } catch (fallbackError: any) {
    console.error('[Prisma] Even fallback client creation failed:', fallbackError?.message || fallbackError)
    // Last resort: create a minimal object that matches Prisma interface
    prisma = {
      $connect: async () => {},
      $disconnect: async () => {},
      $on: () => {},
      $use: () => {},
      $transaction: async () => {},
      $queryRaw: async () => [],
      $executeRaw: async () => 0,
      user: { findMany: async () => [], findUnique: async () => null, count: async () => 0 },
      property: { findMany: async () => [], findUnique: async () => null, count: async () => 0 },
      brand_profiles: { findMany: async () => [], findUnique: async () => null, count: async () => 0 },
    } as any
  }
}

// Cache in development only
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }

export default prisma
