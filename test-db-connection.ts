/**
 * Test Supabase PostgreSQL Connection
 * Run with: npx tsx test-db-connection.ts
 */

import { PrismaClient } from '@prisma/client'

async function testConnection() {
  console.log('🔍 Testing Supabase PostgreSQL connection...\n')
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables')
    process.exit(1)
  }

  // Mask password in URL for logging
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@')
  console.log('📋 Connection String:', maskedUrl)
  console.log('')

  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

  try {
    console.log('⏳ Attempting to connect...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Successfully connected to database!\n')

    // Test a simple query
    console.log('⏳ Testing query...')
    const result = await prisma.$queryRaw`SELECT version() as version`
    console.log('✅ Database query successful!')
    console.log('📊 PostgreSQL Version:', (result as any)[0]?.version || 'Unknown')
    console.log('')

    // Check if tables exist
    console.log('⏳ Checking tables...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} table(s):`)
      tables.forEach(table => {
        console.log(`   - ${table.tablename}`)
      })
    } else {
      console.log('⚠️  No tables found. You may need to run migrations.')
    }
    console.log('')

    // Test Prisma models
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ User model accessible: ${userCount} user(s) found`)
    } catch (error: any) {
      console.log('⚠️  User table may not exist:', error.message)
    }

    try {
      const propertyCount = await prisma.property.count()
      console.log(`✅ Property model accessible: ${propertyCount} property/properties found`)
    } catch (error: any) {
      console.log('⚠️  Property table may not exist:', error.message)
    }

    console.log('\n✅ All connection tests passed!')
    
  } catch (error: any) {
    console.error('\n❌ Connection failed!')
    console.error('Error:', error.message)
    
    if (error.code === 'P1001') {
      console.error('\n💡 This usually means:')
      console.error('   - Database server is not reachable')
      console.error('   - Connection string is incorrect')
      console.error('   - Firewall is blocking the connection')
      console.error('   - Database credentials are wrong')
    } else if (error.code === 'P1000') {
      console.error('\n💡 This usually means:')
      console.error('   - Authentication failed')
      console.error('   - Username or password is incorrect')
    } else if (error.code === 'P1017') {
      console.error('\n💡 This usually means:')
      console.error('   - Database server closed the connection')
      console.error('   - Connection timeout')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Disconnected from database')
  }
}

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

testConnection().catch(console.error)

