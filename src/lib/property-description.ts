import type { property_type_enum } from '@prisma/client'

// Simple deterministic hash so different properties get different variants
function hashString(source: string): number {
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return hash
}

function pickVariant(source: string, options: string[]): string {
  if (options.length === 0) return ''
  const idx = hashString(source) % options.length
  return options[idx]
}

/** Normalize amenities from DB: can be array, or object { features: string[], map_link?: string } */
function toAmenityArray(
  raw: string[] | { features?: string[] } | null | undefined
): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object' && Array.isArray(raw.features)) return raw.features
  return []
}

interface DescriptionInput {
  title: string
  city?: string | null
  size?: number | null
  propertyType: property_type_enum | string
  amenities?: string[] | null
  price?: number | null
}

export function generatePropertyDescription(input: DescriptionInput): string {
  const city = input.city?.trim() || 'a prime F&B micro-market'
  const size =
    typeof input.size === 'number' && input.size > 0
      ? `${input.size.toLocaleString()} sq ft`
      : 'well-sized'

  const type = String(input.propertyType)
  const titleLower = input.title.toLowerCase()
  const hashKey = `${input.title}|${city}|${type}`

  const isFoodCourt =
    titleLower.includes('food court') ||
    type.includes('food')

  const isQsr =
    titleLower.includes('qsr') ||
    titleLower.includes('quick service') ||
    titleLower.includes('takeaway') ||
    titleLower.includes('kiosk')

  const isCafe =
    titleLower.includes('café') ||
    titleLower.includes('cafe') ||
    titleLower.includes('coffee')

  const isDessert =
    titleLower.includes('dessert') ||
    titleLower.includes('ice cream') ||
    titleLower.includes('creamery') ||
    titleLower.includes('bakery')

  let typeSentence = ''
  let headlineTypeLabel = 'commercial'

  if (isFoodCourt || type === 'restaurant') {
    headlineTypeLabel = 'F&B'
    if (isFoodCourt) {
      typeSentence = pickVariant(hashKey, [
        'Food court stall with captive seating and steady shared footfalls across dayparts.',
        'Food court counter well-placed to capture mall / multiplex traffic and impulse F&B orders.',
      ])
    } else if (isQsr) {
      typeSentence = pickVariant(hashKey, [
        'Compact QSR space built for high throughput, quick turnarounds and strong delivery volumes.',
        'Highly efficient QSR format with clear front-of-house and back-of-house separation for speed.',
      ])
    } else if (isCafe) {
      typeSentence = pickVariant(hashKey, [
        'Café-ready floor plate ideal for coffee, all-day dining and community-led experiences.',
        'Inviting café shell with cosy proportions suited for conversations, work-from-café and light bites.',
      ])
    } else if (isDessert) {
      typeSentence = pickVariant(hashKey, [
        'Dessert / bakery space positioned for impulse purchases and strong evening footfalls.',
        'Showcase space for desserts and bakery formats with good visibility and store-front branding.',
      ])
    } else {
      typeSentence = pickVariant(hashKey, [
        'Full-service F&B space suitable for casual dining, bar or multi-brand food court concepts.',
        'Restaurant-scale floor plate with kitchen-ready proportions and clear guest circulation.',
      ])
    }
  } else if (type === 'retail' || type.includes('retail')) {
    headlineTypeLabel = 'retail'
    typeSentence = pickVariant(hashKey, [
      'High-street retail frontage with strong visibility, deep glazing and merchandising-friendly layout.',
      'Retail-ready space designed for display-heavy brands and strong walk-in traffic.',
    ])
  } else if (type === 'office') {
    headlineTypeLabel = 'office'
    typeSentence = pickVariant(hashKey, [
      'Modern office / studio volume with clean spans and efficient cores, ready for fast fit-outs.',
      'Light-filled workspace footprint ideal for studios, consulting rooms or compact HQs.',
    ])
  } else if (type === 'warehouse') {
    headlineTypeLabel = 'warehousing'
    typeSentence = pickVariant(hashKey, [
      'Urban warehousing space suited for dark store, fulfillment or stock-holding operations.',
      'Back-of-house logistics unit with practical proportions for storage and dispatch.',
    ])
  } else {
    typeSentence = pickVariant(hashKey, [
      'Ready-to-fit commercial space that can support retail, F&B or service-led brands.',
      'Multi-format commercial floor that can host retail, experience or service concepts.',
    ])
  }

  const cityPhrase = city === 'a prime F&B micro-market'
    ? 'a prime F&B micro-market'
    : `one of ${city}'s most vibrant F&B destinations`

  const baseSentenceVariants = [
    `${size} ${headlineTypeLabel} space located in ${cityPhrase}.`,
    `${size} ${headlineTypeLabel} space positioned in ${cityPhrase}.`,
  ]
  const baseSentence = pickVariant(`${hashKey}-base`, baseSentenceVariants)

  const amenityHints: string[] = []
  const amenityList = toAmenityArray(input.amenities)
  const normalized = amenityList.map((a) => String(a).toLowerCase())

  if (normalized.some((a) => a.includes('parking'))) {
    amenityHints.push('Dedicated parking available for customers and staff.')
  }
  if (normalized.some((a) => a.includes('corner'))) {
    amenityHints.push('Corner visibility for better signage and dual-side frontage.')
  }
  if (normalized.some((a) => a.includes('ground'))) {
    amenityHints.push('Ground floor access for maximum walk-ins and effortless entry.')
  }

  const amenitySentence = amenityHints.length
    ? ` ${amenityHints.join(' ')}`
    : ''

  return `${baseSentence} ${typeSentence}${amenitySentence}`
}

interface TitleInput {
  title?: string | null
  propertyType: property_type_enum | string
  amenities?: string[] | null
  size?: number | null
}

export function generatePropertyTitle(input: TitleInput): string {
  const existingTitle = input.title?.trim() || ''
  const typeRaw = String(input.propertyType).toLowerCase()
  const lowerTitle = existingTitle.toLowerCase()
  const hashKey = `${existingTitle}|${typeRaw}`

  // Determine high-level F&B / Retail label
  let typeLabel = 'Commercial'
  if (
    typeRaw.includes('restaurant') ||
    typeRaw.includes('food') ||
    lowerTitle.includes('restaurant') ||
    lowerTitle.includes('food')
  ) {
    typeLabel = 'Restaurant'
  }
  if (
    typeRaw.includes('qsr') ||
    lowerTitle.includes('qsr') ||
    lowerTitle.includes('quick service') ||
    lowerTitle.includes('takeaway')
  ) {
    typeLabel = 'QSR'
  } else if (
    typeRaw.includes('cafe') ||
    typeRaw.includes('café') ||
    lowerTitle.includes('cafe') ||
    lowerTitle.includes('café') ||
    lowerTitle.includes('coffee')
  ) {
    typeLabel = 'Café'
  } else if (typeRaw.includes('retail') || lowerTitle.includes('retail')) {
    typeLabel = 'Retail'
  } else if (typeRaw.includes('office') || lowerTitle.includes('office')) {
    typeLabel = 'Office'
  } else if (typeRaw.includes('warehouse') || lowerTitle.includes('warehouse')) {
    typeLabel = 'Warehouse'
  }

  const amenities = toAmenityArray(input.amenities).map((a) =>
    String(a).toLowerCase()
  )

  const hasGround = amenities.some((a) => a.includes('ground'))
  const hasCorner = amenities.some((a) => a.includes('corner'))
  const hasHighVis =
    amenities.some((a) => a.includes('high') && a.includes('visib')) ||
    amenities.some((a) => a.includes('main road'))
  const hasParking = amenities.some((a) => a.includes('parking'))
  const hasStreetFacing = amenities.some((a) => a.includes('street'))

  // Multiple adjective options based on different factors
  const adjectiveOptions: string[] = []
  
  // Size-based adjectives
  if (input.size && input.size > 3000) {
    adjectiveOptions.push('Spacious', 'Large', 'Expansive')
  } else if (input.size && input.size > 2000) {
    adjectiveOptions.push('Spacious', 'Well-Sized', 'Generous')
  } else if (input.size && input.size < 1000) {
    adjectiveOptions.push('Compact', 'Cozy', 'Efficient')
  }
  
  // Visibility-based adjectives (only if actually high visibility)
  if (hasHighVis && hasCorner) {
    adjectiveOptions.push('High-Visibility', 'Premium', 'Prime Corner')
  } else if (hasHighVis) {
    adjectiveOptions.push('High-Visibility', 'Prime', 'Premium')
  } else if (hasCorner) {
    adjectiveOptions.push('Corner', 'Prime', 'Strategic')
  } else if (hasStreetFacing) {
    adjectiveOptions.push('Street-Facing', 'Prime', 'Well-Positioned')
  }
  
  // Ground floor specific adjectives (varied, not always high-visibility)
  if (hasGround && !hasHighVis && !hasCorner) {
    adjectiveOptions.push('Prime', 'Well-Located', 'Accessible', 'Convenient', 'Strategic')
  }
  
  // Default fallback
  if (adjectiveOptions.length === 0) {
    adjectiveOptions.push('Prime', 'Well-Positioned', 'Strategic', 'Premium')
  }

  // Pick adjective using hash for consistency
  const adjective = pickVariant(`${hashKey}-adj`, adjectiveOptions)

  const featureParts: string[] = []
  if (hasGround) featureParts.push('Ground Floor')
  if (hasCorner && !adjective.toLowerCase().includes('corner')) featureParts.push('Corner')

  const featurePhrase = featureParts.join(' ').trim()

  // Multiple title format variations
  const titleVariations: string[] = []
  
  if (featurePhrase) {
    // Format 1: [Adjective] [Feature] [Type] Space [Parking]
    titleVariations.push(`${adjective} ${featurePhrase} ${typeLabel} Space`)
    
    // Format 2: [Feature] [Type] Space [Adjective] [Parking]
    titleVariations.push(`${featurePhrase} ${typeLabel} Space`)
    
    // Format 3: [Adjective] [Type] Space on [Feature] [Parking]
    titleVariations.push(`${adjective} ${typeLabel} Space on ${featurePhrase}`)
  } else {
    // Format 1: [Adjective] [Type] Space [Parking]
    titleVariations.push(`${adjective} ${typeLabel} Space`)
    
    // Format 2: [Type] Space - [Adjective] [Parking]
    titleVariations.push(`${typeLabel} Space`)
  }
  
  // Add variations with different word orders
  if (hasParking) {
    const baseTitles = [...titleVariations]
    titleVariations.length = 0
    baseTitles.forEach(title => {
      titleVariations.push(`${title} with Parking`)
      titleVariations.push(`${title} + Parking`)
      if (!title.toLowerCase().includes('parking')) {
        titleVariations.push(`Parking-Enabled ${title}`)
      }
    })
  }

  // Pick a title variant using hash
  let title = pickVariant(hashKey, titleVariations)
  title = title.replace(/\s+/g, ' ').trim()

  // Ensure parking is mentioned if available
  if (hasParking && !title.toLowerCase().includes('parking')) {
    title += ' with Parking'
  }

  return title
}



