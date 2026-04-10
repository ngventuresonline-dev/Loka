import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerApiUser } from '@/lib/owner-api-server'

export async function GET(request: NextRequest) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        userType: true,
        ownerProfiles: {
          select: {
            company_name: true,
            license_number: true,
            total_properties: true,
          },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      userType: dbUser.userType,
      ownerProfile: dbUser.ownerProfiles
        ? {
            companyName: dbUser.ownerProfiles.company_name,
            licenseNumber: dbUser.ownerProfiles.license_number,
            totalProperties: dbUser.ownerProfiles.total_properties,
          }
        : null,
    })
  } catch (e: any) {
    console.error('[owner/profile GET]', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to load profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwnerApiUser(request)
  if ('response' in auth) return auth.response
  const { user } = auth

  let body: {
    name?: string
    phone?: string | null
    companyName?: string | null
    licenseNumber?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  try {
    if (typeof body.name === 'string' && body.name.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name.trim() },
      })
    }

    if (body.phone !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: body.phone?.trim() || null },
      })
    }

    if (body.companyName !== undefined || body.licenseNumber !== undefined) {
      await prisma.owner_profiles.upsert({
        where: { user_id: user.id },
        create: {
          user_id: user.id,
          company_name: body.companyName?.trim() || null,
          license_number: body.licenseNumber?.trim() || null,
        },
        update: {
          ...(body.companyName !== undefined && {
            company_name: body.companyName?.trim() || null,
          }),
          ...(body.licenseNumber !== undefined && {
            license_number: body.licenseNumber?.trim() || null,
          }),
        },
      })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        ownerProfiles: {
          select: {
            company_name: true,
            license_number: true,
            total_properties: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      name: dbUser?.name,
      email: dbUser?.email,
      phone: dbUser?.phone,
      ownerProfile: dbUser?.ownerProfiles
        ? {
            companyName: dbUser.ownerProfiles.company_name,
            licenseNumber: dbUser.ownerProfiles.license_number,
            totalProperties: dbUser.ownerProfiles.total_properties,
          }
        : null,
    })
  } catch (e: any) {
    console.error('[owner/profile PATCH]', e)
    return NextResponse.json(
      { error: e?.message || 'Update failed' },
      { status: 500 }
    )
  }
}
