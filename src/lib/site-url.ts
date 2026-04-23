/**
 * Canonical public site origin (www.lokazen.in in production).
 * Override with NEXT_PUBLIC_APP_URL for previews and staging.
 */
export function getSiteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.lokazen.in').replace(/\/$/, '')
}
