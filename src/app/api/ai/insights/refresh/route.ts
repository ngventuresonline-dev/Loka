import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { generateBrandInsightsWithClaude } from '@/lib/ai/brand-insights'

export const maxDuration = 300

const MAX_BRANDS_PER_RUN = 10
const INSIGHTS_TTL_MS = 3 * 24 * 60 * 60 * 1000

function isAuthorizedCronOrAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const adminSecret = process.env.ADMIN_SECRET || 'lokazen-admin-secret'
  if (auth === `Bearer ${adminSecret}`) return true
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true
  return false
}

/**
 * Vercel Cron calls this path with GET + `Authorization: Bearer <CRON_SECRET>`.
 * POST is supported for manual / admin triggers with the same auth.
 */
async function runRefresh(request: NextRequest) {
  if (!isAuthorizedCronOrAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const now = new Date()

  const activeBrands = await prisma.user.findMany({
    where: {
      userType: 'brand',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      brandProfiles: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  })

  const needsRefresh: typeof activeBrands = []

  for (const b of activeBrands) {
    const latest = await prisma.brandInsight.findFirst({
      where: { brandId: b.id },
      orderBy: { generatedAt: 'desc' },
      select: { expiresAt: true },
    })
    if (!latest || latest.expiresAt < now) {
      needsRefresh.push(b)
    }
  }

  const batch = needsRefresh.slice(0, MAX_BRANDS_PER_RUN)

  const propertiesContext = await prisma.property.findMany({
    where: { status: 'approved' },
    orderBy: { updatedAt: 'desc' },
    take: 45,
    select: {
      id: true,
      title: true,
      city: true,
      address: true,
      propertyType: true,
      size: true,
      price: true,
      priceType: true,
    },
  })

  const propsForPrompt = propertiesContext.map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    address: p.address,
    propertyType: p.propertyType,
    size: p.size,
    price: Number(p.price),
    priceType: p.priceType,
  }))

  const processed: string[] = []
  const failed: Array<{ brandId: string; error: string }> = []

  for (const brand of batch) {
    const bp = brand.brandProfiles
    const brandContext = {
      user_id: brand.id,
      name: brand.name,
      email: brand.email,
      company_name: bp?.company_name ?? null,
      industry: bp?.industry ?? null,
      category: bp?.category ?? null,
      budget_min: bp?.budget_min != null ? Number(bp.budget_min) : null,
      budget_max: bp?.budget_max != null ? Number(bp.budget_max) : null,
      min_size: bp?.min_size ?? null,
      max_size: bp?.max_size ?? null,
      preferred_locations: bp?.preferred_locations ?? null,
    }

    try {
      const insights = await generateBrandInsightsWithClaude({
        brandContext,
        propertiesContext: propsForPrompt,
      })

      if (!insights) {
        failed.push({ brandId: brand.id, error: 'claude_empty_or_parse_failed' })
        continue
      }

      while (insights.market_pulse.length < 3) {
        insights.market_pulse.push('Monitor footfall and rent trends in your preferred micro-markets this quarter.')
      }
      insights.market_pulse = insights.market_pulse.slice(0, 3)

      const generatedAt = new Date()
      const expiresAt = new Date(generatedAt.getTime() + INSIGHTS_TTL_MS)

      await prisma.brandInsight.create({
        data: {
          brandId: brand.id,
          insights: insights as object,
          generatedAt,
          expiresAt,
        },
      })
      processed.push(brand.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown_error'
      failed.push({ brandId: brand.id, error: msg })
    }
  }

  return NextResponse.json({
    success: true,
    scanned: activeBrands.length,
    needingRefresh: needsRefresh.length,
    processed: processed.length,
    processedBrandIds: processed,
    failed,
    cappedAt: MAX_BRANDS_PER_RUN,
  })
}

export async function GET(request: NextRequest) {
  return runRefresh(request)
}

export async function POST(request: NextRequest) {
  return runRefresh(request)
}
