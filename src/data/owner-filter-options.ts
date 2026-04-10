// Mirrors /filter/owner — keep in sync when that page’s options change.

export const fnbPropertyTypes = [
  'Restaurant',
  'Food Court',
  'Café / Coffee Shop',
  'QSR (Quick Service Restaurant)',
  'Dessert / Bakery',
]

export const otherPropertyTypes = [
  'Office',
  'Retail Space',
  'Warehouse',
  'Mall Space',
  'Standalone Building',
  'Bungalow',
  'Villa',
  'Commercial Complex',
  'Business Park',
  'IT Park',
  'Co-working Space',
  'Service Apartment',
  'Hotel / Hospitality',
  'Land',
  'Industrial Space',
  'Showroom',
  'Kiosk',
  'Other',
]

export const ownerFilterPropertyTypes = [...fnbPropertyTypes, ...otherPropertyTypes]

const primeAreas = [
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
  'Jayanagar',
  'BTM Layout',
  'MG Road',
  'Marathahalli',
]

const allBangaloreLocations = [
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
  'Jayanagar',
  'BTM Layout',
  'MG Road',
  'Brigade Road',
  'Marathahalli',
  'Hebbal',
  'Banashankari',
  'Sarjapur Road',
  'Electronic City',
  'Bellandur',
  'Bannerghatta Road',
  'Rajajinagar',
  'Malleshwaram',
  'Basavanagudi',
  'Vijayanagar',
  'Yelahanka',
  'Yeshwanthpur',
  'RT Nagar',
  'Frazer Town',
  'Richmond Town',
  'Ulsoor',
  'Kanakapura Road',
  'New Bel Road',
  'Kalyan Nagar',
  'Kamanahalli',
  'Sahakar Nagar',
  'JP Nagar',
  'Jeevanbheemanagar',
  'Kempegowda Nagar',
  'Kengeri',
  'Kodigehalli',
  'Kumaraswamy Layout',
  'Madivala',
  'Mahadevapura',
  'Mathikere',
  'Nagarbhavi',
  'Peenya',
  'Rajarajeshwari Nagar',
  'Sadashivanagar',
  'Sanjay Nagar',
  'Seshadripuram',
  'Shivajinagar',
  'T Dasarahalli',
  'Vasanth Nagar',
  'Wilson Garden',
  'Other',
]

const uniqueLocations = Array.from(new Set(allBangaloreLocations))
const otherLocationsSorted = uniqueLocations
  .filter((loc) => !primeAreas.includes(loc) && loc !== 'Other')
  .sort((a, b) => a.localeCompare(b))

export const ownerFilterLocations = [...primeAreas, ...otherLocationsSorted, 'Other']

export const ownerFilterFeaturesCategories: Record<string, string[]> = {
  Floor: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor+', 'Basement', 'Mezzanine'],
  'Location & Visibility': ['Corner Unit', 'Main Road', 'Street Facing', 'High Visibility'],
  'Parking & Access': ['Parking', 'Valet Parking', 'Elevator', 'Wheelchair Accessible'],
  Infrastructure: ['AC', 'Power Backup', 'Water Supply', 'WiFi', 'Fire Safety', 'CCTV'],
  'Setup & Facilities': ['Kitchen Setup', 'Restroom', 'Storage', 'Warehouse Space'],
  'Security & Services': ['Security', '24/7 Security', 'Signage Allowed', 'Loading Dock'],
  Other: ['Other'],
}

export const ownerFilterAvailabilities = [
  'Immediate',
  '1 month',
  '1-2 months',
  '3+ months',
]
