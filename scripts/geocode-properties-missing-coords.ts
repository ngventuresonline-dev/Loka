/**
 * Step 1 — One-time (or periodic) geocoding for listings missing first-class coordinates.
 *
 * - Selects properties where latitude IS NULL.
 * - Geocodes via Google (and Mappls if configured) using the same helpers as the app.
 * - Writes latitude, longitude, map_link, and merges map_link into amenities JSON.
 * - 200ms delay between outbound geocode calls.
 * - Appends failures to a CSV for manual review.
 *
 * Prerequisites: run database/migrations/20260401120000_properties_enrichment_columns.sql (or prisma db push after schema pull).
 *
 * Usage:
 *   npx tsx scripts/geocode-properties-missing-coords.ts
 *   npx tsx scripts/geocode-properties-missing-coords.ts --dry-run
 *   npx tsx scripts/geocode-properties-missing-coords.ts --limit=20
 *
 * Env: DATABASE_URL, GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { appendFileSync, writeFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'
import {
  areUsablePinCoords,
  geocodeAddress,
  getPropertyCoordinatesFromRow,
} from '../src/lib/property-coordinates'

config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()
const dryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limitParsed = limitArg ? parseInt(limitArg.split('=')[1] || '', 10) : NaN
const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : null

const delayMs = 200
const csvPath = resolve(__dirname, `../geocode-failures-${new Date().toISOString().slice(0, 10)}.csv`)

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function googleMapsPinUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

function mergeMapLinkIntoAmenities(amenities: unknown, mapLink: string): Record<string, unknown> {
  const base =
    amenities && typeof amenities === 'object' && !Array.isArray(amenities)
      ? { ...(amenities as Record<string, unknown>) }
      : {}
  base.map_link = mapLink
  return base
}

function logFail(id: string, address: string, reason: string) {
  const line = `"${id.replace(/"/g, '""')}","${address.replace(/"/g, '""')}","${reason.replace(/"/g, '""')}"\n`
  appendFileSync(csvPath, line, 'utf8')
}

async function main() {
  writeFileSync(csvPath, 'property_id,address,reason\n', 'utf8')
  console.log('Failures CSV:', csvPath)

  let rows: Array<{
    id: string
    address: string
    city: string
    state: string | null
    title: string
    amenities: unknown
  }> = []

  try {
    rows = await prisma.property.findMany({
      where: { latitude: null },
      select: { id: true, address: true, city: true, state: true, title: true, amenities: true },
      ...(limit ? { take: limit, orderBy: { createdAt: 'asc' } } : { orderBy: { createdAt: 'asc' } }),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('latitude') || msg.includes('Unknown arg')) {
      console.error(
        'The `latitude` column is missing. Apply database/migrations/20260401120000_properties_enrichment_columns.sql then `npx prisma generate`.'
      )
    }
    throw e
  }

  console.log(`Found ${rows.length} properties with null latitude.`)

  let ok = 0
  let fail = 0

  for (const p of rows) {
    const fromRow = getPropertyCoordinatesFromRow({
      amenities: p.amenities,
      address: p.address,
      city: p.city,
      state: p.state,
      title: p.title,
    })
    if (fromRow && areUsablePinCoords(fromRow)) {
      const mapUrl = fromRow.mapLink || googleMapsPinUrl(fromRow.lat, fromRow.lng)
      if (!dryRun) {
        await prisma.property.update({
          where: { id: p.id },
          data: {
            latitude: fromRow.lat,
            longitude: fromRow.lng,
            mapLink: mapUrl,
            amenities: mergeMapLinkIntoAmenities(p.amenities, mapUrl) as object,
          },
        })
      }
      ok++
      console.log(`[amenities] ${p.id} ${p.title?.slice(0, 40)}`)
      await sleep(delayMs)
      continue
    }

    await sleep(delayMs)
    const g = await geocodeAddress(p.address, p.city, p.state || 'Karnataka', p.title)
    if (!g || !areUsablePinCoords(g)) {
      fail++
      logFail(p.id, `${p.address}, ${p.city}`, 'geocode_null_or_invalid')
      console.warn(`[fail] ${p.id}`)
      continue
    }

    const mapUrl = googleMapsPinUrl(g.lat, g.lng)
    if (!dryRun) {
      await prisma.property.update({
        where: { id: p.id },
        data: {
          latitude: g.lat,
          longitude: g.lng,
          mapLink: mapUrl,
          amenities: mergeMapLinkIntoAmenities(p.amenities, mapUrl) as object,
        },
      })
    }
    ok++
    console.log(`[geocode] ${p.id}`)
  }

  console.log(JSON.stringify({ ok, fail, dryRun, total: rows.length }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
