'use client'

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'

export type OwnerOnboardingMapProps = {
  mapCenter: { lat: number; lng: number }
  markerPosition: { lat: number; lng: number } | null
  onMapClick: (e: google.maps.MapMouseEvent) => void
  onMarkerDragEnd: (e: google.maps.MapMouseEvent) => void
  onLoad?: () => void
}

export default function OwnerOnboardingMap({
  mapCenter,
  markerPosition,
  onMapClick,
  onMarkerDragEnd,
  onLoad,
}: OwnerOnboardingMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-600">
        Failed to load Google Maps. Check your connection and API key.
      </div>
    )
  }

  if (!isLoaded || typeof window === 'undefined' || !window.google?.maps) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Loading map…
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={markerPosition || mapCenter}
      zoom={16}
      options={DEFAULT_MAP_OPTIONS}
      onClick={onMapClick}
      onLoad={() => onLoad?.()}
    >
      {markerPosition && (
        <Marker
          position={markerPosition}
          draggable
          onDragEnd={onMarkerDragEnd}
        />
      )}
    </GoogleMap>
  )
}
