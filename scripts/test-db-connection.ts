/**
 * Test database connection and admin user lookup
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Test admin user lookup
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@ngventures.com' },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
      },
    })
    
    if (adminUser) {
      console.log('✅ Admin user found:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        userType: adminUser.userType,
      })
    } else {
      console.log('❌ Admin user NOT found - creating...')
      const newAdmin = await prisma.user.upsert({
        where: { email: 'admin@ngventures.com' },
        update: {
          name: 'System Administrator',
          userType: 'admin',
        },
        create: {
          email: 'admin@ngventures.com',
          name: 'System Administrator',
          password: '$2b$10$placeholder_hash_change_in_production',
          userType: 'admin',
        },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
        },
      })
      console.log('✅ Admin user created:', newAdmin)
    }
    
    // Test count query
    const userCount = await prisma.user.count()
    console.log(`✅ Total users in database: ${userCount}`)
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Error code:', error.code)
    console.error('Error details:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

