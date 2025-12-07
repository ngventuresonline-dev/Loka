/**
 * Supabase Usage Examples
 * Reference implementations for common use cases
 */

import React, { useState, useEffect } from 'react'
import { signUp, signIn, getCurrentUser, uploadPropertyImage, supabase } from './index'

// ============================================================================
// AUTHENTICATION EXAMPLES
// ============================================================================

/**
 * Example: Sign up a new brand user
 */
export async function exampleSignUpBrand() {
  const result = await signUp(
    'brand@example.com',
    'securepassword123',
    'My Brand Name',
    'brand',
    '+919876543210'
  )

  if (result.success) {
    console.log('User created:', result.user)
    // Redirect to onboarding
  } else {
    console.error('Sign up failed:', result.error)
  }
}

/**
 * Example: Sign in a user
 */
export async function exampleSignIn() {
  const result = await signIn('user@example.com', 'password123')

  if (result.success) {
    console.log('Signed in:', result.user)
    // User is now authenticated
  } else {
    console.error('Sign in failed:', result.error)
  }
}

/**
 * Example: Get current user
 */
export async function exampleGetCurrentUser() {
  const user = await getCurrentUser()

  if (user) {
    console.log('Current user:', user)
    // User is authenticated
  } else {
    console.log('Not authenticated')
    // Redirect to login
  }
}

/**
 * Example: Listen to auth state changes
 */
export function exampleAuthStateListener() {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN') {
        const user = await getCurrentUser()
        console.log('User signed in:', user)
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
      }
    }
  )

  // Cleanup: subscription.unsubscribe() when component unmounts
  return subscription
}

// ============================================================================
// STORAGE EXAMPLES
// ============================================================================

/**
 * Example: Upload property image
 */
export async function exampleUploadPropertyImage(
  file: File,
  propertyId: string
) {
  const result = await uploadPropertyImage(file, propertyId)

  if (result.success && result.url) {
    console.log('Image uploaded:', result.url)
    // Save URL to property record
    return result.url
  } else {
    console.error('Upload failed:', result.error)
    return null
  }
}

/**
 * Example: Upload multiple property images
 */
export async function exampleUploadMultipleImages(
  files: File[],
  propertyId: string
) {
  // Use uploadPropertyImages for multiple files
  const { uploadPropertyImages } = await import('./storage')
  const result = await uploadPropertyImages(files, propertyId)

  if (result.success && result.urls) {
    console.log('Images uploaded:', result.urls)
    // Save URLs array to property record
    return result.urls
  } else {
    console.error('Some uploads failed:', result.errors)
    return result.urls || []
  }
}

// ============================================================================
// API ROUTE EXAMPLES
// ============================================================================

/**
 * Example: Protected API route using Supabase
 */
export async function exampleProtectedRoute(request: Request) {
  // In your API route:
  const { getServerClient } = await import('./server')
  const { supabase, session } = await getServerClient()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Use session.user.id for authenticated operations
  const userId = session.user.id

  // Your protected logic here
  return new Response('Success', { status: 200 })
}

// ============================================================================
// REACT COMPONENT EXAMPLES
// ============================================================================

/**
 * Example: React component with Supabase auth
 */
export function ExampleAuthComponent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async () => {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return React.createElement('div', null, 'Loading...')
  if (!user) return React.createElement('div', null, 'Please sign in')

  return React.createElement('div', null, `Welcome, ${user.name}!`)
}

/**
 * Example: File upload component
 */
export function ExampleFileUpload({ propertyId }: { propertyId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const result = await uploadPropertyImage(file, propertyId)
    setUploading(false)

    if (result.success) {
      console.log('Image URL:', result.url)
      // Update property with image URL
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}

