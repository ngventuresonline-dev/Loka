import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import { generateBrandId } from '@/lib/brand-id-generator'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    console.log('[Admin Brands API] GET request received')
    
    try {
      await requireUserType(request, ['admin'])
      console.log('[Admin Brands API] Auth check passed')
    } catch (authError: any) {
      console.error('[Admin Brands API] Auth error:', authError)
      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 401 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      console.error('[Admin Brands API] Prisma client not available')
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    console.log('[Admin Brands API] Fetching brands from database...')
    // Fetch all brands - simple query without displayOrder
    const brands = await prisma.user.findMany({
      where: { 
        userType: 'brand'
      },
      include: {
        brandProfiles: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`[Admin Brands API] Found ${brands.length} brands in database`)

    console.log('[Admin Brands API] Formatting brands...')
    const formattedBrands = brands.map((brand, index) => {
      try {
        const requirements = brand.brandProfiles?.must_have_amenities as any
        return {
          id: brand.id || `unknown-${index}`,
          name: brand.name || 'Unknown',
          email: brand.email || '',
          phone: brand.phone || null,
          userType: brand.userType || 'brand',
          createdAt: brand.createdAt ? (brand.createdAt instanceof Date ? brand.createdAt.toISOString() : String(brand.createdAt)) : new Date().toISOString(),
          isActive: brand.isActive !== undefined ? brand.isActive : true,
          companyName: brand.brandProfiles?.company_name || null,
          industry: brand.brandProfiles?.industry || null,
          brandProfile: brand.brandProfiles ? {
            budgetMin: brand.brandProfiles.budget_min ? Number(brand.brandProfiles.budget_min) : null,
            budgetMax: brand.brandProfiles.budget_max ? Number(brand.brandProfiles.budget_max) : null,
            minSize: brand.brandProfiles.min_size || null,
            maxSize: brand.brandProfiles.max_size || null,
            preferredLocations: Array.isArray(brand.brandProfiles.preferred_locations) 
              ? brand.brandProfiles.preferred_locations 
              : [],
            timeline: requirements?.timeline || null,
            storeType: requirements?.storeType || null,
            targetAudience: requirements?.targetAudience || null,
            additionalRequirements: requirements?.additionalRequirements || null
          } : null
        }
      } catch (mapError) {
        console.error(`[Admin Brands API] Error mapping brand ${index}:`, mapError)
        return null
      }
    }).filter(b => b !== null)

    console.log(`[Admin Brands API] Formatted ${formattedBrands.length} brands, returning response`)
    return NextResponse.json({ brands: formattedBrands })
  } catch (error: any) {
    console.error('[Admin Brands API] Full error:', error)
    console.error('[Admin Brands API] Error stack:', error.stack)
    console.error('[Admin Brands API] Error name:', error.name)
    console.error('[Admin Brands API] Error message:', error.message)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch brands',
        details: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          stack: error.stack
        } : undefined
      },
      { status: error.message?.includes('Forbidden') || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json()
    const { name, email, password, phone, companyName, industry, budgetMin, budgetMax, minSize, maxSize, preferredLocations } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate brand ID in BP-XXX format
    const brandId = await generateBrandId()

    // Get the highest display order for brands
    const lastBrand = await prisma.user.findFirst({
      where: { userType: 'brand' },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    })

    // Create user with BP-XXX ID
    const user = await prisma.user.create({
      data: {
        id: brandId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        userType: 'brand',
        isActive: true,
        brandProfiles: {
          create: {
            company_name: companyName || '',
            industry: industry || null,
            budget_min: budgetMin ? parseFloat(budgetMin) : null,
            budget_max: budgetMax ? parseFloat(budgetMax) : null,
            min_size: minSize ? parseInt(minSize) : null,
            max_size: maxSize ? parseInt(maxSize) : null,
            preferred_locations: preferredLocations || []
          }
        }
      },
      include: {
        brandProfiles: true
      }
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      createdAt: user.createdAt,
      isActive: user.isActive,
      companyName: user.brandProfiles?.company_name || null,
      industry: user.brandProfiles?.industry || null
    })
  } catch (error: any) {
    console.error('Admin brands POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create brand' },
      { status: 500 }
    )
  }
}

