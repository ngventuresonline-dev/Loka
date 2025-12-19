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

// Get Google Maps API key with better error handling
export function getGoogleMapsApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Google Maps] API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.\n' +
        'Get your API key from: https://console.cloud.google.com/google/maps-apis'
      )
    }
    return ''
  }
  
  return apiKey
}

