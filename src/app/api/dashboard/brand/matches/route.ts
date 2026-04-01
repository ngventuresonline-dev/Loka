import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { getPropertyCoordinatesFromRow, getListingHeuristicCoords } from '@/lib/property-coordinates'
import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'
import {
  deriveMonthlyRentFromListing,
  getAreaCommercialRentBand,
} from '@/lib/location-intelligence/location-rent-context'

function brandProfileText(profile: { industry?: string | null; category?: string | null }): string {
  return `${profile.industry || ''} ${profile.category || ''}`.toLowerCase()
}

function brandSeeksOffice(profile: { industry?: string | null; category?: string | null }): boolean {
  return /\b(office|coworking|co-?working|workspace|b2b office|business centre|business center|serviced office)\b/.test(
    brandProfileText(profile)
  )
}

/** When set, we hide pure office listings from the match list; empty profile → keep offices so the dashboard never goes blank. */
function brandExplicitlySeeksNonOfficeRetail(profile: { industry?: string | null; category?: string | null }): boolean {
  const t = brandProfileText(profile).trim()
  if (!t) return false
  return /\b(restaurant|cafe|coffee|qsr|retail|fashion|salon|spa|gym|bakery|bar|pub|f&b|fnb|food|grocery|pharma|cloud\s*kitchen|dark\s*kitchen)\b/.test(
    t
  )
}

/** Per-brand exclusions (e.g. duplicate Sarjapur listings); stored on brand_profiles.weight_config_json */
function parseExcludedMatchPropertyTitles(weightConfigJson: unknown): string[] {
  if (weightConfigJson == null || typeof weightConfigJson !== 'object') return []
  const o = weightConfigJson as Record<string, unknown>
  const raw = o.excludedMatchPropertyTitles
  if (!Array.isArray(raw)) return []
  return raw.map((t) => String(t).trim()).filter(Boolean)
}

function propertyTitleExcludedForBrand(propertyTitle: string, excluded: string[]): boolean {
  if (excluded.length === 0) return false
  const t = (propertyTitle || '').trim()
  return excluded.some((ex) => t === ex)
}

/** Visibility / main-road proxy from listing text (retail & QSR). */
function mainRoadVisibilityScore(title: string, address: string): number {
  const t = `${title || ''} ${address || ''}`.toLowerCase()
  const strong = /\b(main road|high street|highway|junction|orbit|mg road|st\s*marks|brigade road|road-facing|road facing|corner|frontage|standalone|ground\s*floor)\b/.test(
    t
  )
  const weak = /\b(basement|interior lot|rear building|back lane|service lane|3rd floor|4th floor|5th floor|upper floor)\b/.test(
    t
  )
  if (weak && !strong) return 38
  if (strong) return 92
  const corridor = /\b(sarjapur|whitefield|marathahalli|koramangala|indiranagar|outer ring|orr|100\s*ft|80\s*ft|feet\s*road)\b/.test(
    t
  )
  if (corridor) return 72
  return 56
}

function nearestBangaloreAreaKey(address: string, city: string): string | null {
  const hay = `${address} ${city}`.toLowerCase()
  for (const a of BANGALORE_AREAS) {
    if (hay.includes(a.key)) return a.key
  }
  return null
}

/** Rent vs brand budget + vs typical corridor ₹/sqft — “value for money” layer on BFI. */
function valueForMoneyFit(
  monthlyRent: number | undefined,
  sizeSqft: number,
  budgetMax: number,
  listingPrice: number,
  areaMidPerSqft: number
): number {
  const month =
    monthlyRent != null && monthlyRent > 0
      ? monthlyRent
      : deriveMonthlyRentFromListing(listingPrice, 'monthly', sizeSqft) ?? listingPrice

  if (!Number.isFinite(month) || month <= 0 || sizeSqft <= 0) return 52

  let s = 52
  if (budgetMax > 0) {
    if (month <= budgetMax) s += 20
    else {
      const over = (month - budgetMax) / Math.max(1, budgetMax)
      s -= Math.min(42, Math.round(over * 58))
    }
  }
  if (areaMidPerSqft > 0) {
    const eff = month / sizeSqft
    const ratio = eff / areaMidPerSqft
    if (ratio <= 0.88) s += 16
    else if (ratio <= 1.02) s += 8
    else if (ratio >= 1.28) s -= 14
    else if (ratio >= 1.12) s -= 7
  }
  return Math.max(8, Math.min(100, s))
}

type BrandMatchProfile = {
  preferred_locations: unknown
  budget_min: unknown
  budget_max: unknown
  min_size: number | null
  max_size: number | null
  industry: string | null
  category: string | null
  weight_config_json: unknown
}

/** When onboarding row is missing, still show best-effort matches (permissive bounds). */
const DEFAULT_BRAND_MATCH_PROFILE: BrandMatchProfile = {
  preferred_locations: null,
  budget_min: null,
  budget_max: null,
  min_size: null,
  max_size: null,
  industry: null,
  category: null,
  weight_config_json: null,
}

function numOr(
  v: unknown,
  fallback: number
): number {
  if (v == null || v === '') return fallback
  const n = typeof v === 'object' && v !== null && 'toString' in v ? Number(String(v)) : Number(v)
  return Number.isFinite(n) ? n : fallback
}

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
              weight_config_json: true,
            },
          },
        },
      })
      .catch((e) => {
        console.error('[Brand Matches API] user lookup failed:', e)
        return null
      })

    if (!user) {
      return NextResponse.json({ matches: [], total: 0 })
    }

    const profile: BrandMatchProfile = user.brandProfiles ?? DEFAULT_BRAND_MATCH_PROFILE

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
        where: {
          AND: [
            { status: { not: 'rejected' } },
            { OR: [{ status: 'approved' }, { availability: { not: false } }] },
          ],
        },
        take: 150,
        orderBy: { createdAt: 'desc' },
      })
      .catch((e) => {
        console.error('[Brand Matches API] property.findMany failed:', e)
        return []
      })

    const excludedTitles = parseExcludedMatchPropertyTitles(profile.weight_config_json)
    const visibleProperties =
      excludedTitles.length === 0
        ? properties
        : properties.filter((p) => !propertyTitleExcludedForBrand(p.title ?? '', excludedTitles))

    const budgetMin = profile.budget_min != null ? numOr(profile.budget_min, 0) : 0
    const budgetMax = profile.budget_max != null ? numOr(profile.budget_max, 9_999_999) : 9_999_999
    const sizeMin = profile.min_size ?? 0
    const sizeMax = profile.max_size ?? 999_999

    type ScoredMatch = {
      p: (typeof properties)[0]
      bfiScore: number
      budgetFit: number
      sizeFit: number
      locationFit: number
      coords: { lat: number; lng: number } | null
    }

    const scoredRaw = visibleProperties.map((p) => {
      const price = Number(p.price)
      const size = p.size
      const priceType = String(p.priceType || 'monthly')
      const monthlyRent = deriveMonthlyRentFromListing(price, priceType, size)

      const budgetFit =
        monthlyRent != null
          ? monthlyRent <= budgetMax && monthlyRent >= budgetMin
            ? 100
            : monthlyRent > budgetMax
              ? Math.max(0, 100 - Math.round(((monthlyRent - budgetMax) / (budgetMax || 1)) * 100))
              : 100
          : price <= budgetMax && price >= budgetMin
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
        parsedLocations.length > 0 && parsedLocations.some((loc) => addr.includes(loc.toLowerCase()))
          ? 100
          : 40

      const areaKey = nearestBangaloreAreaKey(p.address || '', p.city || '')
      const band = getAreaCommercialRentBand(areaKey, String(p.propertyType || ''))
      const visibility = mainRoadVisibilityScore(p.title || '', p.address || '')
      const vfm = valueForMoneyFit(monthlyRent, size, budgetMax, price, band.mid)

      const bfiScore = Math.round(
        budgetFit * 0.24 + sizeFit * 0.2 + locationFit * 0.2 + visibility * 0.18 + vfm * 0.14 + 4
      )

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
        const area = BANGALORE_AREAS.find((a) => cityLower.includes(a.key) || addrLower.includes(a.key))
        if (area) coords = { lat: area.lat, lng: area.lng }
      }
      if (!coords) {
        const h = getListingHeuristicCoords(p.title || '', p.address || '')
        if (h) coords = h
      }

      return { p, bfiScore, budgetFit, sizeFit, locationFit, coords }
    })

    const officeAllowed = (m: (typeof scoredRaw)[0]) => {
      const pt = String(m.p.propertyType || '').toLowerCase()
      if (pt !== 'office') return true
      if (brandSeeksOffice(profile)) return true
      if (brandExplicitlySeeksNonOfficeRetail(profile)) return false
      return true
    }

    const sortedByBfi = scoredRaw.filter(officeAllowed).sort((a, b) => b.bfiScore - a.bfiScore)

    /** Strict floor hides everyone when inventory is all “stretch” vs small brand caps (e.g. 600–1000 sqft vs 2400 sqft). */
    const pickWithMinBfi = (minBfi: number) => sortedByBfi.filter((m) => m.bfiScore >= minBfi).slice(0, 15)

    let preScoredList = pickWithMinBfi(45)
    if (preScoredList.length === 0 && sortedByBfi.length > 0) preScoredList = pickWithMinBfi(28)
    if (preScoredList.length === 0 && sortedByBfi.length > 0) preScoredList = pickWithMinBfi(0)

    // Do not geocode here: parallel address lookups added 5–60s+ to first paint. Map pins use
    // map_link / area / heuristic above; precise coords load with per-property intelligence.

    const scored: ScoredMatch[] = preScoredList

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
