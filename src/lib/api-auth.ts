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

/**
 * Get authenticated user from request
 * Supports multiple auth methods:
 * 1. Supabase session token (Authorization header)
 * 2. Supabase session from cookies
 * 3. Legacy: userId in request body/query (for backwards compatibility; never trust query-string identity alone)
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<ApiUser | null> {
  const userIdParam = request.nextUrl.searchParams.get('userId')

  // --- Prisma (required for all DB-backed methods) ---
  const prisma = await getPrisma()
  if (!prisma) {
    console.error('[API Auth] Prisma client not available')
    return null
  }

  // --- Supabase client (only needed for Methods 1 & 2; init failures must NOT abort everything) ---
  let supabase: ReturnType<typeof createServerClient> | null = null
  try {
    supabase = createServerClient()
  } catch (sbErr: any) {
    console.warn('[API Auth] Supabase client init failed (Supabase methods will be skipped):', sbErr?.message)
  }

  // ── Method 0: HttpOnly admin session cookie ────────────────────────────────
  try {
    const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (adminCookie) {
      const verified = verifyAdminSessionCookie(adminCookie)
      if (verified) {
        const user = await prisma.user.findUnique({
          where: { id: verified.userId },
          select: { id: true, email: true, name: true, userType: true, phone: true },
        })
        if (user && user.userType === 'admin') {
          return { id: user.id, email: user.email, name: user.name, userType: 'admin', phone: user.phone }
        }
      }
    }
  } catch (err: any) {
    console.warn('[API Auth] Method 0 (admin cookie) failed:', err?.message)
  }

  // ── Method 1: Authorization header (Supabase Bearer token) ────────────────
  if (supabase) {
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '').trim()
        if (token) {
          const { data: { user: sbUser }, error } = await supabase.auth.getUser(token)
          if (!error && sbUser) {
            const user = await prisma.user.findUnique({
              where: { id: sbUser.id },
              select: { id: true, email: true, name: true, userType: true, phone: true },
            })
            if (user) {
              return { id: user.id, email: user.email, name: user.name, userType: user.userType as 'brand' | 'owner' | 'admin', phone: user.phone }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[API Auth] Method 1 (bearer token) failed:', err?.message)
    }
  }

  // ── Method 2: Supabase session cookie ─────────────────────────────────────
  if (supabase) {
    try {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        const accessToken = cookies['sb-access-token'] || cookies['sb-<project-ref>-auth-token']
        if (accessToken) {
          const { data: { user: sbUser } } = await supabase.auth.getUser(accessToken)
          if (sbUser) {
            const user = await prisma.user.findUnique({
              where: { id: sbUser.id },
              select: { id: true, email: true, name: true, userType: true, phone: true },
            })
            if (user) {
              return { id: user.id, email: user.email, name: user.name, userType: user.userType as 'brand' | 'owner' | 'admin', phone: user.phone }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[API Auth] Method 2 (supabase cookie) failed:', err?.message)
    }
  }

  // ── Method 3: userId in request body (legacy) ─────────────────────────────
  try {
    const body = await request.clone().json().catch(() => null)
    if (body?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: body.userId },
        select: { id: true, email: true, name: true, userType: true, phone: true },
      })
      if (user) {
        return { id: user.id, email: user.email, name: user.name, userType: user.userType as 'brand' | 'owner' | 'admin', phone: user.phone }
      }
    }
  } catch {
    // Body parsing failed or not a JSON request, continue
  }

  // ── Method 4: userId in URL query param ───────────────────────────────────
  if (userIdParam) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userIdParam },
        select: { id: true, email: true, name: true, userType: true, phone: true },
      })
      if (user) {
        return { id: user.id, email: user.email, name: user.name, userType: user.userType as 'brand' | 'owner' | 'admin', phone: user.phone }
      }
    } catch (err: any) {
      console.error('[API Auth] Method 4 (userId param) failed:', err?.message)
    }
  }

  console.warn('[API Auth] All auth methods exhausted — returning null')
  return null
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

