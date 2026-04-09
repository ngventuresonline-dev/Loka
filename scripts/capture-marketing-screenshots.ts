/**
 * Marketing screenshots for LinkedIn / decks.
 *
 *   npm run marketing:screenshots
 *   SCREENSHOT_BASE_URL=http://localhost:3000 npm run marketing:screenshots
 *
 * Produces:
 *   - 01–09: full-viewport context shots (legacy deck)
 *   - ex-*.png: highlighted UI regions (cards, forms, listing steps)
 *
 * See marketing/screenshots/EXAMPLES.md for a plain list of each file.
 */

import * as fs from 'fs'
import * as path from 'path'
import { chromium, type Locator, type Page } from 'playwright'

const BASE = (process.env.SCREENSHOT_BASE_URL || 'https://lokazen.in').replace(/\/$/, '')
const OUT = path.join(process.cwd(), 'marketing', 'screenshots')

/** Avoid flaky Windows EBUSY/EPERM when another process briefly locks the target PNG. */
async function atomicWritePng(destPath: string, write: (tmpPath: string) => Promise<void>): Promise<void> {
  const dir = path.dirname(destPath)
  const delaysMs = [0, 350, 800, 1500, 2500]
  let lastErr: unknown
  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i]) await new Promise((r) => setTimeout(r, delaysMs[i]))
    const tmp = path.join(dir, `._cap_${path.basename(destPath)}_${process.pid}_${Date.now()}.png`)
    try {
      await write(tmp)
      try {
        fs.unlinkSync(destPath)
      } catch {
        /* missing or locked — rename may still work */
      }
      fs.renameSync(tmp, destPath)
      return
    } catch (e) {
      lastErr = e
      try {
        fs.unlinkSync(tmp)
      } catch {
        /* */
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

type ViewportShot = {
  file: string
  urlPath: string
  waitMs?: number
  scrollTo?: string
  fullPage?: boolean
}

const VIEWPORT_SHOTS: ViewportShot[] = [
  { file: '01-home-hero.png', urlPath: '/', waitMs: 2500 },
  /* Long flows: full document so PNGs are not “top half only” at 900px viewport. */
  { file: '02-filter-brand.png', urlPath: '/filter/brand', waitMs: 3000, fullPage: true },
  { file: '03-filter-owner.png', urlPath: '/filter/owner', waitMs: 3000, fullPage: true },
  { file: '04-for-brands-hero.png', urlPath: '/for-brands', waitMs: 3000, scrollTo: 'text=Commercial Space' },
  { file: '05-for-brands-category.png', urlPath: '/for-brands', waitMs: 2000, scrollTo: 'text=Guidance for' },
  { file: '06-location-intelligence.png', urlPath: '/location-intelligence', waitMs: 3000, fullPage: true },
  { file: '07-home-intel-grid.png', urlPath: '/', waitMs: 2000, scrollTo: 'text=Footfall Heatmaps' },
  { file: '08-home-bfi-pfi.png', urlPath: '/', waitMs: 2000, scrollTo: 'text=Dual AI Scoring' },
  { file: '09-brand-login.png', urlPath: '/dashboard/brand/login', waitMs: 2500 },
  /* Homepage “Brand Placements” map strip (lazy — long wait). */
  { file: '10-home-bangalore-map.png', urlPath: '/', waitMs: 1500, scrollTo: '#brand-placements' },
  { file: '11-bangalore-map-lab.png', urlPath: '/bangalore-map', waitMs: 4000 },
]

/** Card on homepage: h4 title → parent rounded-2xl panel */
async function homeIntelCard(page: Page, heading: string, file: string) {
  const h = page.getByRole('heading', { name: heading, exact: true }).first()
  await h.scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(400)
  const card = h.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]')
  await atomicWritePng(path.join(OUT, file), (tmp) => card.screenshot({ path: tmp, type: 'png' }))
}

async function gotoReady(page: Page, urlPath: string) {
  await page.goto(`${BASE}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
}

async function safeShot(loc: Locator, file: string) {
  try {
    await loc.first().waitFor({ state: 'visible', timeout: 15_000 })
    const target = loc.first()
    await atomicWritePng(path.join(OUT, file), (tmp) => target.screenshot({ path: tmp, type: 'png' }))
    return true
  } catch {
    return false
  }
}

async function captureHighlights(page: Page) {
  // ── Homepage: hero *content* only (headline + HeroSearch) — avoids huge empty min-h-screen bands
  await gotoReady(page, '/')
  await page.waitForTimeout(1500)
  await page.evaluate(() => window.scrollTo(0, 0))
  const heroCol = page
    .locator('div.text-center.max-w-6xl')
    .filter({ has: page.getByText('Commercial Real Estate', { exact: false }) })
    .first()
  const heroOk = await safeShot(heroCol, 'ex-home-hero-panel.png')
  if (!heroOk) {
    await safeShot(
      page.locator('div.relative.min-h-screen.flex.items-center.justify-center').first(),
      'ex-home-hero-panel.png',
    )
  }

  // ── Homepage: individual intelligence pillars ──
  await page.getByRole('heading', { name: 'Footfall Heatmaps' }).first().scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(800)

  await homeIntelCard(page, 'Footfall Heatmaps', 'ex-home-intel-footfall.png')
  await homeIntelCard(page, 'Demographics', 'ex-home-intel-demographics.png')
  await homeIntelCard(page, 'Competitor Mapping', 'ex-home-intel-competitors.png')
  await homeIntelCard(page, 'Accessibility Score', 'ex-home-intel-accessibility.png')

  const dual = page.getByRole('heading', { name: 'Dual AI Scoring Engine' }).first()
  await dual.scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(500)
  const dualBlock = dual.locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]')
  await safeShot(dualBlock, 'ex-home-dual-scoring-block.png')

  // ── Homepage: Bangalore map + placements (same section as lokazen.in #brand-placements) ──
  try {
    const bp = page.locator('#brand-placements')
    await bp.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(1500)
    await page.getByText('Loading map...').first().waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const mapStrip = bp.locator('div.rounded-2xl.shadow-2xl').first()
    await safeShot(mapStrip, 'ex-home-bangalore-map.png')
  } catch {
    console.log('→ ex-home-bangalore-map.png skip')
  }

  // ── Location intelligence: hero + above-the-fold (headline + form) ──
  await gotoReady(page, '/location-intelligence')
  await page.waitForTimeout(700)
  await page.evaluate(() => window.scrollTo(0, 0))
  const liFold = page
    .getByRole('heading', { name: 'Make Data-Driven Location Decisions' })
    .locator('xpath=ancestor::div[contains(@class,"max-w-7xl")][1]')
  await safeShot(liFold, 'ex-li-above-fold.png')
  await safeShot(
    page
      .getByRole('heading', { name: 'Make Data-Driven Location Decisions' })
      .locator('xpath=ancestor::div[contains(@class,"text-center")][1]'),
    'ex-li-hero-headline.png',
  )
  const liPanel = page.getByRole('button', { name: 'Generate Intelligence Report' }).locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]')
  await safeShot(liPanel, 'ex-li-search-form.png')

  try {
    await page.getByPlaceholder(/Koramangala|address/i).fill('Koramangala 5th Block, Bangalore')
    await page.getByRole('button', { name: 'F&B', exact: true }).click()
    await page.getByRole('button', { name: 'Generate Intelligence Report' }).click()
    await page.waitForTimeout(2000)
    await page.getByText(/loading|generating|footfall|daily|market/i).first().waitFor({ timeout: 45_000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const preview = page.locator('.max-w-5xl').filter({ has: page.locator('.rounded-3xl.border') }).first()
    if (await preview.isVisible().catch(() => false)) {
      await atomicWritePng(path.join(OUT, 'ex-li-preview-panel.png'), (tmp) =>
        preview.screenshot({ path: tmp, type: 'png' }),
      )
      console.log('→ ex-li-preview-panel.png ok')
    } else {
      console.log('→ ex-li-preview-panel.png skip (no preview DOM)')
    }
  } catch {
    console.log('→ ex-li-preview-panel.png skip (flow/API)')
  }

  // ── Owner listing: step highlights ──
  await gotoReady(page, '/filter/owner')
  await page.waitForTimeout(1200)
  await page.locator('[data-field="propertyType"]').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await safeShot(page.locator('[data-field="propertyType"]'), 'ex-owner-property-type.png')
  await page.locator('[data-field="location"]').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await safeShot(page.locator('[data-field="location"]'), 'ex-owner-location-areas.png')
  await page.locator('[data-field="size"]').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await safeShot(page.locator('[data-field="size"]'), 'ex-owner-size-slider.png')
  await page.locator('[data-field="rent"]').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await safeShot(page.locator('[data-field="rent"]'), 'ex-owner-rent-slider.png')
  await page.locator('[data-field="features"]').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await safeShot(page.locator('[data-field="features"]'), 'ex-owner-features.png')

  // ── Brand filter: mandate sections (FilterCard / LocationSelector = <section>) ──
  await gotoReady(page, '/filter/brand')
  await page.waitForTimeout(1200)
  async function brandSectionShot(heading: string, file: string) {
    const h = page.getByRole('heading', { name: heading, exact: true }).first()
    await h.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(400)
    await safeShot(h.locator('xpath=ancestor::section[1]'), file)
  }
  await brandSectionShot('Business Type', 'ex-brand-business-type.png')
  await brandSectionShot('Size Range', 'ex-brand-size-range.png')
  await brandSectionShot('Location (Popular Areas)', 'ex-brand-location-areas.png')

  try {
    const brandLocH = page.getByRole('heading', { name: 'Location (Popular Areas)', exact: true }).first()
    await brandLocH.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: /Select from other areas/i }).click()
    await page.waitForTimeout(700)
    const brandLocSec = brandLocH.locator('xpath=ancestor::section[1]')
    await safeShot(brandLocSec, 'ex-brand-locations-picker-open.png')
    const brandScrollList = brandLocSec.locator('.overflow-y-auto').first()
    if ((await brandScrollList.count()) > 0) {
      await brandScrollList.evaluate((el: Element) => {
        ;(el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight
      })
      await page.waitForTimeout(400)
      await safeShot(brandLocSec, 'ex-brand-locations-picker-scrolled.png')
    }
  } catch {
    console.log('→ brand location picker crops skip')
  }

  // ── Owner: property location dropdown (full area list in UI) ──
  try {
    await gotoReady(page, '/filter/owner')
    await page.waitForTimeout(900)
    const ownerLocSec = page.locator('[data-field="location"] section').first()
    await ownerLocSec.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(400)
    /* Dropdown trigger is the first <button> in this card (prime chips are below in DOM). */
    await ownerLocSec.locator('button').first().click({ timeout: 15_000 })
    await page.waitForTimeout(700)
    await safeShot(ownerLocSec, 'ex-owner-locations-picker-open.png')
  } catch {
    console.log('→ ex-owner-locations-picker-open.png skip')
  }

  // ── For brands: in-page dashboard mock chrome ──
  await gotoReady(page, '/for-brands')
  await page.waitForTimeout(1500)
  await page.getByText('lokazen.in/dashboard/brand', { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(600)
  const mock = page.getByText('lokazen.in/dashboard/brand', { exact: false }).locator('xpath=ancestor::div[contains(@class,"overflow-hidden")][1]')
  await safeShot(mock, 'ex-for-brands-dashboard-mock.png')
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    /* Taller default window so above-the-fold + mid-page sections show more before fullPage kicks in. */
    viewport: { width: 1440, height: 2000 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  for (const s of VIEWPORT_SHOTS) {
    const url = `${BASE}${s.urlPath}`
    process.stdout.write(`→ ${s.file} (${url}) `)
    try {
      await gotoReady(page, s.urlPath)
      if (s.scrollTo) {
        const loc = page.locator(s.scrollTo).first()
        await loc.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {})
        await loc.scrollIntoViewIfNeeded().catch(() => {})
        await page.waitForTimeout(600)
      }
      if (s.waitMs) await page.waitForTimeout(s.waitMs)
      if (s.scrollTo === '#brand-placements') {
        await page.getByText('Loading map...').first().waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {})
        await page.waitForTimeout(4000)
      }
      await atomicWritePng(path.join(OUT, s.file), (tmp) =>
        page.screenshot({
          path: tmp,
          fullPage: s.fullPage ?? false,
          type: 'png',
        }),
      )
      console.log('ok')
    } catch (e) {
      console.log('FAIL', (e as Error).message)
    }
  }

  console.log('\n--- Highlight crops (ex-*.png) ---\n')
  try {
    await captureHighlights(page)
    console.log('\nHighlight passes done.')
  } catch (e) {
    console.error('Highlights error:', e)
  }

  await browser.close()
  console.log(`\nAll outputs: ${OUT}`)
  console.log('Index: marketing/screenshots/EXAMPLES.md')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
