import { NextRequest, NextResponse } from 'next/server'
import { findMatches } from '@/lib/matching-engine'
import { Property } from '@/types/workflow'
import { getPrisma } from '@/lib/get-prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessType,
      sizeRange,
      locations,
      budgetRange,
      timeline,
      propertyType
    } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build database query filters
    const where: any = {
      availability: true
    }

    // Location filter
    if (locations && locations.length > 0) {
      where.OR = locations.map((loc: string) => ({
        city: { contains: loc, mode: 'insensitive' }
      }))
    }

    // Size filter
    if (sizeRange) {
      if (sizeRange.min) {
        where.size = { ...where.size, gte: sizeRange.min }
      }
      if (sizeRange.max) {
        where.size = { ...where.size, lte: sizeRange.max }
      }
    }

    // Budget filter (convert to monthly for comparison)
    if (budgetRange) {
      // We'll filter in memory after fetching, as priceType affects calculation
    }

    // Property type filter
    if (propertyType) {
      where.propertyType = propertyType
    }

    // Fetch properties from database
    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      take: 100 // Limit initial fetch
    })

    // Convert Prisma properties to Property type
    const typedProperties: Property[] = properties.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      address: p.address,
      city: p.city,
      state: p.state,
      zipCode: p.zipCode,
      price: p.price,
      priceType: p.priceType,
      size: p.size,
      propertyType: p.propertyType,
      condition: p.condition,
      amenities: p.amenities || [],
      accessibility: p.accessibility || false,
      parking: p.parking || false,
      publicTransport: p.publicTransport || false,
      ownerId: p.ownerId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      isAvailable: p.availability,
      images: p.images || []
    }))

    // Prepare brand requirements for BFI calculation
    const brandRequirements = {
      locations: locations || [],
      sizeMin: sizeRange?.min || 0,
      sizeMax: sizeRange?.max || 100000,
      budgetMin: budgetRange?.min || 0,
      budgetMax: budgetRange?.max || 10000000,
      businessType: businessType || ''
    }

    // Calculate BFI scores and rank using findMatches
    const matchResults = findMatches(typedProperties, brandRequirements)

    // Generate match reasons for each match
    const matchesWithReasons = matchResults.map(match => {
      const reasons: string[] = []
      const breakdown = match.bfiScore.breakdown
      
      // Location reasons
      if (breakdown.locationScore === 100) {
        reasons.push(`Perfect location match - in ${match.property.city}`)
      } else if (breakdown.locationScore >= 70) {
        reasons.push(`Good location - nearby your preferred areas`)
      }

      // Budget reasons
      const monthlyPrice = match.property.priceType === 'yearly' 
        ? match.property.price / 12 
        : match.property.price
      if (breakdown.budgetScore >= 80) {
        reasons.push(`Great value - ₹${Math.round(monthlyPrice).toLocaleString()}/month within your budget`)
      }

      // Size reasons
      if (breakdown.sizeScore >= 80) {
        reasons.push(`Ideal size - ${match.property.size.toLocaleString()} sqft perfect for ${businessType || 'your business'}`)
      }

      // Property features
      if (match.property.amenities.some(a => a.toLowerCase().includes('parking'))) {
        reasons.push(`Parking available`)
      }
      if (match.property.amenities.some(a => a.toLowerCase().includes('ground'))) {
        reasons.push(`Ground floor - high visibility`)
      }

      return {
        property: match.property,
        bfiScore: match.bfiScore.score,
        matchReasons: reasons.slice(0, 5),
        breakdown: breakdown
      }
    })

    // Return top 50 matches
    const topMatches = matchesWithReasons.slice(0, 50)

    return NextResponse.json({
      matches: topMatches,
      totalMatches: matchesWithReasons.length
    })
  } catch (error: any) {
    console.error('Property matching error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to find matches' },
      { status: 500 }
    )
  }
}

