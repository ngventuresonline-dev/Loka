import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decodePropertySlug } from '@/lib/property-slug'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const propertyId = decodePropertySlug(id)
    const { userId } = await request.json()

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: 'userId and propertyId are required' },
        { status: 400 }
      )
    }

    // Check if already saved
    const existing = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ success: true, saved: true })
    }

    // Save property
    await prisma.savedProperty.create({
      data: {
        userId,
        propertyId
      }
    })

    return NextResponse.json({ success: true, saved: true })
  } catch (error: any) {
    console.error('Save property error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to save property' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: 'userId and propertyId are required' },
        { status: 400 }
      )
    }

    await prisma.savedProperty.delete({
      where: {
        userId_propertyId: {
          userId: userId,
          propertyId: propertyId
        }
      }
    })

    return NextResponse.json({ success: true, saved: false })
  } catch (error: any) {
    // If not found, that's okay - already unsaved
    if (error.code === 'P2025') {
      return NextResponse.json({ success: true, saved: false })
    }
    console.error('Unsave property error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to unsave property' },
      { status: 500 }
    )
  }
}
