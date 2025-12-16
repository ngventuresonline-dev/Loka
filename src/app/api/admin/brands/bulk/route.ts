import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import { generateBrandId } from '@/lib/brand-id-generator'
import bcrypt from 'bcryptjs'

interface CsvBrandRow {
  name?: string
  email?: string
  industry?: string
  companyName?: string
  preferredLocations?: string
  budgetMin?: string
  budgetMax?: string
  minSize?: string
  maxSize?: string
  preferredPropertyTypes?: string
  mustHaveAmenities?: string
  [key: string]: any
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
    const rows: CsvBrandRow[] = Array.isArray(body.rows) ? body.rows : []

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
        const name = row.name?.trim()
        const email = row.email?.trim().toLowerCase()

        if (!name || !email) {
          skipped++
          errors.push({ row: index + 2, error: 'Missing required fields (name, email)' })
          continue
        }

        const industry = row.industry?.trim() || ''
        const companyName = row.companyName?.trim() || name
        const preferredLocations = row.preferredLocations
          ? row.preferredLocations.split(',').map((l) => l.trim()).filter(Boolean)
          : []

        const budgetMin = parseNumber(row.budgetMin, null)
        const budgetMax = parseNumber(row.budgetMax, null)
        const minSize = parseNumber(row.minSize, null)
        const maxSize = parseNumber(row.maxSize, null)

        const preferredPropertyTypes = row.preferredPropertyTypes
          ? row.preferredPropertyTypes.split(',').map((t) => t.trim()).filter(Boolean)
          : []

        const mustHaveAmenities = row.mustHaveAmenities
          ? row.mustHaveAmenities.split(',').map((a) => a.trim()).filter(Boolean)
          : []

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
          skipped++
          errors.push({ row: index + 2, error: 'Email already exists, skipping' })
          continue
        }

        const hashedPassword = await bcrypt.hash('Brand@123', 10)
        const brandId = await generateBrandId()

        await prisma.user.create({
          data: {
            id: brandId,
            email,
            password: hashedPassword,
            name,
            phone: null,
            userType: 'brand',
            isActive: true,
            brandProfiles: {
              create: {
                company_name: companyName,
                industry,
                budget_min: budgetMin,
                budget_max: budgetMax,
                min_size: minSize,
                max_size: maxSize,
                preferred_locations: preferredLocations,
                preferred_property_types: preferredPropertyTypes,
                must_have_amenities: mustHaveAmenities,
              },
            },
          },
        })

        inserted++
      } catch (error: any) {
        console.error('[Bulk Brands] Row error:', index + 2, error)
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
    console.error('[Bulk Brands] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Bulk upload failed', inserted: 0, skipped: 0, errors: [] },
      { status: 500 }
    )
  }
}


