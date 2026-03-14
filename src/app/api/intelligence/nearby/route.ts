import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const type = searchParams.get('type') || ''  // e.g. 'restaurant', 'cafe', 'apartment'
  const radius = searchParams.get('radius') || '800'
  const keyword = searchParams.get('keyword') || ''  // e.g. 'cafe coffee'

  if (!lat || !lng) {
    return NextResponse.json({ places: [] })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ places: [], error: 'API key not configured' })
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', radius)
    // Only set type if it's a specific type (not generic keyword searches)
    if (type && type !== 'any') url.searchParams.set('type', type)
    if (keyword) url.searchParams.set('keyword', keyword)
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    const data = await res.json()

    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
      console.error('[nearby] Google API error:', data.status, data.error_message)
      return NextResponse.json({ places: [], error: data.status })
    }

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ places: [] })
    }

    const refLat = parseFloat(lat)
    const refLng = parseFloat(lng)

    const places = (data.results || []).slice(0, 20).map((p: Record<string, any>) => {
      const pLat: number = p.geometry?.location?.lat ?? 0
      const pLng: number = p.geometry?.location?.lng ?? 0
      const dLat = (pLat - refLat) * 111320
      const dLng = (pLng - refLng) * 111320 * Math.cos(refLat * Math.PI / 180)
      const distance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng))

      return {
        id: p.place_id as string,
        name: p.name as string,
        lat: pLat,
        lng: pLng,
        category: keyword || type,
        rating: (p.rating as number) ?? null,
        reviewCount: (p.user_ratings_total as number) ?? null,
        priceLevel: (p.price_level as number) ?? null,
        vicinity: (p.vicinity as string) ?? '',
        distance,
      }
    })

    return NextResponse.json({ places })
  } catch (err) {
    console.error('[nearby] error:', err)
    return NextResponse.json({ places: [], error: 'Fetch failed' })
  }
}
