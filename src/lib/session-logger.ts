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
    const authJson = window.localStorage.getItem('ngventures_session')
    if (authJson) {
      const session = JSON.parse(authJson)
      if (session?.userId) return String(session.userId)
    }

    // Fallback: anonymous session id
    const key = 'ng_anon_session_id'
    let anon = window.localStorage.getItem(key)
    if (!anon) {
      anon = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      window.localStorage.setItem(key, anon)
    }
    return anon
  } catch {
    return null
  }
}

export const logSessionEvent = async ({
  sessionType,
  action,
  userId,
  data,
}: SessionLogPayload) => {
  if (typeof window === 'undefined') return

  try {
    const finalUserId = userId ?? getClientSessionUserId()

    await fetch('/api/sessions/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionType,
        userId: finalUserId,
        data,
        action,
      }),
      keepalive: action === 'navigate' || action === 'submit',
    })
  } catch (error) {
    // Avoid breaking UX on logging failures
    console.warn('[session-logger] failed to log event', action, error)
  }
}


