/**
 * Check actual database schema
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function checkSchema() {
  const prisma = new PrismaClient()

  try {
    await prisma.$connect()
    
    // Get table structures
    const tables = ['users', 'properties', 'inquiries', 'saved_properties']
    
    for (const tableName of tables) {
      console.log(`\n📋 Table: ${tableName}`)
      const columns = await prisma.$queryRaw<Array<{
        column_name: string
        data_type: string
        is_nullable: string
      }>>`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position
      `
      
      if (columns.length > 0) {
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`)
        })
      } else {
        console.log(`   ⚠️  Table not found`)
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()

