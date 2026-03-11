/**
 * Known brand names mapped to their category for competitor classification.
 * Used when Google Place types are ambiguous or missing.
 */
export const BRAND_CATEGORY_MAP: Record<string, string> = {
  // CAFÉS
  'starbucks': 'Cafe',
  'subko': 'Cafe',
  'blue tokai': 'Cafe',
  'third wave coffee': 'Cafe',
  'matteo coffea': 'Cafe',
  'corridor seven': 'Cafe',
  'café coffee day': 'Cafe',
  'ccd': 'Cafe',
  'barista': 'Cafe',
  'darshini': 'Cafe',
  'udupi': 'Cafe',
  'chai point': 'Cafe',
  'chaayos': 'Cafe',
  'davidoff': 'Cafe',
  'costa coffee': 'Cafe',
  'lavazza': 'Cafe',

  // QSR
  'kfc': 'QSR',
  'mcdonald': 'QSR',
  'mcdonalds': 'QSR',
  'burger king': 'QSR',
  'subway': 'QSR',
  'domino': 'QSR',
  'dominos': 'QSR',
  'pizza hut': 'QSR',
  'mumbai pav': 'QSR',
  'mumbai pav co': 'QSR',
  'shanti sagar': 'QSR',
  'vasudev adigas': 'QSR',
  'veena stores': 'QSR',
  'haldiram': 'QSR',
  'bikanervala': 'QSR',
  'jumboking': 'QSR',
  'faasos': 'QSR',
  'oven story': 'QSR',
  'la pino': 'QSR',

  // RESTAURANTS (Casual / Fine Dining)
  'empire': 'Restaurant',
  'empire restaurant': 'Restaurant',
  'meghana': 'Restaurant',
  'meghana foods': 'Restaurant',
  'meghana biryani': 'Restaurant',
  'aromas nandini': 'Restaurant',
  'chung wah': 'Restaurant',
  'chung wah restaurant': 'Restaurant',
  'chung wah chinese': 'Restaurant',
  'nandini': 'Restaurant',
  'mavalli tiffin': 'Restaurant',
  'mtr': 'Restaurant',
  'vidyarthi bhavan': 'Restaurant',
  'ctr': 'Restaurant',
  'truffles': 'Restaurant',
  'toit': 'Restaurant',
  'social': 'Restaurant',
  'boba bhai': 'Restaurant',
  'go rally': 'Restaurant',
  'gorally': 'Restaurant',
  'bira 91': 'Restaurant',
  'arbor brewing': 'Restaurant',
  'natural ice cream': 'Restaurant',

  // RETAIL
  'zara': 'Retail',
  'h&m': 'Retail',
  'marks & spencer': 'Retail',
  'nykaa': 'Retail',
  'lifestyle': 'Retail',
  'max fashion': 'Retail',
  'westside': 'Retail',
  'pantaloons': 'Retail',
  'reliance trends': 'Retail',
  'v-mart': 'Retail',
  'trends': 'Retail',

  // SALON / WELLNESS
  'lakme': 'Salon',
  'bblunt': 'Salon',
  'geetanjali': 'Salon',
  'natures basket': 'Retail',
}

export function getBrandCategory(brandName: string): string | null {
  const key = brandName.toLowerCase().trim()
  for (const [name, category] of Object.entries(BRAND_CATEGORY_MAP)) {
    if (key.includes(name)) return category
  }
  return null
}
