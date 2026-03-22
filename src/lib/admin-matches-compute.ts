/**
 * Shared BFI/PFI match computation for admin matches API and CRM email sends.
 */

import { calculateBFI } from '@/lib/matching-engine'
import { getPincodeForBangaloreArea } from '@/lib/location-intelligence/bangalore-areas'

export interface ComputeAdminMatchesOptions {
  minScore: number
  brandId?: string | null
  /** When set, only these brands (e.g. bulk email). Overrides default take limit. */
  brandIds?: string[] | null
  propertyId?: string | null
  propertyType?: string | null
  location?: string | null
  brandName?: string | null
  /** Pagination for brand view */
  brandPage?: number
  brandLimit?: number
  propertyLimit?: number
}

export type AdminMatchRow = {
  id: string
  brand: {
    id: string
    name: string
    businessType: string
    email: string
    phone: string
    sizeRange: string
    budgetRange: string
    preferredLocations: string[]
    preferredPropertyTypes: string[]
  }
  property: {
    id: string
    title: string | null
    address: string | null
    city: string | null
    size: number | null
    price: number
    priceType: string | null
    propertyType: string | null
    owner: {
      id: string
      name: string | null
      email: string | null
      phone: string | null
    } | null
  }
  pfiScore: number
  bfiScore: number
  bfiBreakdown?: { locationScore: number; sizeScore: number; budgetScore: number; typeScore: number }
  matchQuality: 'Excellent' | 'Good' | 'Fair'
  createdAt: string
}

function calculatePFI(
  brandRequirements: {
    sizeMin: number
    sizeMax: number
    budgetMin: number
    budgetMax: number
    locations: string[]
    businessType: string
  },
  property: {
    size: number
    price: number
    priceType: 'monthly' | 'yearly'
    city: string
    propertyType: string
  }
): number {
  let totalScore = 0
  const sizeScore = calculateSizeMatch(property.size, brandRequirements.sizeMin, brandRequirements.sizeMax)
  totalScore += sizeScore * 0.3
  const monthlyPrice = property.priceType === 'yearly' ? property.price / 12 : property.price
  const budgetScore = calculateBudgetMatch(monthlyPrice, brandRequirements.budgetMin, brandRequirements.budgetMax)
  totalScore += budgetScore * 0.3
  const locationScore = calculateLocationMatch(property.city, brandRequirements.locations)
  totalScore += locationScore * 0.25
  const typeScore = calculateTypeMatch(property.propertyType, brandRequirements.businessType)
  totalScore += typeScore * 0.15
  return Math.round(totalScore)
}

function calculateSizeMatch(propertySize: number, minSize: number, maxSize: number): number {
  if (propertySize >= minSize && propertySize <= maxSize) return 100
  if (propertySize < minSize) {
    const diff = minSize - propertySize
    const percentDiff = diff / minSize
    if (percentDiff <= 0.1) return 80
    if (percentDiff <= 0.2) return 60
    return 30
  }
  // Property exceeds maxSize - penalize heavily. 2000 sqft for 150-500 is not a match
  const diff = propertySize - maxSize
  const percentOver = diff / maxSize
  if (percentOver <= 0.1) return 85   // up to 10% over
  if (percentOver <= 0.2) return 60   // up to 20% over
  if (percentOver <= 0.5) return 25   // up to 50% over
  return 0                             // >50% over max = exclude
}

function calculateBudgetMatch(monthlyRent: number, budgetMin: number, budgetMax: number): number {
  if (monthlyRent >= budgetMin && monthlyRent <= budgetMax) return 100
  if (monthlyRent < budgetMin) {
    const diff = budgetMin - monthlyRent
    const percentDiff = diff / budgetMin
    if (percentDiff <= 0.1) return 90
    if (percentDiff <= 0.2) return 80
    return 50
  }
  const diff = monthlyRent - budgetMax
  const percentDiff = diff / budgetMax
  if (percentDiff <= 0.1) return 70
  if (percentDiff <= 0.2) return 50
  return 20
}

function calculateLocationMatch(propertyCity: string, preferredLocations: string[]): number {
  if (!preferredLocations || preferredLocations.length === 0) return 50
  const propertyCityLower = propertyCity.toLowerCase()
  for (const location of preferredLocations) {
    if (propertyCityLower.includes(location.toLowerCase()) || location.toLowerCase().includes(propertyCityLower)) {
      return 100
    }
  }
  return 40
}

function calculateTypeMatch(propertyType: string, businessType: string): number {
  if (!businessType) return 50
  const propertyLower = propertyType.toLowerCase()
  const businessLower = businessType.toLowerCase()
  if (businessLower.includes('café') || businessLower.includes('cafe') || businessLower.includes('qsr')) {
    if (propertyLower.includes('retail') || propertyLower.includes('restaurant')) return 100
  }
  if (businessLower.includes('restaurant')) {
    if (propertyLower.includes('restaurant') || propertyLower.includes('retail')) return 100
  }
  if (businessLower.includes('retail')) {
    if (propertyLower.includes('retail')) return 100
  }
  if (propertyLower.includes('retail') && (businessLower.includes('café') || businessLower.includes('cafe'))) {
    return 80
  }
  return 40
}

function getMatchQuality(score: number): 'Excellent' | 'Good' | 'Fair' {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  return 'Fair'
}

function mapPropertyTypeFilter(propertyType: string | null | undefined): string | undefined {
  if (!propertyType) return undefined
  const normalizedType = propertyType.toLowerCase()
  if (
    normalizedType.includes('office') ||
    normalizedType.includes('business park') ||
    normalizedType.includes('it park') ||
    normalizedType.includes('co-working')
  ) {
    return 'office'
  }
  if (
    normalizedType.includes('retail') ||
    normalizedType.includes('mall') ||
    normalizedType.includes('showroom') ||
    normalizedType.includes('kiosk')
  ) {
    return 'retail'
  }
  if (normalizedType.includes('warehouse') || normalizedType.includes('industrial')) {
    return 'warehouse'
  }
  if (
    normalizedType.includes('restaurant') ||
    normalizedType.includes('food court') ||
    normalizedType.includes('café') ||
    normalizedType.includes('cafe') ||
    normalizedType.includes('qsr') ||
    normalizedType.includes('dessert') ||
    normalizedType.includes('bakery')
  ) {
    return 'restaurant'
  }
  return 'other'
}

/**
 * Compute all property–brand matches for admin (same rules as GET /api/admin/matches).
 */
export async function computeAdminMatches(
  prisma: any,
  options: ComputeAdminMatchesOptions
): Promise<AdminMatchRow[]> {
  const {
    minScore,
    brandId = null,
    brandIds = null,
    propertyId = null,
    propertyType = null,
    location = null,
    brandName = null,
    brandPage = 1,
    brandLimit = 100,
    propertyLimit = 300,
  } = options

  const propertyTypeFilter = mapPropertyTypeFilter(propertyType)

  const brandWhere =
    brandIds && brandIds.length > 0
      ? ({ id: { in: brandIds } } as { id: { in: string[] } })
      : {
          ...(brandName
            ? { company_name: { contains: brandName, mode: 'insensitive' as const } }
            : {}),
        }

  const totalBrands =
    brandIds?.length
      ? brandIds.length
      : await prisma.brand_profiles.count({ where: brandWhere })

  const brands = await prisma.brand_profiles.findMany({
    where: brandWhere,
    orderBy: { company_name: 'asc' },
    ...(brandIds?.length ? {} : { skip: (Math.max(1, brandPage) - 1) * brandLimit, take: brandLimit }),
    select: {
      id: true,
      company_name: true,
      industry: true,
      min_size: true,
      max_size: true,
      budget_min: true,
      budget_max: true,
      preferred_locations: true,
      preferred_property_types: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  const properties = await prisma.property.findMany({
    where: {
      availability: true,
      ...(propertyId ? { id: propertyId } : {}),
      ...(propertyTypeFilter ? { propertyType: propertyTypeFilter as 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other' } : {}),
      ...(location ? { city: { contains: location, mode: 'insensitive' } } : {}),
    },
    take: propertyLimit,
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      size: true,
      price: true,
      priceType: true,
      propertyType: true,
      amenities: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  const allMatches: AdminMatchRow[] = []

  for (const brand of brands) {
    if (brandId && brand.id !== brandId) continue

    const sizeMin = brand.min_size ?? 0
    const sizeMax = brand.max_size ?? Number.MAX_SAFE_INTEGER
    const budgetMin = brand.budget_min ? Number(brand.budget_min) : 0
    const budgetMax = brand.budget_max ? Number(brand.budget_max) : Number.MAX_SAFE_INTEGER
    const locations = Array.isArray(brand.preferred_locations) ? (brand.preferred_locations as string[]) : []
    const propertyTypes = Array.isArray(brand.preferred_property_types) ? (brand.preferred_property_types as string[]) : []

    const brandRequirements = {
      locations,
      sizeMin,
      sizeMax,
      budgetMin,
      budgetMax,
      businessType: brand.industry || '',
    }

    for (const property of properties) {
      const propSize = property.size ?? 0
      // Hard filter: skip properties that exceed brand's max size by >50%
      if (sizeMax !== Number.MAX_SAFE_INTEGER && sizeMax > 0 && propSize > sizeMax * 1.5) continue

      const pfiScore = calculatePFI(brandRequirements, {
        size: propSize,
        price: Number(property.price),
        priceType: property.priceType as 'monthly' | 'yearly',
        city: property.city || '',
        propertyType: property.propertyType || '',
      })

      if (pfiScore >= minScore) {
        const propertyForBFI = {
          id: property.id,
          title: property.title || 'Untitled Property',
          description: '',
          address: property.address || '',
          city: property.city || '',
          state: (property as { state?: string }).state || 'Karnataka',
          zipCode: (property as { zipCode?: string }).zipCode || getPincodeForBangaloreArea((property as { area?: string }).area) || '560001',
          price: Number(property.price) || 0,
          priceType: (property.priceType || 'monthly') as 'monthly' | 'yearly' | 'sqft',
          size: property.size || 0,
          propertyType: (property.propertyType || 'other') as 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other',
          amenities: Array.isArray((property as { amenities?: unknown }).amenities)
            ? ((property as { amenities: string[] }).amenities as string[])
            : [],
          ownerId: property.owner?.id || '',
          createdAt: property.createdAt || new Date(),
          updatedAt: new Date(),
          isAvailable: true,
        }

        let bfiScore = pfiScore
        let bfiBreakdown: { locationScore: number; sizeScore: number; budgetScore: number; typeScore: number } | undefined

        try {
          const bfiResult = calculateBFI(propertyForBFI, brandRequirements)
          bfiScore = bfiResult.score
          bfiBreakdown = bfiResult.breakdown
        } catch (error) {
          console.error(`[Admin Matches] BFI error for ${property.id}:`, error)
        }

        allMatches.push({
          id: `${brand.id}-${property.id}`,
          brand: {
            id: brand.id,
            name: brand.company_name || 'Unknown Brand',
            businessType: brand.industry || 'Brand',
            email: brand.user?.email || '',
            phone: brand.user?.phone || '',
            sizeRange:
              sizeMin && sizeMax !== Number.MAX_SAFE_INTEGER
                ? `${sizeMin.toLocaleString()} - ${sizeMax.toLocaleString()} sqft`
                : 'Size flexible',
            budgetRange:
              budgetMin && budgetMax && budgetMax !== Number.MAX_SAFE_INTEGER
                ? `₹${(budgetMin / 1000).toFixed(0)}K - ₹${(budgetMax / 1000).toFixed(0)}K/month`
                : 'Budget flexible',
            preferredLocations: locations,
            preferredPropertyTypes: propertyTypes,
          },
          property: {
            id: property.id,
            title: property.title,
            address: property.address,
            city: property.city,
            size: property.size,
            price: Number(property.price),
            priceType: property.priceType,
            propertyType: property.propertyType,
            owner: property.owner,
          },
          pfiScore,
          bfiScore,
          bfiBreakdown,
          matchQuality: getMatchQuality(pfiScore),
          createdAt: property.createdAt?.toISOString() || new Date().toISOString(),
        })
      }
    }
  }

  allMatches.sort((a, b) => b.pfiScore - a.pfiScore)
  return { rows: allMatches, totalBrands }
}

export function groupMatchesByBrand(matches: AdminMatchRow[]) {
  const groupedByBrand: Record<
    string,
    { brand: AdminMatchRow['brand']; matches: AdminMatchRow[] }
  > = {}
  for (const match of matches) {
    if (!groupedByBrand[match.brand.id]) {
      groupedByBrand[match.brand.id] = {
        brand: match.brand,
        matches: [],
      }
    }
    groupedByBrand[match.brand.id].matches.push(match)
  }
  return groupedByBrand
}

export function groupMatchesByProperty(matches: AdminMatchRow[]) {
  const groupedByProperty: Record<
    string,
    { property: AdminMatchRow['property']; matches: AdminMatchRow[] }
  > = {}
  for (const match of matches) {
    if (!groupedByProperty[match.property.id]) {
      groupedByProperty[match.property.id] = {
        property: match.property,
        matches: [],
      }
    }
    groupedByProperty[match.property.id].matches.push(match)
  }
  return groupedByProperty
}
