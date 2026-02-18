import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-security'
import { getPrisma } from '@/lib/get-prisma'
import { generatePropertyId } from '@/lib/property-id-generator'
import { logQuerySize, estimateJsonSize } from '@/lib/api-cache'
import { formatPropertyForPlatform } from '@/lib/property-formatter'

export async function GET(request: NextRequest) {
  // Enhanced admin security check
  const securityCheck = await requireAdminAuth(request, {
    checkRateLimit: true
  })

  if (!securityCheck.authorized) {
    await logAdminAction(request, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
      error: securityCheck.error
    })
    
      return NextResponse.json({
        success: false,
      error: securityCheck.error || 'Admin authentication required',
        properties: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
    }, { status: securityCheck.statusCode || 401 })
    }

  await logAdminAction(request, 'ADMIN_PROPERTIES_LIST_VIEW')
  
  try {
    const { searchParams } = new URL(request.url)

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1')
    const requestedLimit = parseInt(searchParams.get('limit') || '50')
    // Enforce maximum limit of 50 to reduce egress
    const limit = Math.min(requestedLimit, 50)
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const prisma = await getPrisma()
    if (!prisma) {
      console.error('[Admin properties] ❌ Prisma client not available')
      return NextResponse.json({
        success: false,
        error: 'Database not available',
        properties: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
      }, { status: 503 })
    }

    const where: any = {}
    
    // Check if status column exists (do this once before building filters)
    let statusColumnExists = false
    if (status) {
      try {
        // Check if status column exists by attempting a simple query
        await prisma.$queryRawUnsafe(`SELECT status FROM properties LIMIT 1`)
        statusColumnExists = true
        console.log('[Admin properties] ✅ Status column exists, using status filter')
      } catch (colError: any) {
        // Status column doesn't exist, will use availability fallback
        statusColumnExists = false
        console.log('[Admin properties] ⚠️ Status column not found, using availability fallback')
      }
    }
    
    // Build search filter
    const searchFilters: any[] = []
    if (search) {
      searchFilters.push(
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      )
    }

    // Build all filter conditions
    const andConditions: any[] = []
    
    // Add location filter
    if (location) {
      andConditions.push({ city: location })
    }
    
    // Add search filters if present
    if (searchFilters.length > 0) {
      andConditions.push({ OR: searchFilters })
    }
    
    // Add status filter - use status column if it exists, otherwise fallback to availability
    if (status === 'pending') {
      if (statusColumnExists) {
        andConditions.push({ status: 'pending' })
      } else {
        // Fallback to availability if status column doesn't exist
        // Pending properties are typically not available
        andConditions.push({ availability: false })
      }
    } else if (status === 'approved') {
      if (statusColumnExists) {
        andConditions.push({ status: 'approved' })
      } else {
        // Fallback: approved properties are typically available
        andConditions.push({
          OR: [
            { availability: true },
            { isFeatured: true }
          ]
        })
      }
    } else if (status === 'rejected') {
      if (statusColumnExists) {
        andConditions.push({ status: 'rejected' })
      } else {
        // Fallback: rejected properties are typically not available
        andConditions.push({ availability: false })
      }
    } else if (status === 'available') {
      andConditions.push({ availability: true })
    } else if (status === 'occupied') {
      andConditions.push({ availability: false })
    }
    
    // Combine all conditions
    if (andConditions.length > 0) {
      if (andConditions.length === 1) {
        // If only one condition, use it directly
        Object.assign(where, andConditions[0])
      } else {
        // Multiple conditions, use AND
        where.AND = andConditions
      }
    }

    const orderBy: any = {}
    if (sortBy === 'date') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'rent') {
      orderBy.price = sortOrder
    }

    // Ensure orderBy is not empty (default to createdAt desc)
    if (Object.keys(orderBy).length === 0) {
      orderBy.createdAt = 'desc'
    }

    // Fetch ALL properties (admin should see everything)
    console.log('[Admin properties] 🔍 Fetching properties with filters:', JSON.stringify({ where, orderBy, page, limit }))
    
    let properties
    try {
      // DON'T call $connect() explicitly - Prisma connects automatically on first query
      // Calling $connect() can cause connection pool exhaustion with connection_limit=1
      
      // Get total count first (for debugging)
      // This will automatically establish connection if needed
      const totalCount = await prisma.property.count()
      console.log('[Admin properties] 📊 Total properties in database:', totalCount)
      
      if (totalCount === 0) {
        console.warn('[Admin properties] ⚠️ Database has ZERO properties!')
        return NextResponse.json({
          success: true,
          properties: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
          message: 'No properties found in database'
        })
      }
      
      // Ensure where is a valid object (empty object is valid for Prisma = all records)
      const queryWhere = Object.keys(where).length > 0 ? where : {}
      
      // Select only needed fields - include status if it exists
      // Try to include status, but handle gracefully if column doesn't exist
      const selectFields: any = {
        id: true,
        title: true,
        address: true,
        city: true,
        size: true,
        price: true,
        priceType: true,
        availability: true,
        isFeatured: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
      
      // Try to include status field
      try {
        // Check if status column exists by attempting a test query
        await prisma.$queryRawUnsafe(`SELECT status FROM properties LIMIT 1`)
        selectFields.status = true
      } catch {
        // Status column doesn't exist, skip it
        console.log('[Admin properties] Status column not found, using availability as fallback')
      }
      
      properties = await prisma.property.findMany({
        where: queryWhere,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: selectFields
      })
      console.log('[Admin properties] ✅ Fetched', properties.length, 'properties from database')
      
      if (properties.length === 0 && totalCount > 0) {
        console.warn('[Admin properties] ⚠️ Query returned 0 properties but database has', totalCount, '- possible filter issue')
      }
    } catch (dbError: any) {
      console.error('[Admin properties] ❌ Database query error:', {
        message: dbError?.message,
        code: dbError?.code,
        name: dbError?.name,
        stack: dbError?.stack?.substring(0, 300)
      })
      
      // If error is about status column not existing, fallback to availability filter
      if (dbError?.message?.includes('status') || dbError?.code === 'P2009' || dbError?.message?.includes('Unknown column') || dbError?.message?.includes('column') && dbError?.message?.includes('does not exist')) {
        console.warn('[Admin properties] ⚠️ Status column not found, falling back to availability filter')
        
        // Remove status from where clause and use availability instead
        const fallbackWhere: any = {}
        
        // Preserve existing filters (search, location, etc.)
        if (where.OR) {
          fallbackWhere.OR = where.OR
        }
        if (where.city) {
          fallbackWhere.city = where.city
        }
        
        // Map status filter to availability
        if (status === 'pending') {
          fallbackWhere.availability = false
        } else if (status === 'approved') {
          fallbackWhere.availability = true
        } else if (status === 'rejected') {
          fallbackWhere.availability = false
        } else if (status === 'available') {
          fallbackWhere.availability = true
        } else if (status === 'occupied') {
          fallbackWhere.availability = false
        }
        // If no status filter, don't add availability filter (show all)
        
        try {
          properties = await prisma.property.findMany({
            where: fallbackWhere,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              size: true,
              price: true,
              priceType: true,
              availability: true,
              isFeatured: true,
              createdAt: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          })
          
          // Status will be undefined in fallback case, which is handled in formatting
          console.log('[Admin properties] ✅ Fallback query fetched', properties.length, 'properties')
        } catch (fallbackError: any) {
          console.error('[Admin properties] ❌ Fallback query also failed:', fallbackError?.message)
          return NextResponse.json({
            success: false,
            error: 'Database query failed',
            details: fallbackError?.message || 'Unknown database error',
            properties: [],
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0
          }, { status: 500 })
        }
      } else {
        // Return valid JSON with empty array - don't fail completely
        return NextResponse.json({
          success: false,
          error: 'Database query failed',
          details: dbError?.message || 'Unknown database error',
          properties: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0
        }, { status: 500 })
      }
    }

    // Get total count for pagination
    let total = properties.length
    try {
      total = await prisma.property.count({ where })
      console.log('[Admin properties] Total properties matching filters:', total)
    } catch (countError: any) {
      console.warn('[Admin properties] Count query failed, using fetched length:', countError?.message || countError)
      // Use properties.length as fallback
      total = properties.length
    }

    let formattedProperties = properties.map(p => {
      // Normalise status for legacy rows:
      // - If status is null and availability=true  -> treat as approved
      // - If status is null and availability=false -> treat as pending
      const rawStatus = (p as any).status as 'pending' | 'approved' | 'rejected' | null | undefined
      const availability = p.availability ?? true
      const effectiveStatus: 'pending' | 'approved' | 'rejected' =
        rawStatus ?? (availability ? 'approved' : 'pending')

      // Type-safe owner access
      const owner = p.owner as { name?: string; email?: string } | null
      
      // Type-safe createdAt access
      const createdAt = p.createdAt as Date | null | undefined
      const createdAtISO = createdAt instanceof Date 
        ? createdAt.toISOString() 
        : (createdAt ? new Date(createdAt).toISOString() : new Date().toISOString())
      
      // Convert Decimal/BigInt to number/string to avoid serialization errors
      const safePrice = typeof p.price === 'object' && p.price !== null && 'toNumber' in p.price
        ? (p.price as any).toNumber()
        : typeof p.price === 'bigint'
        ? Number(p.price)
        : Number(p.price) || 0

      return {
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        owner: {
          name: owner?.name || 'Unknown',
          email: owner?.email || '',
        },
        size: Number(p.size) || 0,
        price: safePrice,
        priceType: p.priceType,
        status: effectiveStatus,
        availability,
        createdAt: createdAtISO,
        isFeatured: p.isFeatured ?? false,
      }
    })
    
    // Final filter: Since we're using availability-based filtering in the where clause,
    // the filtering is already done. But we can apply additional client-side filtering
    // if needed based on the derived status.
    // Note: The where clause already handles most filtering, so this is mainly for
    // ensuring consistency with the derived status values.

    console.log('[Admin properties] ✅ Returning', formattedProperties.length, 'properties (total in DB:', total, ')')

    const responseData = {
      success: true,
      properties: formattedProperties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
    
    // Log query size for monitoring egress (wrap in try-catch to avoid breaking on errors)
    try {
      const responseSize = estimateJsonSize(responseData)
      logQuerySize('/api/admin/properties', responseSize, formattedProperties.length)
    } catch (logError) {
      console.warn('[Admin properties] Failed to log query size:', logError)
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('[Admin properties] ❌ Unexpected error:', error)
    console.error('[Admin properties] Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.substring(0, 500)
    })
    
    // Check if it's a database schema error (missing column)
    if (error?.message?.includes('Unknown column') || 
        error?.message?.includes('does not exist') ||
        error?.code === 'P2009' ||
        error?.message?.includes('status')) {
      console.warn('[Admin properties] ⚠️ Database schema issue detected, returning empty result')
      return NextResponse.json({
        success: true,
        properties: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        message: 'Database schema may be missing some columns. Please check database migration.'
      })
    }
    
    // ALWAYS return valid JSON - never fail completely
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch properties',
      properties: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json()

    // Extract raw data
    const rawTitle = String(body.title || '').trim()
    const rawDescription = body.description ? String(body.description).trim() : ''
    const rawAddress = String(body.address || body.location || '').trim()
    const rawCity = String(body.city || '').trim()
    const rawArea = body.area ? String(body.area).trim() : ''
    const rawState = body.state ? String(body.state).trim() : ''
    const rawZipCode = body.zipCode ? String(body.zipCode).trim() : ''
    const rawPrice = body.price || body.rent
    const rawPriceType = body.priceType
    const rawSecurityDeposit = body.securityDeposit || body.deposit
    const rawRentEscalation = body.rentEscalation
    const rawSize = body.size
    const rawPropertyType = body.propertyType
    const storePowerCapacity = body.storePowerCapacity ? String(body.storePowerCapacity).trim() : ''
    const powerBackup = Boolean(body.powerBackup)
    const waterFacility = Boolean(body.waterFacility)
    const amenitiesArray = Array.isArray(body.amenities) ? body.amenities : []
    const images = Array.isArray(body.images) ? body.images : []
    const mapLink = body.mapLink ? String(body.mapLink).trim() : ''
    const latitude = body.latitude ? (typeof body.latitude === 'string' ? parseFloat(body.latitude) : body.latitude) : null
    const longitude = body.longitude ? (typeof body.longitude === 'string' ? parseFloat(body.longitude) : body.longitude) : null
    
    const ownerId = body.ownerId as string | undefined
    const availability = body.availability
    const isFeatured = body.isFeatured
    const displayOrder = body.displayOrder
    const addedBy = body.addedBy as string | undefined

    // Validate required fields
    if (!rawAddress || !rawCity || rawPrice === undefined || rawSize === undefined || !rawPropertyType) {
      return NextResponse.json(
        { error: 'Missing required fields: address, city, price, size, and propertyType are required' },
        { status: 400 }
      )
    }

    // Auto-format property data to platform standards
    const formatted = formatPropertyForPlatform({
      title: rawTitle,
      description: rawDescription,
      address: rawAddress,
      city: rawCity,
      area: rawArea,
      state: rawState,
      zipCode: rawZipCode,
      propertyType: rawPropertyType,
      size: rawSize,
      price: rawPrice,
      amenities: amenitiesArray,
      mapLink: mapLink,
      latitude: latitude,
      longitude: longitude,
    })

    // Use formatted data (formatter ensures proper structure)
    const title = formatted.title
    const description = formatted.description
    const address = formatted.address
    const city = formatted.city
    const state = formatted.state || rawState || ''
    const zipCode = formatted.zipCode || rawZipCode || '000000'
    const amenitiesData = formatted.amenities // Already includes map_link if provided

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Resolve owner based on addedBy flag (admin vs owner)
    let finalOwnerId = ownerId

    // If no ownerId provided or explicitly marked as admin, attach to admin user
    const addedByValue = addedBy?.toLowerCase() || 'admin'
    if (!finalOwnerId || addedByValue === 'admin') {
      const adminEmail = 'admin@ngventures.com'
      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          userType: 'admin',
        },
        create: {
          email: adminEmail,
          name: 'System Administrator',
          password: '$2b$10$placeholder_hash_change_in_production',
          userType: 'admin',
        },
      })
      finalOwnerId = adminUser.id
    }

    // Generate property ID in prop-XXX format
    const propertyId = await generatePropertyId()

    // Normalise property type to match Prisma enum
    const rawType = String(rawPropertyType || '').toLowerCase()
    const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other'] as const
    let normalizedType: (typeof validTypes)[number] = 'other'

    // Handle specific property type values
    if (rawType === 'office' || rawType.includes('business-park') || rawType.includes('it-park') || rawType.includes('co-working-space')) {
      normalizedType = 'office'
    } else if (rawType === 'retail' || rawType.includes('mall-space') || rawType.includes('showroom') || rawType.includes('kiosk')) {
      normalizedType = 'retail'
    } else if (rawType === 'warehouse' || rawType.includes('industrial-space')) {
      normalizedType = 'warehouse'
    } else if (rawType === 'restaurant' || rawType.includes('food-court') || rawType.includes('cafe-coffee-shop') || rawType.includes('qsr') || rawType.includes('dessert-bakery') || rawType.includes('food') || rawType.includes('restaurant')) {
      // Food court / F&B all map to restaurant
      normalizedType = 'restaurant'
    } else if (rawType.includes('bungalow') || rawType.includes('villa') || rawType.includes('standalone-building') || rawType.includes('commercial-complex') || rawType.includes('service-apartment') || rawType.includes('hotel-hospitality') || rawType.includes('land') || rawType === 'other') {
      normalizedType = 'other'
    } else if (validTypes.includes(rawType as any)) {
      normalizedType = rawType as (typeof validTypes)[number]
    }

    // Normalise price / size / decimals
    const numericPrice = Number(rawPrice)
    const price = Number.isFinite(numericPrice) ? numericPrice : 0

    const numericSize = Number(rawSize)
    const size = Number.isFinite(numericSize) ? Math.trunc(numericSize) : 0

    const securityDeposit =
      rawSecurityDeposit !== undefined && rawSecurityDeposit !== null && rawSecurityDeposit !== ''
        ? Number(rawSecurityDeposit)
        : null

    const rentEscalation =
      rawRentEscalation !== undefined && rawRentEscalation !== null && rawRentEscalation !== ''
        ? Number(rawRentEscalation)
        : null

    const priceTypeRaw = String(rawPriceType || 'monthly').toLowerCase()
    const allowedPriceTypes = ['monthly', 'yearly', 'sqft'] as const
    const priceType = (allowedPriceTypes.includes(priceTypeRaw as any) ? priceTypeRaw : 'monthly') as (typeof allowedPriceTypes)[number]

    // Set status to 'pending' and availability to false so property is ready for approval
    // Admin can approve it later to make it live
    let statusValue: 'pending' | 'approved' | 'rejected' = 'pending'
    let availabilityValue = false // Start as unavailable until approved

    // Check if status column exists before trying to set it
    let statusColumnExists = false
    try {
      await prisma.$queryRawUnsafe(`SELECT status FROM properties LIMIT 1`)
      statusColumnExists = true
    } catch {
      // Status column doesn't exist, will use availability only
      statusColumnExists = false
    }

    const propertyData: any = {
      id: propertyId,
      title,
      description: description || null,
      address,
      city,
      state: state || '',
      zipCode: zipCode || '000000',
      price,
      priceType,
      securityDeposit,
      rentEscalation,
      size,
      propertyType: normalizedType,
      storePowerCapacity: storePowerCapacity || null,
      powerBackup,
      waterFacility,
      amenities: amenitiesData, // Contains both features array and map_link
      images,
      ownerId: finalOwnerId!,
      availability: availabilityValue, // Start as unavailable until approved
      isFeatured: Boolean(isFeatured),
      displayOrder:
        displayOrder !== undefined && displayOrder !== null && String(displayOrder).trim() !== ''
          ? parseInt(String(displayOrder), 10)
          : null,
    }

    // Only set status if column exists
    if (statusColumnExists) {
      propertyData.status = statusValue
    }

    const property = await prisma.property.create({
      data: propertyData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      owner: {
        name: property.owner.name,
        email: property.owner.email,
      },
      size: property.size,
      price: Number(property.price),
      priceType: property.priceType,
      availability: property.availability,
      createdAt: property.createdAt,
      isFeatured: property.isFeatured,
    })
  } catch (error: any) {
    console.error('Admin create property error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create property' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Handle authentication with fallback (same pattern as DELETE)
    let user
    try {
      user = await requireUserType(request, ['admin'])
    } catch (authError: any) {
      console.error('[Admin properties PATCH] Auth error:', authError?.message || authError)

      // Fallback: Check if admin email is in query params (dev bypass)
      const userEmailParam = request.nextUrl.searchParams.get('userEmail')
      if (userEmailParam) {
        const decodedEmail = decodeURIComponent(userEmailParam).toLowerCase()
        if (decodedEmail === 'admin@ngventures.com') {
          const prisma = await getPrisma()
          if (prisma) {
            try {
              const adminUser = await prisma.user.upsert({
                where: { email: 'admin@ngventures.com' },
                update: { userType: 'admin' },
                create: {
                  email: 'admin@ngventures.com',
                  name: 'System Administrator',
                  password: '$2b$10$placeholder_hash_change_in_production',
                  userType: 'admin',
                },
                select: { id: true, email: true, name: true, userType: true, phone: true },
              })
              user = {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                userType: adminUser.userType as 'admin',
                phone: adminUser.phone,
              }
            } catch (fallbackError: any) {
              console.error('[Admin properties PATCH] Fallback auth failed:', fallbackError?.message || fallbackError)
            }
          }
        }
      }

      if (!user) {
        return NextResponse.json(
          { error: authError?.message || 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { propertyId, ...updateData } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Prepare update data
    const data: any = {}
    
    // Basic fields
    if (updateData.title !== undefined) data.title = updateData.title
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.address !== undefined) data.address = updateData.address
    if (updateData.city !== undefined) data.city = updateData.city
    if (updateData.state !== undefined) data.state = updateData.state
    if (updateData.zipCode !== undefined) data.zipCode = updateData.zipCode
    
    // mapLink column removed - store in amenities.map_link per schema workaround
    if (updateData.mapLink !== undefined) {
      const mapLinkVal = updateData.mapLink || null
      if (updateData.amenities !== undefined) {
        const am = updateData.amenities
        const merged: Record<string, unknown> = typeof am === 'object' && am !== null && !Array.isArray(am)
          ? { ...(am as Record<string, unknown>), map_link: mapLinkVal }
          : Array.isArray(am)
            ? { features: am, map_link: mapLinkVal }
            : { map_link: mapLinkVal }
        data.amenities = merged
      } else {
        // Only mapLink sent - fetch current amenities to preserve
        const current = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { amenities: true }
        })
        const existing = current?.amenities
        const merged: Record<string, unknown> = typeof existing === 'object' && existing !== null && !Array.isArray(existing)
          ? { ...(existing as Record<string, unknown>), map_link: mapLinkVal }
          : Array.isArray(existing)
            ? { features: existing, map_link: mapLinkVal }
            : { map_link: mapLinkVal }
        data.amenities = merged
      }
    }
    
    // Pricing - ensure proper number conversion
    if (updateData.price !== undefined) {
      data.price = typeof updateData.price === 'number' ? updateData.price : Number(updateData.price) || 0
    }
    if (updateData.priceType !== undefined) data.priceType = updateData.priceType
    
    // Security deposit - convert to number or null
    if (updateData.securityDeposit !== undefined) {
      if (updateData.securityDeposit === null || updateData.securityDeposit === '' || updateData.securityDeposit === 0) {
        data.securityDeposit = null
      } else {
        data.securityDeposit = typeof updateData.securityDeposit === 'number' 
          ? updateData.securityDeposit 
          : Number(updateData.securityDeposit) || null
      }
    }
    
    // Rent escalation - convert to number or null
    if (updateData.rentEscalation !== undefined) {
      if (updateData.rentEscalation === null || updateData.rentEscalation === '' || updateData.rentEscalation === 0) {
        data.rentEscalation = null
      } else {
        data.rentEscalation = typeof updateData.rentEscalation === 'number'
          ? updateData.rentEscalation
          : Number(updateData.rentEscalation) || null
      }
    }
    
    // Property details
    if (updateData.size !== undefined) data.size = updateData.size
    if (updateData.propertyType !== undefined) {
      // Normalise property type to match Prisma enum
      const rawType = String(updateData.propertyType || '').toLowerCase()
      const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other'] as const
      let normalizedType: (typeof validTypes)[number] = 'other'

      // Handle specific property type values
      if (rawType === 'office' || rawType.includes('business-park') || rawType.includes('it-park') || rawType.includes('co-working-space')) {
        normalizedType = 'office'
      } else if (rawType === 'retail' || rawType.includes('mall-space') || rawType.includes('showroom') || rawType.includes('kiosk')) {
        normalizedType = 'retail'
      } else if (rawType === 'warehouse' || rawType.includes('industrial-space')) {
        normalizedType = 'warehouse'
      } else if (rawType === 'restaurant' || rawType.includes('food-court') || rawType.includes('cafe-coffee-shop') || rawType.includes('qsr') || rawType.includes('dessert-bakery') || rawType.includes('food') || rawType.includes('restaurant')) {
        normalizedType = 'restaurant'
      } else if (rawType.includes('bungalow') || rawType.includes('villa') || rawType.includes('standalone-building') || rawType.includes('commercial-complex') || rawType.includes('service-apartment') || rawType.includes('hotel-hospitality') || rawType.includes('land') || rawType === 'other') {
        normalizedType = 'other'
      } else if (validTypes.includes(rawType as any)) {
        normalizedType = rawType as (typeof validTypes)[number]
      }
      
      data.propertyType = normalizedType
    }
    if (updateData.storePowerCapacity !== undefined) data.storePowerCapacity = updateData.storePowerCapacity
    if (updateData.powerBackup !== undefined) data.powerBackup = updateData.powerBackup
    if (updateData.waterFacility !== undefined) data.waterFacility = updateData.waterFacility
    
    // Features
    if (updateData.amenities !== undefined) data.amenities = updateData.amenities
    if (updateData.images !== undefined) data.images = updateData.images
    
    // Status (for approval workflow: pending | approved | rejected)
    if (updateData.status !== undefined && ['pending', 'approved', 'rejected'].includes(updateData.status)) {
      data.status = updateData.status
      if (updateData.status === 'approved') {
        data.availability = true
      } else if (updateData.status === 'rejected') {
        data.availability = false
      }
    }
    if (updateData.availability !== undefined) data.availability = updateData.availability
    if (updateData.isFeatured !== undefined) data.isFeatured = updateData.isFeatured
    if (updateData.displayOrder !== undefined) data.displayOrder = updateData.displayOrder !== null ? parseInt(String(updateData.displayOrder)) : null
    
    // Owner (only if provided and different)
    if (updateData.ownerId !== undefined && updateData.ownerId) {
      data.ownerId = updateData.ownerId
    }

    const property = await prisma.property.update({
      where: { id: propertyId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        owner: {
          name: property.owner.name,
          email: property.owner.email,
        },
        size: property.size,
        price: Number(property.price),
        priceType: property.priceType,
        availability: property.availability,
        createdAt: property.createdAt,
        isFeatured: property.isFeatured,
      }
    })
  } catch (error: any) {
    console.error('Admin update property error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update property' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Handle authentication with fallback
    let user
    try {
      user = await requireUserType(request, ['admin'])
    } catch (authError: any) {
      console.error('[Admin properties DELETE] Auth error:', authError?.message || authError)
      
      // Fallback: Check if admin email is in query params
      const userEmailParam = request.nextUrl.searchParams.get('userEmail')
      if (userEmailParam) {
        const decodedEmail = decodeURIComponent(userEmailParam).toLowerCase()
        if (decodedEmail === 'admin@ngventures.com') {
          const prisma = await getPrisma()
          if (prisma) {
            try {
              const adminUser = await prisma.user.upsert({
                where: { email: 'admin@ngventures.com' },
                update: { userType: 'admin' },
                create: {
                  email: 'admin@ngventures.com',
                  name: 'System Administrator',
                  password: '$2b$10$placeholder_hash_change_in_production',
                  userType: 'admin',
                },
                select: { id: true, email: true, name: true, userType: true, phone: true },
              })
              user = {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                userType: adminUser.userType as 'admin',
                phone: adminUser.phone,
              }
            } catch (fallbackError: any) {
              console.error('[Admin properties DELETE] Fallback auth failed:', fallbackError?.message || fallbackError)
            }
          }
        }
      }
      
      if (!user) {
        return NextResponse.json(
          { error: authError?.message || 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    await prisma.property.delete({
      where: { id: propertyId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin delete property error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete property' },
      { status: 500 }
    )
  }
}
