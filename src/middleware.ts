import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 
             'unknown'
  return ip
}

function checkRateLimit(request: NextRequest, limit: number, windowMs: number): boolean {
  const key = getRateLimitKey(request)
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || record.resetTime < now) {
    // Create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Rate limit configurations
const RATE_LIMITS = {
  // General API routes
  api: { limit: 100, window: 60 * 1000 }, // 100 requests per minute
  // Admin routes - stricter
  admin: { limit: 30, window: 60 * 1000 }, // 30 requests per minute
  // Auth routes - very strict
  auth: { limit: 10, window: 60 * 1000 }, // 10 requests per minute
  // Public routes
  public: { limit: 200, window: 60 * 1000 }, // 200 requests per minute
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV !== 'production'

  // Security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP header
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://maps.googleapis.com https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms https://scripts.clarity.ms; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob: https://www.facebook.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.vercel.app https://vercel.live https://va.vercel-scripts.com https://maps.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.facebook.com https://www.clarity.ms https://scripts.clarity.ms https://f.clarity.ms https://v.clarity.ms https://*.clarity.ms https://mpc-prod-18-s6uit34pua-uc.a.run.app https://demo-1.conversionsapigateway.com; frame-src 'self' https://*.google.com https://www.googletagmanager.com;"
  )

  // Rate limiting based on route (disabled in development for easier local testing)
  if (!isDev) {
    let rateLimitConfig = RATE_LIMITS.public

    if (pathname.startsWith('/api/admin')) {
      rateLimitConfig = RATE_LIMITS.admin
    } else if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth/')) {
      rateLimitConfig = RATE_LIMITS.auth
    } else if (pathname.startsWith('/api/')) {
      rateLimitConfig = RATE_LIMITS.api
    }

    // Check rate limit
    if (!checkRateLimit(request, rateLimitConfig.limit, rateLimitConfig.window)) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': rateLimitConfig.limit.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }
  }

  // Additional security for admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Check for admin authentication token in headers
    const authHeader = request.headers.get('authorization')
    const cookieAuth = request.cookies.get('sb-access-token') || request.cookies.get('sb-auth-token')
    
    // Allow if has auth token (actual auth check happens in route handlers)
    // This middleware just adds rate limiting and security headers
  }

  // Block common attack patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Code execution
  ]

  const url = request.url.toLowerCase()
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

