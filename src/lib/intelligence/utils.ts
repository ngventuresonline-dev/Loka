/**
 * Shared utilities for location intelligence
 */

export function haversineDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return Math.round(R * c)
}

export function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function getCompetitorTypes(propertyType: string): string[] {
  const typeMap: Record<string, string[]> = {
    QSR: ['meal_takeaway', 'restaurant'],
    Cafe: ['cafe', 'bakery'],
    'Café/QSR': ['cafe', 'bakery', 'restaurant', 'meal_takeaway'],
    restaurant: ['restaurant'],
    retail: ['store', 'clothing_store'],
    office: ['point_of_interest'],
  }
  const key = (propertyType || '').toLowerCase()
  for (const [k, v] of Object.entries(typeMap)) {
    if (key.includes(k.toLowerCase())) return v
  }
  return ['restaurant', 'cafe', 'store']
}
