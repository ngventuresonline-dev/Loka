import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma, executePrismaQuery } from '@/lib/get-prisma'
import { sanitizePropertyTitle, generateGenericPropertyTitle } from '@/lib/generate-property-title'

/**
 * POST /api/admin/properties/migrate-titles
 * Migrate existing property titles to generic, industry-agnostic format
 * 
 * Query params:
 * - dryRun=true: Preview changes without updating database
 * - limit=N: Process only first N properties (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireUserType(request, ['admin'])

    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

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
        ...(limit ? { take: limit } : {}),
      })
    )

    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No properties found',
        updated: 0,
        skipped: 0,
        preview: [],
      })
    }

    const results: Array<{
      id: string
      oldTitle: string
      newTitle: string
      changed: boolean
    }> = []

    let updatedCount = 0
    let skippedCount = 0

    for (const property of properties) {
      const oldTitle = property.title || ''
      
      // Generate new generic title using location and size
      const location = property.address || property.city || 'Bangalore'
      const newTitle = generateGenericPropertyTitle(
        location,
        property.size ? Number(property.size) : undefined,
        property.propertyType || undefined
      )

      const changed = oldTitle.toLowerCase() !== newTitle.toLowerCase()

      results.push({
        id: property.id,
        oldTitle,
        newTitle,
        changed,
      })

      if (changed) {
        if (!dryRun) {
          // Update the property title
          await executePrismaQuery(async (p) =>
            p.property.update({
              where: { id: property.id },
              data: { title: newTitle },
            })
          )
          updatedCount++
        } else {
          updatedCount++ // Count as would-be-updated in dry run
        }
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Dry run complete. ${updatedCount} properties would be updated, ${skippedCount} skipped.`
        : `Migration complete. ${updatedCount} properties updated, ${skippedCount} skipped.`,
      updated: updatedCount,
      skipped: skippedCount,
      total: properties.length,
      dryRun,
      preview: results.slice(0, 20), // Show first 20 as preview
    })
  } catch (error: any) {
    console.error('[Migrate Titles] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to migrate titles' },
      { status: 500 }
    )
  }
}
