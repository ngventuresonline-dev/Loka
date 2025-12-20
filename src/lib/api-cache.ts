/**
 * API Response Caching Utility
 * Helps reduce Supabase egress by caching frequent queries
 */

export interface CacheConfig {
  maxAge: number // Cache duration in seconds
  staleWhileRevalidate?: number // Optional stale-while-revalidate time
}

/**
 * Get cache headers for Next.js API routes
 */
export function getCacheHeaders(config: CacheConfig): HeadersInit {
  const headers: HeadersInit = {
    'Cache-Control': `public, s-maxage=${config.maxAge}, stale-while-revalidate=${config.staleWhileRevalidate || config.maxAge}`,
  }
  return headers
}

/**
 * Cache configurations for different endpoints
 */
export const CACHE_CONFIGS = {
  // Property listings - cache for 5 minutes
  PROPERTY_LISTINGS: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
  },
  // Brand matches - cache for 10 minutes
  BRAND_MATCHES: {
    maxAge: 600, // 10 minutes
    staleWhileRevalidate: 1200, // 20 minutes
  },
  // Property matches - cache for 10 minutes
  PROPERTY_MATCHES: {
    maxAge: 600, // 10 minutes
    staleWhileRevalidate: 1200, // 20 minutes
  },
  // Analytics - cache for 1 minute (more dynamic)
  ANALYTICS: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 120, // 2 minutes
  },
  // Stats - cache for 1 minute
  STATS: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 120, // 2 minutes
  },
} as const

/**
 * Log query size for monitoring egress
 */
export function logQuerySize(endpoint: string, dataSize: number, recordCount: number) {
  const sizeKB = (dataSize / 1024).toFixed(2)
  const sizeMB = (dataSize / (1024 * 1024)).toFixed(4)
  
  console.log(`[Egress Monitor] ${endpoint}: ${recordCount} records, ${sizeKB} KB (${sizeMB} MB)`)
  
  // Warn if response is large
  if (dataSize > 1024 * 1024) { // > 1MB
    console.warn(`[Egress Warning] Large response detected: ${endpoint} - ${sizeMB} MB`)
  }
}

/**
 * Estimate JSON response size
 */
export function estimateJsonSize(data: any): number {
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}

