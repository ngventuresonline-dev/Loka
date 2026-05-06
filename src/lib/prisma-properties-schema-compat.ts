import type { PrismaClient } from '@prisma/client'

/**
 * Production DBs sometimes lag Prisma schema. These columns are optional intelligence / FK fields;
 * adding them if missing avoids hard failures on read/update.
 *
 * Runs once per process — subsequent calls are no-ops. Without this, every
 * request paid 3 round-trips to ALTER TABLE / CREATE INDEX (no-ops at the DB
 * level, but still latency on the hot path).
 */
let ensured: Promise<void> | null = null

export function ensurePropertiesOptionalColumns(prisma: PrismaClient): Promise<void> {
  if (ensured) return ensured
  ensured = (async () => {
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
  })()
  return ensured
}
