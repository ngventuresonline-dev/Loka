/**
 * Supabase Module - Main Exports
 * Central export point for all Supabase utilities
 */

// Client-side exports
export { supabase } from './client'
export type { Database } from './client'

// Server-side exports
export { createServerClient, getServerClient, getAdminClient } from './server'

// Auth exports
export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  isAuthenticated,
  updateProfile,
  resetPassword,
  onAuthStateChange,
} from './auth'
export type { AuthUser } from './auth'

// Storage exports
export {
  uploadPropertyImage,
  uploadPropertyImages,
  deletePropertyImage,
  uploadUserAvatar,
  getStorageBucket,
  createStorageBuckets,
} from './storage'


