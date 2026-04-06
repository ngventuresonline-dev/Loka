/**
 * Repair cached location intel that was warmed with bad coordinates (empty catchment / landmarks / similar markets).
 * Runs client-side when we now have usable lat/lng from map_link or geocode.
 */

import { BANGALORE_AREAS } from '@/lib/location-intelligence/bangalore-areas'
import {
  appendWorkplaceLandmarkSeeds,
  computeCatchment,
  findSimilarMarkets,
  getNearestBangaloreArea,
} from '@/lib/location-intelligence/geoiq-features'
import { areUsablePinCoords } from '@/lib/property-coordinates'

export type CatchmentRow = {
  pincode: string
  name: string
  sharePct: number
  distanceM: number
  areaType?: string
}

export type LandmarkRow = { name: string; kind: string; distance: number; lat: number; lng: number }

export type SimilarRow = { key: string; lat: number; lng: number; score: number }

export function rehydrateIntelGeographyFromCoords(params: {
  coords: { lat: number; lng: number } | null
  catchment: CatchmentRow[]
  catchmentLandmarks: LandmarkRow[]
  similarMarkets: SimilarRow[]
  nearestCommercialAreaKey: string | null
}): {
  catchment: CatchmentRow[]
  catchmentLandmarks: LandmarkRow[]
  similarMarkets: SimilarRow[]
  nearestCommercialAreaKey: string | null
} {
  const coords = params.coords
  if (!coords || !areUsablePinCoords(coords)) {
    return {
      catchment: params.catchment,
      catchmentLandmarks: params.catchmentLandmarks,
      similarMarkets: params.similarMarkets,
      nearestCommercialAreaKey: params.nearestCommercialAreaKey,
    }
  }

  let catchment = [...params.catchment]
  let catchmentLandmarks = [...params.catchmentLandmarks]
  let similarMarkets = [...params.similarMarkets]
  let nearestCommercialAreaKey = params.nearestCommercialAreaKey

  if (catchment.length === 0) {
    catchment = computeCatchment(coords.lat, coords.lng, 4)
  }

  if (similarMarkets.length === 0) {
    similarMarkets = findSimilarMarkets(coords.lat, coords.lng, 6).map((sm) => {
      const area = BANGALORE_AREAS.find((a) => a.key === sm.area)
      return {
        key: sm.area,
        lat: area?.lat ?? coords.lat,
        lng: area?.lng ?? coords.lng,
        score: sm.score,
      }
    })
  }

  if (catchmentLandmarks.length === 0) {
    type SeedRow = {
      name: string
      kind: 'residential' | 'tech_park' | 'corporate'
      lat: number
      lng: number
      distanceMeters: number
    }
    const raw = appendWorkplaceLandmarkSeeds<SeedRow>(coords.lat, coords.lng, [])
    catchmentLandmarks = raw.map((r) => ({
      name: r.name,
      kind: r.kind,
      distance: r.distanceMeters,
      lat: r.lat,
      lng: r.lng,
    }))
  } else {
    type SeedRow = {
      name: string
      kind: 'residential' | 'tech_park' | 'corporate'
      lat: number
      lng: number
      distanceMeters: number
    }
    const asApi: SeedRow[] = catchmentLandmarks.map((l) => ({
      name: l.name,
      kind: (['tech_park', 'corporate', 'residential'].includes(l.kind)
        ? l.kind
        : 'corporate') as SeedRow['kind'],
      lat: l.lat,
      lng: l.lng,
      distanceMeters: l.distance,
    }))
    const merged = appendWorkplaceLandmarkSeeds(coords.lat, coords.lng, asApi)
    catchmentLandmarks = merged.map((r) => ({
      name: r.name,
      kind: r.kind,
      distance: r.distanceMeters,
      lat: r.lat,
      lng: r.lng,
    }))
  }

  const nk = (nearestCommercialAreaKey || '').toLowerCase().trim()
  if (!nearestCommercialAreaKey || nk === 'unknown' || nk === '') {
    const n = getNearestBangaloreArea(coords.lat, coords.lng)
    if (n) nearestCommercialAreaKey = n.key
  }

  return { catchment, catchmentLandmarks, similarMarkets, nearestCommercialAreaKey }
}
