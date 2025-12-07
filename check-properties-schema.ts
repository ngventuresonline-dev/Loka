/**
 * Check actual properties table schema
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function checkSchema() {
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    
    // Get actual columns from properties table
    const columns = await prisma.$executeRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'properties'
      ORDER BY ordinal_position
    `)
    
    console.log('Properties table columns:')
    console.log(JSON.stringify(columns, null, 2))
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()

