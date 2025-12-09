import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking properties in database...\n')
  
  try {
    const count = await prisma.property.count()
    console.log(`Total properties in database: ${count}\n`)
    
    if (count > 0) {
      const properties = await prisma.property.findMany({
        take: 20,
        include: {
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      console.log('Sample properties:')
      properties.forEach((p, i) => {
        console.log(`${i + 1}. ${p.title}`)
        console.log(`   Location: ${p.city}`)
        console.log(`   Owner: ${p.owner?.name || 'N/A'}`)
        console.log(`   Price: ₹${Number(p.price).toLocaleString()}/${p.priceType}`)
        console.log(`   Size: ${p.size} sq ft`)
        console.log(`   Available: ${p.availability ? 'Yes' : 'No'}`)
        console.log(`   Featured: ${p.isFeatured ? 'Yes' : 'No'}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No properties found in database!')
      console.log('Run: npm run db:import-featured to import properties')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })

