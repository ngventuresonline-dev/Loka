import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

async function updateBrandIds() {
  try {
    console.log('Starting brand ID migration to BP-XXX format...')
    
    // Get all brands
    const brands = await prisma.user.findMany({
      where: { userType: 'brand' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true }
    })

    console.log(`Found ${brands.length} brands to update`)

    let updated = 0
    let skipped = 0

    for (let i = 0; i < brands.length; i++) {
      const brand = brands[i]
      const newId = `BP-${(i + 1).toString().padStart(3, '0')}`
      
      // Skip if already in correct format
      if (brand.id.startsWith('BP-')) {
        console.log(`Skipping ${brand.name} - already has BP-XXX format (${brand.id})`)
        skipped++
        continue
      }

      try {
        // Check if the new ID already exists
        const existing = await prisma.user.findUnique({
          where: { id: newId }
        })

        if (existing) {
          console.log(`Warning: ID ${newId} already exists, skipping ${brand.name}`)
          skipped++
          continue
        }

        // Update the brand ID
        // Note: We need to update related records first, then the user
        // Since user_id is a foreign key in brand_profiles, we need to handle this carefully
        
        // Get brand profile
        const brandProfile = await prisma.brand_profiles.findUnique({
          where: { user_id: brand.id }
        })

        if (brandProfile) {
          // Delete old brand profile
          await prisma.brand_profiles.delete({
            where: { user_id: brand.id }
          })
        }

        // Update user ID
        await prisma.$executeRaw`
          UPDATE users 
          SET id = ${newId}
          WHERE id = ${brand.id}
        `

        // Recreate brand profile with new user_id
        if (brandProfile) {
          await prisma.brand_profiles.create({
            data: {
              ...brandProfile,
              id: undefined, // Let it generate new ID
              user_id: newId
            }
          })
        }

        console.log(`✓ Updated: ${brand.name} (${brand.id} -> ${newId})`)
        updated++
      } catch (error: any) {
        console.error(`Error updating ${brand.name}:`, error.message)
        skipped++
      }
    }

    console.log(`\nMigration complete!`)
    console.log(`Updated: ${updated} brands`)
    console.log(`Skipped: ${skipped} brands`)
    
  } catch (error) {
    console.error('Error migrating brand IDs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateBrandIds()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

