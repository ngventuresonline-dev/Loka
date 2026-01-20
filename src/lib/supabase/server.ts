/**
 * Supabase Server Client
 * Server-side Supabase client for API routes and server components
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Debug logging for Supabase server configuration
console.log('🔧 [Supabase Server] Initializing...')
console.log('🔧 [Supabase Server] URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NOT SET')
console.log('🔧 [Supabase Server] Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ NOT SET')
console.log('🔧 [Supabase Server] Service Role Key:', supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 20)}...` : '❌ NOT SET')

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
  console.log('🔧 [Supabase Server] createServerClient called, useServiceRole:', useServiceRole)
  
  const key = useServiceRole && supabaseServiceRoleKey 
    ? supabaseServiceRoleKey 
    : supabaseAnonKey

  console.log('🔧 [Supabase Server] Using key type:', useServiceRole && supabaseServiceRoleKey ? 'Service Role' : 'Anon Key')

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
  console.log('🔧 [Supabase Server] getServerClient called')
  
  const cookieStore = await cookies()
  const supabase = createServerClient()

  // Get session from cookies
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('🔧 [Supabase Server] Session found:', session ? 'Yes' : 'No')
  if (session) {
    console.log('🔧 [Supabase Server] User ID:', session.user?.id)
    console.log('🔧 [Supabase Server] User Email:', session.user?.email)
  }

  return { supabase, session }
}

/**
 * Get admin Supabase client (uses service role key)
 * For admin operations that bypass RLS
 */
export function getAdminClient() {
  console.log('🔧 [Supabase Server] getAdminClient called')
  
  if (!supabaseServiceRoleKey) {
    console.error('❌ [Supabase Server] SUPABASE_SERVICE_ROLE_KEY is not set!')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  console.log('✅ [Supabase Server] Admin client created with service role key')
  return createServerClient(true)
}


