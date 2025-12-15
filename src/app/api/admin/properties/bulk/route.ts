import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'

interface CsvPropertyRow {
  id?: string
  title?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  price?: string
  priceType?: string
  size?: string
  propertyType?: string
  ownerName?: string
  ownerEmail?: string
  isFeatured?: string
  availability?: string
  images?: string
  amenities?: string
  displayOrder?: string
  [key: string]: any
}

function parseBoolean(value?: string) {
  if (!value) return false
  const v = value.toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}

function parseNumber(value?: string, fallback: number | null = null) {
  if (!value) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const body = await request.json()
    const rows: CsvPropertyRow[] = Array.isArray(body.rows) ? body.rows : []

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No rows provided for bulk upload', inserted: 0, skipped: 0, errors: [] },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available', inserted: 0, skipped: rows.length, errors: [] },
        { status: 503 }
      )
    }

    let inserted = 0
    let skipped = 0
    const errors: { row: number; error: string }[] = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      try {
        const title = row.title?.trim()
        const address = row.address?.trim()
        const city = row.city?.trim()
        const propertyType = row.propertyType?.trim() || 'other'
        const ownerEmail = row.ownerEmail?.trim()

        if (!title || !address || !city || !propertyType || !ownerEmail) {
          skipped++
          errors.push({ row: index + 2, error: 'Missing required fields (title, address, city, propertyType, ownerEmail)' })
          continue
        }

        // Find or create owner
        const ownerName = row.ownerName?.trim() || ownerEmail.split('@')[0]

        const owner = await prisma.user.upsert({
          where: { email: ownerEmail },
          update: {},
          create: {
            email: ownerEmail,
            name: ownerName,
            password: 'TEMP_PASSWORD', // not used; auth handled elsewhere
            userType: 'owner',
          },
        })

        // Prepare property data
        const images = row.images
          ? row.images.split('|').map((i) => i.trim()).filter(Boolean)
          : []

        const amenities = row.amenities
          ? row.amenities.split(',').map((a) => a.trim()).filter(Boolean)
          : []

        const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other']
        const mappedType = validTypes.includes(propertyType) ? propertyType : 'other'

        await prisma.property.create({
          data: {
            // id: if provided, otherwise Prisma default/our generator
            id: row.id && row.id.trim() !== '' ? row.id.trim() : undefined,
            title,
            description: null,
            address,
            city,
            state: row.state?.trim() || null,
            zipCode: row.zipCode?.trim() || '',
            price: parseNumber(row.price, 0) ?? 0,
            priceType: (row.priceType?.trim() || 'monthly') as any,
            securityDeposit: null,
            rentEscalation: null,
            size: parseNumber(row.size, 0) ?? 0,
            propertyType: mappedType as any,
            storePowerCapacity: null,
            powerBackup: false,
            waterFacility: false,
            amenities,
            images,
            ownerId: owner.id,
            availability: row.availability ? parseBoolean(row.availability) : true,
            isFeatured: parseBoolean(row.isFeatured),
            displayOrder:
              row.displayOrder && row.displayOrder.trim() !== ''
                ? parseInt(row.displayOrder, 10)
                : null,
          },
        })

        inserted++
      } catch (error: any) {
        console.error('[Bulk Properties] Row error:', index + 2, error)
        skipped++
        errors.push({ row: index + 2, error: error.message || 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      inserted,
      skipped,
      errors,
    })
  } catch (error: any) {
    console.error('[Bulk Properties] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Bulk upload failed', inserted: 0, skipped: 0, errors: [] },
      { status: 500 }
    )
  }
}


