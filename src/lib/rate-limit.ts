/**
 * Rate Limiting Utility
 * Provides server-side rate limiting for API routes
 */

import { NextRequest } from 'next/server'

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean }>()

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now && !value.blocked) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000) // Clean every 5 minutes
}

export interface RateLimitConfig {
  limit: number
  windowMs: number
  blockDurationMs?: number // Optional: block IP after exceeding limit
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try multiple methods to get IP
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
    request.headers.get('x-real-ip') || 
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  
  // Also consider user agent for additional fingerprinting
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Combine IP and user agent for more accurate rate limiting
  return `${ip}:${userAgent.slice(0, 50)}`
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const clientId = getClientId(request)
  const now = Date.now()
  const record = rateLimitStore.get(clientId)

  // Check if IP is blocked
  if (record?.blocked) {
    const blockExpiry = record.resetTime + (config.blockDurationMs || 0)
    if (now < blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockExpiry,
        retryAfter: Math.ceil((blockExpiry - now) / 1000)
      }
    } else {
      // Block expired, reset
      rateLimitStore.delete(clientId)
    }
  }

  // Create new record or update existing
  if (!record || record.resetTime < now) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    })
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: now + config.windowMs
    }
  }

  // Check if limit exceeded
  if (record.count >= config.limit) {
    // Optionally block the IP
    if (config.blockDurationMs) {
      record.blocked = true
      record.resetTime = now + config.blockDurationMs
    }
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    }
  }

  // Increment count
  record.count++
  
  return {
    allowed: true,
    remaining: config.limit - record.count,
    resetTime: record.resetTime
  }
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Public API routes
  public: { limit: 100, windowMs: 60 * 1000 }, // 100/min
  
  // Authenticated API routes
  authenticated: { limit: 200, windowMs: 60 * 1000 }, // 200/min
  
  // Admin routes - stricter
  admin: { 
    limit: 50, 
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes if exceeded
  },
  
  // Auth routes - very strict
  auth: { 
    limit: 5, 
    windowMs: 60 * 1000,
    blockDurationMs: 15 * 60 * 1000 // Block for 15 minutes if exceeded
  },
  
  // Search/AI routes - moderate
  search: { limit: 30, windowMs: 60 * 1000 }, // 30/min
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult) {
  if (result.allowed) {
    return null // No response needed, request is allowed
  }

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': (result.retryAfter || 60).toString(),
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      }
    }
  )
}

