/**
 * Warm location cache + Claude synthesis for every approved property (server-side pipeline).
 *
 * Requires a running app that serves POST /api/admin/warm-intel-cache, OR set INTEL_WARM_BASE_URL
 * to your deployed origin (e.g. https://www.lokazen.in).
 *
 * Usage:
 *   npx tsx scripts/warm-all-properties-intel.ts
 *   npx tsx scripts/warm-all-properties-intel.ts --dry-run
 *   npx tsx scripts/warm-all-properties-intel.ts --limit=5
 *
 * Env: DATABASE_URL,
 *      ADMIN_SECRET (must match Vercel `ADMIN_SECRET` when warming production — add to .env.local),
 *      optional: INTEL_ADMIN_SECRET (alias),
 *      INTEL_WARM_BASE_URL | NEXT_PUBLIC_APP_URL
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

config({ path: resolve(__dirname, '../.env.local') })
config({ path: resolve(__dirname, '../.env') })

function resolveAdminSecret(): string {
  const s =
    process.env.ADMIN_SECRET?.trim() ||
    process.env.INTEL_ADMIN_SECRET?.trim() ||
    process.env.LOKAZEN_ADMIN_SECRET?.trim() ||
    'lokazen-admin-secret'
  return s
}

const prisma = new PrismaClient()

const dryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limitParsed = limitArg ? parseInt(limitArg.split('=')[1] || '', 10) : NaN
const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : null

async function main() {
  const baseUrl = (
    process.env.INTEL_WARM_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
  const secret = resolveAdminSecret()
  const isRemote = !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)
  if (isRemote && secret === 'lokazen-admin-secret') {
    console.error(
      '\nMissing production admin token: set ADMIN_SECRET in .env.local to the same value as Vercel → Project → Settings → Environment Variables → ADMIN_SECRET.\n' +
        '(This script does not read secrets from the Cursor UI — only from your env files.)\n'
    )
    process.exit(1)
  }

  const props = await prisma.property.findMany({
    where: { status: 'approved' },
    select: { id: true, title: true },
    orderBy: { updatedAt: 'desc' },
  })

  const toWarm = limit != null ? props.slice(0, limit) : props
  console.log(`Approved properties: ${props.length} (warming ${toWarm.length})`)
  console.log(`Target API: ${baseUrl}/api/admin/warm-intel-cache`)
  if (dryRun) {
    props.slice(0, 20).forEach((p) => console.log(`  ${p.id}  ${p.title?.slice(0, 60)}`))
    if (props.length > 20) console.log(`  ... +${props.length - 20} more`)
    await prisma.$disconnect()
    return
  }

  let ok = 0
  let fail = 0
  for (let i = 0; i < toWarm.length; i++) {
    const p = toWarm[i]
    process.stdout.write(`[${i + 1}/${toWarm.length}] ${p.id} `)
    try {
      const res = await fetch(`${baseUrl}/api/admin/warm-intel-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ propertyId: p.id, forceRefresh: true }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean
        results?: {
          synthesisCached?: number
          errors?: number
          locationCached?: number
          messages?: string[]
        }
      }
      if (!res.ok) {
        console.log(`FAIL ${res.status}`, JSON.stringify(json).slice(0, 180))
        fail++
        continue
      }
      const r = json.results
      console.log(
        `→ loc+syn: locationCached=${r?.locationCached ?? '?'} synthesisCached=${r?.synthesisCached ?? '?'} errors=${r?.errors ?? '?'}`
      )
      if (r?.messages?.length) {
        console.log('   messages:', r.messages.join(' | '))
      }
      ok++
    } catch (e) {
      console.log('ERR', e instanceof Error ? e.message : e)
      fail++
    }
    await new Promise((r) => setTimeout(r, 400))
  }

  console.log(`Done. OK=${ok} fail=${fail}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
