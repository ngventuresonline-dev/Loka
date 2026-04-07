/**
 * Records two short screen captures using the real app UI (local dev server).
 *
 * Prereqs:
 *   1. npm run videos:marketing:install   (one-time Chromium for Playwright)
 *   2. npm run dev                        (Next.js on RECORDING_BASE_URL)
 *
 * Brand dashboard clip needs a real brand row in your DB:
 *   RECORDING_BRAND_ID=cuid   (same id returned by POST /api/auth/brand)
 *   RECORDING_BRAND_NAME=...  (optional, shown in dashboard header)
 *
 * Run:
 *   npm run videos:marketing
 *
 * Outputs (WebM): marketing-videos/output/brand-dashboard-18s.webm
 *                 marketing-videos/output/property-listing-15s.webm
 */

import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { chromium, type Browser, type BrowserContext, type Page, type Video } from 'playwright'

config({ path: path.join(process.cwd(), '.env.local') })
config()

const BASE = process.env.RECORDING_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
const BRAND_ID = process.env.RECORDING_BRAND_ID?.trim()
const BRAND_NAME = process.env.RECORDING_BRAND_NAME?.trim() || 'Brand'
const HEADLESS = process.env.RECORDING_HEADLESS !== '0'
const VIEWPORT = { width: 1920, height: 1080 }

const OUT_DIR = path.join(process.cwd(), 'marketing-videos', 'output')
const BRAND_MS = 18_000
const OWNER_MS = 15_000

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

async function recordOnce(
  browser: Browser,
  fileName: string,
  durationMs: number,
  setup: (ctx: BrowserContext) => Promise<Page>
) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const tmpDir = fs.mkdtempSync(path.join(OUT_DIR, '.rec-'))

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: tmpDir, size: VIEWPORT },
  })

  const page = await setup(context)
  const video: Video | null = page.video()
  const dest = path.join(OUT_DIR, fileName)

  const start = Date.now()
  try {
    while (Date.now() - start < durationMs) {
      await page.mouse.wheel(0, 100)
      await sleep(400)
    }
  } finally {
    await page.close()
    if (video) await video.saveAs(dest)
    await context.close()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  return dest
}

async function main() {
  console.log(`Recording against ${BASE}`)
  console.log(`Output: ${OUT_DIR}\n`)

  const browser = await chromium.launch({ headless: HEADLESS })

  try {
    if (BRAND_ID) {
      const dest = await recordOnce(browser, 'brand-dashboard-18s.webm', BRAND_MS, async (context) => {
        await context.addInitScript(
          ({ id, name }: { id: string; name: string }) => {
            localStorage.setItem('brandId', id)
            localStorage.setItem('brandName', name)
          },
          { id: BRAND_ID, name: BRAND_NAME }
        )
        const page = await context.newPage()
        await page.goto(`${BASE}/dashboard/brand`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
        await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {})
        await page.getByText('Matches', { exact: false }).first().waitFor({ state: 'visible', timeout: 120_000 }).catch(() => {})
        await sleep(600)
        try {
          const row = page.locator('button, a, [role="button"]').filter({ hasText: /₹|\/mo|sq\.?\s*ft|sqft/i }).first()
          if (await row.isVisible({ timeout: 5000 })) await row.click({ timeout: 3000 })
        } catch {
          /* optional */
        }
        await sleep(500)
        return page
      })
      console.log('Brand dashboard:', dest)
    } else {
      console.warn(
        'Skipped brand dashboard clip: set RECORDING_BRAND_ID (and optional RECORDING_BRAND_NAME) in .env.local'
      )
    }

    const ownerDest = await recordOnce(browser, 'property-listing-15s.webm', OWNER_MS, async (context) => {
      const page = await context.newPage()
      await page.goto(`${BASE}/filter/owner`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
      await sleep(500)
      try {
        await page.getByRole('button', { name: /Restaurant|Café|QSR/i }).first().click({ timeout: 5000 })
      } catch {
        /* optional */
      }
      await sleep(400)
      return page
    })
    console.log('Property listing:', ownerDest)
  } finally {
    await browser.close()
  }

  console.log('\nDone. Convert or trim WebM in an editor if needed (e.g. ffmpeg).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
