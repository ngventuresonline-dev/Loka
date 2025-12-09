/**
 * Shared utility for dynamic Prisma import
 * Used in API routes to avoid build-time issues
 */

export async function getPrisma() {
  try {
    const prismaModule = await import('./prisma')
    const prisma = prismaModule.prisma
    
    return prisma
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to import Prisma:', e)
    }
    return null
  }
}

// Helper function to handle Prisma queries with automatic retry on prepared statement errors
export async function executePrismaQuery<T>(
  queryFn: (prisma: any) => Promise<T>,
  retries = 1
): Promise<T> {
  const prisma = await getPrisma()
  if (!prisma) {
    throw new Error('Prisma client not available')
  }
  
  try {
    return await queryFn(prisma)
  } catch (error: any) {
    // Check if it's a prepared statement error
    if (
      (error.message?.includes('prepared statement') || 
       error.code === '26000' ||
       error.message?.includes('does not exist')) &&
      retries > 0
    ) {
      console.warn('[Prisma] Prepared statement error, retrying after disconnect/reconnect...')
      try {
        // Disconnect and reconnect
        await prisma.$disconnect()
        await prisma.$connect()
        // Retry the query
        return await queryFn(prisma)
      } catch (retryError) {
        console.error('[Prisma] Retry failed:', retryError)
        throw retryError
      }
    }
    throw error
  }
}

