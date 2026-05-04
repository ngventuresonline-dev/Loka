export type VisitStatus = 'Confirmed' | 'Scheduled' | 'Awaiting confirmation'

export type VisitSlot = {
  rowId: string
  time: string
  title: string
  lead?: boolean
  bfi: number
  status: VisitStatus
  note: string
  mapsUrl: string
}

export const VISIT_SCHEDULE: VisitSlot[] = [
  {
    rowId: 'p1-road92',
    time: '1:00 PM',
    title: "P1 — Road 92 Villa (Behind Hakim's Aalim)",
    bfi: 68,
    status: 'Confirmed',
    note: 'Nikesh will also show BH Road 3 (BFI 40) ~3km from here',
    mapsUrl: 'https://maps.app.goo.gl/gu8fVhyiJE1WGE959',
  },
  {
    rowId: 'p5-bungalow',
    time: '2:00 PM',
    title: 'P5 — JH Checkpost Bungalow (beside SABOO)',
    bfi: 72,
    status: 'Scheduled',
    note: 'Partner confirming keys with owner',
    mapsUrl: 'https://maps.app.goo.gl/84p1nLeXnvTfeR5u5',
  },
  {
    rowId: 'p3-aidu',
    time: '3:00 PM',
    title: 'P3 — Road 45, Aidu Kitchen',
    lead: true,
    bfi: 85,
    status: 'Scheduled',
    note: 'Developer to confirm shortly',
    mapsUrl: 'https://maps.app.goo.gl/iJ7ULdRGos1tJkEM6',
  },
  {
    rowId: 'p6-oka',
    time: '3:30 – 4:00 PM',
    title: 'P6 — Road 59, OKA Bar & Bistro',
    bfi: 80,
    status: 'Confirmed',
    note: 'Confirmed with partner',
    mapsUrl: 'https://maps.app.goo.gl/gsDtZVr89nAXpqNv8',
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
