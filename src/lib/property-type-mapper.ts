/**
 * Property Type Mapper
 * Maps database property types to display labels, handling QSR and other subtypes
 */

export function getPropertyTypeLabel(
  propertyType: string,
  title?: string,
  description?: string
): string {
  const text = `${title || ''} ${description || ''}`.toLowerCase()
  
  // If propertyType is 'restaurant', try to detect specific subtype
  if (propertyType === 'restaurant' || propertyType === 'qsr') {
    // Check for QSR first (most specific) - check multiple variations and common QSR keywords
    if (text.includes('qsr') || 
        text.includes('quick service') || 
        text.includes('quick-service') ||
        text.includes('quick service restaurant') ||
        text.includes('fast food') ||
        text.includes('fast-food') ||
        (text.includes('corner') && (text.includes('restaurant') || text.includes('space')))) {
      return 'QSR'
    }
    if (text.includes('food court') || text.includes('fc')) {
      return 'Food Court'
    }
    if (text.includes('cafe') || text.includes('coffee')) {
      return 'Café'
    }
    if (text.includes('dessert') || text.includes('bakery')) {
      return 'Dessert / Bakery'
    }
    // Default for restaurant
    return 'Restaurant'
  }
  
  // Map other types
  const typeMap: Record<string, string> = {
    'office': 'Office',
    'retail': 'Retail',
    'warehouse': 'Warehouse',
    'other': 'Other',
    'kiosk': 'Kiosk',
    'commercial': 'Commercial',
    'mixed_use': 'Mixed Use',
  }
  
  return typeMap[propertyType.toLowerCase()] || propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
}

