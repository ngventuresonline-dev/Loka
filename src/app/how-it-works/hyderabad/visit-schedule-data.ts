export type VisitStatus = 'Confirmed' | 'Scheduled' | 'Awaiting confirmation'

/** IST calendar day (YYYY-MM-DD) for matching `site_visits.scheduled_at` (set `NEXT_PUBLIC_KIND_HYD_VISIT_DAY` in env). */
export const VISIT_SCHEDULE_IST_DATE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_KIND_HYD_VISIT_DAY?.trim()) || '2026-05-04'

/** UUID of `properties.id` — set `NEXT_PUBLIC_KIND_HYD_P1_PROPERTY_ID` (and P2, P3, P5, P6) when site_visits rows exist. */
function kindHydPropertyId(envKey: string): string | null {
  if (typeof process === 'undefined') return null
  const v = process.env[`NEXT_PUBLIC_KIND_HYD_${envKey}_PROPERTY_ID`]?.trim()
  if (!v || v.length < 32) return null
  return v
}

export type VisitSlot = {
  rowId: string
  time: string
  title: string
  lead?: boolean
  bfi: number
  status: VisitStatus
  /** On-site / coordination contact */
  poc?: string
  note: string
  mapsUrl: string
  /** When set, brand visit-done toggle syncs to `site_visits` for this property on `VISIT_SCHEDULE_IST_DATE`. */
  propertyId: string | null
}

export const VISIT_SCHEDULE: VisitSlot[] = [
  {
    rowId: 'p1-road92',
    time: '1:00 PM',
    title: "P1 — Road 92 Villa (Behind Hakim's Aalim)",
    bfi: 68,
    status: 'Confirmed',
    poc: 'Nikesh',
    note: 'Will also show BH Road 3 (BFI 40) ~3km from here',
    mapsUrl: 'https://maps.app.goo.gl/gu8fVhyiJE1WGE959',
    propertyId: kindHydPropertyId('P1'),
  },
  {
    rowId: 'p5-bungalow',
    time: '2:00 PM',
    title: 'P5 — JH Checkpost Bungalow (beside SABOO)',
    bfi: 72,
    status: 'Confirmed',
    poc: 'Aravind',
    note: 'Keys and access confirmed with owner',
    mapsUrl: 'https://maps.app.goo.gl/84p1nLeXnvTfeR5u5',
    propertyId: kindHydPropertyId('P5'),
  },
  {
    rowId: 'p3-aidu',
    time: '3:00 PM',
    title: 'P3 — Road 45, Aidu Kitchen',
    lead: true,
    bfi: 85,
    status: 'Confirmed',
    poc: 'Amann · Developer',
    note: 'Confirmed with developer',
    mapsUrl: 'https://maps.app.goo.gl/iJ7ULdRGos1tJkEM6',
    propertyId: kindHydPropertyId('P3'),
  },
  {
    rowId: 'p6-oka',
    time: '3:30 – 4:00 PM',
    title: 'P6 — Road 59, OKA Bar & Bistro',
    bfi: 80,
    status: 'Confirmed',
    poc: 'Saif',
    note: 'Confirmed with partner',
    mapsUrl: 'https://maps.app.goo.gl/gsDtZVr89nAXpqNv8',
    propertyId: kindHydPropertyId('P6'),
  },
  {
    rowId: 'p2-corner',
    time: 'TBC',
    title: 'P2 — JH Checkpost Corner Unit',
    bfi: 78,
    status: 'Awaiting confirmation',
    note: 'Last visit — confirmation pending',
    mapsUrl:
      'https://www.google.com/maps/place/17%C2%B025\'53.0%22N+78%C2%B025\'17.1%22E/@17.4313889,78.4214167,17z',
    propertyId: kindHydPropertyId('P2'),
  },
]

export const VISIT_ROUTE_MAPS_URL =
  'https://www.google.com/maps/dir/17.4153686,78.4211877/17.418447,78.41287/17.4271923,78.4060177/17.4302067,78.3978765/17.4313889,78.4214167'

export function visitStatusStyles(status: VisitStatus): { dot: string; text: string } {
  switch (status) {
    case 'Confirmed':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700' }
    case 'Scheduled':
      return { dot: 'bg-amber-500', text: 'text-amber-800' }
    case 'Awaiting confirmation':
      return { dot: 'bg-stone-400', text: 'text-stone-500' }
  }
}

export function bfiBadgeClass(bfi: number): string {
  if (bfi >= 80) return 'bg-emerald-600 text-white'
  if (bfi >= 65) return 'bg-amber-500 text-stone-900'
  return 'bg-red-600 text-white'
}
