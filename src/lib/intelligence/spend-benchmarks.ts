export type SpendTier = 'budget' | 'mid' | 'premium'
export type BrandCategory = 'cafe' | 'qsr' | 'casual_dining' | 'fine_dining' | 'brewery_taproom' | 'retail' | 'salon'

export const SPEND_BENCHMARKS: Record<BrandCategory, Record<SpendTier, { min: number; max: number; avg: number }>> = {
  cafe: {
    budget:  { min: 60,   max: 120,  avg: 85 },
    mid:     { min: 150,  max: 280,  avg: 210 },
    premium: { min: 280,  max: 450,  avg: 360 },
  },
  qsr: {
    budget:  { min: 100,  max: 180,  avg: 140 },
    mid:     { min: 200,  max: 350,  avg: 270 },
    premium: { min: 350,  max: 500,  avg: 400 },
  },
  casual_dining: {
    budget:  { min: 200,  max: 350,  avg: 280 },
    mid:     { min: 400,  max: 700,  avg: 550 },
    premium: { min: 800,  max: 1500, avg: 1100 },
  },
  fine_dining: {
    budget:  { min: 600,  max: 1000, avg: 800 },
    mid:     { min: 1200, max: 2000, avg: 1600 },
    premium: { min: 2500, max: 5000, avg: 3500 },
  },
  brewery_taproom: {
    budget:  { min: 250,  max: 450,  avg: 350 },
    mid:     { min: 500,  max: 900,  avg: 700 },
    premium: { min: 1000, max: 1800, avg: 1400 },
  },
  retail: {
    budget:  { min: 500,  max: 1000, avg: 700 },
    mid:     { min: 1500, max: 3000, avg: 2200 },
    premium: { min: 3000, max: 8000, avg: 5000 },
  },
  salon: {
    budget:  { min: 200,  max: 500,  avg: 350 },
    mid:     { min: 600,  max: 1200, avg: 900 },
    premium: { min: 1500, max: 4000, avg: 2500 },
  },
}

/** Categories to show in category-wise spend UI, with display labels */
export const SPEND_DISPLAY_CATEGORIES: { key: BrandCategory; label: string }[] = [
  { key: 'cafe', label: 'Cafe' },
  { key: 'qsr', label: 'QSR' },
  { key: 'casual_dining', label: 'Casual Dining' },
  { key: 'fine_dining', label: 'Fine Dine' },
  { key: 'brewery_taproom', label: 'Brewery / Taproom' },
]

export const TIER_LABELS: Record<SpendTier, string> = {
  budget: 'Eco / Budget',
  mid: 'Mid-Range',
  premium: 'Premium',
}
