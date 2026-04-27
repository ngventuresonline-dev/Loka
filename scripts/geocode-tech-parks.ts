/**
 * Geocodes all bangalore_tech_parks rows.
 * Many rows share AI-generated area centroids. This replaces them with real coords.
 *
 * Usage:
 *   npx tsx scripts/geocode-tech-parks.ts
 *   npx tsx scripts/geocode-tech-parks.ts --dry-run
 *   npx tsx scripts/geocode-tech-parks.ts --failed
 *
 * Env: GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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

const failureCsvPath = resolve(process.cwd(), 'geocode-techparks-failures.csv')
const successLogPath = resolve(process.cwd(), 'geocode-techparks-done.log')

function inBangalore(lat: number, lng: number) {
  return lat >= BANGALORE_BBOX.latMin && lat <= BANGALORE_BBOX.latMax
    && lng >= BANGALORE_BBOX.lngMin && lng <= BANGALORE_BBOX.lngMax
}

async function geocode(name: string, locality: string | null): Promise<{ lat: number; lng: number } | null> {
  const queries = [
    `${name}, ${locality || 'Bangalore'}, Bangalore, Karnataka, India`,
    `${name}, Bangalore, Karnataka, India`,
    `${name.replace(/\s+(Phase \d+|Campus|HQ|India|Centre|Center)$/i, '').trim()}, Bangalore, Karnataka, India`,
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
        console.error(`\n❌  API blocked: ${json.status}`); process.exit(1)
      }
      if (json.status === 'OK' && json.results[0]) {
        const { lat, lng } = json.results[0].geometry.location
        if (inBangalore(lat, lng)) return { lat, lng }
      }
    } catch (e) { console.error('  fetch error:', e) }
  }
  return null
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

async function main() {
  console.log(`\n🏢  Tech parks geocoder  ${dryRun ? '(DRY RUN)' : ''}`)

  const { data: parks, error } = await supabase
    .from('bangalore_tech_parks')
    .select('id, name, locality, zone, latitude, longitude')
    .order('name')

  if (error || !parks) { console.error('❌  DB read error:', error); process.exit(1) }

  let rows = parks as Array<{ id: string; name: string; locality: string | null; zone: string | null; latitude: number; longitude: number }>

  if (retryFailed && existsSync(failureCsvPath)) {
    const csv = readFileSync(failureCsvPath, 'utf8')
    const failedIds = new Set(csv.split('\n').slice(1).map((l) => l.split(',')[0].replace(/"/g, '')).filter(Boolean))
    rows = rows.filter((r) => failedIds.has(r.id))
    writeFileSync(failureCsvPath, 'id,name,reason\n')
    console.log(`   Retrying ${rows.length} failed rows`)
  }

  if (limit) rows = rows.slice(0, limit)
  console.log(`   Processing ${rows.length} tech parks...\n`)

  const doneIds = new Set<string>()
  if (existsSync(successLogPath)) {
    readFileSync(successLogPath, 'utf8').split('\n').filter(Boolean).forEach((id) => doneIds.add(id))
  }

  let updated = 0, failed = 0, skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const progress = `[${String(i + 1).padStart(3)}/${rows.length}]`

    if (doneIds.has(row.id)) {
      skipped++
      process.stdout.write(`${progress} ⏭  ${row.name.slice(0, 50)}\r`)
      continue
    }

    process.stdout.write(`${progress} 🔍 ${row.name.slice(0, 50).padEnd(52)}\r`)

    const result = await geocode(row.name, row.locality)

    if (!result) {
      console.log(`${progress} ❌  ${row.name} (${row.locality ?? '?'})`)
      if (!existsSync(failureCsvPath)) writeFileSync(failureCsvPath, 'id,name,reason\n')
      appendFileSync(failureCsvPath, `"${row.id}","${row.name.replace(/"/g, '')}","no_result_in_bangalore"\n`)
      failed++
    } else {
      const moved = Math.abs(result.lat - row.latitude) > 0.001 || Math.abs(result.lng - row.longitude) > 0.001
      const delta = moved ? ` Δ(${(result.lat - row.latitude).toFixed(3)}, ${(result.lng - row.longitude).toFixed(3)})` : ' (same)'
      console.log(`${progress} ✅  ${row.name.slice(0, 42).padEnd(42)} ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}${delta}`)

      if (!dryRun) {
        const { error: upErr } = await supabase
          .from('bangalore_tech_parks')
          .update({ latitude: result.lat, longitude: result.lng })
          .eq('id', row.id)
        if (upErr) {
          console.error(`  ⚠️  update failed:`, upErr.message); failed++
        } else {
          appendFileSync(successLogPath, row.id + '\n'); updated++
        }
      } else { updated++ }
    }

    if (i < rows.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅  Updated : ${updated}`)
  console.log(`❌  Failed  : ${failed}${failed > 0 ? `  → ${failureCsvPath}` : ''}`)
  console.log(`⏭  Skipped : ${skipped}`)
  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)
}

main().catch((e) => { console.error(e); process.exit(1) })
