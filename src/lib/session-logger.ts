export type SessionType = 'brand' | 'owner' | 'view' | 'inquiry'

export interface SessionLogPayload {
  sessionType: SessionType
  action: string
  userId?: string | null
  data?: any
}

export const getClientSessionUserId = (): string | null => {
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
    let sessionId = window.localStorage.getItem(key)
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      window.localStorage.setItem(key, sessionId)
    }
    return sessionId
  } catch (error) {
    console.error('[Session Logger] Error accessing localStorage:', error)
    return null
  }
}

export function logSessionEvent({
  sessionType,
  action,
  userId,
  data,
}: SessionLogPayload): void {
  if (typeof window === 'undefined') return

  // Fire and forget - don't block the UI
  const finalUserId = userId ?? getClientSessionUserId()

  fetch('/api/sessions/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionType,
      userId: finalUserId,
      data,
      action,
    }),
    keepalive: action === 'navigate' || action === 'submit',
  }).catch((error) => {
    // Avoid breaking UX on logging failures
    console.warn('[session-logger] failed to log event', action, error)
  })
}


