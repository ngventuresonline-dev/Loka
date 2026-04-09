/**
 * Step 2+ — Pocket + locality_intel → properties.*, property_location_cache, location_* tables.
 *
 * Runs the same pipeline as listing approval (runPropertyReferenceEnrichment).
 * Use after coordinates exist (Step 1 or map_link).
 *
 * Usage:
 *   npx tsx scripts/enrich-properties-reference-data.ts
 *   npx tsx scripts/enrich-properties-reference-data.ts --propertyId=<uuid>
 *   npx tsx scripts/enrich-properties-reference-data.ts --approved-only --limit=50
 *   npx tsx scripts/enrich-properties-reference-data.ts --geocode-missing   # allow Google fallback per row
 *
 * Env: DATABASE_URL
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { runPropertyReferenceEnrichment } from '../src/lib/enrichment/property-reference-enrichment'

config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

const propertyIdArg = process.argv.find((a) => a.startsWith('--propertyId='))?.split('=')[1]
const approvedOnly = process.argv.includes('--approved-only')
const geocodeMissing = process.argv.includes('--geocode-missing')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limitParsed = limitArg ? parseInt(limitArg.split('=')[1] || '', 10) : NaN
const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : null

async function main() {
  if (propertyIdArg) {
    const r = await runPropertyReferenceEnrichment(prisma, propertyIdArg, {
      geocodeIfMissing: geocodeMissing,
    })
    console.log(JSON.stringify(r, null, 2))
    return
  }

  const where = approvedOnly
    ? { status: 'approved' as const, latitude: { not: null } }
    : { latitude: { not: null } }

  const props = await prisma.property.findMany({
    where,
    select: { id: true, title: true },
    ...(limit ? { take: limit, orderBy: { updatedAt: 'desc' as const } } : { orderBy: { updatedAt: 'desc' as const } }),
  })

  const summary = { total: props.length, ok: 0, failed: 0, reasons: {} as Record<string, number> }
  for (const p of props) {
    const r = await runPropertyReferenceEnrichment(prisma, p.id, { geocodeIfMissing: geocodeMissing })
    if (r.ok) summary.ok++
    else {
      summary.failed++
      const k = r.reason || 'unknown'
      summary.reasons[k] = (summary.reasons[k] || 0) + 1
    }
    console.log(p.id.slice(0, 8), p.title?.slice(0, 36), r.ok ? 'OK' : r.reason)
  }
  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
