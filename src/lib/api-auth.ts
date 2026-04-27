/**
 * Server-side authentication helper for API routes
 * Uses Supabase for authentication
 */

import { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionCookie } from '@/lib/admin-session-cookie'
import { createServerClient } from '@/lib/supabase/server'
import { getPrisma } from './get-prisma'

export interface ApiUser {
  id: string
  email: string
  name: string
  userType: 'brand' | 'owner' | 'admin'
  phone?: string | null
}

/** Supabase stores the JWT under sb-<projectRef>-auth-token (and sometimes chunked .0, .1, …). */
function collectSupabaseAuthJwtCandidates(request: NextRequest): string[] {
  const assembled = new Map<string, Map<number, string>>()

  for (const { name, value } of request.cookies.getAll()) {
    if (!value?.trim()) continue
    if (name === 'sb-access-token') {
      assembled.set('sb-access-token', new Map([[0, value]]))
      continue
    }
    const m = name.match(/^(sb-[a-zA-Z0-9]+-auth-token)(?:\.(\d+))?$/)
    if (!m) continue
    const base = m[1]
    const chunkIdx = m[2] !== undefined ? parseInt(m[2], 10) : 0
    if (!Number.isFinite(chunkIdx)) continue
    if (!assembled.has(base)) assembled.set(base, new Map())
    assembled.get(base)!.set(chunkIdx, value)
  }

  const tokens: string[] = []
  for (const [, chunks] of assembled) {
    const indices = [...chunks.keys()].sort((a, b) => a - b)
    tokens.push(indices.map((i) => chunks.get(i)!).join(''))
  }
  return tokens
}

/**
 * Get authenticated user from request
 * Supports multiple auth methods:
 * 1. Supabase session token (Authorization header)
 * 2. HttpOnly admin session cookie (DB login via /api/auth/admin/login)
 * 3. Supabase session from cookies
 * 4. Legacy: userId in request body/query (for backwards compatibility; never trust query-string identity alone)
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<ApiUser | null> {
  try {
    const userIdParam = request.nextUrl.searchParams.get('userId')

    const supabase = createServerClient()
    const prisma = await getPrisma()
    
    // Check if Prisma is available
    if (!prisma) {
      console.error('[API Auth] Prisma client not available')
      return null
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Auth] Auth attempt, userId param:', userIdParam)
    }

    // Method 1: Check Authorization header for Supabase token
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim()
      if (token) {
        // Verify token with Supabase
        const {
          data: { user: supabaseUser },
          error,
        } = await supabase.auth.getUser(token)

        if (!error && supabaseUser) {
          // Get user profile from database
          const user = await prisma.user.findUnique({
            where: { id: supabaseUser.id },
            select: {
              id: true,
              email: true,
              name: true,
              userType: true,
              phone: true,
            },
          })

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              userType: user.userType as 'brand' | 'owner' | 'admin',
              phone: user.phone,
            }
          }
        }
      }
    }

    // Method 1b: HttpOnly cookie from POST /api/auth/admin/login (Prisma admin user)
    const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (adminCookie) {
      const verified = verifyAdminSessionCookie(adminCookie)
      if (verified) {
        const user = await prisma.user.findUnique({
          where: { id: verified.userId },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            phone: true,
          },
        })
        if (user && user.userType === 'admin') {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: 'admin',
            phone: user.phone,
          }
        }
      }
    }

    // Method 2: Check cookies for Supabase session (use Request cookies API; JWT values contain "=")
    const jwtCandidates = collectSupabaseAuthJwtCandidates(request)
    for (const accessToken of jwtCandidates) {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser(accessToken)

      if (supabaseUser) {
        const user = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            phone: true,
          },
        })

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType as 'brand' | 'owner' | 'admin',
            phone: user.phone,
          }
        }
      }
    }

    // Method 3: Fallback - Check request body for userId (legacy support)
    try {
      const body = await request.clone().json().catch(() => null)
      if (body?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: body.userId },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            phone: true,
          },
        })
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType as 'brand' | 'owner' | 'admin',
            phone: user.phone,
          }
        }
      }
    } catch {
      // Body parsing failed, continue
    }

    // Method 4: Fallback - Check by userId if email lookup didn't work
    if (userIdParam) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userIdParam },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            phone: true,
          },
        })
        if (user) {
          if (process.env.NODE_ENV === 'development') {
            // User authenticated by userId
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType as 'brand' | 'owner' | 'admin',
            phone: user.phone,
          }
        }
      } catch (error: any) {
        console.error('[API Auth] Error looking up user by userId:', error?.message || error)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      // No authentication method succeeded
    }
    return null
  } catch (error: any) {
    console.error('[API Auth] Error getting authenticated user:', error?.message || error)
    console.error('[API Auth] Error stack:', error?.stack)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<ApiUser> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  return user
}

/**
 * Require specific user type
 */
export async function requireUserType(
  request: NextRequest,
  allowedTypes: ('brand' | 'owner' | 'admin')[]
): Promise<ApiUser> {
  const user = await requireAuth(request)
  if (!allowedTypes.includes(user.userType)) {
    throw new Error(
      `Forbidden: User type '${user.userType}' not allowed. Required: ${allowedTypes.join(', ')}`
    )
  }
  return user
}

/**
 * Require owner or admin (for property operations)
 */
export async function requireOwnerOrAdmin(
  request: NextRequest
): Promise<ApiUser> {
  return requireUserType(request, ['owner', 'admin'])
}

/**
 * Admin API routes: session or verified bearer token only (see getAuthenticatedUser).
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<
  { ok: true; user: ApiUser } | { ok: false }
> {
  const user = await getAuthenticatedUser(request)
  if (!user || user.userType !== 'admin') {
    return { ok: false }
  }
  return { ok: true, user }
}

/**
 * Check if user owns a property
 */
export async function checkPropertyOwnership(
  propertyId: string,
  userId: string
): Promise<boolean> {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      return false
    }
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })
    return property?.ownerId === userId
  } catch {
    return false
  }
}

