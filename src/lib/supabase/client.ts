/**
 * Supabase Client Configuration
 * Client-side Supabase client for browser usage
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client with fallback empty strings to prevent build errors
// Will show helpful errors at runtime if not configured
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Warn if Supabase is not configured (only in development)
if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '⚠️  Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
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


