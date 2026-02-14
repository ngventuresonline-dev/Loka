import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-security'
import { getPrisma } from '@/lib/get-prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminAuth(request)
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 401 }
    )
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

    // Check if property exists first
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, status: true, availability: true }
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Update property status to approved
    // Try to update status field, but fallback to availability if status doesn't exist yet
    try {
      const property = await prisma.property.update({
        where: { id: propertyId },
        data: { 
          status: 'approved',
          availability: true // Make it available when approved
        },
      })

      return NextResponse.json({
        success: true,
        property: {
          id: property.id,
          status: property.status,
          availability: property.availability,
        },
      })
    } catch (statusError: any) {
      // If status field doesn't exist yet, fallback to availability only
      if (statusError.message?.includes('status') || statusError.code === 'P2009' || statusError.message?.includes('Unknown argument') || statusError.message?.includes('column') && statusError.message?.includes('does not exist')) {
        console.warn('[Approve Property] Status field not available, using availability fallback:', statusError.message)
        try {
          const property = await prisma.property.update({
            where: { id: propertyId },
            data: { 
              availability: true // Make it available when approved
            },
          })

          return NextResponse.json({
            success: true,
            property: {
              id: property.id,
              availability: property.availability,
              message: 'Property approved (using legacy availability field)'
            },
          })
        } catch (fallbackError: any) {
          console.error('[Approve Property] Fallback update failed:', fallbackError)
          throw fallbackError
        }
      }
      throw statusError
    }
  } catch (error: any) {
    console.error('[Approve Property] Error:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.substring(0, 500)
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to approve property',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

