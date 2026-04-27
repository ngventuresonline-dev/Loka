import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request)
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { propertyIds } = body

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { error: 'Property IDs array is required' },
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

    // Delete properties in bulk
    const deleteResult = await prisma.property.deleteMany({
      where: {
        id: {
          in: propertyIds
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} property/properties`
    })
  } catch (error: any) {
    console.error('Admin bulk delete properties error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete properties' },
      { status: 500 }
    )
  }
}

