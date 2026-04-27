/**
 * Geocodes all rows in bangalore_societies using Google Geocoding API.
 * All existing coordinates are AI-generated area centroids and cannot be trusted.
 * This script replaces them with real geocoded positions.
 *
 * Usage:
 *   npx tsx scripts/geocode-societies.ts              # geocode all 1,035 rows
 *   npx tsx scripts/geocode-societies.ts --dry-run    # preview only, no writes
 *   npx tsx scripts/geocode-societies.ts --limit=50   # process first N rows
 *   npx tsx scripts/geocode-societies.ts --failed     # retry only previously failed rows (from CSV)
 *
 * Env required:
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY  (or GOOGLE_MAPS_API_KEY)
 *   DATABASE_URL                     (Postgres connection string, via .env.local)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

const MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY || ''

if (!MAPS_KEY) {
  console.error('❌  No Google Maps API key found. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local')
  process.exit(1)
}

const dryRun = process.argv.includes('--dry-run')
const retryFailed = process.argv.includes('--failed')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1] || '0', 10) : null

const DELAY_MS = 150           // ~6 req/s, well within Google's 50 req/s limit
const BANGALORE_BBOX = { latMin: 12.70, latMax: 13.45, lngMin: 77.30, lngMax: 77.95 }

const failureCsvPath = resolve(__dirname, '../geocode-societies-failures.csv')
const successLogPath = resolve(__dirname, '../geocode-societies-done.log')

type SocietyRow = { id: string; name: string; locality: string | null; latitude: number; longitude: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function inBangalore(lat: number, lng: number): boolean {
  return lat >= BANGALORE_BBOX.latMin && lat <= BANGALORE_BBOX.latMax
    && lng >= BANGALORE_BBOX.lngMin && lng <= BANGALORE_BBOX.lngMax
}

async function geocode(name: string, locality: string | null): Promise<{ lat: number; lng: number } | null> {
  // Try progressively looser queries if precise match fails
  const queries = [
    `${name}, ${locality || 'Bangalore'}, Bangalore, Karnataka, India`,
    `${name}, Bangalore, Karnataka, India`,
    // Strip common suffixes and retry
    `${name.replace(/\s+(Phase \d+|Tower \d+|Block [A-Z]|\(.*?\))$/i, '').trim()}, ${locality || 'Bangalore'}, Bangalore, Karnataka, India`,
  ]

  for (const q of queries) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${MAPS_KEY}`
    try {
      const res = await fetch(url)
      const json = await res.json() as {
        status: string
        results: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address: string }>
      }

      if (json.status === 'OK' && json.results[0]) {
        const { lat, lng } = json.results[0].geometry.location
        if (inBangalore(lat, lng)) return { lat, lng }
        // Result outside Bangalore — try next query variant
      }

      if (json.status === 'OVER_DAILY_LIMIT' || json.status === 'REQUEST_DENIED') {
        console.error(`\n❌  API error: ${json.status}`)
        process.exit(1)
      }
    } catch (e) {
      console.error(`  fetch error for "${q}":`, e)
    }
  }

  return null
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function logFailure(row: SocietyRow, reason: string) {
  const line = `"${row.id}","${row.name}","${row.locality ?? ''}","${reason}"\n`
  if (!existsSync(failureCsvPath)) {
    writeFileSync(failureCsvPath, 'id,name,locality,reason\n')
  }
  appendFileSync(failureCsvPath, line)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🗺  Societies geocoder  ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`   API key: ${MAPS_KEY.slice(0, 8)}...`)

  // Load rows
  let rows = (await prisma.$queryRawUnsafe(
    `SELECT id, name, locality, latitude, longitude FROM bangalore_societies ORDER BY name`
  )) as SocietyRow[]

  // If --failed flag, only process ids that appear in the failure CSV
  if (retryFailed && existsSync(failureCsvPath)) {
    const csv = readFileSync(failureCsvPath, 'utf8')
    const failedIds = new Set(
      csv.split('\n').slice(1).map((l) => l.split(',')[0].replace(/"/g, '')).filter(Boolean)
    )
    rows = rows.filter((r) => failedIds.has(r.id))
    console.log(`   Retrying ${rows.length} previously failed rows`)
    // Clear the failure CSV so we get a fresh list
    writeFileSync(failureCsvPath, 'id,name,locality,reason\n')
  }

  if (limit && limit > 0) {
    rows = rows.slice(0, limit)
    console.log(`   Limited to first ${limit} rows`)
  }

  console.log(`   Processing ${rows.length} societies...\n`)

  let updated = 0
  let failed = 0
  let skipped = 0

  // Already-done set (skip if re-running with --limit)
  const doneIds = new Set<string>()
  if (existsSync(successLogPath)) {
    readFileSync(successLogPath, 'utf8').split('\n').filter(Boolean).forEach((id) => doneIds.add(id))
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const progress = `[${String(i + 1).padStart(4)}/${rows.length}]`

    if (doneIds.has(row.id)) {
      skipped++
      process.stdout.write(`${progress} ⏭  ${row.name.slice(0, 50)}\r`)
      continue
    }

    process.stdout.write(`${progress} 🔍 ${row.name.slice(0, 50).padEnd(50)}\r`)

    const result = await geocode(row.name, row.locality)

    if (!result) {
      console.log(`${progress} ❌  ${row.name} (${row.locality}) — no result in Bangalore`)
      logFailure(row, 'no_result_in_bangalore')
      failed++
    } else {
      const moved = Math.abs(result.lat - row.latitude) > 0.001 || Math.abs(result.lng - row.longitude) > 0.001
      const delta = moved
        ? `  Δ ${(result.lat - row.latitude).toFixed(4)}, ${(result.lng - row.longitude).toFixed(4)}`
        : '  (unchanged)'
      console.log(`${progress} ✅  ${row.name.slice(0, 45).padEnd(45)} → ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}${delta}`)

      if (!dryRun) {
        await prisma.$executeRawUnsafe(
          `UPDATE bangalore_societies SET latitude = $1, longitude = $2 WHERE id = $3`,
          result.lat, result.lng, row.id
        )
        appendFileSync(successLogPath, row.id + '\n')
      }
      updated++
    }

    if (i < rows.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅  Updated : ${updated}`)
  console.log(`❌  Failed  : ${failed}${failed > 0 ? `  → see ${failureCsvPath}` : ''}`)
  console.log(`⏭  Skipped : ${skipped} (already done)`)
  if (dryRun) console.log(`\n⚠️   Dry run — no database writes made`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
