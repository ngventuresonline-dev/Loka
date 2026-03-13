import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { enrichPropertyIntelligence } from '@/lib/intelligence/enrichment'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  const categoryFilter = req.nextUrl.searchParams.get('category') ?? undefined
  if (!propertyId) {
    return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const intelligence = await prisma.propertyIntelligence.findUnique({
    where: { propertyId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          state: true,
          propertyType: true,
          size: true,
          price: true,
          priceType: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  })

  if (!intelligence) {
    return NextResponse.json(
      { error: 'No intelligence data. Trigger enrichment with POST.' },
      { status: 404 }
    )
  }

  let competitors = await prisma.competitor.findMany({
    where: { propertyId },
    orderBy: { distance: 'asc' },
  })

  if (categoryFilter) {
    const normalized = categoryFilter.trim().toLowerCase()
    const categoryMatch = (c: { category: string }) => {
      const cat = (c.category || '').toLowerCase()
      if (normalized.includes('cafe') || normalized === 'cafe') return cat === 'cafe'
      if (normalized.includes('qsr')) return cat === 'qsr'
      if (normalized.includes('restaurant') || normalized.includes('dining') || normalized.includes('casual') || normalized.includes('fine')) return cat === 'restaurant' || cat.includes('dining')
      if (normalized.includes('brew') || normalized.includes('taproom') || normalized.includes('bar')) return cat === 'bar' || cat.includes('brew')
      if (normalized.includes('retail')) return cat === 'retail' || cat.includes('store') || cat.includes('shop')
      if (normalized.includes('bakery')) return cat === 'bakery'
      if (normalized.includes('salon') || normalized.includes('wellness') || normalized.includes('spa')) return cat === 'salon' || cat.includes('spa') || cat.includes('beauty')
      return true
    }
    competitors = competitors.filter(categoryMatch)
  }

  const ward =
    intelligence.wardCode != null
      ? await prisma.wardDemographics.findUnique({
          where: { wardCode: intelligence.wardCode },
        })
      : null

  return NextResponse.json({
    property: intelligence.property,
    intelligence,
    competitors,
    ward,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  if (!propertyId) {
    return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
  }

  let businessType: string | undefined
  try {
    const body = (await req.json().catch(() => null)) as { businessType?: string; targetCategory?: string } | null
    businessType = body?.businessType ?? body?.targetCategory ?? undefined
  } catch {
    // ignore
  }

  try {
    const result = await enrichPropertyIntelligence(propertyId, businessType)
    return NextResponse.json(
      {
        message: 'Enrichment completed',
        propertyId,
        result,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Enrichment failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
