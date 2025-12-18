import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { generatePropertyId } from '@/lib/property-id-generator'

export async function POST(request: NextRequest) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const {
      ownerId: providedOwnerId,
      owner,
      property,
    }: {
      ownerId?: string
      owner?: { name?: string; email?: string; phone?: string }
      property?: {
        propertyType?: string
        location?: string
        latitude?: number
        longitude?: number
        size?: number
        rent?: number
        deposit?: number
        amenities?: string[]
        description?: string
        images?: string[]
      }
    } = body

    // If ownerId is provided, skip owner creation/validation
    // Otherwise, require owner contact info
    if (!providedOwnerId && (!owner?.name || !owner?.phone)) {
      return NextResponse.json(
        { success: false, error: 'Owner name and phone are required (or provide ownerId)' },
        { status: 400 }
      )
    }

    if (!property?.latitude || !property?.longitude) {
      return NextResponse.json(
        { success: false, error: 'Pinned latitude and longitude are required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    // 1) Get or create owner
    let ownerId: string | null = null

    if (providedOwnerId) {
      // Use provided ownerId - verify it exists
      const existingOwner = await prisma.user.findUnique({
        where: { id: providedOwnerId },
        select: { id: true, userType: true },
      })

      if (!existingOwner || existingOwner.userType !== 'owner') {
        return NextResponse.json(
          { success: false, error: 'Invalid ownerId provided' },
          { status: 400 }
        )
      }

      ownerId = providedOwnerId
      console.log('[Owner Property API] Using provided ownerId:', ownerId)
    } else if (owner) {
      // Check if owner already exists (by phone or email)
      const email = (owner.email || '').trim() || `owner-${Date.now()}@placeholder.email`
      const name = (owner.name || '').trim() || 'Property Owner'
      const phone = (owner.phone || '').trim()

      // Try to find existing owner by phone first (most reliable)
      const existingOwnerByPhone = await prisma.user.findFirst({
        where: {
          phone,
          userType: 'owner',
        },
        select: { id: true },
      })

      if (existingOwnerByPhone) {
        ownerId = existingOwnerByPhone.id
        console.log('[Owner Property API] Reusing existing owner by phone:', ownerId)
      } else {
        // Try by email if provided and not placeholder
        if (email && !email.includes('@placeholder.email')) {
          const existingOwnerByEmail = await prisma.user.findFirst({
            where: {
              email,
              userType: 'owner',
            },
            select: { id: true },
          })

          if (existingOwnerByEmail) {
            ownerId = existingOwnerByEmail.id
            console.log('[Owner Property API] Reusing existing owner by email:', ownerId)
          }
        }

        // If no existing owner found, create new one
        if (!ownerId) {
          const placeholderPassword = '$2b$10$placeholder_hash_change_in_production'

          const ownerUser = await prisma.user.create({
            data: {
              email,
              name,
              password: placeholderPassword,
              phone,
              userType: 'owner',
            },
            select: { id: true },
          })

          ownerId = ownerUser.id

          // Optional: create an owner profile shell
          try {
            await prisma.owner_profiles.create({
              data: {
                user_id: ownerId,
              },
            })
          } catch (profileError: any) {
            // Don't fail the request if profile creation fails
            console.warn('[Owner Property API] Failed to create owner profile:', profileError?.message || profileError)
          }
        }
      }
    }

    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create or find owner' },
        { status: 500 }
      )
    }

    // 2) Create property record in Prisma
    const title =
      `${property.propertyType ? property.propertyType.toString().replace(/_/g, ' ') : 'Property'} in ${property.location || 'Bangalore'}`.trim()

    const description =
      property.description ||
      `Commercial property in ${property.location || 'Bangalore'} listed via onboarding form.`

    const amenities = property.amenities && property.amenities.length > 0
      ? property.amenities
      : []

    const images = property.images && property.images.length > 0
      ? property.images
      : []

    const size = property.size && property.size > 0 ? property.size : 0
    const rent = property.rent && property.rent > 0 ? property.rent : 0
    const securityDeposit =
      property.deposit && property.deposit > 0 ? property.deposit : null

    const rawType = (property.propertyType || '').toLowerCase()
    const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other'] as const
    let normalizedType: (typeof validTypes)[number] = 'other'

    if (rawType === 'office' || rawType.includes('business-park') || rawType.includes('it-park') || rawType.includes('co-working-space')) {
      normalizedType = 'office'
    } else if (rawType === 'retail' || rawType.includes('mall-space') || rawType.includes('showroom') || rawType.includes('kiosk')) {
      normalizedType = 'retail'
    } else if (rawType === 'warehouse' || rawType.includes('industrial-space')) {
      normalizedType = 'warehouse'
    } else if (
      rawType === 'restaurant' ||
      rawType.includes('food-court') ||
      rawType.includes('cafe-coffee-shop') ||
      rawType.includes('qsr') ||
      rawType.includes('dessert-bakery') ||
      rawType.includes('food') ||
      rawType.includes('restaurant')
    ) {
      normalizedType = 'restaurant'
    } else if (
      rawType.includes('bungalow') ||
      rawType.includes('villa') ||
      rawType.includes('standalone-building') ||
      rawType.includes('commercial-complex') ||
      rawType.includes('service-apartment') ||
      rawType.includes('hotel-hospitality') ||
      rawType.includes('land') ||
      rawType === 'other'
    ) {
      normalizedType = 'other'
    } else if (validTypes.includes(rawType as any)) {
      normalizedType = rawType as (typeof validTypes)[number]
    }

    const propertyId = await generatePropertyId()

    const propertyRow = await prisma.property.create({
      data: {
        id: propertyId,
        title,
        description,
        address: property.location || 'Bangalore',
        city: property.location || 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001',
        price: rent,
        priceType: 'monthly',
        securityDeposit,
        rentEscalation: null,
        size,
        propertyType: normalizedType,
        storePowerCapacity: null,
        powerBackup: false,
        waterFacility: false,
        amenities,
        images,
        ownerId,
        status: 'pending', // New properties start as pending
        availability: false, // Set to false for pending approval - admin will approve and set to true
        isFeatured: false,
        views: 0,
        displayOrder: null,
      },
      select: { id: true },
    })

    return NextResponse.json(
      {
        success: true,
        ownerId,
        propertyId: propertyRow.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Owner Property API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unexpected error while creating property',
      },
      { status: 500 }
    )
  }
}

