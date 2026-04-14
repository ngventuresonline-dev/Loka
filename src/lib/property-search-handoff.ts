/** Session handoff + cache key helpers for /filter/brand → /properties/results */

export const LOKAZEN_SEARCH_FILTERS_KEY = 'lokazen_search_filters'

/** Freshness for handoff payload in sessionStorage */
export const SEARCH_FILTERS_STORAGE_TTL_MS = 10 * 60 * 1000

/** Client results cache TTL (sessionStorage results_*) */
export const RESULTS_CACHE_TTL_MS = 10 * 60 * 1000

export type ResultFilters = {
  businessType: string
  sizeMin: number
  sizeMax: number
  locations: string[]
  budgetMin: number
  budgetMax: number
  timeline: string
  propertyType: string
}

export type StoredSearchFilters = ResultFilters & { timestamp: number }

const DEFAULT_FILTERS: ResultFilters = {
  businessType: '',
  sizeMin: 0,
  sizeMax: 100000,
  locations: [],
  budgetMin: 0,
  budgetMax: 10000000,
  timeline: '',
  propertyType: '',
}

/** Deterministic query string — same key order as filter submit (URLSearchParams encoding) */
export function filtersToQueryString(f: ResultFilters): string {
  const params = new URLSearchParams()
  if (f.businessType) params.set('businessType', f.businessType)
  params.set('sizeMin', String(f.sizeMin))
  params.set('sizeMax', String(f.sizeMax))
  if (f.locations.length > 0) params.set('locations', f.locations.join(','))
  params.set('budgetMin', String(f.budgetMin))
  params.set('budgetMax', String(f.budgetMax))
  if (f.timeline) params.set('timeline', f.timeline)
  if (f.propertyType) params.set('propertyType', f.propertyType)
  return params.toString()
}

export function resultsCacheKeyFromQueryString(qs: string): string {
  const hash = btoa(qs).replace(/[/+=]/g, '_').substring(0, 48)
  return `results_${hash}`
}

export function parseFiltersFromUrl(searchParams: URLSearchParams): ResultFilters {
  try {
    const businessType = searchParams.get('businessType') || ''
    const locations = searchParams.get('locations') || ''
    const timeline = searchParams.get('timeline') || ''
    const propertyType = searchParams.get('propertyType') || ''

    return {
      businessType: businessType ? decodeURIComponent(businessType) : '',
      sizeMin: parseInt(searchParams.get('sizeMin') || '0', 10) || 0,
      sizeMax: parseInt(searchParams.get('sizeMax') || '100000', 10) || 100000,
      locations: locations
        ? locations.split(',').filter((l) => l.trim()).map((l) => decodeURIComponent(l.trim()))
        : [],
      budgetMin: parseInt(searchParams.get('budgetMin') || '0', 10) || 0,
      budgetMax: parseInt(searchParams.get('budgetMax') || '10000000', 10) || 10000000,
      timeline: timeline ? decodeURIComponent(timeline) : '',
      propertyType: propertyType ? decodeURIComponent(propertyType) : '',
    }
  } catch {
    return { ...DEFAULT_FILTERS }
  }
}

function isStoredSearchFilters(x: unknown): x is StoredSearchFilters {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (
    typeof o.timestamp !== 'number' ||
    typeof o.businessType !== 'string' ||
    typeof o.sizeMin !== 'number' ||
    typeof o.sizeMax !== 'number' ||
    !Array.isArray(o.locations) ||
    typeof o.budgetMin !== 'number' ||
    typeof o.budgetMax !== 'number' ||
    typeof o.timeline !== 'string'
  ) {
    return false
  }
  if (!o.locations.every((loc): loc is string => typeof loc === 'string')) return false
  if (o.propertyType !== undefined && typeof o.propertyType !== 'string') return false
  return true
}

/** Read handoff payload if fresh; otherwise null */
export function readStoredSearchFilters(): StoredSearchFilters | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(LOKAZEN_SEARCH_FILTERS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isStoredSearchFilters(parsed)) return null
    if (Date.now() - parsed.timestamp > SEARCH_FILTERS_STORAGE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

export function storedToResultFilters(s: StoredSearchFilters): ResultFilters {
  return {
    businessType: s.businessType,
    sizeMin: s.sizeMin,
    sizeMax: s.sizeMax,
    locations: s.locations,
    budgetMin: s.budgetMin,
    budgetMax: s.budgetMax,
    timeline: s.timeline,
    propertyType: s.propertyType || '',
  }
}

/**
 * If the URL has query params, use them (shareable / direct links).
 * Otherwise use a fresh sessionStorage handoff from the filter form.
 */
export function resolveResultFilters(searchParams: URLSearchParams): ResultFilters {
  if (searchParams.toString()) return parseFiltersFromUrl(searchParams)
  const stored = readStoredSearchFilters()
  if (stored) return storedToResultFilters(stored)
  return parseFiltersFromUrl(searchParams)
}

/** Synchronous read of cached match list for filter set (client only). */
export function readResultsCacheForFilters(f: ResultFilters): {
  matches: unknown[]
  totalMatches: number
} | null {
  if (typeof window === 'undefined') return null
  const qs = filtersToQueryString(f)
  const key = resultsCacheKeyFromQueryString(qs)
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw) as { timestamp?: number; matches?: unknown[]; totalMatches?: number }
    if (Date.now() - (data.timestamp || 0) > RESULTS_CACHE_TTL_MS) return null
    const m = data.matches
    if (!Array.isArray(m) || m.length === 0) return null
    const first = m[0] as { property?: unknown }
    if (!first?.property) return null
    return { matches: m, totalMatches: data.totalMatches ?? m.length }
  } catch {
    return null
  }
}
