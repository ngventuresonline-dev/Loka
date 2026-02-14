import { NextRequest, NextResponse } from 'next/server'
import { getPrisma, executePrismaQuery } from '@/lib/get-prisma'
import { generatePropertyId } from '@/lib/property-id-generator'
import bcrypt from 'bcryptjs'
import { generateSecurePassword, sendOwnerWelcomeEmail } from '@/lib/email-service'

/* TODO: Add auth when owner registration enabled
import { getAuthenticatedUser } from '@/lib/api-auth'
*/

export async function POST(request: NextRequest) {
  try {
    /* TODO: Add auth when owner registration enabled
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user || user.userType !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    */
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
          mapLink?: string
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

    // Get anon_id from request if available (for tracking) - declare once at top level
    const anonId = body.sessionId || body.userId || null

    // If ownerId is provided, skip owner creation/validation
    // Otherwise, require owner contact info
    if (!providedOwnerId && (!owner?.name || !owner?.phone)) {
      return NextResponse.json(
        { success: false, error: 'Owner name and phone are required (or provide ownerId)' },
        { status: 400 }
      )
    }

    // Extract coordinates from mapLink if not provided
    let latitude = property?.latitude
    let longitude = property?.longitude
    
    // If coordinates are missing but mapLink is provided, try to extract them
    if ((!latitude || !longitude) && property?.mapLink) {
      const mapLink = property.mapLink.trim()
      
      // Try to extract coordinates from Google Maps link
      // Pattern 1: @lat,lng (most common)
      const atMatch = mapLink.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
      if (atMatch) {
        latitude = parseFloat(atMatch[1])
        longitude = parseFloat(atMatch[2])
      } else {
        // Pattern 2: /place/.../@lat,lng
        const placeMatch = mapLink.match(/\/place\/[^/]+\/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
        if (placeMatch) {
          latitude = parseFloat(placeMatch[1])
          longitude = parseFloat(placeMatch[2])
        } else {
          // Pattern 3: ?q=lat,lng or &q=lat,lng
          const qMatch = mapLink.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
          if (qMatch) {
            latitude = parseFloat(qMatch[1])
            longitude = parseFloat(qMatch[2])
          }
        }
      }
    }
    
    // Require either coordinates OR a valid Google Maps link
    const hasValidMapLink = property?.mapLink && (
      property.mapLink.includes('maps.google.com') ||
      property.mapLink.includes('google.com/maps') ||
      property.mapLink.includes('goo.gl/maps') ||
      property.mapLink.includes('maps.app.goo.gl')
    )
    
    if (!latitude || !longitude) {
      if (!hasValidMapLink) {
        return NextResponse.json(
          { success: false, error: 'Please provide either coordinates (latitude/longitude) or a valid Google Maps link' },
          { status: 400 }
        )
      }
      // Valid mapLink provided but coordinates couldn't be extracted - allow submission
      // Coordinates can be extracted later or the link can be used directly
      console.warn('[Owner Property API] No coordinates extracted from mapLink, but link is valid. Proceeding with submission.')
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
      // Use executePrismaQuery to handle connection pool timeouts with retry
      const existingOwner = await executePrismaQuery(async (p) => 
        p.user.findUnique({
          where: { id: providedOwnerId },
          select: { id: true, userType: true },
        })
      )

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
      // Use executePrismaQuery to handle connection pool timeouts with retry
      const existingOwnerByPhone = await executePrismaQuery(async (p) =>
        p.user.findFirst({
          where: {
            phone,
            userType: 'owner',
          },
          select: { id: true },
        })
      )

      if (existingOwnerByPhone) {
        ownerId = existingOwnerByPhone.id
        console.log('[Owner Property API] Reusing existing owner by phone:', ownerId)
      } else {
        // Try by email if provided and not placeholder
        if (email && !email.includes('@placeholder.email')) {
          const existingOwnerByEmail = await executePrismaQuery(async (p) =>
            p.user.findFirst({
              where: {
                email,
                userType: 'owner',
              },
              select: { id: true },
            })
          )

          if (existingOwnerByEmail) {
            ownerId = existingOwnerByEmail.id
            console.log('[Owner Property API] Reusing existing owner by email:', ownerId)
          }
        }

        // If no existing owner found, create new one
        if (!ownerId) {
          // anonId already declared at top level
          console.log('[LOKAZEN_DEBUG] USER_CREATE', 'Creating user from anon_id:', anonId)
          
          // Generate secure password for new owner
          const plainPassword = generateSecurePassword(12)
          const hashedPassword = await bcrypt.hash(plainPassword, 10)

          const ownerUser = await executePrismaQuery(async (p) =>
            p.user.create({
              data: {
                email,
                name,
                password: hashedPassword,
                phone,
                userType: 'owner',
              },
              select: { id: true, email: true, name: true },
            })
          )

          ownerId = ownerUser.id
          
          console.log('[LOKAZEN_DEBUG] USER_CREATE', 'User created:', {
            anon_id: anonId,
            user_id: ownerUser.id,
            email: ownerUser.email
          })

          // Link session to user immediately after user creation
          if (anonId && anonId.startsWith('anon_')) {
            try {
              console.log('[LOKAZEN_DEBUG] SESSION_LINK', 'Linking session to user after creation:', {
                anon_id: anonId,
                user_id: ownerUser.id
              })
              
              // Get existing session data
              const existingSession = await prisma.$queryRawUnsafe<Array<{ 
                id: string
                user_id: string
                filter_step: any 
              }>>(
                `SELECT id, user_id, filter_step FROM property_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
                anonId
              ).catch(() => [])
              
              if (existingSession.length > 0) {
                const session = existingSession[0]
                const existingFilterStep = session.filter_step || {}
                const existingData = typeof existingFilterStep === 'string' ? JSON.parse(existingFilterStep) : existingFilterStep
                
                // Preserve existing structure and update user_id
                const updatedFilterStep = {
                  userType: existingData.userType || 'owner',
                  filter_step: existingData.filter_step || {},
                  metadata: {
                    ...(existingData.metadata || {}),
                    userId: ownerUser.id,
                    lastUpdated: new Date().toISOString()
                  }
                }
                
                // Update session user_id from anon_id to actual user_id
                await prisma.$executeRawUnsafe(
                  `
                  UPDATE property_onboarding_sessions
                  SET 
                    user_id = $1::varchar,
                    filter_step = $2::jsonb,
                    updated_at = NOW()
                  WHERE user_id = $3::varchar
                  `,
                  ownerUser.id,
                  JSON.stringify(updatedFilterStep),
                  anonId
                )
                
                console.log('[LOKAZEN_DEBUG] SESSION_LINK', 'Session linked to user:', {
                  session_id: session.id,
                  old_user_id: anonId,
                  new_user_id: ownerUser.id
                })
              }
            } catch (err) {
              console.warn('[LOKAZEN_DEBUG] SESSION_LINK', 'Failed to link session after user creation:', err)
            }
          }

          // Optional: create an owner profile shell
          if (ownerId) {
            try {
              console.log('[LOKAZEN_DEBUG] OWNER_PROFILE', 'Creating owner profile:', {
                user_id: ownerId
              })
              
              const ownerProfile = await prisma.owner_profiles.create({
                data: {
                  user_id: ownerId,
                },
              })
              
              console.log('[LOKAZEN_DEBUG] OWNER_PROFILE', 'Owner profile created:', {
                profile_id: ownerProfile.id,
                user_id: ownerProfile.user_id
              })
            } catch (profileError: any) {
              // Don't fail the request if profile creation fails
              console.warn('[Owner Property API] Failed to create owner profile:', profileError?.message || profileError)
            }
          }

          // Send welcome email with login credentials (only if real email provided)
          if (email && !email.includes('@placeholder.email')) {
            try {
              const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lokazen.com'}/dashboard/owner`
              const emailResult = await sendOwnerWelcomeEmail(
                email,
                ownerUser.name || 'Property Owner',
                ownerId!,
                plainPassword,
                dashboardUrl
              )
              
              if (emailResult.success) {
                console.log('[Owner Property API] Welcome email sent successfully to:', email)
              } else {
                console.warn('[Owner Property API] Failed to send welcome email:', emailResult.error)
                // Don't fail the request if email fails
              }
            } catch (emailError: any) {
              console.error('[Owner Property API] Error sending welcome email:', emailError)
              // Don't fail the request if email fails
            }
          } else {
            console.log('[Owner Property API] Skipping email - placeholder email provided')
            // Log credentials for development/testing when no email
            if (process.env.NODE_ENV === 'development') {
              console.log('[Owner Property API] Generated credentials for owner:', {
                userId: ownerId,
                email,
                password: plainPassword,
                note: 'Email not sent - placeholder email provided'
              })
            }
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
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property data is required' },
        { status: 400 }
      )
    }
    
    const title =
      `${property.propertyType ? property.propertyType.toString().replace(/_/g, ' ') : 'Property'} in ${property.location || 'Bangalore'}`.trim()

    const description =
      property.description ||
      `Commercial property in ${property.location || 'Bangalore'} listed via onboarding form.`

    // Handle amenities properly - convert array to object format
    // Structure: { features: [...], map_link: "..." }
    let amenitiesData: any = {}

    // If amenities is array (legacy format from form)
    if (Array.isArray(property.amenities)) {
      amenitiesData = {
        features: property.amenities.filter(Boolean) // Remove any empty values
      }
    }
    // If amenities is already an object (new format or from update)
    else if (property.amenities && typeof property.amenities === 'object' && !Array.isArray(property.amenities)) {
      amenitiesData = { ...(property.amenities as Record<string, unknown>) }
      // Ensure features array exists
      if (!amenitiesData.features || !Array.isArray(amenitiesData.features)) {
        amenitiesData.features = []
      }
    }
    // If amenities is undefined/null/empty, start with empty features
    else {
      amenitiesData = {
        features: []
      }
    }

    // Add map_link to amenities object if provided
    if (property.mapLink && property.mapLink.trim()) {
      amenitiesData.map_link = property.mapLink.trim()
    }

    const images = property.images && property.images.length > 0
      ? property.images
      : []

    const size = property.size && property.size > 0 ? property.size : 0
    const rent = property.rent && property.rent > 0 ? property.rent : 0
    // Deposit is now sent as amount (already calculated from months * rent in frontend)
    // But handle legacy case where it might still be in months
    let securityDeposit: number | null = null
    if (property.deposit && property.deposit > 0) {
      // If deposit is less than rent, it's likely in months - convert it
      if (property.deposit < rent && rent > 0) {
        securityDeposit = rent * property.deposit
      } else {
        // Otherwise, it's already the amount
        securityDeposit = property.deposit
      }
    }

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

    // anonId already declared at top level
    console.log('[LOKAZEN_DEBUG] PROPERTY_CREATE', 'Creating property:', {
      owner_id: ownerId,
      anon_id: anonId
    })

    // Prepare property data
    const propertyData: any = {
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
      amenities: amenitiesData, // Contains both features array and map_link
      images,
      ownerId,
      status: 'pending', // New properties start as pending
      availability: false, // Set to false for pending approval - admin will approve and set to true
      isFeatured: false,
      views: 0,
      displayOrder: null,
    }

    // Note: latitude and longitude are not stored in the Property model
    // They are validated during creation but not persisted to the database
    // The mapLink is stored in amenities.map_link JSONB field (workaround for column timeout)

    // Use executePrismaQuery to handle connection pool timeouts with retry
    const propertyRow = await executePrismaQuery(async (p) =>
      p.property.create({
        data: propertyData,
        select: { id: true },
      })
    )
    
    console.log('[LOKAZEN_DEBUG] PROPERTY_CREATE', 'Property created:', {
      property_id: propertyRow.id,
      owner_id: ownerId
    })

    // Link session to user if anon_id exists - reuse anonId from top level
    if (anonId && ownerId && anonId.startsWith('anon_')) {
      try {
        console.log('[LOKAZEN_DEBUG] SESSION_COMPLETE', 'Linking session to user:', {
          anon_id: anonId,
          user_id: ownerId,
          property_id: propertyRow.id
        })
        
        // Get existing session data first
        const existingSession = await prisma.$queryRawUnsafe<Array<{ 
          id: string
          user_id: string
          filter_step: any 
          status: string
        }>>(
          `SELECT id, user_id, filter_step, status FROM property_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
          anonId
        ).catch(() => [])
        
        if (existingSession.length > 0) {
          const session = existingSession[0]
          const existingFilterStep = session.filter_step || {}
          const existingData = typeof existingFilterStep === 'string' ? JSON.parse(existingFilterStep) : existingFilterStep
          
          // Preserve existing structure (userType, filter_step, metadata)
          const updatedFilterStep = {
            userType: existingData.userType || 'owner',
            filter_step: existingData.filter_step || {},
            metadata: {
              ...(existingData.metadata || {}),
              status: 'completed',
              lastUpdated: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              userId: ownerId,
              propertyId: propertyRow.id
            }
          }
          
          // Update session to link anon_id to user_id
          await prisma.$executeRawUnsafe(
            `
            UPDATE property_onboarding_sessions
            SET 
              user_id = $1::varchar,
              filter_step = $2::jsonb,
              status = 'completed',
              updated_at = NOW()
            WHERE user_id = $3::varchar
            `,
            ownerId,
            JSON.stringify(updatedFilterStep),
            anonId
          )
          
          console.log('[LOKAZEN_DEBUG] SESSION_COMPLETE', 'Session linked successfully:', {
            old_user_id: anonId,
            new_user_id: ownerId,
            session_id: session.id
          })
        } else {
          console.warn('[LOKAZEN_DEBUG] SESSION_COMPLETE', 'No session found with anon_id:', anonId)
        }
        
        // Log full journey
        console.log('[LOKAZEN_DEBUG] JOURNEY_COMPLETE', 'Full ID mapping:', {
          '1_anon_id': anonId,
          '2_user_id': ownerId,
          '3_owner_id': ownerId,
          '4_property_id': propertyRow.id,
          flow: 'anon → user → owner_profile → property'
        })
      } catch (err) {
        console.error('[LOKAZEN_DEBUG] SESSION_COMPLETE', 'Error linking session:', err)
      }
    } else if (anonId && !anonId.startsWith('anon_')) {
      console.log('[LOKAZEN_DEBUG] SESSION_COMPLETE', 'anonId is not anonymous, skipping linking:', anonId)
    }

    // Send webhook to Pabbly
    const { sendPropertySubmissionWebhook } = await import('@/lib/pabbly-webhook')
    // Extract features array from amenitiesData for webhook (webhook expects array format)
    const amenitiesArray = Array.isArray(amenitiesData?.features) ? amenitiesData.features : []
    sendPropertySubmissionWebhook({
      ownerId,
      propertyId: propertyRow.id,
      propertyType: normalizedType,
      location: property.location || 'Bangalore',
      size: size || undefined,
      rent: rent || undefined,
      deposit: securityDeposit || undefined,
      amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
      ownerPhone: owner?.phone,
    }).catch(err => console.warn('[Owner Property API] Failed to send webhook:', err))

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
    const errorMessage = error?.message || error?.toString() || 'Unexpected error while creating property'
    
    // Return detailed error for debugging (in development)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        // Include error code if available for better debugging
        ...(error?.code && { code: error.code }),
      },
      { status: 500 }
    )
  }
}

