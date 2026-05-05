import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export const revalidate = 3600

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '0')
  const lng = parseFloat(searchParams.get('lng') ?? '0')

  if (!lat || !lng) return NextResponse.json({ wards: [] })

  const prisma = await getPrisma()
  if (!prisma) return NextResponse.json({ wards: [] })

  try {
    const all = await prisma.wardDemographics.findMany({
      select: {
        wardName: true,
        locality: true,
        latitude: true,
        longitude: true,
        populationDensity: true,
        population2026: true,
        incomeAbove15L: true,
      },
    })

    const nearby = all
      .map(w => ({
        ...w,
        distance: haversineMeters(lat, lng, w.latitude, w.longitude),
      }))
      .filter(w => w.distance <= 5000)
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json({ wards: nearby })
  } catch (err) {
    console.error('[ward-density] error:', err)
    return NextResponse.json({ wards: [] })
  }
}
