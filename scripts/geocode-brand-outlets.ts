/**
 * Geocodes + populates bangalore_brand_outlets from two sources:
 *
 *  1. Existing outlet rows (123) — geocode using street_address + area + locality
 *  2. Directory brands missing from outlets (571) — insert flagship row + geocode
 *
 * Result: every brand in bangalore_brand_directory has at least one geocoded outlet.
 *
 * Usage:
 *   npx tsx scripts/geocode-brand-outlets.ts              # full run
 *   npx tsx scripts/geocode-brand-outlets.ts --dry-run
 *   npx tsx scripts/geocode-brand-outlets.ts --limit=50
 *   npx tsx scripts/geocode-brand-outlets.ts --failed
 *
 * Env:
 *   GOOGLE_MAPS_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
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

const failureCsvPath = resolve(process.cwd(), 'geocode-outlets-failures.csv')
const successLogPath = resolve(process.cwd(), 'geocode-outlets-done.log')

function inBangalore(lat: number, lng: number) {
  return lat >= BANGALORE_BBOX.latMin && lat <= BANGALORE_BBOX.latMax
    && lng >= BANGALORE_BBOX.lngMin && lng <= BANGALORE_BBOX.lngMax
}

async function geocode(queries: string[]): Promise<{ lat: number; lng: number } | null> {
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

function logFailure(id: string, name: string, reason: string) {
  if (!existsSync(failureCsvPath)) writeFileSync(failureCsvPath, 'id,name,reason\n')
  appendFileSync(failureCsvPath, `"${id}","${name.replace(/"/g, '')}","${reason}"\n`)
}

async function main() {
  console.log(`\n🏪  Brand outlets geocoder  ${dryRun ? '(DRY RUN)' : ''}`)

  // ── Phase 1: Geocode existing outlet rows with NULL coords ──────────────────
  const { data: existingOutlets, error: e1 } = await supabase
    .from('bangalore_brand_outlets')
    .select('id, brand_name, category, street_address, area, locality, zone, format, is_flagship')
    .is('lat', null)
    .order('brand_name')

  if (e1) { console.error('❌  DB read error:', e1); process.exit(1) }

  // ── Phase 2: Directory brands missing from outlets ──────────────────────────
  const { data: directory, error: e2 } = await supabase
    .from('bangalore_brand_directory')
    .select('id, brand_name, industry, type, category, flagship_location, bangalore_localities, format, store_type')
    .eq('is_active', true)
    .order('brand_name')

  if (e2) { console.error('❌  DB read error:', e2); process.exit(1) }

  // Find directory brands that have no outlet row at all
  const { data: existingOutletNames } = await supabase
    .from('bangalore_brand_outlets')
    .select('brand_name')

  const outletNameSet = new Set(
    (existingOutletNames || []).map((r: { brand_name: string }) => r.brand_name.toLowerCase())
  )

  const missingFromOutlets = (directory || []).filter(
    (d: { brand_name: string }) => !outletNameSet.has(d.brand_name.toLowerCase())
  )

  // Build work queue
  type WorkItem =
    | { kind: 'update'; id: string; brandName: string; queries: string[] }
    | { kind: 'insert'; brandName: string; industry: string; type: string | null; category: string | null; locality: string; format: string | null; queries: string[] }

  const queue: WorkItem[] = [
    // Phase 1: update existing NULL rows
    ...(existingOutlets || []).map((o: {
      id: string; brand_name: string; street_address: string | null
      area: string | null; locality: string | null
    }) => ({
      kind: 'update' as const,
      id: o.id,
      brandName: o.brand_name,
      queries: [
        `${o.brand_name}, ${o.street_address || ''}, ${o.locality || 'Bangalore'}, Bangalore, Karnataka, India`,
        `${o.brand_name}, ${o.area || o.locality || 'Bangalore'}, Bangalore, Karnataka, India`,
        `${o.brand_name}, Bangalore, Karnataka, India`,
      ].filter((q) => q.trim().replace(/,\s*/g, '').length > 5),
    })),
    // Phase 2: insert missing directory brands
    ...(missingFromOutlets).map((d: {
      brand_name: string; industry: string; type: string | null; category: string | null
      flagship_location: string | null; bangalore_localities: string[] | null; format: string | null; store_type: string | null
    }) => ({
      kind: 'insert' as const,
      brandName: d.brand_name,
      industry: d.industry,
      type: d.type,
      category: d.category,
      locality: d.flagship_location || (d.bangalore_localities?.[0] ?? 'Bangalore'),
      format: d.format || d.store_type,
      queries: [
        `${d.brand_name}, ${d.flagship_location || ''}, Bangalore, Karnataka, India`,
        `${d.brand_name}, ${d.bangalore_localities?.[0] || 'Bangalore'}, Bangalore, Karnataka, India`,
        `${d.brand_name}, Bangalore, Karnataka, India`,
      ].filter((q) => q.trim().replace(/,\s*/g, '').length > 5),
    })),
  ]

  console.log(`   Phase 1 — geocode ${existingOutlets?.length ?? 0} existing NULL rows`)
  console.log(`   Phase 2 — insert + geocode ${missingFromOutlets.length} missing brands`)
  console.log(`   Total: ${queue.length} items\n`)

  // Resume / retry support
  const doneIds = new Set<string>()
  if (existsSync(successLogPath)) {
    readFileSync(successLogPath, 'utf8').split('\n').filter(Boolean).forEach((id) => doneIds.add(id))
  }

  let failedIds: Set<string> = new Set()
  if (retryFailed && existsSync(failureCsvPath)) {
    const csv = readFileSync(failureCsvPath, 'utf8')
    failedIds = new Set(csv.split('\n').slice(1).map((l) => l.split(',')[0].replace(/"/g, '')).filter(Boolean))
    writeFileSync(failureCsvPath, 'id,name,reason\n')
  }

  let items = retryFailed ? queue.filter((q) => failedIds.has(q.kind === 'update' ? q.id : q.brandName)) : queue
  if (limit) items = items.slice(0, limit)

  let updated = 0, inserted = 0, failed = 0, skipped = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const key = item.kind === 'update' ? item.id : item.brandName
    const progress = `[${String(i + 1).padStart(4)}/${items.length}]`

    if (doneIds.has(key)) {
      skipped++
      process.stdout.write(`${progress} ⏭  ${item.brandName.slice(0, 50)}\r`)
      continue
    }

    process.stdout.write(`${progress} 🔍 ${item.brandName.slice(0, 50).padEnd(52)}\r`)

    const result = await geocode(item.queries)

    if (!result) {
      console.log(`${progress} ❌  ${item.brandName} — no result in Bangalore`)
      logFailure(key, item.brandName, 'no_result_in_bangalore')
      failed++
    } else {
      const tag = item.kind === 'update' ? '📍' : '➕'
      console.log(`${progress} ${tag}  ${item.brandName.slice(0, 42).padEnd(42)} ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`)

      if (!dryRun) {
        if (item.kind === 'update') {
          const { error } = await supabase
            .from('bangalore_brand_outlets')
            .update({ lat: result.lat, lng: result.lng })
            .eq('id', item.id)
          if (error) { logFailure(key, item.brandName, error.message); failed++ }
          else { appendFileSync(successLogPath, key + '\n'); updated++ }
        } else {
          const { error } = await supabase
            .from('bangalore_brand_outlets')
            .insert({
              id: `out-${item.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40)}-${Date.now().toString(36)}`,
              brand_name: item.brandName,
              industry: item.industry,
              type: item.type,
              category: item.category,
              locality: item.locality,
              format: item.format,
              lat: result.lat,
              lng: result.lng,
              is_active: true,
              data_confidence: 'medium',
            })
          if (error) { logFailure(key, item.brandName, error.message); failed++ }
          else { appendFileSync(successLogPath, key + '\n'); inserted++ }
        }
      } else {
        if (item.kind === 'update') updated++; else inserted++
      }
    }

    if (i < items.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`📍  Updated  : ${updated} (existing rows geocoded)`)
  console.log(`➕  Inserted : ${inserted} (new rows from directory)`)
  console.log(`❌  Failed   : ${failed}${failed > 0 ? `  → ${failureCsvPath}` : ''}`)
  console.log(`⏭  Skipped  : ${skipped}`)
  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)
}

main().catch((e) => { console.error(e); process.exit(1) })
