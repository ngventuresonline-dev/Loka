import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating property IDs to prop-XXX format...\n')
  
  try {
    // Get all properties ordered by creation date
    const properties = await prisma.property.findMany({
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        title: true
      }
    })

    console.log(`Found ${properties.length} properties to update\n`)

    let updated = 0
    let skipped = 0

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i]
      let newId = `prop-${(i + 1).toString().padStart(3, '0')}`

      // Skip if already in correct format
      if (property.id.startsWith('prop-')) {
        console.log(`⏭️  Skipping ${property.id} (already in prop-XXX format)`)
        skipped++
        continue
      }

      try {
        // Check if new ID already exists
        const existing = await prisma.property.findUnique({
          where: { id: newId }
        })

        if (existing && existing.id !== property.id) {
          console.log(`⚠️  ID ${newId} already exists, finding next available...`)
          // Find next available number
          const allProps = await prisma.property.findMany({
            where: { id: { startsWith: 'prop-' } },
            select: { id: true }
          })
          const numbers = allProps
            .map(p => {
              const match = p.id.match(/prop-(\d+)/)
              return match ? parseInt(match[1], 10) : 0
            })
            .filter(n => n > 0)
          const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0
          newId = `prop-${(maxNum + 1).toString().padStart(3, '0')}`
        }

        // Update property ID using raw SQL (PostgreSQL allows this)
        // First, update all foreign key references
        await prisma.$executeRawUnsafe(`
          UPDATE inquiries 
          SET property_id = $1 
          WHERE property_id = $2
        `, newId, property.id)

        await prisma.$executeRawUnsafe(`
          UPDATE saved_properties 
          SET property_id = $1 
          WHERE property_id = $2
        `, newId, property.id)

        await prisma.$executeRawUnsafe(`
          UPDATE property_views 
          SET property_id = $1 
          WHERE property_id = $2
        `, newId, property.id)

        // Then update the property ID itself
        await prisma.$executeRawUnsafe(`
          UPDATE properties 
          SET id = $1 
          WHERE id = $2
        `, newId, property.id)

        console.log(`✅ Updated: ${property.id} → ${newId} (${property.title.substring(0, 40)}...)`)
        updated++
      } catch (error: any) {
        console.error(`❌ Error updating ${property.id}:`, error.message)
      }
    }

    console.log(`\n🎉 Update complete!`)
    console.log(`   ✅ Updated: ${updated} properties`)
    console.log(`   ⏭️  Skipped: ${skipped} properties`)
    console.log(`   📊 Total: ${properties.length} properties`)
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })

