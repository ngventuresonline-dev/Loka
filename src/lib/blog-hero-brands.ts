import { brandPlacements } from '@/lib/brand-placements'
import { getBrandLogo } from '@/lib/brand-logos'

export interface HeroBrandLogo {
  brand: string
  logoSrc: string | null
}

/** Unique placement brands with optional logo path for blog hero / featured strips. */
export function getHeroBrandLogos(max = 10): HeroBrandLogo[] {
  const seen = new Set<string>()
  const out: HeroBrandLogo[] = []
  for (const row of brandPlacements) {
    const key = row.brand.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ brand: row.brand, logoSrc: getBrandLogo(row.brand) })
    if (out.length >= max) break
  }
  return out
}
