import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import {
  generatePropertyDescription,
  generatePropertyTitle,
} from '@/lib/property-description'
import {
  generateAdminListingDescriptionAI,
  generateAdminListingTitleAI,
  isGoogleAIConfigured,
  type PropertyFactsForListingAI,
} from '@/lib/admin-property-listing-ai'

function toFactsPayload(p: {
  title: string
  description: string | null
  address: string
  city: string
  state: string
  zipCode: string
  size: number
  propertyType: string
  price: { toNumber: () => number } | null
  priceType: string
  amenities: unknown
  availability: boolean | null
  powerBackup: boolean | null
  waterFacility: boolean | null
  storePowerCapacity: string | null
}): PropertyFactsForListingAI {
  return {
    title: p.title,
    description: p.description,
    address: p.address,
    city: p.city,
    state: p.state,
    zipCode: p.zipCode,
    size: p.size,
    propertyType: p.propertyType,
    price: p.price,
    priceType: p.priceType,
    amenities: p.amenities,
    availability: p.availability,
    powerBackup: p.powerBackup,
    waterFacility: p.waterFacility,
    storePowerCapacity: p.storePowerCapacity,
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json().catch(() => ({} as any))
    const { propertyId, all = false, mode } = body as {
      propertyId?: string
      all?: boolean
      mode?: 'title' | 'description' | 'both'
    }

    const modeValue = mode || 'description'
    const wantTitle = modeValue === 'title' || modeValue === 'both'
    const wantDescription = modeValue === 'description' || modeValue === 'both'

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Bulk regenerate mode (template-based; avoids AI cost and rate limits)
    if (all) {
      const properties = await prisma.property.findMany({
        select: {
          id: true,
          title: true,
          city: true,
          size: true,
          propertyType: true,
          amenities: true,
        },
      })

      let updated = 0
      for (const p of properties) {
        const data: any = {}

        if (wantDescription) {
          data.description = generatePropertyDescription({
            title: p.title,
            city: p.city,
            size: p.size,
            propertyType: p.propertyType,
            amenities: (p.amenities as string[]) || [],
          })
        }

        if (wantTitle) {
          data.title = generatePropertyTitle({
            propertyType: p.propertyType,
          })
        }

        if (Object.keys(data).length > 0) {
          await prisma.property.update({
            where: { id: p.id },
            data,
          })
          updated++
        }
      }

      return NextResponse.json({
        success: true,
        updated,
      })
    }

    // Single property mode
    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId is required when all=false' },
        { status: 400 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        size: true,
        propertyType: true,
        amenities: true,
        price: true,
        priceType: true,
        availability: true,
        powerBackup: true,
        waterFacility: true,
        storePowerCapacity: true,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const facts = toFactsPayload(property)
    const useAi = isGoogleAIConfigured()

    const data: any = {}
    let description: string | undefined
    let title: string | undefined

    if (wantDescription) {
      if (useAi) {
        try {
          description = await generateAdminListingDescriptionAI(facts)
        } catch (e) {
          console.error('[Describe Property] AI description failed, using template:', e)
          description = generatePropertyDescription({
            title: property.title,
            city: property.city,
            size: property.size,
            propertyType: property.propertyType,
            amenities: (property.amenities as string[]) || [],
            price: property.price ? property.price.toNumber() : undefined,
          })
        }
      } else {
        description = generatePropertyDescription({
          title: property.title,
          city: property.city,
          size: property.size,
          propertyType: property.propertyType,
          amenities: (property.amenities as string[]) || [],
          price: property.price ? property.price.toNumber() : undefined,
        })
      }
      data.description = description
    }

    if (wantTitle) {
      if (useAi) {
        try {
          title = await generateAdminListingTitleAI(facts)
        } catch (e) {
          console.error('[Describe Property] AI title failed, using template:', e)
          title = generatePropertyTitle({
            title: property.title,
            propertyType: property.propertyType,
            amenities: (property.amenities as string[]) || [],
            size: property.size,
          })
        }
      } else {
        title = generatePropertyTitle({
          title: property.title,
          propertyType: property.propertyType,
          amenities: (property.amenities as string[]) || [],
          size: property.size,
        })
      }
      data.title = title
    }

    if (Object.keys(data).length > 0) {
      await prisma.property.update({
        where: { id: property.id },
        data,
      })
    }

    return NextResponse.json({
      success: true,
      description,
      title,
      usedAi: useAi,
    })
  } catch (error: any) {
    console.error('[Describe Property] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate description' },
      { status: 500 }
    )
  }
}
