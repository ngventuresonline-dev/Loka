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
  try {
    // Sign up with Supabase Auth
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
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' }
    }

    // Create user profile in database
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email!,
      name,
      user_type: userType,
      phone: phone || null,
    })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // User is created in auth but profile failed - this is okay, can be fixed later
    }

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
    console.error('Sign up error:', error)
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
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user || !data.session) {
      return { success: false, error: 'Failed to sign in' }
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
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
    console.error('Sign in error:', error)
    return { success: false, error: error.message || 'Failed to sign in' }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign out' }
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      // Fallback to auth user data
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name,
        phone: user.user_metadata?.phone,
        userType: user.user_metadata?.user_type || 'brand',
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      userType: profile.user_type,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Update user profile
 */
export async function updateProfile(
  updates: Partial<AuthUser>
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update user metadata in auth
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: updates.name,
        phone: updates.phone,
        user_type: updates.userType,
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

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
      return { success: false, error: error.message }
    }

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
    return { success: false, error: error.message || 'Failed to update profile' }
  }
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send reset email' }
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser()
      callback(user)
    } else {
      callback(null)
    }
  })
}


