import type { PrismaClient } from '@prisma/client'

/**
 * Production DBs sometimes lag Prisma schema. These columns are optional intelligence / FK fields;
 * adding them if missing avoids hard failures on read/update.
 */
export async function ensurePropertiesOptionalColumns(prisma: PrismaClient) {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS map_link VARCHAR(1000)`
    )
  } catch {
    /* ignore */
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_id VARCHAR(36)`
    )
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_properties_location_id ON properties(location_id)`
    )
  } catch {
    /* ignore */
  }
}
