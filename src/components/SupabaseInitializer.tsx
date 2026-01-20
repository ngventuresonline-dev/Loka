'use client'

/**
 * SupabaseInitializer - Client component to initialize Supabase
 * This ensures Supabase client is initialized on the browser side
 * and logs appear in the browser console
 */

import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

export function SupabaseInitializer() {
  useEffect(() => {
    // Log Supabase status on mount
    console.log('🔧 [SupabaseInitializer] Component mounted')
    console.log('🔧 [SupabaseInitializer] isSupabaseConfigured:', isSupabaseConfigured)
    
    if (isSupabaseConfigured) {
      // Test connection by getting session
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('[Supabase] Session check error:', error.message)
        } else {
          console.log('[Supabase] Session check result:', {
            hasSession: !!data.session,
            userId: data.session?.user?.id,
            expiresAt: data.session?.expires_at
          })
        }
      })
    }
  }, [])

  // This component doesn't render anything
  return null
}

export default SupabaseInitializer
