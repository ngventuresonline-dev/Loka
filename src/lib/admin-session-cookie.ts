import { createHmac, timingSafeEqual } from 'crypto'

/** HttpOnly cookie set by POST /api/auth/admin/login — verified in getAuthenticatedUser */
export const ADMIN_SESSION_COOKIE = 'lz_admin_session'

const MAX_AGE_SEC = 60 * 60 * 24 // 24h

function getSecret(): string | null {
  const s =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (s && s.length >= 16) return s
  if (process.env.NODE_ENV !== 'production') {
    return '__dev-admin-session-secret-min16__'
  }
  return null
}

export function isAdminSessionSigningAvailable(): boolean {
  return getSecret() !== null
}

export function signAdminSessionCookie(userId: string): string | null {
  const secret = getSecret()
  if (!secret) return null
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp }), 'utf8').toString('base64url')
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyAdminSessionCookie(token: string): { userId: string } | null {
  const secret = getSecret()
  if (!secret) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url')
  const a = Buffer.from(sig, 'utf8')
  const b = Buffer.from(expectedSig, 'utf8')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string
      exp?: number
    }
    if (typeof json.uid !== 'string' || typeof json.exp !== 'number') return null
    if (Math.floor(Date.now() / 1000) > json.exp) return null
    return { userId: json.uid }
  } catch {
    return null
  }
}
