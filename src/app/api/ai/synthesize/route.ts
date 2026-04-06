import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { INDUSTRY_KEYS } from '@/lib/intelligence/industry-key'
import { runPropertySynthesisForIndustry } from '@/lib/intelligence/property-synthesis-worker'

export const maxDuration = 300

const MAX_SYNTHESIS_JOBS_PER_RUN = 48

function isAuthorizedCronOrAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')?.trim() ?? ''
  const cronSecret = process.env.CRON_SECRET?.trim()
  const adminSecret = (process.env.ADMIN_SECRET || 'lokazen-admin-secret').trim()
  if (authHeader === `Bearer ${adminSecret}`) return true
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  return false
}

async function runSynthesize(request: NextRequest) {
  if (!isAuthorizedCronOrAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const properties = await prisma.property.findMany({
    where: { status: 'approved' },
    orderBy: { updatedAt: 'desc' },
    take: 80,
    select: { id: true },
  })

  let ok = 0
  let skippedFresh = 0
  let skippedNoLocation = 0
  let errors = 0

  outer: for (const p of properties) {
    for (const industryKey of INDUSTRY_KEYS) {
      if (ok + errors >= MAX_SYNTHESIS_JOBS_PER_RUN) break outer

      const r = await runPropertySynthesisForIndustry(prisma, {
        propertyId: p.id,
        industryKey,
        forceRefresh: false,
        cacheTtlDays: 3,
      })

      if (r.status === 'ok') {
        ok++
      } else if (r.status === 'skipped_fresh') {
        skippedFresh++
      } else if (r.status === 'skipped_no_location') {
        skippedNoLocation++
      } else {
        errors++
      }
    }
  }

  return NextResponse.json({
    success: true,
    propertiesScanned: properties.length,
    synthesisWritten: ok,
    skippedFresh,
    skippedNoLocation,
    errors,
    cappedAt: MAX_SYNTHESIS_JOBS_PER_RUN,
  })
}

/** Vercel Cron uses GET with Authorization: Bearer CRON_SECRET */
export async function GET(request: NextRequest) {
  return runSynthesize(request)
}

export async function POST(request: NextRequest) {
  return runSynthesize(request)
}
