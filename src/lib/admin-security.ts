/**
 * Enhanced Admin Security
 * Provides additional security layers for admin routes
 */

import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from './api-auth'
import { checkRateLimit, RATE_LIMITS, createRateLimitResponse } from './rate-limit'

export interface AdminSecurityResult {
  authorized: boolean
  user?: any
  error?: string
  statusCode?: number
}

/**
 * Enhanced admin authentication with multiple security checks
 */
export async function requireAdminAuth(
  request: NextRequest,
  options: {
    requireMfa?: boolean
    ipWhitelist?: string[]
    checkRateLimit?: boolean
  } = {}
): Promise<AdminSecurityResult> {
  // 1. Rate limiting check
  if (options.checkRateLimit !== false) {
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.admin)
    if (!rateLimitResult.allowed) {
      const response = createRateLimitResponse(rateLimitResult)
      return {
        authorized: false,
        error: 'Rate limit exceeded',
        statusCode: 429
      }
    }
  }

  // 2. IP whitelist check (if configured)
  if (options.ipWhitelist && options.ipWhitelist.length > 0) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || 
               ''
    
    if (!options.ipWhitelist.includes(ip)) {
      return {
        authorized: false,
        error: 'Access denied from this IP address',
        statusCode: 403
      }
    }
  }

  // 3. Get authenticated user
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return {
      authorized: false,
      error: 'Authentication required',
      statusCode: 401
    }
  }

  // 4. Verify admin role
  if (user.userType !== 'admin') {
    return {
      authorized: false,
      error: 'Admin access required',
      statusCode: 403
    }
  }

  // 5. Check for suspicious patterns in request
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'user-agent'
  ]

  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header)
    if (value && value.length > 500) {
      // Suspiciously long header
      return {
        authorized: false,
        error: 'Invalid request',
        statusCode: 400
      }
    }
  }

  // 6. Verify request origin (if in production)
  if (process.env.NODE_ENV === 'production') {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://lokazen.in',
      'https://www.lokazen.in'
    ].filter((url): url is string => Boolean(url))

    if (origin && allowedOrigins.length > 0 && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      // Log suspicious origin but don't block (could be legitimate API calls)
      console.warn('[Admin Security] Suspicious origin:', origin)
    }
  }

  return {
    authorized: true,
    user
  }
}

/**
 * Validate admin session token
 */
export async function validateAdminSession(request: NextRequest): Promise<boolean> {
  try {
    // Check for session token in multiple places
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('sb-access-token') || 
                       request.cookies.get('sb-auth-token')
    
    // Must have at least one valid token
    if (!authHeader && !cookieToken) {
      return false
    }

    // Additional validation can be added here
    // e.g., check token expiry, signature, etc.
    
    return true
  } catch (error) {
    console.error('[Admin Security] Session validation error:', error)
    return false
  }
}

/**
 * Audit log for admin actions
 */
export async function logAdminAction(
  request: NextRequest,
  action: string,
  details?: Record<string, any>
) {
  const user = await getAuthenticatedUser(request)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 
             'unknown'
  
  // In production, log to a proper audit system
  console.log('[Admin Audit]', {
    timestamp: new Date().toISOString(),
    user: user?.email || 'unknown',
    userId: user?.id || 'unknown',
    action,
    ip,
    path: request.nextUrl.pathname,
    method: request.method,
    ...details
  })

  // TODO: Store in database or external logging service
}

