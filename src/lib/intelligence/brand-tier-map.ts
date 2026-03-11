export const BRAND_TIER_MAP: Record<string, 'budget' | 'mid' | 'premium'> = {
  // PREMIUM CAFÉ
  'starbucks': 'premium',
  'blue tokai': 'premium',
  'third wave coffee': 'premium',
  'matteo coffea': 'premium',
  'subko': 'premium',
  'corridor seven': 'premium',

  // MID CAFÉ
  'café coffee day': 'mid',
  'ccd': 'mid',
  'barista': 'mid',
  'natural ice cream': 'mid',

  // BUDGET CAFÉ
  'darshini': 'budget',
  'udupi': 'budget',
  'id': 'budget',

  // PREMIUM QSR / CASUAL
  'social': 'premium',
  'truffles': 'premium',
  'boba bhai': 'mid',
  'go rally': 'mid',
  'gorally': 'mid',

  // MID QSR
  'mcdonalds': 'mid',
  'burger king': 'mid',
  'subway': 'mid',
  'dominos': 'mid',
  'pizza hut': 'mid',
  'kfc': 'mid',

  // BUDGET QSR
  'shanti sagar': 'budget',
  'vasudev adigas': 'budget',
  'veena stores': 'budget',

  // PREMIUM RETAIL
  'zara': 'premium',
  'h&m': 'premium',
  'marks & spencer': 'premium',
  'nykaa luxe': 'premium',

  // MID RETAIL
  'lifestyle': 'mid',
  'max fashion': 'mid',
  'westside': 'mid',
  'pantaloons': 'mid',

  // BUDGET RETAIL
  'reliance trends': 'budget',
  'v-mart': 'budget',
}

export function getBrandTier(brandName: string): 'budget' | 'mid' | 'premium' | null {
  const key = brandName.toLowerCase().trim()
  for (const [name, tier] of Object.entries(BRAND_TIER_MAP)) {
    if (key.includes(name)) return tier
  }
  return null
}
