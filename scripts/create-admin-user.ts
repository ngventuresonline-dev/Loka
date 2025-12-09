/**
 * Script to create admin user in database
 * Run with: npx tsx scripts/create-admin-user.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Creating admin user...')
    
    const adminUser = await prisma.user.upsert({
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
    })
    
    console.log('✅ Admin user created/updated:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      userType: adminUser.userType,
    })
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
  } finally {
    await prisma.$disconnect()
  }
}

main()

