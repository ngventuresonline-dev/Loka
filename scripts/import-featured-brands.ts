import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { brandRequirements } from '../src/data/brand-requirements'
import { generateBrandId } from '../src/lib/brand-id-generator'

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

async function importFeaturedBrands() {
  try {
    console.log('Starting import of featured brands...')
    
    let imported = 0
    let skipped = 0
    
    for (const brandReq of brandRequirements) {
      // Generate email from brand name
      const email = `${brandReq.brandName.toLowerCase().replace(/\s+/g, '')}@brand.com`
      
      // Check if brand already exists
      const existing = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existing) {
        console.log(`Skipping ${brandReq.brandName} - already exists`)
        skipped++
        continue
      }
      
      // Hash a default password
      const hashedPassword = await bcrypt.hash('Brand@123', 10)
      
      // Generate brand ID in BP-XXX format
      const brandId = await generateBrandId()
      
      // Create user and brand profile with BP-XXX ID
      const user = await prisma.user.create({
        data: {
          id: brandId,
          email,
          password: hashedPassword,
          name: brandReq.brandName,
          phone: null,
          userType: 'brand',
          isActive: true,
          displayOrder: imported + 1, // Set display order based on import order
          brandProfiles: {
            create: {
              company_name: brandReq.brandName,
              industry: brandReq.businessType,
              budget_min: brandReq.budgetRange.monthly.min,
              budget_max: brandReq.budgetRange.monthly.max,
              min_size: brandReq.sizeRequirement.sqft.min,
              max_size: brandReq.sizeRequirement.sqft.max,
              preferred_locations: [
                ...brandReq.preferredLocations.primary,
                ...(brandReq.preferredLocations.secondary || [])
              ],
              must_have_amenities: {
                timeline: brandReq.timeline,
                storeType: brandReq.businessType,
                targetAudience: '',
                additionalRequirements: brandReq.mustHaveFeatures.join(', ')
              }
            }
          }
        }
      })
      
      console.log(`✓ Imported: ${brandReq.brandName} (${user.id})`)
      imported++
    }
    
    console.log(`\nImport complete!`)
    console.log(`Imported: ${imported} brands`)
    console.log(`Skipped: ${skipped} brands (already exist)`)
    
  } catch (error) {
    console.error('Error importing featured brands:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importFeaturedBrands()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

