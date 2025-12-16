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

interface DescriptionInput {
  title: string
  city?: string | null
  size?: number | null
  propertyType: property_type_enum | string
  amenities?: string[] | null
}

export function generatePropertyDescription(input: DescriptionInput): string {
  const city = input.city?.trim() || 'a prime micro-market'
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

  if (isFoodCourt || type === 'restaurant') {
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
    typeSentence = pickVariant(hashKey, [
      'High-street retail frontage with strong visibility, deep glazing and merchandising-friendly layout.',
      'Retail-ready space designed for display-heavy brands and strong walk-in traffic.',
    ])
  } else if (type === 'office') {
    typeSentence = pickVariant(hashKey, [
      'Modern office / studio volume with clean spans and efficient cores, ready for fast fit-outs.',
      'Light-filled workspace footprint ideal for studios, consulting rooms or compact HQs.',
    ])
  } else if (type === 'warehouse') {
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

  const baseSentenceVariants = [
    `Commercial space in ${city} with ${size} carpet area.`,
    `${size} commercial space positioned in ${city}, suited to high-street brand requirements.`,
  ]
  const baseSentence = pickVariant(`${hashKey}-base`, baseSentenceVariants)

  const amenityHints: string[] = []
  const amenities = input.amenities || []
  const normalized = amenities.map((a) => a.toLowerCase())

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
  city?: string | null
  propertyType: property_type_enum | string
}

export function generatePropertyTitle(input: TitleInput): string {
  const city = input.city?.trim() || ''
  const existingTitle = input.title?.trim() || ''
  const type = String(input.propertyType)

  const citySuffix = city ? ` in ${city}` : ''

  const lowerTitle = existingTitle.toLowerCase()
  const mentionsFoodCourt =
    lowerTitle.includes('food court') || lowerTitle.includes('fc')

  const hashKey = `${existingTitle}|${city}|${type}`

  if (type === 'restaurant') {
    if (mentionsFoodCourt) {
      return pickVariant(hashKey, [
        `Food Court F&B Stall${citySuffix}`,
        `High-Impact Food Court Counter${citySuffix}`,
      ])
    }
    if (
      lowerTitle.includes('qsr') ||
      lowerTitle.includes('quick service') ||
      lowerTitle.includes('takeaway') ||
      lowerTitle.includes('kiosk')
    ) {
      return pickVariant(hashKey, [
        `Premium QSR Space${citySuffix}`,
        `High-Throughput QSR Format${citySuffix}`,
      ])
    }
    if (
      lowerTitle.includes('café') ||
      lowerTitle.includes('cafe') ||
      lowerTitle.includes('coffee')
    ) {
      return pickVariant(hashKey, [
        `Neighbourhood Café Space${citySuffix}`,
        `Signature Coffee / Café Format${citySuffix}`,
      ])
    }
    if (
      lowerTitle.includes('dessert') ||
      lowerTitle.includes('ice cream') ||
      lowerTitle.includes('creamery') ||
      lowerTitle.includes('bakery')
    ) {
      return pickVariant(hashKey, [
        `Dessert / Bakery Format Store${citySuffix}`,
        `Impulse Dessert Kiosk / Store${citySuffix}`,
      ])
    }
    return pickVariant(hashKey, [
      `Prime Restaurant / Bar Space${citySuffix}`,
      `Full-Service Restaurant Format${citySuffix}`,
    ])
  }

  if (type === 'retail') {
    return pickVariant(hashKey, [
      `High-Street Retail Flagship${citySuffix}`,
      `Ground Floor Retail Front${citySuffix}`,
    ])
  }
  if (type === 'office') {
    return pickVariant(hashKey, [
      `Grade-A Office / Studio Space${citySuffix}`,
      `Compact Office / Studio Floor${citySuffix}`,
    ])
  }
  if (type === 'warehouse') {
    return pickVariant(hashKey, [
      `Urban Warehouse / Dark Store Unit${citySuffix}`,
      `Back-of-House Logistics Unit${citySuffix}`,
    ])
  }

  return pickVariant(hashKey, [
    `Ready-to-Fit Commercial Space${citySuffix}`,
    `Multi-Use Commercial Format${citySuffix}`,
  ])
}



