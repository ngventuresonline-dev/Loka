/**
 * Server-side authentication helper for API routes
 * Uses Supabase for authentication
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from './prisma'

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
 * 3. Fallback: userId in request body/query (legacy support)
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<ApiUser | null> {
  try {
    const supabase = createServerClient()

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

    // Method 2: Check cookies for Supabase session
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      // Extract access token from cookies
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      const accessToken = cookies['sb-access-token'] || cookies['sb-<project-ref>-auth-token']
      
      if (accessToken) {
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

    // Method 4: Fallback - Check query params (legacy support)
    const userId = request.nextUrl.searchParams.get('userId')
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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

    return null
  } catch (error) {
    console.error('[API Auth] Error getting authenticated user:', error)
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
 * Check if user owns a property
 */
export async function checkPropertyOwnership(
  propertyId: string,
  userId: string
): Promise<boolean> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })
    return property?.ownerId === userId
  } catch {
    return false
  }
}

