import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'
import type { BrandInsightsStored } from '@/lib/ai/brand-insights-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params
  if (!brandId) {
    return NextResponse.json({ error: 'brandId required' }, { status: 400 })
  }

  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = user.userType === 'admin' || (user.userType === 'brand' && user.id === brandId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const row = await prisma.brandInsight.findFirst({
    where: { brandId },
    orderBy: { generatedAt: 'desc' },
  })

  if (!row) {
    return NextResponse.json({
      status: 'generating' as const,
      message: 'Insights are not ready yet. They refresh on a schedule.',
    })
  }

  const insights = row.insights as BrandInsightsStored

  return NextResponse.json({
    status: 'ready' as const,
    id: row.id,
    brandId: row.brandId,
    insights,
    generatedAt: row.generatedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  })
}
