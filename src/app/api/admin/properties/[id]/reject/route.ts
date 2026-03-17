import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-security'
import { getPrisma } from '@/lib/get-prisma'
import { sendPropertyStatusEmail } from '@/lib/lead-email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Primary auth check
  const authResult = await requireAdminAuth(request)

  // If primary auth failed, attempt fallback via userEmail query param
  if (!authResult.authorized) {
    const prisma = await getPrisma()
    const userEmailParam = request.nextUrl.searchParams.get('userEmail')
    let fallbackOk = false

    if (prisma && userEmailParam) {
      try {
        const decodedEmail = decodeURIComponent(userEmailParam).toLowerCase()
        const dbUser = await prisma.user.findUnique({
          where: { email: decodedEmail },
          select: { userType: true },
        })
        fallbackOk = dbUser?.userType === 'admin'
      } catch {
        fallbackOk = false
      }
    }

    if (!fallbackOk) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: authResult.statusCode || 401 }
      )
    }
  }

  try {
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { id: propertyId } = await params

    // Fetch property with owner details for the status email
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        city: true,
        status: true,
        availability: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Update property status to rejected
    let updatedProperty: { id: string; status: unknown; availability: boolean | null }

    try {
      updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: {
          status: 'rejected',
          availability: false,
        },
        select: { id: true, status: true, availability: true },
      })
    } catch (statusError: any) {
      // Fallback if status column doesn't exist yet
      if (
        statusError.message?.includes('status') ||
        statusError.code === 'P2009' ||
        statusError.message?.includes('Unknown argument') ||
        (statusError.message?.includes('column') && statusError.message?.includes('does not exist'))
      ) {
        console.warn('[Reject Property] Status field not available, using availability fallback:', statusError.message)
        updatedProperty = await prisma.property.update({
          where: { id: propertyId },
          data: { availability: false },
          select: { id: true, status: true, availability: true },
        })
      } else {
        throw statusError
      }
    }

    // Fire owner status email non-blocking (don't hold up the HTTP response)
    if (existingProperty.owner?.email) {
      sendPropertyStatusEmail({
        status: 'rejected',
        ownerEmail: existingProperty.owner.email,
        ownerName: existingProperty.owner.name || 'there',
        propertyTitle: existingProperty.title,
        propertyCity: existingProperty.city,
        propertyId,
      }).then(({ ownerOk, ngOk }) => {
        console.log(`[Reject Property] Status email — ownerOk:${ownerOk} ngOk:${ngOk} property:${propertyId}`)
      }).catch(err => console.error('[Reject Property] Status email error:', err))
    }

    return NextResponse.json({
      success: true,
      property: {
        id: updatedProperty.id,
        status: updatedProperty.status,
        availability: updatedProperty.availability,
      },
    })
  } catch (error: any) {
    console.error('[Reject Property] Error:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.substring(0, 500),
    })
    return NextResponse.json(
      {
        error: error?.message || 'Failed to reject property',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
