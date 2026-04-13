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
  /** Sarjapur main commercial strip (Ambalipura / junction) — tighter than generic “sarjapur road” centroid */
  { key: 'sarjapur junction', lat: 12.9185, lng: 77.6775, pincode: '560035' },
  { key: 'sarjapur road', lat: 12.9102, lng: 77.6878, pincode: '560035' },
  { key: 'banashankari', lat: 12.9254, lng: 77.5468, pincode: '560070' },
  { key: 'kalyan nagar', lat: 13.022, lng: 77.647, pincode: '560043' },
  { key: 'malleswaram', lat: 13.0035, lng: 77.5648, pincode: '560055' },
  { key: 'rajajinagar', lat: 13.0102, lng: 77.5534, pincode: '560010' },
  { key: 'brigade road', lat: 12.9714, lng: 77.6061, pincode: '560025' },
  { key: 'cunningham road', lat: 12.9882, lng: 77.6052, pincode: '560052' },
]

/** Pincode centroids (Bangalore) – for catchment proxy. Share % is estimated by distance inverse. */
export const BANGALORE_PINCODES: Array<{ pincode: string; name: string; lat: number; lng: number; areaType: 'residential' | 'commercial' | 'tech' | 'mixed' }> = [
  { pincode: '560001', name: 'MG Road', lat: 12.975, lng: 77.606, areaType: 'commercial' },
  { pincode: '560005', name: 'Frazer Town / Cox Town / Cooke Town', lat: 12.990, lng: 77.618, areaType: 'mixed' },
  { pincode: '560008', name: 'Sadashivanagar', lat: 13.009, lng: 77.577, areaType: 'residential' },
  { pincode: '560010', name: 'Rajajinagar', lat: 13.010, lng: 77.553, areaType: 'mixed' },
  { pincode: '560016', name: 'Rammurthy Nagar', lat: 13.021, lng: 77.668, areaType: 'residential' },
  { pincode: '560024', name: 'Hebbal', lat: 13.035, lng: 77.597, areaType: 'mixed' },
  { pincode: '560025', name: 'Brigade Road / Richmond Town', lat: 12.971, lng: 77.606, areaType: 'commercial' },
  { pincode: '560034', name: 'Ejipura / Viveknagar', lat: 12.952, lng: 77.627, areaType: 'residential' },
  { pincode: '560035', name: 'Sarjapur Road / Kaikondrahalli', lat: 12.919, lng: 77.658, areaType: 'tech' },
  { pincode: '560037', name: 'Marathahalli / AECS Layout', lat: 12.960, lng: 77.697, areaType: 'tech' },
  { pincode: '560038', name: 'Indiranagar', lat: 12.978, lng: 77.641, areaType: 'commercial' },
  { pincode: '560041', name: 'Jayanagar', lat: 12.925, lng: 77.594, areaType: 'residential' },
  { pincode: '560043', name: 'Kalyan Nagar / Banaswadi', lat: 13.020, lng: 77.648, areaType: 'residential' },
  { pincode: '560045', name: 'Bellandur / Sarjapur', lat: 12.930, lng: 77.673, areaType: 'tech' },
  { pincode: '560048', name: 'Mahadevapura / Whitefield Tech Park', lat: 12.992, lng: 77.697, areaType: 'tech' },
  { pincode: '560052', name: 'Cunningham Road / Vasanthnagar', lat: 12.988, lng: 77.605, areaType: 'commercial' },
  { pincode: '560054', name: 'RT Nagar', lat: 13.026, lng: 77.597, areaType: 'residential' },
  { pincode: '560055', name: 'Malleswaram', lat: 13.004, lng: 77.565, areaType: 'mixed' },
  { pincode: '560066', name: 'Whitefield', lat: 12.970, lng: 77.750, areaType: 'tech' },
  { pincode: '560068', name: 'Bommanahalli / Kudlu Gate', lat: 12.890, lng: 77.640, areaType: 'mixed' },
  { pincode: '560070', name: 'Banashankari', lat: 12.925, lng: 77.547, areaType: 'residential' },
  { pincode: '560071', name: 'Domlur / HAL 2nd Stage', lat: 12.961, lng: 77.640, areaType: 'mixed' },
  { pincode: '560076', name: 'BTM Layout', lat: 12.917, lng: 77.610, areaType: 'mixed' },
  { pincode: '560077', name: 'Hegde Nagar / Thanisandra', lat: 13.058, lng: 77.624, areaType: 'residential' },
  { pincode: '560078', name: 'JP Nagar', lat: 12.906, lng: 77.586, areaType: 'residential' },
  { pincode: '560084', name: 'Kammanahalli', lat: 13.009, lng: 77.648, areaType: 'residential' },
  { pincode: '560085', name: 'HBR Layout', lat: 13.033, lng: 77.637, areaType: 'residential' },
  { pincode: '560086', name: 'Horamavu', lat: 13.030, lng: 77.660, areaType: 'residential' },
  { pincode: '560093', name: 'CV Raman Nagar', lat: 12.986, lng: 77.662, areaType: 'mixed' },
  { pincode: '560095', name: 'Koramangala', lat: 12.935, lng: 77.625, areaType: 'commercial' },
  { pincode: '560100', name: 'Electronic City', lat: 12.846, lng: 77.660, areaType: 'tech' },
  { pincode: '560102', name: 'HSR Layout', lat: 12.912, lng: 77.645, areaType: 'mixed' },
  { pincode: '560103', name: 'Bellandur', lat: 12.926, lng: 77.676, areaType: 'tech' },

  // Koramangala & adjacent micro-areas
  { pincode: '560095', name: 'Koramangala 1st Block', lat: 12.9403, lng: 77.6189, areaType: 'commercial' },
  { pincode: '560095', name: 'Koramangala 3rd Block', lat: 12.9352, lng: 77.6245, areaType: 'commercial' },
  { pincode: '560095', name: 'Koramangala 5th Block', lat: 12.9302, lng: 77.6278, areaType: 'commercial' },
  { pincode: '560095', name: 'Koramangala 6th Block', lat: 12.9278, lng: 77.6325, areaType: 'commercial' },
  { pincode: '560095', name: 'Koramangala 7th Block', lat: 12.9242, lng: 77.6368, areaType: 'commercial' },
  { pincode: '560068', name: 'SG Palya', lat: 12.9272, lng: 77.6214, areaType: 'residential' },
  { pincode: '560068', name: 'Taverekere', lat: 12.9215, lng: 77.6258, areaType: 'residential' },
  { pincode: '560068', name: 'Adugodi', lat: 12.9452, lng: 77.6278, areaType: 'mixed' },
  { pincode: '560034', name: 'Ejipura', lat: 12.9518, lng: 77.6272, areaType: 'residential' },
  { pincode: '560034', name: 'Viveknagar', lat: 12.9488, lng: 77.6258, areaType: 'residential' },
  // Indiranagar micro-areas
  { pincode: '560038', name: 'Indiranagar 1st Stage', lat: 12.9718, lng: 77.6378, areaType: 'commercial' },
  { pincode: '560038', name: 'Indiranagar 2nd Stage', lat: 12.9752, lng: 77.6408, areaType: 'commercial' },
  { pincode: '560038', name: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408, areaType: 'commercial' },
  { pincode: '560038', name: 'Domlur Layout', lat: 12.9628, lng: 77.6378, areaType: 'mixed' },
  { pincode: '560038', name: 'HAL 2nd Stage', lat: 12.9608, lng: 77.6448, areaType: 'mixed' },
  // HSR Layout micro-areas
  { pincode: '560102', name: 'HSR Sector 1', lat: 12.9188, lng: 77.6408, areaType: 'residential' },
  { pincode: '560102', name: 'HSR Sector 2', lat: 12.9148, lng: 77.6448, areaType: 'residential' },
  { pincode: '560102', name: 'HSR Sector 5', lat: 12.9108, lng: 77.6488, areaType: 'residential' },
  { pincode: '560102', name: 'HSR Sector 7', lat: 12.9078, lng: 77.6528, areaType: 'residential' },
  { pincode: '560102', name: 'Agara', lat: 12.9058, lng: 77.6428, areaType: 'residential' },
  // BTM Layout micro-areas
  { pincode: '560076', name: 'BTM 1st Stage', lat: 12.9178, lng: 77.6108, areaType: 'mixed' },
  { pincode: '560076', name: 'BTM 2nd Stage', lat: 12.9108, lng: 77.6108, areaType: 'mixed' },
  { pincode: '560076', name: 'Madivala', lat: 12.9228, lng: 77.6168, areaType: 'mixed' },
  { pincode: '560076', name: 'Hongasandra', lat: 12.8978, lng: 77.6168, areaType: 'residential' },
  // Whitefield micro-areas
  { pincode: '560066', name: 'Whitefield Main Road', lat: 12.9698, lng: 77.7508, areaType: 'commercial' },
  { pincode: '560066', name: 'Varthur Road', lat: 12.9368, lng: 77.7028, areaType: 'mixed' },
  { pincode: '560066', name: 'ITPL Road', lat: 12.9848, lng: 77.7268, areaType: 'tech' },
  { pincode: '560066', name: 'Hoodi', lat: 12.9748, lng: 77.6988, areaType: 'tech' },
  { pincode: '560066', name: 'Kadugodi', lat: 12.9948, lng: 77.7448, areaType: 'residential' },
  // Sarjapur Road micro-areas
  { pincode: '560035', name: 'Sarjapur Main Road', lat: 12.8968, lng: 77.6908, areaType: 'mixed' },
  { pincode: '560035', name: 'Ambalipura', lat: 12.9148, lng: 77.6958, areaType: 'residential' },
  { pincode: '560035', name: 'Dommasandra', lat: 12.8918, lng: 77.7108, areaType: 'residential' },
  { pincode: '560035', name: 'Carmelaram', lat: 12.9058, lng: 77.6908, areaType: 'residential' },
  // Jayanagar micro-areas
  { pincode: '560041', name: 'Jayanagar 4th Block', lat: 12.9298, lng: 77.5838, areaType: 'commercial' },
  { pincode: '560041', name: 'Jayanagar 9th Block', lat: 12.9198, lng: 77.5798, areaType: 'residential' },
  { pincode: '560041', name: 'JP Nagar 3rd Phase', lat: 12.9108, lng: 77.5808, areaType: 'residential' },
  { pincode: '560041', name: 'Basavanagudi', lat: 12.9418, lng: 77.5778, areaType: 'residential' },
  // Marathahalli micro-areas
  { pincode: '560037', name: 'Marathahalli Junction', lat: 12.9568, lng: 77.7028, areaType: 'commercial' },
  { pincode: '560037', name: 'Outer Ring Road Marathahalli', lat: 12.9448, lng: 77.6968, areaType: 'tech' },
  { pincode: '560037', name: 'Brookfield', lat: 12.9508, lng: 77.6968, areaType: 'tech' },
  { pincode: '560037', name: 'Kundalahalli', lat: 12.9618, lng: 77.7068, areaType: 'residential' },
  // Hebbal / North (macro Hebbal remains above; add finer north nodes)
  { pincode: '560024', name: 'Nagawara', lat: 13.0258, lng: 77.6208, areaType: 'residential' },
  { pincode: '560024', name: 'Thanisandra', lat: 13.0558, lng: 77.6158, areaType: 'residential' },
  // MG Road / CBD micro-areas
  { pincode: '560001', name: 'Church Street', lat: 12.9727, lng: 77.6068, areaType: 'commercial' },
  { pincode: '560001', name: 'Brigade Road', lat: 12.9724, lng: 77.6068, areaType: 'commercial' },
  { pincode: '560001', name: 'Lavelle Road', lat: 12.974, lng: 77.5988, areaType: 'commercial' },
  { pincode: '560025', name: 'Richmond Town', lat: 12.9618, lng: 77.6008, areaType: 'commercial' },
  { pincode: '560025', name: 'Shanti Nagar', lat: 12.9598, lng: 77.5978, areaType: 'mixed' },
  // Electronic City micro-areas
  { pincode: '560100', name: 'Electronic City Phase 1', lat: 12.8448, lng: 77.6648, areaType: 'tech' },
  { pincode: '560100', name: 'Electronic City Phase 2', lat: 12.8318, lng: 77.6728, areaType: 'tech' },
  { pincode: '560100', name: 'Neeladri Road', lat: 12.8538, lng: 77.6598, areaType: 'tech' },
  { pincode: '560100', name: 'Bommasandra', lat: 12.8018, lng: 77.6818, areaType: 'tech' },
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
  { label: 'Adugodi', value: 'Adugodi', pincode: '560030' },
  { label: 'Agara', value: 'Agara', pincode: '560034' },
  { label: 'Anand Nagar', value: 'Anand Nagar', pincode: '560024' },
  { label: 'Arekere', value: 'Arekere', pincode: '560076' },
  { label: 'Ashok Nagar', value: 'Ashok Nagar', pincode: '560050' },
  { label: 'Banaswadi', value: 'Banaswadi', pincode: '560043' },
  { label: 'Banashankari', value: 'Banashankari', pincode: '560070' },
  { label: 'Bannerghatta Road', value: 'Bannerghatta Road', pincode: '560076' },
  { label: 'Basavanagudi', value: 'Basavanagudi', pincode: '560004' },
  { label: 'Bellandur', value: 'Bellandur', pincode: '560103' },
  { label: 'Bommanahalli', value: 'Bommanahalli', pincode: '560068' },
  { label: 'Brigade Road', value: 'Brigade Road', pincode: '560025' },
  { label: 'Brookfield', value: 'Brookfield', pincode: '560037' },
  { label: 'BTM Layout', value: 'BTM Layout', pincode: '560076' },
  { label: 'Chamrajpet', value: 'Chamrajpet', pincode: '560018' },
  { label: 'Chandapura', value: 'Chandapura', pincode: '560081' },
  { label: 'Commercial Street', value: 'Commercial Street', pincode: '560001' },
  { label: 'Cooke Town', value: 'Cooke Town', pincode: '560005' },
  { label: 'Cox Town', value: 'Cox Town', pincode: '560005' },
  { label: 'Cunningham Road', value: 'Cunningham Road', pincode: '560052' },
  { label: 'CV Raman Nagar', value: 'CV Raman Nagar', pincode: '560093' },
  { label: 'Devanahalli', value: 'Devanahalli', pincode: '562110' },
  { label: 'Domlur', value: 'Domlur', pincode: '560071' },
  { label: 'Electronic City', value: 'Electronic City', pincode: '560100' },
  { label: 'Frazer Town', value: 'Frazer Town', pincode: '560005' },
  { label: 'Gandhi Nagar', value: 'Gandhi Nagar', pincode: '560009' },
  { label: 'Gottigere', value: 'Gottigere', pincode: '560083' },
  { label: 'HBR Layout', value: 'HBR Layout', pincode: '560043' },
  { label: 'Hegde Nagar', value: 'Hegde Nagar', pincode: '560077' },
  { label: 'Hebbal', value: 'Hebbal', pincode: '560024' },
  { label: 'Hessarghatta', value: 'Hessarghatta', pincode: '560088' },
  { label: 'Hoodi', value: 'Hoodi', pincode: '560048' },
  { label: 'HSR Layout', value: 'HSR Layout', pincode: '560102' },
  { label: 'Hulimavu', value: 'Hulimavu', pincode: '560076' },
  { label: 'Indiranagar', value: 'Indiranagar', pincode: '560038' },
  { label: 'Jayanagar', value: 'Jayanagar', pincode: '560041' },
  { label: 'JP Nagar', value: 'JP Nagar', pincode: '560078' },
  { label: 'Jeevanbheemanagar', value: 'Jeevanbheemanagar', pincode: '560075' },
  { label: 'Kaikondrahalli', value: 'Kaikondrahalli', pincode: '560035' },
  { label: 'Kalyan Nagar', value: 'Kalyan Nagar', pincode: '560043' },
  { label: 'Kamanahalli', value: 'Kamanahalli', pincode: '560084' },
  { label: 'Kanakapura Road', value: 'Kanakapura Road', pincode: '560062' },
  { label: 'Kasturi Nagar', value: 'Kasturi Nagar', pincode: '560043' },
  { label: 'Kempegowda Nagar', value: 'Kempegowda Nagar', pincode: '560079' },
  { label: 'Koramangala', value: 'Koramangala', pincode: '560095' },
  { label: 'Krishnarajapura', value: 'Krishnarajapura', pincode: '560036' },
  { label: 'Kumaraswamy Layout', value: 'Kumaraswamy Layout', pincode: '560078' },
  { label: 'Kundalahalli', value: 'Kundalahalli', pincode: '560037' },
  { label: 'Lavelle Road', value: 'Lavelle Road', pincode: '560001' },
  { label: 'Madivala', value: 'Madivala', pincode: '560068' },
  { label: 'Mahadevapura', value: 'Mahadevapura', pincode: '560048' },
  { label: 'Malleswaram', value: 'Malleswaram', pincode: '560055' },
  { label: 'Malleshwaram', value: 'Malleshwaram', pincode: '560055' },
  { label: 'Marathahalli', value: 'Marathahalli', pincode: '560037' },
  { label: 'Mathikere', value: 'Mathikere', pincode: '560054' },
  { label: 'MG Road', value: 'MG Road', pincode: '560001' },
  { label: 'Murugeshpalya', value: 'Murugeshpalya', pincode: '560017' },
  { label: 'Nagarbhavi', value: 'Nagarbhavi', pincode: '560072' },
  { label: 'New Bel Road', value: 'New Bel Road', pincode: '560054' },
  { label: 'Padmanabhanagar', value: 'Padmanabhanagar', pincode: '560070' },
  { label: 'Peenya', value: 'Peenya', pincode: '560058' },
  { label: 'Rammurthy Nagar', value: 'Rammurthy Nagar', pincode: '560016' },
  { label: 'Rajajinagar', value: 'Rajajinagar', pincode: '560010' },
  { label: 'Residency Road', value: 'Residency Road', pincode: '560025' },
  { label: 'Richmond Town', value: 'Richmond Town', pincode: '560025' },
  { label: 'RT Nagar', value: 'RT Nagar', pincode: '560032' },
  { label: 'Sadashivanagar', value: 'Sadashivanagar', pincode: '560080' },
  { label: 'Sahakar Nagar', value: 'Sahakar Nagar', pincode: '560092' },
  { label: 'Sanjay Nagar', value: 'Sanjay Nagar', pincode: '560094' },
  { label: 'Sarjapur Road', value: 'Sarjapur Road', pincode: '560035' },
  { label: 'Seshadripuram', value: 'Seshadripuram', pincode: '560020' },
  { label: 'Shivajinagar', value: 'Shivajinagar', pincode: '560051' },
  { label: 'St Marks Road', value: 'St Marks Road', pincode: '560001' },
  { label: 'Subramanyapura', value: 'Subramanyapura', pincode: '560061' },
  { label: 'Thanisandra', value: 'Thanisandra', pincode: '560077' },
  { label: 'UB City', value: 'UB City', pincode: '560001' },
  { label: 'Ulsoor', value: 'Ulsoor', pincode: '560008' },
  { label: 'Varthur', value: 'Varthur', pincode: '560087' },
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

/** Best-effort area label when the owner only typed a free-text address (e.g. includes "Koramangala"). */
export function guessBangaloreLocalityLabel (text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null
  const q = text.trim().toLowerCase()
  if (!q) return null
  let found = BANGALORE_AREAS_ADMIN.find(
    (a) => q.includes(a.label.toLowerCase()) || q.includes(a.value.toLowerCase())
  )
  return found ? found.label : null
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
