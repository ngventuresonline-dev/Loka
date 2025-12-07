/**
 * Simple connection test
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function test() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing connection...\n')
    
    // Simple connection test
    await prisma.$connect()
    console.log('✅ Connected successfully!\n')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query successful:', result)
    
    // Test if we can access tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      LIMIT 5
    `
    console.log(`✅ Found ${tables.length} table(s)`)
    
    console.log('\n✅ Connection is working!')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error('   Code:', error.code)
    }
  } finally {
    await prisma.$disconnect()
  }
}

test()

