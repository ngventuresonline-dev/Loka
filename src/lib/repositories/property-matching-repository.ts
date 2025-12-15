import { prisma } from '@/lib/prisma'
import { calculateBFI, findMatches } from '@/lib/matching-engine'
import { Property } from '@/types/workflow'

export interface BrandMatchResult {
  property: Property
  bfiScore: number
  breakdown: {
    locationScore: number
    sizeScore: number
    budgetScore: number
    typeScore: number
  }
  matchReasons: string[]
}

/**
 * Get brand profile from database
 */
export async function getBrandProfile(brandId: string) {
  const brand = await prisma.user.findUnique({
    where: { id: brandId },
    include: {
      brandProfiles: true
    }
  })

  if (!brand || !brand.brandProfiles) {
    throw new Error('Brand profile not found')
  }

  const profile = brand.brandProfiles

  // Parse JSONB fields
  const preferredLocations = Array.isArray(profile.preferred_locations)
    ? profile.preferred_locations
    : typeof profile.preferred_locations === 'string'
    ? JSON.parse(profile.preferred_locations)
    : []

  const preferredPropertyTypes = Array.isArray(profile.preferred_property_types)
    ? profile.preferred_property_types
    : typeof profile.preferred_property_types === 'string'
    ? JSON.parse(profile.preferred_property_types)
    : []

  const mustHaveAmenities = Array.isArray(profile.must_have_amenities)
    ? profile.must_have_amenities
    : typeof profile.must_have_amenities === 'string'
    ? JSON.parse(profile.must_have_amenities)
    : []

  return {
    id: brand.id,
    name: brand.name,
    email: brand.email,
    companyName: profile.company_name,
    industry: profile.industry || '',
    preferredLocations: preferredLocations as string[],
    preferredPropertyTypes: preferredPropertyTypes as string[],
    budgetMin: profile.budget_min ? Number(profile.budget_min) : 0,
    budgetMax: profile.budget_max ? Number(profile.budget_max) : 10000000,
    minSize: profile.min_size || 0,
    maxSize: profile.max_size || 100000,
    mustHaveAmenities: mustHaveAmenities as string[]
  }
}

/**
 * Fetch all available properties from database
 */
export async function getAllAvailableProperties() {
  const properties = await prisma.property.findMany({
    where: {
      availability: true
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  })

  // Convert Prisma properties to Property type
  return properties.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description || '',
    address: p.address,
    city: p.city,
    state: p.state,
    zipCode: p.zipCode || '',
    price: Number(p.price),
    priceType: p.priceType,
    securityDeposit: p.securityDeposit ? Number(p.securityDeposit) : undefined,
    rentEscalation: p.rentEscalation ? Number(p.rentEscalation) : undefined,
    size: p.size,
    propertyType: p.propertyType,
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
    storePowerCapacity: p.storePowerCapacity || '',
    powerBackup: p.powerBackup || false,
    waterFacility: p.waterFacility || false,
    images: Array.isArray(p.images) ? p.images : [],
    ownerId: p.ownerId,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt || p.createdAt),
    isAvailable: p.availability !== false,
    condition: 'good' as const, // Default value
    accessibility: false, // Default value
    parking: false, // Default value
    publicTransport: false // Default value
  })) as Property[]
}

/**
 * Match properties for a brand based on their profile
 * Returns only matches with >60% BFI score
 */
export async function findMatchingPropertiesForBrand(
  brandId: string,
  minMatchScore: number = 60
): Promise<BrandMatchResult[]> {
  // Get brand profile
  const brandProfile = await getBrandProfile(brandId)

  // Get all available properties
  const properties = await getAllAvailableProperties()

  // Prepare brand requirements for BFI calculation
  const brandRequirements = {
    locations: brandProfile.preferredLocations,
    sizeMin: brandProfile.minSize,
    sizeMax: brandProfile.maxSize,
    budgetMin: brandProfile.budgetMin,
    budgetMax: brandProfile.budgetMax,
    businessType: brandProfile.industry
  }

  // Calculate BFI scores and rank using findMatches
  const matchResults = findMatches(properties, brandRequirements)

  // Filter matches above minimum score and generate reasons
  // Also log scores for debugging
  console.log(`[Matching] Total matches before filtering: ${matchResults.length}`)
  if (matchResults.length > 0) {
    console.log(`[Matching] Score range: ${Math.min(...matchResults.map(m => m.bfiScore.score))}% - ${Math.max(...matchResults.map(m => m.bfiScore.score))}%`)
    console.log(`[Matching] Matches >= ${minMatchScore}%: ${matchResults.filter(r => r.bfiScore.score >= minMatchScore).length}`)
  }

  const filteredMatches = matchResults
    .filter(result => result.bfiScore.score >= minMatchScore)
    .map(match => {
      const reasons: string[] = []
      const breakdown = match.bfiScore.breakdown

      // Location reasons
      if (breakdown.locationScore === 100) {
        reasons.push(`Perfect location match - in ${match.property.city}`)
      } else if (breakdown.locationScore >= 70) {
        reasons.push(`Good location - nearby your preferred areas`)
      }

      // Budget reasons
      const monthlyPrice =
        match.property.priceType === 'yearly'
          ? Number(match.property.price) / 12
          : Number(match.property.price)
      if (breakdown.budgetScore >= 80) {
        reasons.push(
          `Great value - ₹${Math.round(monthlyPrice).toLocaleString()}/month within your budget`
        )
      } else if (breakdown.budgetScore >= 60) {
        reasons.push(`Budget-friendly - ₹${Math.round(monthlyPrice).toLocaleString()}/month`)
      }

      // Size reasons
      if (breakdown.sizeScore >= 80) {
        reasons.push(
          `Ideal size - ${match.property.size.toLocaleString()} sqft perfect for ${brandProfile.industry || 'your business'}`
        )
      } else if (breakdown.sizeScore >= 60) {
        reasons.push(`Good size - ${match.property.size.toLocaleString()} sqft`)
      }

      // Property type reasons
      if (breakdown.typeScore >= 70) {
        reasons.push(`Perfect property type - ${match.property.propertyType} for ${brandProfile.industry || 'your business'}`)
      }

      // Amenity reasons
      const amenities = Array.isArray(match.property.amenities) ? match.property.amenities : []
      if (amenities.some((a: any) => String(a).toLowerCase().includes('parking'))) {
        reasons.push('Parking available')
      }
      if (amenities.some((a: any) => String(a).toLowerCase().includes('ground'))) {
        reasons.push('Ground floor - high visibility')
      }

      return {
        property: match.property,
        bfiScore: match.bfiScore.score,
        breakdown: breakdown,
        matchReasons: reasons.slice(0, 5) // Limit to top 5 reasons
      }
    })
    .sort((a, b) => b.bfiScore - a.bfiScore) // Sort by score descending

  return filteredMatches
}

