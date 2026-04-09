# Screenshot index

All files live in this folder. Regenerate with `npm run marketing:screenshots` (optional: `SCREENSHOT_BASE_URL=http://localhost:3000`).

## Full viewport (context slides)

| File | What it shows |
|------|----------------|
| `01-home-hero.png` | Homepage above the fold — hero, Brand / List property entry. |
| `02-filter-brand.png` | `/filter/brand` — **full-page** capture (entire scrollable form). |
| `03-filter-owner.png` | `/filter/owner` — **full-page** capture (entire listing flow). |
| `04-for-brands-hero.png` | `/for-brands` scrolled to commercial-space hero. |
| `05-for-brands-category.png` | `/for-brands` — category guidance / tabs region. |
| `06-location-intelligence.png` | `/location-intelligence` — **full-page** capture (hero through foot of page). |
| `07-home-intel-grid.png` | Homepage — “Powered by Location Intelligence” four-card grid in view. |
| `08-home-bfi-pfi.png` | Homepage — Dual AI / BFI · PFI scoring block. |
| `09-brand-login.png` | `/dashboard/brand/login` — brand sign-in screen. |
| `10-home-bangalore-map.png` | Homepage — scrolled to **#brand-placements** (animated Bangalore map + pins). Waits for map lazy-load. |
| `11-bangalore-map-lab.png` | `/bangalore-map` — map illustration lab page (component preview). |

## Highlight crops (`ex-*.png`)

Tight crops for LinkedIn carousels, docs, or pitch decks (one UI idea per image).

### Homepage — hero

| File | What it highlights |
|------|---------------------|
| `ex-home-hero-panel.png` | **Hero content column** (`text-center max-w-6xl`: badge, headline, subtitle, `HeroSearch`) — no full-viewport empty bands. |

### Homepage — location intelligence pillars

| File | What it highlights |
|------|---------------------|
| `ex-home-intel-footfall.png` | Single card: **Footfall Heatmaps** + short description. |
| `ex-home-intel-demographics.png` | Single card: **Demographics**. |
| `ex-home-intel-competitors.png` | Single card: **Competitor Mapping**. |
| `ex-home-intel-accessibility.png` | Single card: **Accessibility Score**. |
| `ex-home-dual-scoring-block.png` | **Dual AI Scoring Engine** panel with BFI / PFI callouts. |
| `ex-home-bangalore-map.png` | Crop: homepage placements strip (rounded map container under “Our Brand Placements”). |

### Location intelligence tool

| File | What it highlights |
|------|---------------------|
| `ex-li-above-fold.png` | **max-w-7xl** column: headline + subcopy + search card (hero + form in one crop). |
| `ex-li-hero-headline.png` | **Make Data-Driven Location Decisions** block only (`text-center` hero). |
| `ex-li-search-form.png` | Address field, category chips, **Generate Intelligence Report** CTA. |
| `ex-li-preview-panel.png` | *(When the live flow returns a preview)* report / preview container under the form. Omitted if the run cannot produce preview content. |

### Owner listing (`/filter/owner`)

| File | What it highlights |
|------|---------------------|
| `ex-owner-property-type.png` | **Property Type** filter card (F&B-first taxonomy). |
| `ex-owner-location-areas.png` | **Property Location** — prime areas + search. |
| `ex-owner-locations-picker-open.png` | **Property Location** with **Select from other locations** dropdown open (full catalogue). |
| `ex-owner-size-slider.png` | **Size** requirement slider. |
| `ex-owner-rent-slider.png` | **Rent** slider. |
| `ex-owner-features.png` | **Features** multi-select card. |

### Brand search (`/filter/brand`)

| File | What it highlights |
|------|---------------------|
| `ex-brand-business-type.png` | **Business Type** mandate card. |
| `ex-brand-size-range.png` | **Size Range** card. |
| `ex-brand-location-areas.png` | **Location (Popular Areas)** — Koramangala-style chips + more. |
| `ex-brand-locations-picker-open.png` | Same section with **Select from other areas** opened (scrollable Bangalore list). |
| `ex-brand-locations-picker-scrolled.png` | That list scrolled to the bottom (shows tail areas + density). |

### Marketing — dashboard story

| File | What it highlights |
|------|---------------------|
| `ex-for-brands-dashboard-mock.png` | `/for-brands` in-page **lokazen.in/dashboard/brand** browser mock. |

---

## Bangalore area names (deck chip list)

The **pill labels** on `linkedin-visual-deck.html` slide “Micro-markets baked into the UI” mirror `allBangaloreLocations` in `src/app/filter/brand/page.tsx`. If you add/remove areas in code, update that slide and re-run captures.
