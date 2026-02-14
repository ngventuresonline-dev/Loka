'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getOrCreateSessionId, getUserIdForSession } from '@/lib/session-utils'

export type SessionUserType = 'brand' | 'owner' | 'unknown'
export type SessionAction = 
  | 'page_view'
  | 'ai_search'
  | 'filter_update'
  | 'property_view'
  | 'button_click'
  | 'form_start'
  | 'form_progress'
  | 'form_complete'
  | 'user_type_detected'

export interface SessionActionData {
  action: SessionAction
  data?: any
  metadata?: {
    page?: string
    timestamp?: string
    userAgent?: string
    referrer?: string
  }
}

export interface UseSessionTrackingOptions {
  userType?: SessionUserType
  autoTrackPageViews?: boolean
  entryPage?: string
}

/**
 * Custom hook for progressive session tracking
 * Creates session on mount and provides methods to track interactions
 */
export function useSessionTracking(options: UseSessionTrackingOptions = {}) {
  const {
    userType = 'unknown',
    autoTrackPageViews = true,
    entryPage
  } = options

  const pathname = usePathname()
  const sessionIdRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)
  const initializedRef = useRef(false)

  // Initialize session ID immediately on mount
  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    sessionIdRef.current = sessionId
    userIdRef.current = getUserIdForSession()
  }, [])

  // Initialize session on mount - ONLY if userType is known (not 'unknown')
  // This prevents auto-creating empty brand sessions on homepage visit
  useEffect(() => {
    if (initializedRef.current) return
    
    // Don't auto-create sessions for unknown user types
    if (userType === 'unknown') {
      initializedRef.current = true
      return
    }
    
    initializedRef.current = true

    const initializeSession = async () => {
      try {
        const sessionId = getOrCreateSessionId()
        const userId = getUserIdForSession()
        
        sessionIdRef.current = sessionId
        userIdRef.current = userId

        // Only create session if userType is known (brand or owner)
        if (userType === 'brand' || userType === 'owner') {
          await fetch('/api/sessions/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              userId,
              userType,
              entryPage: entryPage || (typeof window !== 'undefined' ? window.location.pathname : '/'),
              timestamp: new Date().toISOString(),
              userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
              referrer: typeof window !== 'undefined' ? document.referrer : ''
            }),
            keepalive: true // Ensure request completes even if page unloads
          }).catch(err => {
            console.warn('[Session Tracking] Failed to create session:', err)
          })
        }
      } catch (error) {
        console.error('[Session Tracking] Error initializing session:', error)
      }
    }

    initializeSession()
  }, [userType, entryPage]) // Include userType in dependencies

  // Track page views automatically
  useEffect(() => {
    if (!autoTrackPageViews || !sessionIdRef.current) return

    const trackPageView = async () => {
      try {
        await updateSession({
          action: 'page_view',
          data: {
            path: pathname,
            timestamp: new Date().toISOString()
          },
          metadata: {
            page: pathname,
            timestamp: new Date().toISOString()
          }
        })
      } catch (error) {
        console.warn('[Session Tracking] Failed to track page view:', error)
      }
    }

    // Small delay to ensure session is created first
    const timer = setTimeout(trackPageView, 100)
    return () => clearTimeout(timer)
  }, [pathname, autoTrackPageViews])

  /**
   * Update session with an action
   */
  const updateSession = useCallback(async (actionData: SessionActionData) => {
    if (!sessionIdRef.current) {
      // Try to get session ID if not set
      sessionIdRef.current = getOrCreateSessionId()
      userIdRef.current = getUserIdForSession()
    }

    if (!sessionIdRef.current || !userIdRef.current) {
      console.warn('[Session Tracking] Cannot update session - missing sessionId or userId')
      return
    }

    try {
      const response = await fetch('/api/sessions/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userId: userIdRef.current,
          ...actionData,
          timestamp: new Date().toISOString()
        }),
        keepalive: true
      })

      if (!response.ok) {
        console.warn('[Session Tracking] Failed to update session:', response.statusText)
      }
    } catch (error) {
      console.warn('[Session Tracking] Error updating session:', error)
    }
  }, [])

  /**
   * Track AI search query
   */
  const trackAISearch = useCallback(async (query: string, additionalData?: any) => {
    await updateSession({
      action: 'ai_search',
      data: {
        query,
        ...additionalData
      },
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }, [updateSession])

  /**
   * Track filter changes
   */
  const trackFilterUpdate = useCallback(async (filterData: any) => {
    await updateSession({
      action: 'filter_update',
      data: filterData,
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }, [updateSession])

  /**
   * Track property view
   */
  const trackPropertyView = useCallback(async (propertyId: string, additionalData?: any) => {
    await updateSession({
      action: 'property_view',
      data: {
        propertyId,
        ...additionalData
      },
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }, [updateSession])

  /**
   * Track button click
   */
  const trackButtonClick = useCallback(async (buttonName: string, additionalData?: any) => {
    await updateSession({
      action: 'button_click',
      data: {
        buttonName,
        ...additionalData
      },
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }, [updateSession])

  /**
   * Detect and set user type
   */
  const setUserType = useCallback(async (newUserType: 'brand' | 'owner') => {
    await updateSession({
      action: 'user_type_detected',
      data: {
        userType: newUserType
      },
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }, [updateSession])

  /**
   * Track form progress
   */
  const trackFormProgress = useCallback(async (formName: string, step: number | string, formData?: any) => {
    await updateSession({
      action: 'form_progress',
      data: {
        formName,
        step,
        formData
      },
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }, [updateSession])

  /**
   * Track form completion
   */
  const trackFormComplete = useCallback(async (formName: string, formData?: any) => {
    await updateSession({
      action: 'form_complete',
      data: {
        formName,
        formData
      },
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: new Date().toISOString()
      }
    })
  }, [updateSession])

  return {
    sessionId: sessionIdRef.current,
    userId: userIdRef.current,
    updateSession,
    trackAISearch,
    trackFilterUpdate,
    trackPropertyView,
    trackButtonClick,
    setUserType,
    trackFormProgress,
    trackFormComplete
  }
}
