/**
 * Load Scaling and Performance Utilities
 * Handles caching, connection pooling, and performance optimizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCacheHeaders, CACHE_CONFIGS } from './api-cache'

/**
 * Response caching for high-traffic endpoints
 */
export interface CacheConfig {
  maxAge: number // seconds
  staleWhileRevalidate?: number // seconds
  public?: boolean
  mustRevalidate?: boolean
}

/**
 * Apply caching headers to response
 */
export function applyCacheHeaders(
  response: NextResponse,
  config: CacheConfig
): NextResponse {
  const headers = response.headers

  if (config.public !== false) {
    headers.set('Cache-Control', `public, max-age=${config.maxAge}${config.staleWhileRevalidate ? `, stale-while-revalidate=${config.staleWhileRevalidate}` : ''}${config.mustRevalidate ? ', must-revalidate' : ''}`)
  } else {
    headers.set('Cache-Control', `private, max-age=${config.maxAge}${config.mustRevalidate ? ', must-revalidate' : ''}`)
  }

  // Add ETag support for better caching
  headers.set('Vary', 'Accept, Accept-Encoding')

  return response
}

/**
 * Predefined cache configurations for different endpoint types
 */
export const CACHE_CONFIGS_SCALING = {
  // Public read-only data - aggressive caching
  publicData: {
    maxAge: 600, // 10 minutes
    staleWhileRevalidate: 3600, // 1 hour
    public: true
  },
  
  // User-specific data - shorter cache
  userData: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
    public: false
  },
  
  // Admin data - no cache
  adminData: {
    maxAge: 0,
    public: false,
    mustRevalidate: true
  },
  
  // Search results - moderate cache
  searchResults: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    public: true
  },
  
  // Static content - very long cache
  staticContent: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400, // 1 day
    public: true
  }
}

/**
 * Database connection pool configuration
 * Note: Prisma handles connection pooling automatically
 * This is for reference and future optimizations
 */
export const DB_POOL_CONFIG = {
  maxConnections: 20,
  minConnections: 5,
  connectionTimeout: 10000, // 10 seconds
  idleTimeout: 30000, // 30 seconds
}

/**
 * Request timeout configuration
 */
export const REQUEST_TIMEOUTS = {
  fast: 5000, // 5 seconds - for simple queries
  normal: 15000, // 15 seconds - for standard operations
  slow: 30000, // 30 seconds - for complex operations
  admin: 60000, // 60 seconds - for admin operations
}

/**
 * Add timeout to async operation
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  return Promise.race([promise, timeout])
}

/**
 * Batch processing for large datasets
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Debounce function for rate limiting
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Health check for system resources
 */
export async function checkSystemHealth(): Promise<{
  healthy: boolean
  database: boolean
  memory: NodeJS.MemoryUsage
  uptime: number
}> {
  const memory = process.memoryUsage()
  const healthy = memory.heapUsed < memory.heapTotal * 0.9 // Less than 90% heap used

  // Check database connection
  let database = false
  try {
    const { getPrisma } = await import('./get-prisma')
    const prisma = await getPrisma()
    if (prisma) {
      // Try a simple query
      await prisma.$queryRaw`SELECT 1`
      database = true
    }
  } catch (error) {
    console.error('[Health Check] Database check failed:', error)
  }

  return {
    healthy: healthy && database,
    database,
    memory,
    uptime: process.uptime()
  }
}

