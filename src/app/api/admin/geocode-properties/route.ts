import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { requireOwnerOrAdmin } from '@/lib/api-auth'
import { getMapLinkFromAmenities, extractLatLngFromMapLink, geocodeAddress } from '@/lib/property-coordinates'

// GET /api/admin/geocode-properties — run this once, manually, from the admin
// Geocodes all properties missing coordinates and stores them in the DB
export async function GET(request: NextRequest) {
  // Admin auth check
  try {
    const user = await requireOwnerOrAdmin(request)
    if (user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = await getPrisma()
  if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  const properties = await prisma.property.findMany({
    where: { availability: true },
    select: { id: true, address: true, city: true, state: true, title: true, amenities: true }
  })

  const results: Array<{ id: string; status: string; coords?: { lat: number; lng: number } }> = []

  for (const p of properties) {
    const mapLink = getMapLinkFromAmenities(p.amenities)
    const existingCoords = extractLatLngFromMapLink(mapLink)
    if (existingCoords) {
      results.push({ id: p.id, status: 'already_has_coords' })
      continue
    }

    const coords = await geocodeAddress(p.address || '', p.city || '', p.state || '')
    if (coords) {
      const existingAmenities = (p.amenities as any) || {}
      const updatedAmenities =
        typeof existingAmenities === 'object' && !Array.isArray(existingAmenities)
          ? { ...existingAmenities, map_link: `https://maps.google.com/?q=${coords.lat},${coords.lng}` }
          : { map_link: `https://maps.google.com/?q=${coords.lat},${coords.lng}` }
      await prisma.property.update({ where: { id: p.id }, data: { amenities: updatedAmenities } })
      results.push({ id: p.id, status: 'geocoded', coords })
    } else {
      results.push({ id: p.id, status: 'geocode_failed' })
    }

    // Rate limit: 1 geocode per 200ms to avoid API quota
    await new Promise(r => setTimeout(r, 200))
  }

  return NextResponse.json({ results, count: results.length })
}
