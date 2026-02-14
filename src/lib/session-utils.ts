/**
 * Generate or retrieve a session ID
 * Stores in localStorage for persistence across page reloads
 * Uses 'clientSessionUserId' key for consistency
 */
export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder (shouldn't be used)
    return ''
  }

  try {
    const key = 'clientSessionUserId'
    
    console.log('[LOKAZEN_DEBUG] ANON_ID', 'Checking localStorage for anon_id')
    
    let sessionId = window.localStorage.getItem(key)
    
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      console.log('[LOKAZEN_DEBUG] ANON_ID', 'Created new anon_id:', sessionId)
      window.localStorage.setItem(key, sessionId)
      
      // Verify it was saved (only in development)
      if (process.env.NODE_ENV === 'development') {
        const verify = window.localStorage.getItem(key)
        if (verify !== sessionId) {
          console.error('[Session Utils] Failed to verify sessionId save!')
        }
      }
    } else {
      console.log('[LOKAZEN_DEBUG] ANON_ID', 'Using existing anon_id:', sessionId)
    }
    
    return sessionId
  } catch (error) {
    // Log the error instead of silently failing
    console.error('[Session Utils] Error accessing localStorage:', error)
    const fallbackId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    console.log('[LOKAZEN_DEBUG] ANON_ID', 'Created fallback anon_id:', fallbackId)
    return fallbackId
  }
}

/**
 * Get user ID from authenticated session or use session ID
 */
export const getUserIdForSession = (): string => {
  if (typeof window === 'undefined') return getOrCreateSessionId()

  try {
    // Check for authenticated session first
    const authJson = window.localStorage.getItem('ngventures_session')
    if (authJson) {
      const session = JSON.parse(authJson)
      if (session?.userId) return String(session.userId)
    }
  } catch {
    // Continue to fallback
  }

  // Use session ID as userId for anonymous sessions
  return getOrCreateSessionId()
}

/**
 * Get session ID from localStorage or cookie
 * Uses the same logic as session-logger.ts
 * @deprecated Use getOrCreateSessionId() for new code
 */
export const getSessionId = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    // Check for authenticated session first
    const authJson = window.localStorage.getItem('ngventures_session')
    if (authJson) {
      const session = JSON.parse(authJson)
      if (session?.userId) return String(session.userId)
    }

    // Use consistent session ID key
    const key = 'clientSessionUserId'
    let anon = window.localStorage.getItem(key)
    if (!anon) {
      anon = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      window.localStorage.setItem(key, anon)
    }
    return anon
  } catch {
    return null
  }
}

/**
 * Detect session type (brand or owner) by checking session tables
 */
export const detectSessionType = async (): Promise<'brand' | 'owner' | null> => {
  const sessionId = getSessionId()
  if (!sessionId) return null

  try {
    const response = await fetch(`/api/profile/session-type?userId=${encodeURIComponent(sessionId)}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return data.type || null
  } catch (error) {
    console.error('Failed to detect session type:', error)
    return null
  }
}
