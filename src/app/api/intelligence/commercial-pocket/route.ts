import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { resolveCommercialPocket } from '@/lib/intelligence/enrichment'

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'))
  const lng = Number(req.nextUrl.searchParams.get('lng'))
  const address = req.nextUrl.searchParams.get('address') ?? ''
  const title = req.nextUrl.searchParams.get('title') ?? ''

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat and lng required', pocket: null }, { status: 400 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    return NextResponse.json({ pocket: null }, { status: 503 })
  }

  const pocket = await resolveCommercialPocket(prisma, lat, lng, address, title)
  return NextResponse.json({ pocket })
}
