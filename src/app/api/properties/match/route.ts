import { NextRequest, NextResponse } from 'next/server'
import { findMatches } from '@/lib/matching-engine'
import { Property } from '@/types/workflow'

// Dynamic import for prisma
async function getPrisma() {
  try {
    const prismaModule = await import('@/lib/prisma')
    return prismaModule.prisma
  } catch (e) {
    console.error('Failed to import Prisma:', e)
    return null
  }
}

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

    // Calculate BFI scores and rank
    const matches = findMatches(typedProperties, {
      businessType,
      sizeRange,
      locations,
      budgetRange,
      propertyType
    })

    // Return top 50 matches
    const topMatches = matches.slice(0, 50)

    return NextResponse.json({
      matches: topMatches.map(match => ({
        property: {
          id: match.property.id,
          title: match.property.title,
          description: match.property.description,
          address: match.property.address,
          city: match.property.city,
          state: match.property.state,
          zipCode: match.property.zipCode,
          price: match.property.price,
          priceType: match.property.priceType,
          size: match.property.size,
          propertyType: match.property.propertyType,
          condition: match.property.condition,
          amenities: match.property.amenities,
          accessibility: match.property.accessibility,
          parking: match.property.parking,
          publicTransport: match.property.publicTransport,
          images: match.property.images,
          isAvailable: match.property.isAvailable,
          createdAt: match.property.createdAt,
          updatedAt: match.property.updatedAt
        },
        bfiScore: match.bfiScore,
        matchReasons: match.matchReasons,
        breakdown: match.breakdown
      })),
      totalMatches: matches.length
    })
  } catch (error: any) {
    console.error('Property matching error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to find matches' },
      { status: 500 }
    )
  }
}

