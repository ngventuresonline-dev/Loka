/**
 * Supabase Authentication Utilities
 * Client-side authentication helpers
 */

import { supabase } from './client'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name?: string
  phone?: string
  userType: 'brand' | 'owner' | 'admin'
  avatar?: string
}

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  userType: 'brand' | 'owner' | 'admin',
  phone?: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  console.log('[Supabase Auth] signUp called', { email, name, userType, hasPhone: !!phone })
  
  try {
    // Sign up with Supabase Auth
    console.log('[Supabase Auth] Executing supabase.auth.signUp', { email })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          user_type: userType,
          phone: phone || null,
        },
      },
    })

    if (error) {
      console.error('[Supabase Auth] signUp auth error', { error: error.message, code: error.status })
      return { success: false, error: error.message }
    }

    if (!data.user) {
      console.error('[Supabase Auth] signUp failed - no user returned')
      return { success: false, error: 'Failed to create user' }
    }

    console.log('[Supabase Auth] Auth user created', { userId: data.user.id, email: data.user.email })

    // Create user profile in database
    console.log('[Supabase Auth] Creating user profile in database', { userId: data.user.id })
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email!,
      name,
      user_type: userType,
      phone: phone || null,
    })

    if (profileError) {
      console.error('[Supabase Auth] Error creating user profile', { error: profileError.message, code: profileError.code })
      // User is created in auth but profile failed - this is okay, can be fixed later
    } else {
      console.log('[Supabase Auth] User profile created successfully', { userId: data.user.id })
    }

    console.log('[Supabase Auth] signUp successful', { userId: data.user.id, userType })
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
        name,
        phone,
        userType,
      },
    }
  } catch (error: any) {
    console.error('[Supabase Auth] signUp exception', { error: error.message, stack: error.stack })
    return { success: false, error: error.message || 'Failed to sign up' }
  }
}

/**
 * Sign in a user
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  console.log('[Supabase Auth] signIn called', { email })
  
  try {
    console.log('[Supabase Auth] Executing signInWithPassword')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[Supabase Auth] signIn auth error', { error: error.message, code: error.status })
      return { success: false, error: error.message }
    }

    if (!data.user || !data.session) {
      console.error('[Supabase Auth] signIn failed - no user/session returned')
      return { success: false, error: 'Failed to sign in' }
    }

    console.log('[Supabase Auth] Auth successful', { 
      userId: data.user.id, 
      email: data.user.email,
      sessionExpires: data.session.expires_at 
    })

    // Get user profile from database
    console.log('[Supabase Auth] Fetching user profile from database', { userId: data.user.id })
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.warn('[Supabase Auth] Error fetching user profile, using auth metadata', { 
        error: profileError.message, 
        code: profileError.code 
      })
      // Fallback to auth user data
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          phone: data.user.user_metadata?.phone,
          userType: data.user.user_metadata?.user_type || 'brand',
        },
      }
    }

    console.log('[Supabase Auth] signIn successful', { 
      userId: profile.id, 
      email: profile.email, 
      userType: profile.user_type 
    })
    return {
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        userType: profile.user_type,
      },
    }
  } catch (error: any) {
    console.error('[Supabase Auth] signIn exception', { error: error.message, stack: error.stack })
    return { success: false, error: error.message || 'Failed to sign in' }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  console.log('[Supabase Auth] signOut called')
  
  try {
    console.log('[Supabase Auth] Executing supabase.auth.signOut')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('[Supabase Auth] signOut error', { error: error.message })
      return { success: false, error: error.message }
    }
    console.log('[Supabase Auth] signOut successful')
    return { success: true }
  } catch (error: any) {
    console.error('[Supabase Auth] signOut exception', { error: error.message })
    return { success: false, error: error.message || 'Failed to sign out' }
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  console.log('[Supabase Auth] getCurrentUser called')
  
  try {
    console.log('[Supabase Auth] Fetching user from auth')
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Supabase Auth] No authenticated user found')
      return null
    }

    console.log('[Supabase Auth] Auth user found', { userId: user.id, email: user.email })

    // Get user profile from database
    console.log('[Supabase Auth] Fetching user profile from database', { userId: user.id })
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      console.warn('[Supabase Auth] Profile not found, using auth metadata', { 
        userId: user.id, 
        error: error?.message 
      })
      // Fallback to auth user data
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name,
        phone: user.user_metadata?.phone,
        userType: user.user_metadata?.user_type || 'brand',
      }
    }

    console.log('[Supabase Auth] getCurrentUser successful', { 
      userId: profile.id, 
      email: profile.email, 
      userType: profile.user_type 
    })
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      userType: profile.user_type,
    }
  } catch (error: any) {
    console.error('[Supabase Auth] getCurrentUser exception', { error: error.message })
    return null
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  console.log('[Supabase Auth] getSession called')
  
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    console.log('[Supabase Auth] getSession result', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      expiresAt: session?.expires_at 
    })
    return session
  } catch (error: any) {
    console.error('[Supabase Auth] getSession exception', { error: error.message })
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  console.log('[Supabase Auth] isAuthenticated called')
  const user = await getCurrentUser()
  const authenticated = user !== null
  console.log('[Supabase Auth] isAuthenticated result', { authenticated, userId: user?.id })
  return authenticated
}

/**
 * Update user profile
 */
export async function updateProfile(
  updates: Partial<AuthUser>
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  console.log('[Supabase Auth] updateProfile called', { updates })
  
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.warn('[Supabase Auth] updateProfile failed - not authenticated')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('[Supabase Auth] Updating auth user metadata', { userId: currentUser.id })
    // Update user metadata in auth
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: updates.name,
        phone: updates.phone,
        user_type: updates.userType,
      },
    })

    if (authError) {
      console.error('[Supabase Auth] updateProfile auth error', { error: authError.message })
      return { success: false, error: authError.message }
    }

    console.log('[Supabase Auth] Auth metadata updated, updating database profile', { userId: currentUser.id })
    // Update user profile in database
    const { data, error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        phone: updates.phone,
        user_type: updates.userType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id)
      .select()
      .single()

    if (error) {
      console.error('[Supabase Auth] updateProfile database error', { error: error.message, code: error.code })
      return { success: false, error: error.message }
    }

    console.log('[Supabase Auth] updateProfile successful', { 
      userId: data.id, 
      updatedFields: Object.keys(updates) 
    })
    return {
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        userType: data.user_type,
      },
    }
  } catch (error: any) {
    console.error('[Supabase Auth] updateProfile exception', { error: error.message })
    return { success: false, error: error.message || 'Failed to update profile' }
  }
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[Supabase Auth] resetPassword called', { email })
  
  try {
    const redirectTo = `${window.location.origin}/auth/reset-password`
    console.log('[Supabase Auth] Sending password reset email', { email, redirectTo })
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      console.error('[Supabase Auth] resetPassword error', { error: error.message })
      return { success: false, error: error.message }
    }

    console.log('[Supabase Auth] resetPassword email sent successfully', { email })
    return { success: true }
  } catch (error: any) {
    console.error('[Supabase Auth] resetPassword exception', { error: error.message })
    return { success: false, error: error.message || 'Failed to send reset email' }
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
) {
  console.log('[Supabase Auth] onAuthStateChange listener registered')
  
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Supabase Auth] Auth state changed', { 
      event, 
      hasSession: !!session, 
      userId: session?.user?.id 
    })
    
    if (session?.user) {
      const user = await getCurrentUser()
      console.log('[Supabase Auth] Auth state callback - user found', { userId: user?.id })
      callback(user)
    } else {
      console.log('[Supabase Auth] Auth state callback - no user')
      callback(null)
    }
  })
}


