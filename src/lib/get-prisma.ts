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

// Helper function to handle Prisma queries with automatic retry on connection errors
export async function executePrismaQuery<T>(
  queryFn: (prisma: any) => Promise<T>,
  retries = 2,
  delayMs = 1000
): Promise<T> {
  const prisma = await getPrisma()
  if (!prisma) {
    throw new Error('Prisma client not available')
  }
  
  let lastError: any
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await queryFn(prisma)
    } catch (error: any) {
      lastError = error
      
      // Check if it's a connection pool timeout error
      const isPoolTimeout = 
        error.message?.includes('Timed out fetching a new connection') ||
        error.message?.includes('connection pool') ||
        error.code === 'P1008' ||
        error.code === 'P1017'
      
      // Check if it's a prepared statement error
      const isPreparedStatementError = 
        error.message?.includes('prepared statement') || 
        error.code === '26000' ||
        error.message?.includes('does not exist')
      
      // Check if it's a connection error that might benefit from retry
      const isConnectionError =
        error.message?.includes('connect') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        error.code === 'P1001'
      
      // Retry on connection-related errors
      if ((isPoolTimeout || isPreparedStatementError || isConnectionError) && attempt < retries) {
        const waitTime = delayMs * (attempt + 1) // Exponential backoff
        console.warn(
          `[Prisma] ${isPoolTimeout ? 'Connection pool timeout' : isPreparedStatementError ? 'Prepared statement error' : 'Connection error'} detected. ` +
          `Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries + 1})`
        )
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        // For pool timeout and connection errors, try to reset the connection
        if (isPoolTimeout || isConnectionError) {
          try {
            await prisma.$disconnect().catch(() => {}) // Ignore disconnect errors
            // Small delay before reconnecting
            await new Promise(resolve => setTimeout(resolve, 500))
            await prisma.$connect().catch(() => {}) // Ignore connect errors, let the query retry
          } catch (reconnectError) {
            // Ignore reconnect errors, will retry the query
            console.warn('[Prisma] Reconnect attempt failed, will retry query:', reconnectError)
          }
        } else if (isPreparedStatementError) {
          // For prepared statement errors, disconnect and reconnect
          try {
            await prisma.$disconnect()
            await prisma.$connect()
          } catch (reconnectError) {
            console.error('[Prisma] Reconnect failed:', reconnectError)
          }
        }
        
        // Continue to retry the query
        continue
      }
      
      // If it's not a retryable error or we've exhausted retries, throw
      throw error
    }
  }
  
  // If we get here, all retries failed
  throw lastError
}

