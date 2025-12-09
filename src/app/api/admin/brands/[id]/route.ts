import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireUserType(request, ['admin'])

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const brand = await prisma.user.findUnique({
      where: { id: params.id, userType: 'brand' },
      include: {
        brandProfiles: true
      }
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('Admin brand GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brand' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json()
    const { name, email, password, phone, companyName, industry, budgetMin, budgetMax, minSize, maxSize, preferredLocations, isActive } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email.toLowerCase()
    if (password) updateData.password = await bcrypt.hash(password, 10)
    if (phone !== undefined) updateData.phone = phone
    if (isActive !== undefined) updateData.isActive = isActive

    const brand = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...updateData,
        brandProfiles: {
          upsert: {
            create: {
              company_name: companyName || '',
              industry: industry || null,
              budget_min: budgetMin ? parseFloat(budgetMin) : null,
              budget_max: budgetMax ? parseFloat(budgetMax) : null,
              min_size: minSize ? parseInt(minSize) : null,
              max_size: maxSize ? parseInt(maxSize) : null,
              preferred_locations: preferredLocations || []
            },
            update: {
              company_name: companyName !== undefined ? companyName : undefined,
              industry: industry !== undefined ? industry : undefined,
              budget_min: budgetMin !== undefined ? (budgetMin ? parseFloat(budgetMin) : null) : undefined,
              budget_max: budgetMax !== undefined ? (budgetMax ? parseFloat(budgetMax) : null) : undefined,
              min_size: minSize !== undefined ? (minSize ? parseInt(minSize) : null) : undefined,
              max_size: maxSize !== undefined ? (maxSize ? parseInt(maxSize) : null) : undefined,
              preferred_locations: preferredLocations !== undefined ? preferredLocations : undefined
            }
          }
        }
      },
      include: {
        brandProfiles: true
      }
    })

    return NextResponse.json({
      id: brand.id,
      name: brand.name,
      email: brand.email,
      phone: brand.phone,
      userType: brand.userType,
      createdAt: brand.createdAt,
      isActive: brand.isActive,
      companyName: brand.brandProfiles?.company_name || null,
      industry: brand.brandProfiles?.industry || null
    })
  } catch (error: any) {
    console.error('Admin brand PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update brand' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireUserType(request, ['admin'])

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin brand DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete brand' },
      { status: 500 }
    )
  }
}

