/**
 * Supabase Client Configuration
 * Client-side Supabase client for browser usage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')

// Debug logging for Supabase configuration
console.log('🔧 [Supabase Client] Initializing...')
console.log('🔧 [Supabase Client] URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NOT SET')
console.log('🔧 [Supabase Client] Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ NOT SET')
console.log('🔧 [Supabase Client] Configured:', isSupabaseConfigured ? '✅ YES' : '❌ NO')

// Create client only if properly configured, otherwise create a mock client
let supabase: SupabaseClient

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  console.log('✅ [Supabase Client] Client created successfully')
} else {
  // Create a placeholder client that won't crash but will log warnings
  console.warn('⚠️  [Supabase Client] Not configured - using placeholder client')
  console.warn('⚠️  Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  
  // Use a dummy URL that passes validation but won't actually work
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export { supabase, isSupabaseConfigured }

/**
 * Create Supabase client for client components
 * Returns the configured Supabase client instance
 */
export function createClientComponentClient() {
  return supabase
}

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          user_type: 'brand' | 'owner' | 'admin'
          phone?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          user_type: 'brand' | 'owner' | 'admin'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          user_type?: 'brand' | 'owner' | 'admin'
          phone?: string | null
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          title: string
          description: string
          address: string
          city: string
          state: string
          country: string
          zip_code: string
          latitude?: number | null
          longitude?: number | null
          size: number
          property_type: string
          condition: string
          price: number
          price_type: string
          security_deposit?: number | null
          negotiable: boolean
          amenities: string[]
          images: string[]
          availability: boolean
          available_from?: string | null
          is_verified: boolean
          is_featured: boolean
          parking: boolean
          public_transport: boolean
          accessibility: boolean
          owner_id: string
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          address: string
          city: string
          state: string
          country?: string
          zip_code: string
          latitude?: number | null
          longitude?: number | null
          size: number
          property_type: string
          condition: string
          price: number
          price_type: string
          security_deposit?: number | null
          negotiable?: boolean
          amenities?: string[]
          images?: string[]
          availability?: boolean
          available_from?: string | null
          is_verified?: boolean
          is_featured?: boolean
          parking?: boolean
          public_transport?: boolean
          accessibility?: boolean
          owner_id: string
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          address?: string
          city?: string
          state?: string
          country?: string
          zip_code?: string
          latitude?: number | null
          longitude?: number | null
          size?: number
          property_type?: string
          condition?: string
          price?: number
          price_type?: string
          security_deposit?: number | null
          negotiable?: boolean
          amenities?: string[]
          images?: string[]
          availability?: boolean
          available_from?: string | null
          is_verified?: boolean
          is_featured?: boolean
          parking?: boolean
          public_transport?: boolean
          accessibility?: boolean
          owner_id?: string
          views?: number
          updated_at?: string
        }
      }
    }
  }
}


