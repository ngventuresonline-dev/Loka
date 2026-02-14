import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = id

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user with owner profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownerProfiles: true
      }
    })

    if (!user || user.userType !== 'owner') {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    // Get owner's properties
    const properties = await prisma.property.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        priceType: true,
        city: true,
        size: true,
        createdAt: true,
        images: true,
        address: true,
        propertyType: true,
        securityDeposit: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const propertiesByStatus = {
      pending: properties.filter(p => p.status === 'pending').length,
      approved: properties.filter(p => p.status === 'approved').length,
      rejected: properties.filter(p => p.status === 'rejected').length
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyName: user.ownerProfiles?.companyName || null,
      properties: properties,
      propertiesByStatus,
      totalProperties: properties.length
    })

  } catch (error: any) {
    console.error('[Profile Owner API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch owner profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
