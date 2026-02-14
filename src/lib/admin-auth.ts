/**
 * Admin Authentication Helper
 * Server-side protection for admin routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from './api-auth'
import { logAdminAction } from './admin-security'

/**
 * Require admin authentication
 * Throws error if user is not authenticated or not an admin
 * Use in API route handlers
 */
export async function requireAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  if (user.userType !== 'admin') {
    // Log unauthorized access attempt
    await logAdminAction(request, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
      attemptedPath: request.nextUrl.pathname,
      userType: user.userType,
      userId: user.id,
    })
    
    throw new Error('Forbidden: Admin access required')
  }
  
  return user
}

/**
 * Require admin and log action
 * Convenience function that combines requireAdmin with audit logging
 */
export async function requireAdminWithLogging(
  request: NextRequest,
  action: string,
  details?: Record<string, any>
) {
  const user = await requireAdmin(request)
  
  // Log the admin action
  await logAdminAction(request, action, {
    ...details,
    userId: user.id,
    userEmail: user.email,
  })
  
  return user
}

/**
 * Check if user is admin (non-throwing)
 * Returns null if not admin, user object if admin
 */
export async function checkAdmin(request: NextRequest) {
  try {
    return await requireAdmin(request)
  } catch {
    return null
  }
}
