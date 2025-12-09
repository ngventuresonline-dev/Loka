import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserType(request, ['admin'])

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'responded', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
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

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status },
      include: {
        brand: {
          select: {
            name: true,
            email: true,
          }
        },
        owner: {
          select: {
            name: true,
            email: true,
          }
        },
        property: {
          select: {
            title: true,
            address: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: inquiry.id,
      brand: {
        name: inquiry.brand.name,
        email: inquiry.brand.email,
      },
      property: {
        title: inquiry.property.title,
        address: inquiry.property.address,
      },
      owner: inquiry.owner ? {
        name: inquiry.owner.name,
        email: inquiry.owner.email,
      } : null,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
      message: inquiry.message,
    })
  } catch (error: any) {
    console.error('Admin update inquiry error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inquiry' },
      { status: 500 }
    )
  }
}

