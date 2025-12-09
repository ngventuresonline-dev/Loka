import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const brands = await prisma.user.findMany({
      where: { userType: 'brand' },
      include: {
        brandProfiles: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      email: brand.email,
      phone: brand.phone,
      userType: brand.userType,
      createdAt: brand.createdAt,
      isActive: brand.isActive,
      companyName: brand.brandProfiles?.company_name || null,
      industry: brand.brandProfiles?.industry || null,
      brandProfile: brand.brandProfiles ? {
        budgetMin: brand.brandProfiles.budget_min ? Number(brand.brandProfiles.budget_min) : null,
        budgetMax: brand.brandProfiles.budget_max ? Number(brand.brandProfiles.budget_max) : null,
        minSize: brand.brandProfiles.min_size || null,
        maxSize: brand.brandProfiles.max_size || null,
        preferredLocations: (brand.brandProfiles.preferred_locations as string[]) || []
      } : null
    }))

    return NextResponse.json({ brands: formattedBrands })
  } catch (error: any) {
    console.error('Admin brands GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brands' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
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

    // Create user
    const user = await prisma.user.create({
      data: {
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

