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
 * Env required (pass inline or set in .env.local):
 *   GOOGLE_MAPS_API_KEY        — Google Maps Geocoding API key
 *   SUPABASE_URL               — https://pasuywntzuyomkwfagep.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  — from Supabase dashboard → Settings → API → service_role
 *
 * Example:
 *   GOOGLE_MAPS_API_KEY=AIza... SUPABASE_URL=https://pasuywntzuyomkwfagep.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/geocode-societies.ts
 */

import { resolve } from 'path'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: resolve(process.cwd(), '.env.local') })
dotenvConfig({ path: resolve(process.cwd(), '.env') })

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!MAPS_KEY) { console.error('❌  GOOGLE_MAPS_API_KEY not set'); process.exit(1) }
if (!SUPABASE_URL) { console.error('❌  SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_KEY) { console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const dryRun = process.argv.includes('--dry-run')
const retryFailed = process.argv.includes('--failed')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1] || '0', 10) : null

const DELAY_MS = 150
const BANGALORE_BBOX = { latMin: 12.70, latMax: 13.45, lngMin: 77.30, lngMax: 77.95 }

const failureCsvPath = resolve(process.cwd(), 'geocode-societies-failures.csv')
const successLogPath = resolve(process.cwd(), 'geocode-societies-done.log')

type SocietyRow = { id: string; name: string; locality: string | null; latitude: number; longitude: number }

function inBangalore(lat: number, lng: number) {
  return lat >= BANGALORE_BBOX.latMin && lat <= BANGALORE_BBOX.latMax
    && lng >= BANGALORE_BBOX.lngMin && lng <= BANGALORE_BBOX.lngMax
}

async function geocode(name: string, locality: string | null): Promise<{ lat: number; lng: number } | null> {
  const queries = [
    `${name}, ${locality || 'Bangalore'}, Bangalore, Karnataka, India`,
    `${name}, Bangalore, Karnataka, India`,
    `${name.replace(/\s+(Phase \d+|Tower \d+|Block [A-Z]|\(.*?\))$/i, '').trim()}, ${locality || 'Bangalore'}, Bangalore, Karnataka, India`,
  ]

  for (const q of queries) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${MAPS_KEY}`
    try {
      const res = await fetch(url)
      const json = await res.json() as {
        status: string
        results: Array<{ geometry: { location: { lat: number; lng: number } } }>
      }
      if (json.status === 'OVER_DAILY_LIMIT' || json.status === 'REQUEST_DENIED') {
        console.error(`\n❌  API blocked: ${json.status}`)
        process.exit(1)
      }
      if (json.status === 'OK' && json.results[0]) {
        const { lat, lng } = json.results[0].geometry.location
        if (inBangalore(lat, lng)) return { lat, lng }
      }
    } catch (e) {
      console.error(`  fetch error:`, e)
    }
  }
  return null
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

function logFailure(row: SocietyRow, reason: string) {
  if (!existsSync(failureCsvPath)) writeFileSync(failureCsvPath, 'id,name,locality,reason\n')
  appendFileSync(failureCsvPath, `"${row.id}","${row.name}","${row.locality ?? ''}","${reason}"\n`)
}

async function main() {
  console.log(`\n🗺  Societies geocoder  ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`   Supabase: ${SUPABASE_URL}`)
  console.log(`   Maps key: ${MAPS_KEY.slice(0, 8)}...`)

  // Read all societies
  const { data, error } = await supabase
    .from('bangalore_societies')
    .select('id, name, locality, latitude, longitude')
    .order('name')

  if (error || !data) { console.error('❌  DB read failed:', error); process.exit(1) }

  let rows = data as SocietyRow[]

  // --failed: retry only ids from failure CSV
  if (retryFailed && existsSync(failureCsvPath)) {
    const csv = readFileSync(failureCsvPath, 'utf8')
    const failedIds = new Set(csv.split('\n').slice(1).map((l) => l.split(',')[0].replace(/"/g, '')).filter(Boolean))
    rows = rows.filter((r) => failedIds.has(r.id))
    writeFileSync(failureCsvPath, 'id,name,locality,reason\n')
    console.log(`   Retrying ${rows.length} previously failed rows`)
  }

  if (limit && limit > 0) {
    rows = rows.slice(0, limit)
    console.log(`   Limited to first ${limit} rows`)
  }

  console.log(`   Processing ${rows.length} societies...\n`)

  // Resume support
  const doneIds = new Set<string>()
  if (existsSync(successLogPath)) {
    readFileSync(successLogPath, 'utf8').split('\n').filter(Boolean).forEach((id) => doneIds.add(id))
  }

  let updated = 0, failed = 0, skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const progress = `[${String(i + 1).padStart(4)}/${rows.length}]`

    if (doneIds.has(row.id)) {
      skipped++
      process.stdout.write(`${progress} ⏭  ${row.name.slice(0, 50)}\r`)
      continue
    }

    process.stdout.write(`${progress} 🔍 ${row.name.slice(0, 50).padEnd(52)}\r`)

    const result = await geocode(row.name, row.locality)

    if (!result) {
      console.log(`${progress} ❌  ${row.name} (${row.locality ?? '?'})`)
      logFailure(row, 'no_result_in_bangalore')
      failed++
    } else {
      const moved = Math.abs(result.lat - row.latitude) > 0.001 || Math.abs(result.lng - row.longitude) > 0.001
      const delta = moved
        ? ` Δ(${(result.lat - row.latitude).toFixed(3)}, ${(result.lng - row.longitude).toFixed(3)})`
        : ' (same)'
      console.log(`${progress} ✅  ${row.name.slice(0, 42).padEnd(42)} ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}${delta}`)

      if (!dryRun) {
        const { error: upErr } = await supabase
          .from('bangalore_societies')
          .update({ latitude: result.lat, longitude: result.lng })
          .eq('id', row.id)
        if (upErr) {
          console.error(`      ⚠️  update failed for ${row.id}:`, upErr.message)
          logFailure(row, `update_error: ${upErr.message}`)
          failed++
        } else {
          appendFileSync(successLogPath, row.id + '\n')
          updated++
        }
      } else {
        updated++
      }
    }

    if (i < rows.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅  Updated : ${updated}`)
  console.log(`❌  Failed  : ${failed}${failed > 0 ? `  → ${failureCsvPath}` : ''}`)
  console.log(`⏭  Skipped : ${skipped} (already done)`)
  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)
}

main().catch((e) => { console.error(e); process.exit(1) })
