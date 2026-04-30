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

/**
 * Best-effort client IP for edge middleware (Vercel, Cloudflare, proxies).
 * When this collapses to "unknown", many users can share one bucket — keep auth limits high enough for that case.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const vercelFwd = request.headers.get('x-vercel-forwarded-for')
  if (vercelFwd) {
    const first = vercelFwd.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const cf = request.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf
  const trueClient = request.headers.get('true-client-ip')?.trim()
  if (trueClient) return trueClient
  return 'unknown'
}

function checkRateLimit(request: NextRequest, limit: number, windowMs: number, keySuffix?: string): boolean {
  const ip = getClientIp(request)
  const key = keySuffix ? `${ip}::${keySuffix}` : ip
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

// Rate limit configurations (per composite key: IP, or IP::route for auth)
const RATE_LIMITS = {
  // General API routes
  api: { limit: 100, window: 60 * 1000 }, // 100 requests per minute per IP
  // Admin routes - stricter
  admin: { limit: 30, window: 60 * 1000 }, // 30 requests per minute per IP
  // Brand phone/email lookup — must tolerate NAT offices and CDN IP quirks
  brandAuth: { limit: 120, window: 60 * 1000 }, // 120/min per IP per route (generous for shared egress)
  // Other /api/auth/* (e.g. OAuth) — still protected but usable behind shared IPs
  auth: { limit: 60, window: 60 * 1000 }, // 60/min per IP per auth route
  // Public routes
  public: { limit: 200, window: 60 * 1000 }, // 200 requests per minute
}

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    const isDev = process.env.NODE_ENV !== 'production'

    const response = NextResponse.next()

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // script-src: https://*.run.app allows GTM server-side containers hosted on Google Cloud Run
    const cspScriptSrc =
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'" +
      " https://vercel.live https://va.vercel-scripts.com" +
      " https://maps.googleapis.com https://www.googletagmanager.com" +
      " https://*.run.app" +                          // GTM server-side / Cloud Run
      " https://connect.facebook.net" +               // Facebook Pixel
      " https://www.clarity.ms https://scripts.clarity.ms" + // Clarity
      " https://td.doubleclick.net https://googleads.g.doubleclick.net;"; // Google Ads

    // connect-src: https://*.run.app + wss://*.run.app allows fetch()/XHR to GTM server-side event endpoints
    // This is required for Meta Pixel CAPI events routed through mpc2-prod-*.run.app
    const cspConnectSrc =
      "connect-src 'self'" +
      " https://*.supabase.co wss://*.supabase.co" +
      " https://*.vercel.app https://vercel.live https://va.vercel-scripts.com" +
      " https://vitals.vercel-insights.com" +
      " https://maps.googleapis.com https://www.googletagmanager.com" +
      " https://www.google.com https://*.google.com" +
      " https://www.google-analytics.com https://*.google-analytics.com" +
      " https://*.analytics.google.com" +
      " https://*.run.app wss://*.run.app" +           // GTM server-side / Cloud Run events (Meta CAPI + GA4)
      " https://*.doubleclick.net https://googleads.g.doubleclick.net https://stats.g.doubleclick.net" +
      " https://td.doubleclick.net" +                  // Google Ads conversion ping
      " https://connect.facebook.net https://www.facebook.com https://graph.facebook.com" +
      " https://an.facebook.com https://*.facebook.com https://*.facebook.net" +
      " https://*.fbcdn.net https://*.fbsbx.com" +
      " https://www.clarity.ms https://scripts.clarity.ms https://f.clarity.ms" +
      " https://v.clarity.ms https://*.clarity.ms" +
      " https://demo-1.conversionsapigateway.com https://*.conversionsapigateway.com;";

    response.headers.set(
      'Content-Security-Policy',
      `default-src 'self'; ${cspScriptSrc} style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; ${cspConnectSrc} frame-src 'self' https://*.google.com https://www.googletagmanager.com https://www.facebook.com https://*.facebook.com;`
    )

    if (!isDev) {
      let rateLimitConfig = RATE_LIMITS.public
      let rateLimitKeySuffix: string | undefined

      if (pathname.startsWith('/api/admin')) {
        rateLimitConfig = RATE_LIMITS.admin
      } else if (pathname.startsWith('/api/auth/brand') || pathname === '/api/auth/brand') {
        rateLimitConfig = RATE_LIMITS.brandAuth
        rateLimitKeySuffix = 'api/auth/brand'
      } else if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth/')) {
        rateLimitConfig = RATE_LIMITS.auth
        // Separate buckets per auth path so brand login is not coupled to OAuth traffic
        rateLimitKeySuffix = pathname.split('?')[0].slice(0, 120)
      } else if (pathname.startsWith('/api/')) {
        rateLimitConfig = RATE_LIMITS.api
      }

      if (!checkRateLimit(request, rateLimitConfig.limit, rateLimitConfig.window, rateLimitKeySuffix)) {
        const retrySec = Math.max(1, Math.ceil(rateLimitConfig.window / 1000))
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Too many attempts from this network. Please wait a minute and try again.',
            retryAfter: retrySec,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retrySec),
              'X-RateLimit-Limit': rateLimitConfig.limit.toString(),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
    }

    const suspiciousPatterns = [/\.\./, /<script/i, /union.*select/i, /exec\(/i]
    const url = (request.url || '').toLowerCase()
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return response
  } catch (err) {
    console.error('[Middleware] Error:', err)
    return NextResponse.next()
  }
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

