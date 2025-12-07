/**
 * Test Prisma Models with Supabase
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function testModels() {
  console.log('🔍 Testing Prisma models with Supabase...\n')
  
  const prisma = new PrismaClient({
    log: ['error'],
  })

  try {
    await prisma.$connect()
    console.log('✅ Connected to database\n')

    // Test User model
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ User model: ${userCount} user(s) found`)
    } catch (error: any) {
      console.log(`❌ User model error: ${error.message}`)
    }

    // Test Property model
    try {
      const propertyCount = await prisma.property.count()
      console.log(`✅ Property model: ${propertyCount} property/properties found`)
    } catch (error: any) {
      console.log(`❌ Property model error: ${error.message}`)
    }

    // Test Inquiry model
    try {
      const inquiryCount = await prisma.inquiry.count()
      console.log(`✅ Inquiry model: ${inquiryCount} inquiry/inquiries found`)
    } catch (error: any) {
      console.log(`❌ Inquiry model error: ${error.message}`)
    }

    // Test SavedProperty model
    try {
      const savedCount = await prisma.savedProperty.count()
      console.log(`✅ SavedProperty model: ${savedCount} saved property/properties found`)
    } catch (error: any) {
      console.log(`❌ SavedProperty model error: ${error.message}`)
    }

    console.log('\n✅ All model tests completed!')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Disconnected')
  }
}

testModels()

