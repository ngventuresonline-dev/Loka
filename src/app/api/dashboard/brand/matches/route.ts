import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { getPropertyCoordinatesFromRow, geocodeAddress } from '@/lib/property-coordinates'
import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const user = await prisma.user
      .findUnique({
        where: { id: brandId },
        select: {
          id: true,
          name: true,
          brandProfiles: {
            select: {
              preferred_locations: true,
              budget_min: true,
              budget_max: true,
              min_size: true,
              max_size: true,
              industry: true,
              category: true,
            },
          },
        },
      })
      .catch(() => null)

    if (!user || !user.brandProfiles) {
      return NextResponse.json({ matches: [], total: 0 })
    }

    const profile = user.brandProfiles

    let parsedLocations: string[] = []
    try {
      const raw = profile.preferred_locations
      if (Array.isArray(raw)) {
        parsedLocations = raw.map(String)
      } else if (typeof raw === 'string') {
        const parsed = JSON.parse(raw)
        parsedLocations = Array.isArray(parsed) ? parsed.map(String) : []
      }
    } catch {
      parsedLocations = []
    }

    const properties = await prisma.property
      .findMany({
        where: { OR: [{ status: 'approved' }, { availability: true }] },
        take: 100,
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => [])

    const budgetMin = Number(profile.budget_min) || 0
    const budgetMax = Number(profile.budget_max) || 9_999_999
    const sizeMin = profile.min_size || 0
    const sizeMax = profile.max_size || 999_999

    type ScoredMatch = {
      p: (typeof properties)[0]
      bfiScore: number
      budgetFit: number
      sizeFit: number
      locationFit: number
      coords: { lat: number; lng: number } | null
    }

    const preScoredList = properties
      .map((p) => {
        const price = Number(p.price)
        const size = p.size

        const budgetFit =
          price <= budgetMax && price >= budgetMin
            ? 100
            : price > budgetMax
            ? Math.max(0, 100 - Math.round(((price - budgetMax) / (budgetMax || 1)) * 120))
            : 100

        const sizeFit =
          size >= sizeMin && size <= sizeMax
            ? 100
            : size < sizeMin
            ? Math.max(0, 100 - Math.round(((sizeMin - size) / (sizeMin || 1)) * 120))
            : Math.max(0, 100 - Math.round(((size - sizeMax) / (sizeMax || 1)) * 120))

        const addr = ((p.address || '') + ' ' + (p.city || '')).toLowerCase()
        const locationFit =
          parsedLocations.length > 0 &&
          parsedLocations.some((loc) => addr.includes(loc.toLowerCase()))
            ? 100
            : 40

        const bfiScore = Math.round(budgetFit * 0.3 + sizeFit * 0.25 + locationFit * 0.3 + 15)

        const rawCoords = getPropertyCoordinatesFromRow({
          amenities: p.amenities,
          address: p.address,
          city: p.city,
          state: p.state,
          title: p.title,
        })

        let coords: { lat: number; lng: number } | null = rawCoords
          ? { lat: rawCoords.lat, lng: rawCoords.lng }
          : null

        if (!coords) {
          const cityLower = (p.city || '').toLowerCase()
          const addrLower = (p.address || '').toLowerCase()
          const area = BANGALORE_AREAS.find(
            (a) => cityLower.includes(a.key) || addrLower.includes(a.key)
          )
          if (area) coords = { lat: area.lat, lng: area.lng }
        }

        return { p, bfiScore, budgetFit, sizeFit, locationFit, coords }
      })
      .filter((m) => m.bfiScore >= 45)
      .sort((a, b) => b.bfiScore - a.bfiScore)
      .slice(0, 15)

    // Geocode any remaining properties without coordinates (run in parallel, cap at 5s)
    const geocodeResults = await Promise.allSettled(
      preScoredList.map(async (m) => {
        if (m.coords) return m
        try {
          const geocoded = await geocodeAddress(
            m.p.address || '',
            m.p.city || '',
            m.p.state || 'Karnataka',
            m.p.title
          )
          return { ...m, coords: geocoded }
        } catch {
          return m
        }
      })
    )

    const scored: ScoredMatch[] = geocodeResults.map((r, i) =>
      r.status === 'fulfilled' ? r.value : preScoredList[i]
    )

    return NextResponse.json({
      matches: scored.map((m) => ({
        property: {
          id: m.p.id,
          title: m.p.title,
          address: m.p.address,
          city: m.p.city,
          price: Number(m.p.price),
          priceType: m.p.priceType,
          size: m.p.size,
          propertyType: m.p.propertyType,
          images: m.p.images,
          amenities: m.p.amenities,
          status: m.p.status,
        },
        bfiScore: m.bfiScore,
        breakdown: {
          budgetFit: m.budgetFit,
          sizeFit: m.sizeFit,
          locationFit: m.locationFit,
        },
        coords: m.coords,
      })),
      total: scored.length,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch brand matches'
    console.error('[Brand Matches API] Error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
