/**
 * POST /api/location-intelligence/compare
 * Compare two locations side-by-side (GeoIQ-style "Vs" feature).
 *
 * Body: {
 *   locations: [{ lat, lng, label?, address?, city?, state? }, { lat, lng, label?, ... }],
 *   propertyType?: string,
 *   businessType?: string,
 *   monthlyRent?: number,
 *   sizeSqft?: number
 * }
 */
import { NextRequest, NextResponse } from 'next/server'

type CompareLocation = {
  lat: number
  lng: number
  label?: string
  address?: string
  city?: string
  state?: string
}

type CompareRequest = {
  locations: [CompareLocation, CompareLocation]
  propertyType?: string
  businessType?: string
  monthlyRent?: number
  sizeSqft?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompareRequest
    const { locations, propertyType, businessType, monthlyRent, sizeSqft } = body

    if (!Array.isArray(locations) || locations.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Exactly 2 locations required in body.locations' },
        { status: 400 }
      )
    }

    const [locA, locB] = locations
    if (
      typeof locA?.lat !== 'number' ||
      typeof locA?.lng !== 'number' ||
      typeof locB?.lat !== 'number' ||
      typeof locB?.lng !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: 'Each location must have lat and lng' },
        { status: 400 }
      )
    }

    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    const toPayload = (loc: CompareLocation) => ({
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      propertyType,
      businessType,
      monthlyRent,
      sizeSqft,
    })

    const [resA, resB] = await Promise.all([
      fetch(`${baseUrl}/api/location-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(locA)),
      }),
      fetch(`${baseUrl}/api/location-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(locB)),
      }),
    ])

    const jsonA = await resA.json()
    const jsonB = await resB.json()

    const dataA = jsonA?.data ?? jsonA
    const dataB = jsonB?.data ?? jsonB

    const labelA = locA.label || locA.address || `${locA.lat.toFixed(4)}, ${locA.lng.toFixed(4)}`
    const labelB = locB.label || locB.address || `${locB.lat.toFixed(4)}, ${locB.lng.toFixed(4)}`

    if (!resA.ok || !resB.ok) {
      const errA = jsonA?.error ?? resA.statusText
      const errB = jsonB?.error ?? resB.statusText
      return NextResponse.json(
        {
          success: false,
          error: 'One or both intel fetches failed',
          details: { locationA: resA.ok ? null : errA, locationB: resB.ok ? null : errB },
        },
        { status: resA.ok && resB.ok ? 200 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comparison: {
        locationA: dataA,
        locationB: dataB,
        labelA,
        labelB,
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[LocationIntelligence Compare] Error:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Comparison failed' },
      { status: 500 }
    )
  }
}
