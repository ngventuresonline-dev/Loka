/**
 * Captures PNG screenshots of key Lokazen routes for marketing/linkedin-visual-deck.html
 *
 *   SCREENSHOT_BASE_URL=https://lokazen.in npx tsx scripts/capture-marketing-screenshots.ts
 *
 * Defaults to https://lokazen.in. For local: SCREENSHOT_BASE_URL=http://localhost:3000
 * Requires: npx playwright install chromium (same as videos:marketing:install)
 */

import * as fs from 'fs'
import * as path from 'path'
import { chromium } from 'playwright'

const BASE = (process.env.SCREENSHOT_BASE_URL || 'https://lokazen.in').replace(/\/$/, '')
const OUT = path.join(process.cwd(), 'marketing', 'screenshots')

type Shot = {
  file: string
  urlPath: string
  waitMs?: number
  /** Scroll selector into view before capture */
  scrollTo?: string
  /** Full page vs viewport */
  fullPage?: boolean
}

const SHOTS: Shot[] = [
  { file: '01-home-hero.png', urlPath: '/', waitMs: 2500 },
  { file: '02-filter-brand.png', urlPath: '/filter/brand', waitMs: 3000 },
  { file: '03-filter-owner.png', urlPath: '/filter/owner', waitMs: 3000 },
  { file: '04-for-brands-hero.png', urlPath: '/for-brands', waitMs: 3000, scrollTo: 'text=Commercial Space' },
  { file: '05-for-brands-category.png', urlPath: '/for-brands', waitMs: 2000, scrollTo: 'text=Guidance for' },
  { file: '06-location-intelligence.png', urlPath: '/location-intelligence', waitMs: 3000 },
  { file: '07-home-intel-grid.png', urlPath: '/', waitMs: 2000, scrollTo: 'text=Footfall Heatmaps' },
  { file: '08-home-bfi-pfi.png', urlPath: '/', waitMs: 2000, scrollTo: 'text=Dual AI Scoring' },
  { file: '09-brand-login.png', urlPath: '/dashboard/brand/login', waitMs: 2500 },
]

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1500 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  for (const s of SHOTS) {
    const url = `${BASE}${s.urlPath}`
    process.stdout.write(`→ ${s.file} (${url}) `)
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
      await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
      if (s.scrollTo) {
        const loc = page.locator(s.scrollTo).first()
        await loc.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {})
        await loc.scrollIntoViewIfNeeded().catch(() => {})
        await page.waitForTimeout(600)
      }
      if (s.waitMs) await page.waitForTimeout(s.waitMs)
      const outPath = path.join(OUT, s.file)
      await page.screenshot({
        path: outPath,
        fullPage: s.fullPage ?? false,
        type: 'png',
      })
      console.log('ok')
    } catch (e) {
      console.log('FAIL', (e as Error).message)
    }
  }

  await browser.close()
  console.log(`\nDone. PNGs in ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
