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
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/database'
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
  
  // Don't connect immediately - let queries handle connection
  // Connection will be established on first query
  
  return client
}

// Initialize Prisma client
export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
