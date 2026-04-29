/**
 * Deactivates bad-quality brand entries from bangalore_brand_outlets.
 * Sets is_active = false (does NOT delete — can be reversed if needed).
 *
 * Catches:
 *   - Outcall / home-service businesses (not physical outlets)
 *   - Obvious person names in commercial categories
 *   - Known hyper-local / non-brand entries
 *
 * Usage:
 *   npx tsx scripts/cleanup-bad-brands.ts            ← dry run (default)
 *   npx tsx scripts/cleanup-bad-brands.ts --apply    ← write to DB
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: resolve(process.cwd(), '.env.local') })
dotenvConfig({ path: resolve(process.cwd(), '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL) { console.error('❌  SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_KEY) { console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const apply = process.argv.includes('--apply')

// ── Patterns that indicate a home/outcall service, not a physical outlet ──────
const BAD_PATTERNS: RegExp[] = [
  /\boutcall\b/i,
  /\bout[\s-]call\b/i,
  /\bhome\s*(massage|spa|beauty|facial|wax|service|visit|call)\b/i,
  /\bat[\s-]home\b/i,
  /\bmobile\s*(spa|salon|massage|beauty|grooming)\b/i,
  /\bdoorstep\s*(service|salon|spa|massage)\b/i,
  /\bon[\s-]demand\s*(spa|salon|massage)\b/i,
]

// ── Exact brand names to suppress (case-insensitive) ─────────────────────────
const BAD_EXACT: string[] = [
  'iyengar bakery',
  'sri iyengar bakery',
  'new iyengar bakery',
  'vinayaka hot chips',
  'home delivery',
  'arun kumar',
  'ravi kumar',
  'suresh kumar',
]

function isBad(name: string, _category: string | null): boolean {
  const lower = name.toLowerCase().trim()
  if (BAD_EXACT.some(b => lower === b)) return true
  if (BAD_PATTERNS.some(re => re.test(name))) return true
  return false
}

async function main() {
  console.log(`\n🧹  Brand cleanup  ${apply ? '(APPLYING)' : '(DRY RUN — pass --apply to write)'}`)

  type Row = { id: string; brand_name: string; category: string | null; locality: string | null }
  const allRows: Row[] = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('bangalore_brand_outlets')
      .select('id, brand_name, category, locality')
      .eq('is_active', true)
      .range(from, from + pageSize - 1)

    if (error) { console.error('fetch error:', error); break }
    if (!data?.length) break
    allRows.push(...(data as Row[]))
    if (data.length < pageSize) break
    from += pageSize
  }

  console.log(`   ${allRows.length} active outlets scanned\n`)

  const toDeactivate = allRows.filter(r => isBad(r.brand_name, r.category))

  if (!toDeactivate.length) {
    console.log('✅  No bad entries found.')
    return
  }

  console.log(`Found ${toDeactivate.length} entries to deactivate:\n`)
  toDeactivate.slice(0, 50).forEach(r =>
    console.log(`   [${(r.category ?? 'Other').padEnd(12)}] ${r.brand_name}  (${r.locality ?? ''})`)
  )
  if (toDeactivate.length > 50) console.log(`   … and ${toDeactivate.length - 50} more`)

  if (!apply) {
    console.log(`\n⚠️   Dry run — run with --apply to deactivate these in the DB`)
    return
  }

  // Deactivate in batches of 100
  const ids = toDeactivate.map(r => r.id)
  let done = 0
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const { error } = await supabase
      .from('bangalore_brand_outlets')
      .update({ is_active: false })
      .in('id', batch)
    if (error) { console.error('update error:', error) }
    else { done += batch.length }
  }

  console.log(`\n✅  Deactivated ${done} entries`)
}

main().catch(e => { console.error(e); process.exit(1) })
