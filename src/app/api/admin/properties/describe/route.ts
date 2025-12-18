import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import { generatePropertyDescription, generatePropertyTitle } from '@/lib/property-description'

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json().catch(() => ({} as any))
    const { propertyId, all = false, mode } = body as {
      propertyId?: string
      all?: boolean
      mode?: 'title' | 'description' | 'both'
    }

    const modeValue = mode || 'description'
    const wantTitle = modeValue === 'title' || modeValue === 'both'
    const wantDescription = modeValue === 'description' || modeValue === 'both'

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Bulk regenerate mode
    if (all) {
      const properties = await prisma.property.findMany({
        select: {
          id: true,
          title: true,
          city: true,
          size: true,
          propertyType: true,
          amenities: true,
        },
      })

      let updated = 0
      for (const p of properties) {
        const data: any = {}

        if (wantDescription) {
          data.description = generatePropertyDescription({
            title: p.title,
            city: p.city,
            size: p.size,
            propertyType: p.propertyType,
            amenities: (p.amenities as string[]) || [],
          })
        }

        if (wantTitle) {
          data.title = generatePropertyTitle({
            city: p.city,
            propertyType: p.propertyType,
          })
        }

        if (Object.keys(data).length > 0) {
          await prisma.property.update({
            where: { id: p.id },
            data,
          })
          updated++
        }
      }

      return NextResponse.json({
        success: true,
        updated,
      })
    }

    // Single property mode
    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId is required when all=false' },
        { status: 400 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        city: true,
        size: true,
        propertyType: true,
        amenities: true,
        price: true,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const data: any = {}
    let description: string | undefined
    let title: string | undefined

    if (wantDescription) {
      description = generatePropertyDescription({
        title: property.title,
        city: property.city,
        size: property.size,
        propertyType: property.propertyType,
        amenities: (property.amenities as string[]) || [],
        price: property.price,
      })
      data.description = description
    }

    if (wantTitle) {
      title = generatePropertyTitle({
        title: property.title,
        propertyType: property.propertyType,
        amenities: (property.amenities as string[]) || [],
        size: property.size,
      })
      data.title = title
    }

    if (Object.keys(data).length > 0) {
      await prisma.property.update({
        where: { id: property.id },
        data,
      })
    }

    return NextResponse.json({
      success: true,
      description,
      title,
    })
  } catch (error: any) {
    console.error('[Describe Property] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate description' },
      { status: 500 }
    )
  }
}


