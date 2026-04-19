/**
 * Copies Google Places POIs from `competitors` into:
 * - `property_intelligence.competitors` (top 5 summary JSON — same shape as enrichment)
 * - `property_location_cache.competitors` + `competitor_count` (up to 25 rows for dashboard / view match)
 *
 * Run after `competitors` rows exist (from warm-intel or enrichPropertyIntelligence):
 *   npx tsx scripts/sync-google-competitors-to-caches.ts
 *
 * Requires DATABASE_URL in .env / .env.local
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

function toIntelligenceSummary(
  rows: Array<{
    name: string
    distance: number
    rating: number | null
    priceLevel: number | null
  }>
) {
  return rows.slice(0, 5).map((c) => ({
    name: c.name,
    distance: c.distance,
    rating: c.rating ?? undefined,
    priceLevel: c.priceLevel ?? undefined,
  }))
}

function toLocationCacheJson(
  rows: Array<{
    name: string
    category: string
    distance: number
    rating: number | null
    reviewCount: number | null
    latitude: number
    longitude: number
  }>
) {
  return rows.slice(0, 25).map((c) => ({
    name: c.name,
    category: c.category,
    placeCategory: c.category,
    distance: c.distance,
    distanceMeters: c.distance,
    rating: c.rating != null ? Number(c.rating) : undefined,
    reviewCount: c.reviewCount != null ? Number(c.reviewCount) : undefined,
    userRatingsTotal: c.reviewCount != null ? Number(c.reviewCount) : undefined,
    lat: Number(c.latitude),
    lng: Number(c.longitude),
    branded: true,
  }))
}

async function main() {
  const grouped = await prisma.competitor.groupBy({
    by: ['propertyId'],
    _count: { _all: true },
  })

  let piUpdated = 0
  let plcUpdated = 0
  let plcSkipped = 0
  let piSkipped = 0

  for (const g of grouped) {
    const propertyId = g.propertyId
    const rows = await prisma.competitor.findMany({
      where: { propertyId },
      orderBy: { distance: 'asc' },
      take: 25,
    })
    if (rows.length === 0) continue

    const summary = toIntelligenceSummary(rows)
    const cacheJson = toLocationCacheJson(rows)
    const total = g._count._all

    const pi = await prisma.propertyIntelligence.updateMany({
      where: { propertyId },
      data: {
        competitors: summary as object,
        competitorCount: total,
      },
    })
    if (pi.count > 0) piUpdated += 1
    else piSkipped += 1

    const res = await prisma.$executeRaw`
      UPDATE property_location_cache
      SET
        competitors = ${JSON.stringify(cacheJson)}::jsonb,
        competitor_count = ${total}
      WHERE property_id = ${propertyId}
    `
    const n = Number(res)
    if (n > 0) plcUpdated += 1
    else plcSkipped += 1
  }

  console.log(
    JSON.stringify(
      {
        propertyIdsWithCompetitors: grouped.length,
        propertyIntelligenceRowsUpdated: piUpdated,
        propertyIntelligenceSkippedNoRow: piSkipped,
        locationCacheRowsUpdated: plcUpdated,
        locationCacheSkippedNoRow: plcSkipped,
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
