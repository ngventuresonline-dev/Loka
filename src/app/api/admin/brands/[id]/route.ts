import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserType(request, ['admin'])

    const { id } = await params
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const brand = await prisma.user.findUnique({
      where: { id, userType: 'brand' },
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

    const requirements = brand.brandProfiles?.must_have_amenities as any
    const preferredLocations = brand.brandProfiles?.preferred_locations
      ? (Array.isArray(brand.brandProfiles.preferred_locations) 
          ? brand.brandProfiles.preferred_locations 
          : typeof brand.brandProfiles.preferred_locations === 'string'
          ? JSON.parse(brand.brandProfiles.preferred_locations)
          : [])
      : []
    
    return NextResponse.json({
      brand: {
        id: brand.id,
        name: brand.name,
        email: brand.email,
        phone: brand.phone,
        userType: brand.userType,
        createdAt: brand.createdAt,
        isActive: brand.isActive,
        displayOrder: brand.displayOrder || null,
        companyName: brand.brandProfiles?.company_name || null,
        industry: brand.brandProfiles?.industry || null,
        brandProfile: brand.brandProfiles ? {
          budgetMin: brand.brandProfiles.budget_min != null ? Number(brand.brandProfiles.budget_min) : null,
          budgetMax: brand.brandProfiles.budget_max != null ? Number(brand.brandProfiles.budget_max) : null,
          minSize: brand.brandProfiles.min_size != null ? Number(brand.brandProfiles.min_size) : null,
          maxSize: brand.brandProfiles.max_size != null ? Number(brand.brandProfiles.max_size) : null,
          preferredLocations: preferredLocations,
          timeline: requirements?.timeline || null,
          storeType: requirements?.storeType || null,
          targetAudience: requirements?.targetAudience || null,
          targetAudienceTags: requirements?.targetAudienceTags || [],
          additionalRequirements: requirements?.additionalRequirements || null,
          badges: requirements?.badges || []
        } : null
      }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserType(request, ['admin'])

    const { id } = await params
    const body = await request.json()
    const { name, email, password, phone, companyName, industry, budgetMin, budgetMax, minSize, maxSize, preferredLocations, isActive, timeline, storeType, targetAudience, targetAudienceTags, additionalRequirements, badges, displayOrder } = body

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
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder !== null ? parseInt(String(displayOrder)) : null

    // Get existing brand profile to merge requirements
    const existingProfile = await prisma.brand_profiles.findUnique({
      where: { user_id: id },
      select: { must_have_amenities: true }
    })
    const existingReq = (existingProfile?.must_have_amenities as any) || {}

    // Merge requirements if any are provided
    let mergedRequirements = existingReq
    if (timeline !== undefined || storeType !== undefined || targetAudience !== undefined || additionalRequirements !== undefined || targetAudienceTags !== undefined || badges !== undefined) {
      mergedRequirements = {
        ...existingReq,
        ...(timeline !== undefined && { timeline }),
        ...(storeType !== undefined && { storeType }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(targetAudienceTags !== undefined && { targetAudienceTags }),
        ...(additionalRequirements !== undefined && { additionalRequirements }),
        ...(badges !== undefined && { badges })
      }
    }

    const brand = await prisma.user.update({
      where: { id },
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
              preferred_locations: preferredLocations || [],
              must_have_amenities: (timeline || storeType || targetAudience || additionalRequirements || targetAudienceTags || badges) ? {
                timeline: timeline || null,
                storeType: storeType || null,
                targetAudience: targetAudience || null,
                targetAudienceTags: targetAudienceTags || [],
                additionalRequirements: additionalRequirements || null,
                badges: badges || []
              } : null
            },
            update: {
              company_name: companyName !== undefined ? companyName : undefined,
              industry: industry !== undefined ? industry : undefined,
              budget_min: budgetMin !== undefined ? (budgetMin ? parseFloat(budgetMin) : null) : undefined,
              budget_max: budgetMax !== undefined ? (budgetMax ? parseFloat(budgetMax) : null) : undefined,
              min_size: minSize !== undefined ? (minSize ? parseInt(minSize) : null) : undefined,
              max_size: maxSize !== undefined ? (maxSize ? parseInt(maxSize) : null) : undefined,
              preferred_locations: preferredLocations !== undefined ? preferredLocations : undefined,
              must_have_amenities: (timeline !== undefined || storeType !== undefined || targetAudience !== undefined || additionalRequirements !== undefined || targetAudienceTags !== undefined || badges !== undefined) ? mergedRequirements : undefined
            }
          }
        }
      },
      include: {
        brandProfiles: true
      }
    })

    const requirements = brand.brandProfiles?.must_have_amenities as any
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
        timeline: requirements?.timeline || null,
        storeType: requirements?.storeType || null,
        targetAudience: requirements?.targetAudience || null,
        targetAudienceTags: requirements?.targetAudienceTags || [],
        additionalRequirements: requirements?.additionalRequirements || null,
        badges: requirements?.badges || []
      } : null
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserType(request, ['admin'])

    const { id } = await params
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    await prisma.user.delete({
      where: { id }
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

