'use client'

import { useEffect } from 'react'

/**
 * Google Maps Error Handler
 * Suppresses deprecation warnings and provides better error handling
 */
export default function GoogleMapsErrorHandler() {
  useEffect(() => {
    // Suppress Google Maps Marker deprecation warning in development
    // Note: This is a known deprecation. We'll migrate to AdvancedMarkerElement in a future update.
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn
      console.warn = (...args: any[]) => {
        const message = args[0]?.toString() || ''
        // Suppress Marker deprecation warning
        if (message.includes('google.maps.Marker is deprecated')) {
          return
        }
        // Suppress LoadScript reload warning (should be fixed by using constant libraries array)
        if (message.includes('LoadScript has been reloaded unintentionally')) {
          console.warn(
            '[Google Maps] LoadScript reload detected. Make sure libraries prop is a constant array.',
            ...args.slice(1)
          )
          return
        }
        originalWarn.apply(console, args)
      }

      return () => {
        console.warn = originalWarn
      }
    }
  }, [])

  return null
}

