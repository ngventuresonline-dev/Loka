import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'

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

    const owners = await prisma.user.findMany({
      where: { userType: 'owner' },
      include: {
        ownerProfiles: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedOwners = owners.map(owner => ({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      userType: owner.userType,
      createdAt: owner.createdAt,
      isActive: owner.isActive,
      companyName: owner.ownerProfiles?.company_name || null,
      licenseNumber: owner.ownerProfiles?.license_number || null,
      totalProperties: owner.ownerProfiles?.total_properties || 0,
    }))

    return NextResponse.json({ owners: formattedOwners })
  } catch (error: any) {
    console.error('Admin owners GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch owners' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

