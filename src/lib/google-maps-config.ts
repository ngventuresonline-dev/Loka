/**
 * Google Maps Configuration
 * Centralized configuration to prevent LoadScript reload warnings
 */

// Libraries array must be a constant to prevent LoadScript reload warnings
export const GOOGLE_MAPS_LIBRARIES: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places']

// Default map options
export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
}

// Cache to prevent multiple warnings
let hasWarnedAboutApiKey = false

// Get Google Maps API key with better error handling
export function getGoogleMapsApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development' && !hasWarnedAboutApiKey) {
      hasWarnedAboutApiKey = true
      console.warn(
        '[Google Maps] API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.\n' +
        'Get your API key from: https://console.cloud.google.com/google/maps-apis'
      )
    }
    return ''
  }
  
  // Trim whitespace and validate
  const trimmedKey = apiKey.trim()
  
  if (!trimmedKey) {
    if (process.env.NODE_ENV === 'development' && !hasWarnedAboutApiKey) {
      hasWarnedAboutApiKey = true
      console.warn('[Google Maps] API key is empty after trimming whitespace.')
    }
    return ''
  }
  
  // Validate API key format (should start with AIza)
  if (!trimmedKey.startsWith('AIza')) {
    if (process.env.NODE_ENV === 'development' && !hasWarnedAboutApiKey) {
      hasWarnedAboutApiKey = true
      console.warn(
        '[Google Maps] API key format appears invalid. Google Maps API keys should start with "AIza".'
      )
    }
  }
  
  // Log API key status in development (first 4 chars only for security)
  if (process.env.NODE_ENV === 'development' && !hasWarnedAboutApiKey) {
    hasWarnedAboutApiKey = true
    console.log(
      `[Google Maps] API key loaded: ${trimmedKey.substring(0, 4)}...${trimmedKey.substring(trimmedKey.length - 4)}`
    )
  }
  
  return trimmedKey
}

