/**
 * POST /api/bulk/enrich
 * Bulk enrich locations: geocode, fetch intel, upsert Location + child tables
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { geocodeAddress } from '@/lib/property-coordinates'
import { Decimal } from '@prisma/client/runtime/library'

type EnrichItem = {
  lat?: number
  lng?: number
  address?: string
  city?: string
  state?: string
}

type EnrichRequest = {
  items: EnrichItem[]
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EnrichRequest
    const { items = [] } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required and must not be empty' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    const results: Array<{
      input: EnrichItem
      locationId?: string
      error?: string
      created?: boolean
    }> = []

    for (const item of items) {
      let lat = item.lat
      let lng = item.lng

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        const address = item.address ?? ''
        const city = item.city ?? ''
        const state = item.state ?? ''
        if (!address && !city) {
          results.push({ input: item, error: 'lat/lng or address required' })
          continue
        }
        try {
          const coords = await geocodeAddress(address, city, state)
          if (coords) {
            lat = coords.lat
            lng = coords.lng
          }
        } catch (e: any) {
          results.push({ input: item, error: `Geocode failed: ${e?.message}` })
          continue
        }
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          results.push({ input: item, error: 'Could not resolve coordinates' })
          continue
        }
      }

      try {
        const intelRes = await fetch(`${baseUrl}/api/location-intelligence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            address: item.address,
            city: item.city,
            state: item.state,
          }),
        })
        const intelJson = await intelRes.json()
        if (!intelJson.success || !intelJson.data) {
          results.push({
            input: item,
            error: intelJson.error ?? 'Location intelligence fetch failed',
          })
          continue
        }

        const data = intelJson.data
        const city = item.city ?? 'Unknown'
        const competitorPresence: Record<string, number> = {}
        if (Array.isArray(data.competitors)) {
          data.competitors.forEach((c: { name: string }, i: number) => {
            competitorPresence[c.name || `Competitor${i}`] = 1
          })
        }
        const saturationLevel = data.market?.saturationLevel ?? 'medium'
        const saturationIdx = data.market?.saturationIndex ?? data.market?.competitorCount ?? 0
        const dailyFootfall = data.footfall?.dailyAverage ?? 2000
        const scores = data.scores

        const eps = 0.0001
        const existing = await prisma.location.findFirst({
          where: {
            latitude: { gte: new Decimal(lat - eps), lte: new Decimal(lat + eps) },
            longitude: { gte: new Decimal(lng - eps), lte: new Decimal(lng + eps) },
          },
        })

        if (existing) {
          await prisma.locationDemographics.upsert({
            where: { locationId: existing.id },
            create: {
              locationId: existing.id,
              population500m: Math.round(dailyFootfall * 0.5),
              attributesJson: data.demographics ?? {},
            },
            update: {
              population500m: Math.round(dailyFootfall * 0.5),
              attributesJson: (data.demographics ?? {}) as object,
              lastUpdated: new Date(),
            },
          })
          await prisma.locationCommercial.upsert({
            where: { locationId: existing.id },
            create: {
              locationId: existing.id,
              competitorBrandPresence: competitorPresence as object,
              saturationIndices: { [saturationLevel]: saturationIdx } as object,
            },
            update: {
              competitorBrandPresence: competitorPresence as object,
              saturationIndices: { [saturationLevel]: saturationIdx } as object,
              lastUpdated: new Date(),
            },
          })
          await prisma.locationMobility.upsert({
            where: { locationId: existing.id },
            create: {
              locationId: existing.id,
              avgDailyFootfall: dailyFootfall,
              attributesJson: data.footfall ?? {},
            },
            update: {
              avgDailyFootfall: dailyFootfall,
              attributesJson: (data.footfall ?? {}) as object,
              lastUpdated: new Date(),
            },
          })
          if (scores) {
            await prisma.locationScores.create({
              data: {
                locationId: existing.id,
                whitespaceScore: scores.whitespaceScore,
                demandGapScore: scores.demandGapScore,
                revenueProjectionMid: scores.revenueProjectionMonthly,
                cafeFitScore: scores.whitespaceScore,
                qsrFitScore: scores.whitespaceScore,
                scoresJson: { saturationIndex: scores.saturationIndex } as object,
                explanationText: `Enriched via bulk. Footfall: ${dailyFootfall}, competitors: ${data.market?.competitorCount ?? 0}.`,
              },
            })
          }
          results.push({
            input: item,
            locationId: existing.id,
            created: false,
          })
        } else {
          const location = await prisma.location.create({
            data: {
              latitude: new Decimal(lat),
              longitude: new Decimal(lng),
              city,
            },
          })
          await prisma.locationDemographics.create({
            data: {
              locationId: location.id,
              population500m: Math.round(dailyFootfall * 0.5),
              attributesJson: (data.demographics ?? {}) as object,
            },
          })
          await prisma.locationCommercial.create({
            data: {
              locationId: location.id,
              competitorBrandPresence: competitorPresence as object,
              saturationIndices: { [saturationLevel]: saturationIdx } as object,
            },
          })
          await prisma.locationMobility.create({
            data: {
              locationId: location.id,
              avgDailyFootfall: dailyFootfall,
              attributesJson: (data.footfall ?? {}) as object,
            },
          })
          if (scores) {
            await prisma.locationScores.create({
              data: {
                locationId: location.id,
                whitespaceScore: scores.whitespaceScore,
                demandGapScore: scores.demandGapScore,
                revenueProjectionMid: scores.revenueProjectionMonthly,
                cafeFitScore: scores.whitespaceScore,
                qsrFitScore: scores.whitespaceScore,
                scoresJson: { saturationIndex: scores.saturationIndex } as object,
                explanationText: `Enriched via bulk. Footfall: ${dailyFootfall}, competitors: ${data.market?.competitorCount ?? 0}.`,
              },
            })
          }
          results.push({
            input: item,
            locationId: location.id,
            created: true,
          })
        }
      } catch (e: any) {
        results.push({ input: item, error: e?.message ?? 'Enrich failed' })
      }
    }

    const created = results.filter(r => r.created).length
    const updated = results.filter(r => r.locationId && !r.created).length
    const failed = results.filter(r => r.error).length

    return NextResponse.json({
      success: true,
      summary: { total: items.length, created, updated, failed },
      results,
    })
  } catch (error: any) {
    console.error('[Bulk Enrich API] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Bulk enrich failed' },
      { status: 500 }
    )
  }
}
