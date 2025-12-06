/**
 * Supabase Server Client
 * Server-side Supabase client for API routes and server components
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Warn if Supabase is not configured (only in development)
if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '⚠️  Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

/**
 * Get Supabase client for server-side usage
 * Uses service role key for admin operations, or user's session for user operations
 */
export function createServerClient(useServiceRole = false) {
  const key = useServiceRole && supabaseServiceRoleKey 
    ? supabaseServiceRoleKey 
    : supabaseAnonKey

  return createClient(supabaseUrl!, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get authenticated Supabase client from cookies
 * For use in Server Components and API routes
 */
export async function getServerClient() {
  const cookieStore = await cookies()
  const supabase = createServerClient()

  // Get session from cookies
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { supabase, session }
}

/**
 * Get admin Supabase client (uses service role key)
 * For admin operations that bypass RLS
 */
export function getAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createServerClient(true)
}


