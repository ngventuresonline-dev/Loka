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
  let databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/database'
  
  // For Supabase connections, ensure proper SSL and connection settings
  if (databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')) {
    const urlParts = databaseUrl.split('?')
    const baseUrl = urlParts[0]
    const existingParams = urlParts[1] ? new URLSearchParams(urlParts[1]) : new URLSearchParams()
    
    // Add SSL requirement if not present
    if (!existingParams.has('sslmode')) {
      existingParams.set('sslmode', 'require')
    }
    
    // For pooler connections, ensure pgbouncer is set
    if (databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes(':6543')) {
      if (!existingParams.has('pgbouncer')) {
        existingParams.set('pgbouncer', 'true')
      }
      if (!existingParams.has('connection_limit')) {
        existingParams.set('connection_limit', '1')
      }
    }
    
    databaseUrl = `${baseUrl}?${existingParams.toString()}`
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Prisma] Using database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')) // Log without password
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Connection pool configuration for better reliability
    // This helps prevent connection issues with poolers
    __internal: {
      engine: {
        connectTimeout: 10000, // 10 seconds
      },
    },
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

// Always create a new client instance
prisma = createPrismaClient()

// Cache in development only
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }

export default prisma
