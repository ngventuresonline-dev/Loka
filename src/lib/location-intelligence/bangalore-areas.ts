/**
 * Extended Bangalore areas and pincodes for location intelligence.
 * Used for catchment proxy, area lookup, and similar markets.
 */

export interface AreaDefinition {
  key: string
  lat: number
  lng: number
  pincode?: string
}

/** Bangalore area centres – extended with Mahadevapura, Brookfield, etc. */
export const BANGALORE_AREAS: AreaDefinition[] = [
  { key: 'hsr layout', lat: 12.9121, lng: 77.6446, pincode: '560102' },
  { key: 'koramangala', lat: 12.9352, lng: 77.6245, pincode: '560095' },
  { key: 'indiranagar', lat: 12.9784, lng: 77.6408, pincode: '560038' },
  { key: 'jayanagar', lat: 12.925, lng: 77.5936, pincode: '560041' },
  { key: 'jp nagar', lat: 12.9063, lng: 77.5857, pincode: '560078' },
  { key: 'btm layout', lat: 12.9166, lng: 77.6101, pincode: '560076' },
  { key: 'mg road', lat: 12.975, lng: 77.6063, pincode: '560001' },
  { key: 'ub city', lat: 12.9716, lng: 77.5946, pincode: '560001' },
  { key: 'whitefield', lat: 12.9698, lng: 77.7499, pincode: '560066' },
  { key: 'marathahalli', lat: 12.9593, lng: 77.6974, pincode: '560037' },
  { key: 'mahadevapura', lat: 12.9922, lng: 77.6968, pincode: '560048' },
  { key: 'brookfield', lat: 12.9502, lng: 77.6962, pincode: '560037' },
  { key: 'kaikondrahalli', lat: 12.9188, lng: 77.6578, pincode: '560035' },
  { key: 'richmond town', lat: 12.9782, lng: 77.6102, pincode: '560025' },
  { key: 'aecs layout', lat: 12.9658, lng: 77.7002, pincode: '560037' },
  { key: 'st marks road', lat: 12.9752, lng: 77.6062, pincode: '560001' },
  { key: 'bellandur', lat: 12.926, lng: 77.6762, pincode: '560103' },
  { key: 'electronic city', lat: 12.8456, lng: 77.6603, pincode: '560100' },
  { key: 'sarjapur road', lat: 12.9102, lng: 77.6878, pincode: '560035' },
  { key: 'banashankari', lat: 12.9254, lng: 77.5468, pincode: '560070' },
  { key: 'malleswaram', lat: 13.0035, lng: 77.5648, pincode: '560055' },
  { key: 'rajajinagar', lat: 13.0102, lng: 77.5534, pincode: '560010' },
  { key: 'brigade road', lat: 12.9714, lng: 77.6061, pincode: '560025' },
  { key: 'cunningham road', lat: 12.9882, lng: 77.6052, pincode: '560052' },
]

/** Pincode centroids (Bangalore) – for catchment proxy. Share % is estimated by distance inverse. */
export const BANGALORE_PINCODES: Array<{ pincode: string; name: string; lat: number; lng: number }> = [
  { pincode: '560001', name: 'MG Road / Bangalore GPO', lat: 12.975, lng: 77.606 },
  { pincode: '560025', name: 'Brigade Road / Richmond Town', lat: 12.971, lng: 77.606 },
  { pincode: '560038', name: 'Indiranagar', lat: 12.978, lng: 77.641 },
  { pincode: '560041', name: 'Jayanagar', lat: 12.925, lng: 77.594 },
  { pincode: '560066', name: 'Whitefield', lat: 12.970, lng: 77.750 },
  { pincode: '560070', name: 'Banashankari', lat: 12.925, lng: 77.547 },
  { pincode: '560076', name: 'BTM Layout', lat: 12.917, lng: 77.610 },
  { pincode: '560078', name: 'JP Nagar', lat: 12.906, lng: 77.586 },
  { pincode: '560095', name: 'Koramangala', lat: 12.935, lng: 77.625 },
  { pincode: '560102', name: 'HSR Layout', lat: 12.912, lng: 77.645 },
  { pincode: '560103', name: 'Bellandur', lat: 12.926, lng: 77.676 },
  { pincode: '560035', name: 'Sarjapur Road / Kaikondrahalli', lat: 12.919, lng: 77.658 },
  { pincode: '560037', name: 'Marathahalli / AECS Layout / Brookfield', lat: 12.960, lng: 77.697 },
  { pincode: '560048', name: 'Mahadevapura', lat: 12.992, lng: 77.697 },
  { pincode: '560055', name: 'Malleswaram', lat: 13.004, lng: 77.565 },
  { pincode: '560010', name: 'Rajajinagar', lat: 13.010, lng: 77.553 },
  { pincode: '560052', name: 'Cunningham Road', lat: 12.988, lng: 77.605 },
  { pincode: '560100', name: 'Electronic City', lat: 12.846, lng: 77.660 },
]

/**
 * All Bangalore areas for admin dropdown: label (display), value (stored), pincode.
 * Sorted alphabetically. Used in admin property form "Select area".
 */
export interface BangaloreAreaOption {
  label: string
  value: string
  pincode: string
}

const BANGALORE_AREAS_RAW: BangaloreAreaOption[] = [
  { label: 'AECS Layout', value: 'AECS Layout', pincode: '560037' },
  { label: 'Banashankari', value: 'Banashankari', pincode: '560070' },
  { label: 'Bannerghatta Road', value: 'Bannerghatta Road', pincode: '560076' },
  { label: 'Basavanagudi', value: 'Basavanagudi', pincode: '560004' },
  { label: 'Bellandur', value: 'Bellandur', pincode: '560103' },
  { label: 'Bommanahalli', value: 'Bommanahalli', pincode: '560068' },
  { label: 'Brigade Road', value: 'Brigade Road', pincode: '560025' },
  { label: 'Brookfield', value: 'Brookfield', pincode: '560037' },
  { label: 'BTM Layout', value: 'BTM Layout', pincode: '560076' },
  { label: 'Cunningham Road', value: 'Cunningham Road', pincode: '560052' },
  { label: 'Domlur', value: 'Domlur', pincode: '560071' },
  { label: 'Electronic City', value: 'Electronic City', pincode: '560100' },
  { label: 'Frazer Town', value: 'Frazer Town', pincode: '560005' },
  { label: 'Hebbal', value: 'Hebbal', pincode: '560024' },
  { label: 'HSR Layout', value: 'HSR Layout', pincode: '560102' },
  { label: 'Indiranagar', value: 'Indiranagar', pincode: '560038' },
  { label: 'Jayanagar', value: 'Jayanagar', pincode: '560041' },
  { label: 'JP Nagar', value: 'JP Nagar', pincode: '560078' },
  { label: 'Kaikondrahalli', value: 'Kaikondrahalli', pincode: '560035' },
  { label: 'Kalyan Nagar', value: 'Kalyan Nagar', pincode: '560043' },
  { label: 'Kanakapura Road', value: 'Kanakapura Road', pincode: '560062' },
  { label: 'Kempegowda Nagar', value: 'Kempegowda Nagar', pincode: '560079' },
  { label: 'Koramangala', value: 'Koramangala', pincode: '560095' },
  { label: 'Kumaraswamy Layout', value: 'Kumaraswamy Layout', pincode: '560078' },
  { label: 'Lavelle Road', value: 'Lavelle Road', pincode: '560001' },
  { label: 'MG Road', value: 'MG Road', pincode: '560001' },
  { label: 'Mahadevapura', value: 'Mahadevapura', pincode: '560048' },
  { label: 'Malleswaram', value: 'Malleswaram', pincode: '560055' },
  { label: 'Malleshwaram', value: 'Malleshwaram', pincode: '560055' },
  { label: 'Marathahalli', value: 'Marathahalli', pincode: '560037' },
  { label: 'New Bel Road', value: 'New Bel Road', pincode: '560054' },
  { label: 'Rajajinagar', value: 'Rajajinagar', pincode: '560010' },
  { label: 'Richmond Town', value: 'Richmond Town', pincode: '560025' },
  { label: 'RT Nagar', value: 'RT Nagar', pincode: '560032' },
  { label: 'Sahakar Nagar', value: 'Sahakar Nagar', pincode: '560092' },
  { label: 'Sarjapur Road', value: 'Sarjapur Road', pincode: '560035' },
  { label: 'St Marks Road', value: 'St Marks Road', pincode: '560001' },
  { label: 'UB City', value: 'UB City', pincode: '560001' },
  { label: 'Ulsoor', value: 'Ulsoor', pincode: '560008' },
  { label: 'Vijayanagar', value: 'Vijayanagar', pincode: '560040' },
  { label: 'Whitefield', value: 'Whitefield', pincode: '560066' },
  { label: 'Yelahanka', value: 'Yelahanka', pincode: '560064' },
  { label: 'Yeshwanthpur', value: 'Yeshwanthpur', pincode: '560022' },
]

export const BANGALORE_AREAS_ADMIN: BangaloreAreaOption[] = BANGALORE_AREAS_RAW.sort((a, b) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
)

/** Get pincode for a Bangalore area/location name (case-insensitive match). Returns null if no match. */
export function getPincodeForBangaloreArea (areaName: string | null | undefined): string | null {
  if (!areaName || typeof areaName !== 'string') return null
  const q = areaName.trim().toLowerCase()
  if (!q) return null
  // Exact match first
  let found = BANGALORE_AREAS_ADMIN.find(
    (a) => a.value.toLowerCase() === q || a.label.toLowerCase() === q
  )
  if (found) return found.pincode
  // Then match if area label appears in the input (e.g. "MG Road" in "123, MG Road, Bangalore")
  found = BANGALORE_AREAS_ADMIN.find(
    (a) => q.includes(a.label.toLowerCase()) || q.includes(a.value.toLowerCase())
  )
  return found ? found.pincode : null
}

/** Get nearest Bangalore pincode from coordinates (for map link / lat-lng). */
export function getNearestPincodeFromCoords (lat: number, lng: number): string {
  let nearest = BANGALORE_PINCODES[0]
  let minDist = 1e9
  for (const p of BANGALORE_PINCODES) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2
    if (d < minDist) {
      minDist = d
      nearest = p
    }
  }
  return nearest.pincode
}
