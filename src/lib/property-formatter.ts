/**
 * Auto-format property data to platform standards
 * Ensures title, description, location, amenities are properly formatted and ready for approval
 */

export interface PropertyFormData {
  title?: string
  description?: string
  address?: string
  city?: string
  area?: string
  state?: string
  zipCode?: string
  propertyType?: string
  size?: number | string
  price?: number | string
  amenities?: string[]
  mapLink?: string
  latitude?: number | string | null
  longitude?: number | string | null
}

export interface FormattedProperty {
  title: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  amenities: { features: string[]; map_link?: string | null }
}

/**
 * Format property title based on property type, size, location
 */
function formatTitle(data: PropertyFormData): string {
  if (data.title && data.title.trim().length >= 3) {
    // If title exists and is valid, capitalize properly
    return capitalizeTitle(data.title.trim())
  }

  // Auto-generate title from available data
  const parts: string[] = []
  
  // Size
  if (data.size) {
    const sizeNum = typeof data.size === 'string' ? parseInt(data.size) : data.size
    if (sizeNum > 0) {
      parts.push(`${sizeNum.toLocaleString()} sqft`)
    }
  }

  // Property type
  const propType = formatPropertyTypeLabel(data.propertyType)
  if (propType) {
    parts.push(propType)
  }

  // Location (area or city)
  const location = data.area || data.city || ''
  if (location) {
    parts.push(location)
  }

  // Default fallback
  if (parts.length === 0) {
    return 'Commercial Property Available'
  }

  return parts.join(' in ')
}

/**
 * Format property description with standard structure
 */
function formatDescription(data: PropertyFormData): string {
  if (data.description && data.description.trim().length >= 10) {
    // If description exists and is valid, clean it up
    return cleanDescription(data.description.trim())
  }

  // Auto-generate description
  const parts: string[] = []
  
  // Size and type
  if (data.size) {
    const sizeNum = typeof data.size === 'string' ? parseInt(data.size) : data.size
    if (sizeNum > 0) {
      const propType = formatPropertyTypeLabel(data.propertyType) || 'commercial space'
      parts.push(`${sizeNum.toLocaleString()} sqft ${propType.toLowerCase()}`)
    }
  }

  // Location
  const locationParts: string[] = []
  if (data.area) locationParts.push(data.area)
  if (data.city) locationParts.push(data.city)
  if (data.state) locationParts.push(data.state)
  
  if (locationParts.length > 0) {
    parts.push(`located in ${locationParts.join(', ')}`)
  }

  // Address
  if (data.address) {
    parts.push(`at ${data.address}`)
  }

  // Features from amenities
  const keyFeatures = extractKeyFeatures(data.amenities || [])
  if (keyFeatures.length > 0) {
    parts.push(`Features include ${keyFeatures.join(', ').toLowerCase()}`)
  }

  // Default fallback
  if (parts.length === 0) {
    return 'Well-maintained commercial property available for lease. Contact for more details.'
  }

  return capitalizeFirst(parts.join('. ') + '.')
}

/**
 * Format address with area if provided
 */
function formatAddress(data: PropertyFormData): string {
  let address = (data.address || '').trim()
  const area = (data.area || '').trim()
  const city = (data.city || '').trim()

  // If address doesn't include area and area is provided, prepend it
  if (area && !address.toLowerCase().includes(area.toLowerCase())) {
    address = `${area}${address ? ', ' + address : ''}`
  }

  // Ensure city is not duplicated in address
  if (city && address.toLowerCase().includes(city.toLowerCase())) {
    // City already in address, keep as is
  } else if (city && !address.toLowerCase().includes(city.toLowerCase())) {
    // Add city if not present
    address = `${address}${address ? ', ' : ''}${city}`
  }

  return address || 'Address to be updated'
}

/**
 * Format amenities object with map_link
 */
function formatAmenities(data: PropertyFormData): { features: string[]; map_link?: string | null } {
  const features = Array.isArray(data.amenities) ? data.amenities.filter(Boolean).map(String) : []
  
  // Normalize amenity names (capitalize, remove duplicates)
  const normalized = features
    .map(f => capitalizeFirst(f.trim()))
    .filter((f, i, arr) => arr.indexOf(f) === i) // Remove duplicates
    .filter(f => f.length > 0)

  const result: { features: string[]; map_link?: string | null } = {
    features: normalized
  }

  // Add map_link if provided
  if (data.mapLink && typeof data.mapLink === 'string' && data.mapLink.trim()) {
    result.map_link = data.mapLink.trim()
  }

  return result
}

/**
 * Main formatter function - formats all property fields to platform standards
 */
export function formatPropertyForPlatform(data: PropertyFormData): FormattedProperty {
  return {
    title: formatTitle(data),
    description: formatDescription(data),
    address: formatAddress(data),
    city: (data.city || '').trim() || 'City to be updated',
    state: (data.state || '').trim() || 'State to be updated',
    zipCode: (data.zipCode || '').trim() || '000000',
    amenities: formatAmenities(data),
  }
}

// Helper functions

function capitalizeTitle(title: string): string {
  // Capitalize first letter of each word, handle special cases
  return title
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      // Handle common abbreviations
      if (['sqft', 'sq', 'ft', 'ac', 'km', 'm'].includes(word.toLowerCase())) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

function cleanDescription(desc: string): string {
  // Remove extra whitespace, ensure proper capitalization
  return desc
    .replace(/\s+/g, ' ')
    .trim()
    .split('.')
    .map(s => capitalizeFirst(s.trim()))
    .filter(s => s.length > 0)
    .join('. ')
    .trim()
}

function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatPropertyTypeLabel(type?: string): string {
  if (!type) return ''
  
  const typeMap: Record<string, string> = {
    'office': 'Office Space',
    'retail': 'Retail Space',
    'warehouse': 'Warehouse',
    'restaurant': 'Restaurant Space',
    'food-court': 'Food Court Space',
    'cafe-coffee-shop': 'Café / Coffee Shop',
    'qsr': 'QSR Space',
    'dessert-bakery': 'Dessert / Bakery',
    'mall-space': 'Mall Space',
    'showroom': 'Showroom',
    'kiosk': 'Kiosk',
    'standalone-building': 'Standalone Building',
    'commercial-complex': 'Commercial Complex',
    'business-park': 'Business Park',
    'it-park': 'IT Park',
    'co-working-space': 'Co-working Space',
    'other': 'Commercial Property',
  }

  const normalized = type.toLowerCase().trim()
  return typeMap[normalized] || capitalizeFirst(type)
}

function extractKeyFeatures(amenities: string[]): string[] {
  // Prioritize key features for description
  const priority = ['Ground Floor', 'Parking', 'Main Road', 'Corner Unit', 'AC', 'Security']
  const found: string[] = []
  const others: string[] = []

  amenities.forEach(a => {
    const normalized = capitalizeFirst(a.trim())
    if (priority.some(p => normalized.toLowerCase().includes(p.toLowerCase()))) {
      found.push(normalized)
    } else if (normalized.length > 0) {
      others.push(normalized)
    }
  })

  // Return up to 3 priority features, or first 3 others if no priority found
  return found.slice(0, 3).length > 0 ? found.slice(0, 3) : others.slice(0, 3)
}
