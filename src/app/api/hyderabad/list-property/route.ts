import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'
import { getPrisma } from '@/lib/get-prisma'
import { generatePropertyId } from '@/lib/property-id-generator'
import { buildLeadNotificationHtml, getFrom, getResend, NG_EMAIL } from '@/lib/lead-email'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Cafe-only listings use the restaurant enum value in the database. */
const CAFE_PROPERTY_TYPE = 'restaurant' as const

function isValidGoogleMapsUrl(raw: string): boolean {
  const u = raw.trim().toLowerCase()
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false
  try {
    const { hostname } = new URL(u)
    const h = hostname.replace(/^www\./, '')
    return (
      h === 'maps.app.goo.gl' ||
      h === 'goo.gl' ||
      (h.includes('google.') && (u.includes('/maps') || h.startsWith('maps.google')))
    )
  } catch {
    return false
  }
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
    const cafeFormat = String(body.cafeFormat ?? '').trim()
    const kitchenSetup = String(body.kitchenSetup ?? '').trim()
    const mapLink = String(body.mapLink ?? '').trim()
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
    if (!cafeFormat || !kitchenSetup || !locality) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    if (!mapLink || !isValidGoogleMapsUrl(mapLink)) {
      return NextResponse.json(
        { success: false, error: 'A valid Google Maps link is required (maps.google.com or goo.gl/maps)' },
        { status: 400 }
      )
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

    const title = `Hyderabad Property — ${locality}`.slice(0, 255)
    const description = [
      'Lead: Hyderabad list-property form.',
      `Cafe format: ${cafeFormat}.`,
      `Kitchen / setup: ${kitchenSetup}.`,
      `Listing contact: ${ownerName}.`,
      `WhatsApp: ${whatsapp}.`,
      `Maps: ${mapLink}.`,
      `Availability: ${availability}.`,
    ].join(' ')

    const amenities = {
      features,
      availability,
      owner_name: ownerName,
      whatsapp,
      map_link: mapLink,
      source: 'hyderabad_list_property_cafe',
      listing_kind: 'cafe',
      cafe_format: cafeFormat,
      kitchen_setup: kitchenSetup,
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
      property_type: CAFE_PROPERTY_TYPE,
      map_link: mapLink,
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

    const rupee = '\u20B9'
    const rentLabel =
      rent >= 100000
        ? `${rupee}${(rent / 100000).toFixed(2).replace(/\.?0+$/, '')} L / month`
        : `${rupee}${rent.toLocaleString('en-IN')} / month`

    const resend = getResend()
    if (resend) {
      try {
        const teamHtml = buildLeadNotificationHtml({
          subject: escapeHtml(`New Hyderabad property — ${locality}`),
          actionType: 'Hyderabad property listing',
          fields: [
            ['Property ID', escapeHtml(propertyId)],
            ['Listing type', 'Commercial F&B (restaurant type in DB)'],
            ['Listing contact', escapeHtml(ownerName)],
            ['WhatsApp', escapeHtml(whatsapp)],
            ['Cafe format', escapeHtml(cafeFormat)],
            ['Kitchen & fit-out', escapeHtml(kitchenSetup)],
            ['Locality', escapeHtml(locality)],
            ['City', 'Hyderabad'],
            ['Google Maps link', escapeHtml(mapLink)],
            ['Size', `${Math.round(size).toLocaleString('en-IN')} sqft`],
            ['Expected rent (monthly)', escapeHtml(rentLabel)],
            ['Features', escapeHtml(features.join(', '))],
            ['Availability', escapeHtml(availability)],
          ],
          nextStep:
            'Follow up on WhatsApp, open the Maps link to verify the pin, and review the listing in admin.',
        })
        const { error: emailErr } = await resend.emails.send({
          from: getFrom(),
          to: NG_EMAIL,
          subject: `[Lokazen] Hyderabad property lead — ${locality} · ${propertyId}`,
          html: teamHtml,
        })
        if (emailErr) {
          console.error('[hyderabad/list-property] Team email failed:', emailErr)
        }
      } catch (emailEx) {
        console.error('[hyderabad/list-property] Team email threw:', emailEx)
      }
    } else {
      console.warn('[hyderabad/list-property] RESEND_API_KEY not set — team email skipped')
    }

    return NextResponse.json({ success: true, id: propertyId })
  } catch (e) {
    console.error('[hyderabad/list-property]', e)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
