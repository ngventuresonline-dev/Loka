import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { enrichPropertyIntelligence } from '@/lib/intelligence/enrichment'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
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

  const competitors = await prisma.competitor.findMany({
    where: { propertyId },
    orderBy: { distance: 'asc' },
  })

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
  _req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  if (!propertyId) {
    return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
  }

  try {
    const result = await enrichPropertyIntelligence(propertyId)
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
