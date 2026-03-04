# Real Footfall & Demographics Data

## Current State

Footfall and revenue are **modeled** using:
- **India market benchmarks** (see `india-benchmarks.ts`): category profiles (QSR, cafe, restaurant, bar, bakery, cloud kitchen) with capture rate, avg ticket (₹), base footfall, per-competitor lift, gross margins
- Area-specific multipliers (Indiranagar ~1.35x, Jayanagar ~0.85x, BTM ~1.05x)
- Area × category modifiers (QSR over-performs in high-density BTM/HSR; cafe in premium Indiranagar/Koramangala)
- Rent viability: F&B rent ≤15% of revenue healthy (10–15% typical); non-F&B ≤25%
- Competitor count from Mappls/Google POI

Benchmark sources include: population/demographics (2026), CPI food & beverage, consumer spending, retail leasing, cafes & bars market size, F&B franchise and consumer survey data. No brand names from sources are used.

This is **not** real footfall or demographics. For production-grade accuracy, integrate GeoIQ.

## GeoIQ – Real Footfall & Demographics for India

**GeoIQ** (geoiq.ai) provides:
- Street-level footfall data across 3000+ Indian cities
- Hourly, daily, weekly metrics from aggregated mobile geolocation
- Heat maps and site analysis
- Real demographics (age, income, density)
- APIs: Data API, Bulk Data API, Model API

Use GeoIQ to replace modeled values with real data. High-density non-cosmopolitan areas and category performance vary significantly; real data is essential for accurate revenue prediction. Contact hello@geoiq.io.

## India Benchmarks (Location Intelligence)

The `india-benchmarks.ts` module provides:

| Data | Use |
|------|-----|
| Population 2026, urban %, median age | Context for demand scaling |
| CPI Food & Beverage | Inflation-adjusted revenue context |
| Cafes & Bars market size, CAGR | Category outlook |
| Coffee cafe segment (premium vs traditional AOV) | Cafe avg ticket calibration |
| Retail leasing (mall vs high street) | Format preference context |
| Consumer behaviour (taste-led, cost-conscious) | Capture-rate modifiers |
| Channel usage (supermarkets, on-demand, eat-out) | Channel mix context |
| Rent viability (F&B ≤15%, non-F&B ≤25%, stretched ≤35%) | Rent-to-revenue thresholds |
| Top city populations | Density scaling |

Category profiles include: QSR, cafe/coffee/chai, restaurant, bar/brew, bakery/dessert, cloud kitchen. Each has capture rate, avg ticket (₹), base footfall, per-competitor lift, gross margin, and growth CAGR.

## Mappls / Google

- **Mappls**: POI (competitors), geocoding, transit – we use this
- **Google**: Map display, Places fallback – we use this
- Neither provides footfall or demographics; that requires GeoIQ or similar.
