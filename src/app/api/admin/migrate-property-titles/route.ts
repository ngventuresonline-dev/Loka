import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma, executePrismaQuery } from '@/lib/get-prisma'
import { generateGenericPropertyTitle, sanitizePropertyTitle } from '@/lib/generate-property-title'

/**
 * POST /api/admin/migrate-property-titles
 * One-time migration to update all existing property titles to be generic/industry-agnostic
 * Requires: Admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireUserType(request, ['admin'])

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Fetch all properties
    const properties = await executePrismaQuery(async (p) =>
      p.property.findMany({
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          size: true,
          propertyType: true,
        },
      })
    )

    if (!properties || properties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No properties found to migrate',
        updated: 0,
        total: 0,
      })
    }

    let updated = 0
    let skipped = 0
    const errors: Array<{ id: string; error: string }> = []

    // Update each property title
    for (const property of properties) {
      try {
        const currentTitle = property.title || ''
        
        // Use actual location data from database for better title generation
        const location = property.address || property.city || 'Bangalore'
        const size = property.size ? Number(property.size) : undefined
        
        // Generate new generic title using actual property data
        const newTitle = generateGenericPropertyTitle(
          location,
          size,
          property.propertyType || undefined
        )

        // Only update if title actually changed
        if (newTitle !== currentTitle && newTitle.trim().length > 0) {
          await executePrismaQuery(async (p) =>
            p.property.update({
              where: { id: property.id },
              data: { title: newTitle },
            })
          )
          updated++
        } else {
          skipped++
        }
      } catch (error: any) {
        errors.push({
          id: property.id,
          error: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed: ${updated} updated, ${skipped} skipped`,
      updated,
      skipped,
      total: properties.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[Migrate Property Titles] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to migrate property titles',
        success: false,
      },
      { status: 500 }
    )
  }
}
