/**
 * Mappls (MapMyIndia) Configuration
 * Mappls = Geocoding only (address → lat/lng).
 * Google = Map display + Places (nearby, transit). No overlap.
 */

// Base URL for Mappls India REST APIs
export const MAPPLS_INDIA_BASE_URL = 'https://apis.mappls.com'

// REST / Map SDK Key - use for Geocoding, Nearby, Auto Suggest, Maps SDK
export function getMapplsRestApiKey(): string {
  const key =
    process.env.MAPPLS_REST_API_KEY || process.env.NEXT_PUBLIC_MAPPLS_REST_API_KEY || ''
  return key.trim()
}

// Client ID - for OAuth2 token generation (server-side only)
export function getMapplsClientId(): string {
  return (process.env.MAPPLS_CLIENT_ID || '').trim()
}

// Client Secret - for OAuth2 token generation (server-side only)
export function getMapplsClientSecret(): string {
  return (process.env.MAPPLS_CLIENT_SECRET || '').trim()
}

// Check if Mappls credentials are configured
export function isMapplsConfigured(): boolean {
  return !!getMapplsRestApiKey()
}

export function isMapplsKeyPairConfigured(): boolean {
  return !!(getMapplsClientId() && getMapplsClientSecret())
}
