/**
 * Generate generic, industry-agnostic property titles
 * This ensures properties appeal to all industries, not just F&B
 */

export function generateGenericPropertyTitle(
  location: string,
  size?: number,
  propertyType?: string
): string {
  // Extract area/city from location (handle formats like "Koramangala, Bangalore" or just "Koramangala")
  const locationParts = location.split(',').map(s => s.trim())
  const area = locationParts[0] || 'Bangalore'
  
  // Format size if provided
  let sizeText = ''
  if (size && size > 0) {
    if (size >= 1000) {
      sizeText = `${(size / 1000).toFixed(size % 1000 === 0 ? 0 : 1)}K sqft`
    } else {
      sizeText = `${size} sqft`
    }
  }
  
  // Build generic title - avoid industry-specific terms
  const parts: string[] = []
  
  // Add size if available
  if (sizeText) {
    parts.push(sizeText)
  }
  
  // Add generic property descriptor (avoid "restaurant", "cafe", "QSR", etc.)
  parts.push('Commercial Space')
  
  // Add location
  parts.push(`in ${area}`)
  
  return parts.join(' ')
}

/**
 * Sanitize existing titles to remove industry-specific terms
 * Useful for migrating existing properties
 */
export function sanitizePropertyTitle(title: string): string {
  if (!title) return 'Commercial Space'
  
  const lowerTitle = title.toLowerCase()
  
  // Industry-specific terms to remove/replace
  const industryTerms = [
    'restaurant',
    'cafe',
    'café',
    'qsr',
    'quick service restaurant',
    'food court',
    'bar',
    'brewery',
    'bakery',
    'dining',
    'eatery',
    'bistro'
  ]
  
  let sanitized = title
  
  // Replace industry-specific terms with generic alternatives
  industryTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    sanitized = sanitized.replace(regex, 'Commercial Space')
  })
  
  // Clean up multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim()
  
  // If title became too short or empty, generate a generic one
  if (sanitized.length < 10 || sanitized.toLowerCase() === 'commercial space') {
    // Try to extract location from original title
    const locationMatch = title.match(/(?:in|at|near)\s+([A-Za-z\s,]+)/i)
    const location = locationMatch ? locationMatch[1].trim() : 'Bangalore'
    return generateGenericPropertyTitle(location)
  }
  
  return sanitized
}
