import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.error('.env.local file not found')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment')
  process.exit(1)
}

// Process DATABASE_URL similar to how prisma.ts does it
let databaseUrl = (process.env.DATABASE_URL || '').trim()
// Remove quotes if present
databaseUrl = databaseUrl.replace(/^["']|["']$/g, '')
databaseUrl = databaseUrl.replace(/\\+$/, '').replace(/\n+/g, '').replace(/\r+/g, '').trim()

console.log('DATABASE_URL length:', databaseUrl.length)
console.log('DATABASE_URL starts with:', databaseUrl.substring(0, 30))

// Validate URL format
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('Invalid DATABASE_URL format. Must start with postgresql:// or postgres://')
  console.error('Current value (first 50 chars):', databaseUrl.substring(0, 50))
  process.exit(1)
}

// For Supabase connections, ensure proper SSL
if (databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')) {
  const urlParts = databaseUrl.split('?')
  const baseUrl = urlParts[0]
  const existingParams = urlParts[1] ? new URLSearchParams(urlParts[1]) : new URLSearchParams()
  
  if (!existingParams.has('sslmode')) {
    existingParams.set('sslmode', 'require')
  }
  
  databaseUrl = `${baseUrl}?${existingParams.toString()}`
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

async function main() {
  console.log('Creating expert_requests table and enum...')

  try {
    // Create the enum type if it doesn't exist (using DO block to handle if exists)
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE expert_request_status_enum AS ENUM ('pending', 'contacted', 'scheduled', 'completed', 'cancelled');
      `)
      console.log('✅ Created expert_request_status_enum')
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === '42P07') {
        console.log('ℹ️  expert_request_status_enum already exists, skipping...')
      } else {
        throw error
      }
    }

    // Create the table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE expert_requests (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
          property_id VARCHAR(36) NOT NULL,
          brand_name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20) NOT NULL,
          schedule_date_time TIMESTAMP(6) NOT NULL,
          notes TEXT NOT NULL,
          status expert_request_status_enum NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT expert_requests_property_id_fkey 
            FOREIGN KEY (property_id) 
            REFERENCES properties(id) 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        )
      `)
      console.log('✅ Created expert_requests table')
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === '42P07') {
        console.log('ℹ️  expert_requests table already exists, skipping...')
      } else {
        throw error
      }
    }

    // Create indexes one by one
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_expert_requests_property_id ON expert_requests(property_id)',
      'CREATE INDEX IF NOT EXISTS idx_expert_requests_status ON expert_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_expert_requests_created_at ON expert_requests(created_at)'
    ]

    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql)
        console.log(`✅ Created index: ${indexSql.split(' ')[5]}`)
      } catch (error: any) {
        console.warn(`⚠️  Index creation warning:`, error.message)
        // Continue even if index creation fails
      }
    }

    console.log('✅ expert_requests table and indexes created successfully!')
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

