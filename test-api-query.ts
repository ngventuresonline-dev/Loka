/**
 * Test actual API queries that the app uses
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function testApiQueries() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing API-style queries...\n')
    
    // Test 1: Get properties (like GET /api/properties)
    console.log('1. Testing property listing...')
    const properties = await prisma.property.findMany({
      take: 3,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
    console.log(`   ✅ Found ${properties.length} properties`)
    
    // Test 2: Get single property (like GET /api/properties/[id])
    if (properties.length > 0) {
      console.log('\n2. Testing single property fetch...')
      const property = await prisma.property.findUnique({
        where: { id: properties[0].id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })
      console.log(`   ✅ Property found: ${property?.title}`)
    }
    
    // Test 3: Get users
    console.log('\n3. Testing user listing...')
    const users = await prisma.user.findMany({
      take: 3
    })
    console.log(`   ✅ Found ${users.length} users`)
    
    console.log('\n✅ All API queries working perfectly!')
    console.log('✅ Your application should work correctly with Supabase PostgreSQL')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testApiQueries()

