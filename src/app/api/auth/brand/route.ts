import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const phone = body.phone ? String(body.phone).trim() : null
    const email = body.email ? String(body.email).trim().toLowerCase() : null

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'Phone number or email is required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Look up brand user by phone first, then email
    let user = null

    if (phone) {
      user = await prisma.user
        .findFirst({
          where: { phone, userType: 'brand' },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            brandProfiles: {
              select: { company_name: true, industry: true },
            },
          },
        })
        .catch(() => null)
    }

    if (!user && email) {
      user = await prisma.user
        .findFirst({
          where: {
            email,
            userType: 'brand',
            NOT: { email: { contains: '@placeholder.lokazen.com' } },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            brandProfiles: {
              select: { company_name: true, industry: true },
            },
          },
        })
        .catch(() => null)
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No brand account found with these details. Please contact the Lokazen team.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      brandName: user.brandProfiles?.company_name || user.name,
      industry: user.brandProfiles?.industry || null,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Login failed'
    console.error('[Brand Auth API] Error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
