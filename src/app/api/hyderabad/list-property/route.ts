import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'
import { getPrisma } from '@/lib/get-prisma'
import { generatePropertyId } from '@/lib/property-id-generator'

type NormalizedPropertyType = 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other'

function normalizePropertyType(raw: string): NormalizedPropertyType {
  const t = (raw || '').toLowerCase()
  const validTypes = ['office', 'retail', 'warehouse', 'restaurant', 'other'] as const

  if (t === 'office' || t.includes('business-park') || t.includes('it-park') || t.includes('co-working-space')) {
    return 'office'
  }
  if (t === 'retail' || t.includes('mall-space') || t.includes('showroom') || t.includes('kiosk')) {
    return 'retail'
  }
  if (t === 'warehouse' || t.includes('industrial-space')) {
    return 'warehouse'
  }
  if (
    t === 'restaurant' ||
    t.includes('food-court') ||
    t.includes('cafe-coffee-shop') ||
    t.includes('qsr') ||
    t.includes('dessert-bakery') ||
    t.includes('food')
  ) {
    return 'restaurant'
  }
  if (
    t.includes('bungalow') ||
    t.includes('villa') ||
    t.includes('standalone-building') ||
    t.includes('commercial-complex') ||
    t.includes('service-apartment') ||
    t.includes('hotel-hospitality') ||
    t.includes('land') ||
    t === 'other'
  ) {
    return 'other'
  }
  if (validTypes.includes(t as NormalizedPropertyType)) {
    return t as NormalizedPropertyType
  }
  return 'other'
}

/** Returns E.164 +91XXXXXXXXXX or null if invalid */
function normalizeIndianMobile(input: string): string | null {
  const d = input.replace(/\D/g, '')
  let ten = d
  if (d.length === 12 && d.startsWith('91')) ten = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) ten = d.slice(1)
  if (ten.length !== 10 || !/^[6-9]\d{9}$/.test(ten)) return null
  return `+91${ten}`
}

async function resolveLeadOwnerId(): Promise<string | null> {
  const prisma = await getPrisma()
  if (!prisma) return null
  const admin = await prisma.user.findFirst({ where: { userType: 'admin' } })
  if (admin) return admin.id
  const owner = await prisma.user.findFirst({ where: { userType: 'owner' } })
  return owner?.id ?? null
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const ownerName = String(body.ownerName ?? '').trim()
    const whatsappRaw = String(body.whatsapp ?? '').trim()
    const propertyType = String(body.propertyType ?? '').trim()
    const locality = String(body.locality ?? '').trim()
    const size = Number(body.size)
    const rent = Number(body.rent)
    const features = Array.isArray(body.features) ? body.features.map(String) : []
    const availability = String(body.availability ?? '').trim()

    const whatsapp = normalizeIndianMobile(whatsappRaw)
    if (!ownerName) {
      return NextResponse.json({ success: false, error: 'Owner name is required' }, { status: 400 })
    }
    if (!whatsapp) {
      return NextResponse.json({ success: false, error: 'Valid Indian WhatsApp number is required' }, { status: 400 })
    }
    if (!propertyType || !locality) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid size' }, { status: 400 })
    }
    if (!Number.isFinite(rent) || rent <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid rent' }, { status: 400 })
    }
    if (features.length === 0) {
      return NextResponse.json({ success: false, error: 'Select at least one feature' }, { status: 400 })
    }
    if (!availability) {
      return NextResponse.json({ success: false, error: 'Availability is required' }, { status: 400 })
    }

    const ownerId = await resolveLeadOwnerId()
    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'Could not resolve property owner account' }, { status: 503 })
    }

    let supabase: ReturnType<typeof getAdminClient>
    try {
      supabase = getAdminClient()
    } catch {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 503 })
    }

    const propertyId = await generatePropertyId()
    const normalizedType = normalizePropertyType(propertyType)

    const title = `Hyderabad — ${locality} — ${propertyType}`.slice(0, 255)
    const description = [
      'Lead: Hyderabad list-property form.',
      `Owner/Broker: ${ownerName}.`,
      `WhatsApp: ${whatsapp}.`,
      `Availability: ${availability}.`,
    ].join(' ')

    const amenities = {
      features,
      availability,
      owner_name: ownerName,
      whatsapp,
      source: 'hyderabad_list_property',
      property_type_label: propertyType,
    }

    const { error } = await supabase.from('properties').insert({
      id: propertyId,
      title,
      description,
      address: `${locality}, Hyderabad`,
      city: 'Hyderabad',
      state: 'Telangana',
      zip_code: '500081',
      price: rent,
      price_type: 'monthly',
      security_deposit: null,
      size: Math.round(size),
      property_type: normalizedType,
      amenities,
      images: [],
      owner_id: ownerId,
      status: 'pending',
      is_available: false,
      locality,
      views_count: 0,
    })

    if (error) {
      console.error('[hyderabad/list-property]', error)
      return NextResponse.json({ success: false, error: error.message || 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: propertyId })
  } catch (e) {
    console.error('[hyderabad/list-property]', e)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
