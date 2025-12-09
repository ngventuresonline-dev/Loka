import { PrismaClient } from '@prisma/client'
import { featuredProperties } from '../src/data/featured-properties'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') })

async function generatePropertyId(prisma: PrismaClient, index: number): Promise<string> {
  // Check if prop-XXX already exists, if so find next available
  let propId = `prop-${(index + 1).toString().padStart(3, '0')}`
  let exists = await prisma.property.findUnique({ where: { id: propId } })
  
  if (exists) {
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
    propId = `prop-${(maxNum + 1).toString().padStart(3, '0')}`
  }
  
  return propId
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Importing featured properties to database...')

  // Get or create a default owner for these properties
  let defaultOwner = await prisma.user.findFirst({
    where: { userType: 'owner' }
  })

  if (!defaultOwner) {
    console.log('Creating default owner...')
    defaultOwner = await prisma.user.create({
      data: {
        email: 'default-owner@ngventures.com',
        name: 'Default Property Owner',
        password: '$2b$10$placeholder_hash_change_in_production',
        userType: 'owner',
        phone: '+91 00000 00000',
      }
    })
  }

  console.log(`Using owner: ${defaultOwner.name} (${defaultOwner.id})`)

  let imported = 0
  let skipped = 0

  for (const prop of featuredProperties) {
    try {
      // Parse size (e.g., "450 Sq. Ft." -> 450)
      const sizeMatch = prop.size.match(/(\d+(?:,\d+)?)/)
      const size = sizeMatch ? parseInt(sizeMatch[1].replace(/,/g, '')) : 0

      // Parse rent (e.g., "₹1,55,000/month" -> 155000 or "₹180/Sq. Ft." -> calculate)
      let price = 0
      let priceType: 'monthly' | 'yearly' | 'sqft' = 'monthly'
      
      if (prop.rent.includes('/Sq. Ft.')) {
        const rentPerSqft = parseFloat(prop.rent.replace(/[^0-9.]/g, ''))
        price = Math.round(rentPerSqft * size)
        priceType = 'sqft'
      } else if (prop.rent.includes('/month')) {
        price = parseFloat(prop.rent.replace(/[^0-9]/g, ''))
        priceType = 'monthly'
      } else {
        price = parseFloat(prop.rent.replace(/[^0-9]/g, ''))
        priceType = 'monthly'
      }

      // Parse deposit (e.g., "10 months" -> calculate from monthly rent)
      let securityDeposit: number | null = null
      if (prop.deposit.includes('months')) {
        const months = parseInt(prop.deposit.replace(/[^0-9]/g, ''))
        if (priceType === 'monthly') {
          securityDeposit = price * months
        }
      }

      // Determine property type from title
      let propertyType: 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other' = 'other'
      const titleLower = prop.title.toLowerCase()
      if (titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('qsr')) {
        propertyType = 'restaurant'
      } else if (titleLower.includes('retail') || titleLower.includes('shop') || titleLower.includes('kiosk')) {
        propertyType = 'retail'
      } else if (titleLower.includes('office')) {
        propertyType = 'office'
      } else if (titleLower.includes('warehouse')) {
        propertyType = 'warehouse'
      }

      // Check if property already exists (by title and location)
      const existing = await prisma.property.findFirst({
        where: {
          title: prop.title,
          city: prop.location,
        }
      })

      if (existing) {
        console.log(`⏭️  Skipping: ${prop.title} (already exists)`)
        skipped++
        continue
      }

      // Generate property ID
      const propertyId = await generatePropertyId(prisma, imported)

      // Create property
      await prisma.property.create({
        data: {
          id: propertyId,
          title: prop.title,
          description: `Commercial space in ${prop.location}. ${prop.floor}. ${prop.size}.`,
          address: prop.title.includes(prop.location) ? prop.title : `${prop.title}, ${prop.location}`,
          city: prop.location,
          state: 'Karnataka',
          zipCode: '560000',
          size,
          propertyType,
          price,
          priceType,
          securityDeposit,
          amenities: ['Parking', 'Security'],
          images: [],
          availability: prop.badge !== 'Leased Out',
          isFeatured: true,
          ownerId: defaultOwner.id,
          views: 0,
        }
      })

      console.log(`✅ Imported: ${prop.title} (${prop.location})`)
      imported++
    } catch (error: any) {
      console.error(`❌ Error importing ${prop.title}:`, error.message)
    }
  }

  console.log(`\n🎉 Import complete!`)
  console.log(`   ✅ Imported: ${imported} properties`)
  console.log(`   ⏭️  Skipped: ${skipped} properties (already exist)`)
  console.log(`   📊 Total: ${featuredProperties.length} properties`)
}

main()
  .catch((e) => {
    console.error('❌ Import error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

