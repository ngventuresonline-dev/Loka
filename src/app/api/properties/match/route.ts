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

    // Build database query filters - make them more flexible
    // We'll use BFI scoring for matching, so we don't need strict filters
    const where: any = {
      OR: [
        { availability: true },
        { isFeatured: true }
      ]
    }

    // Don't apply strict location filter - let BFI scoring handle location matching
    // This allows properties in nearby areas to still show up
    
    // Size filter - make it more flexible (allow ±50% range)
    if (sizeRange) {
      const sizeMinExpanded = sizeRange.min ? Math.max(0, Math.floor(sizeRange.min * 0.5)) : 0
      const sizeMaxExpanded = sizeRange.max ? Math.ceil(sizeRange.max * 1.5) : 1000000
      
      where.size = {
        gte: sizeMinExpanded,
        lte: sizeMaxExpanded
      }
    }

    // Budget filter - make it more flexible (allow up to 50% over budget)
    // We'll filter more strictly in BFI scoring
    if (budgetRange && budgetRange.max) {
      const maxBudgetExpanded = Math.ceil(budgetRange.max * 1.5) // Allow 50% over
      where.price = {
        lte: maxBudgetExpanded
      }
    }

    // Property type filter - optional, BFI will score type matches
    // if (propertyType) {
    //   where.propertyType = propertyType
    // }

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
      take: 500 // accommodate larger DB, still bounded
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
      isFeatured: p.isFeatured ?? false,
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

    // Log matching info for debugging
    console.log(`[API Match] Total properties checked: ${typedProperties.length}`)
    console.log(`[API Match] Total matches found: ${matchResults.length}`)
    if (matchResults.length > 0) {
      const scores = matchResults.map(m => m.bfiScore.score)
      console.log(`[API Match] Score range: ${Math.min(...scores)}% - ${Math.max(...scores)}%`)
    }

    // Filter matches with >= 60% score (but show lower scores if no matches found)
    let filteredMatches = matchResults.filter(result => result.bfiScore.score >= 60)
    
    // If no matches >= 60%, progressively lower threshold to find any matches
    if (filteredMatches.length === 0 && matchResults.length > 0) {
      console.log(`[API Match] No matches >= 60%, checking lower thresholds...`)
      
      // Try >= 50%
      filteredMatches = matchResults.filter(result => result.bfiScore.score >= 50)
      if (filteredMatches.length === 0) {
        // Try >= 40%
        filteredMatches = matchResults.filter(result => result.bfiScore.score >= 40)
        if (filteredMatches.length === 0) {
          // Show all matches >= 30% (original minimum in findMatches)
          filteredMatches = matchResults.filter(result => result.bfiScore.score >= 30)
          console.log(`[API Match] Showing matches >= 30% (${filteredMatches.length} found)`)
        } else {
          console.log(`[API Match] Showing matches >= 40% (${filteredMatches.length} found)`)
        }
      } else {
        console.log(`[API Match] Showing matches >= 50% (${filteredMatches.length} found)`)
      }
    } else {
      console.log(`[API Match] Found ${filteredMatches.length} matches >= 60%`)
    }

    // Generate match reasons for each match
    const matchesWithReasons = filteredMatches.map(match => {
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

    // Return top 50 matches (already filtered to >= 60%)
    const topMatches = matchesWithReasons.slice(0, 50)

    return NextResponse.json({
      matches: topMatches,
      totalMatches: matchesWithReasons.length,
      minMatchScore: 60
    })
  } catch (error: any) {
    console.error('Property matching error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to find matches' },
      { status: 500 }
    )
  }
}

