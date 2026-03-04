# Location Intelligence Data Provenance

How Lokazen derives the metrics shown in the Intelligence Layer section.

---

## Catchment Population (e.g. "10,000 households")

**Not random.** Data flows as follows:

### 1. Primary: CensusData (ward-level)

When `/api/location-intelligence` finds a nearby Census ward via `findNearestCensusWard()`, it computes:

```
totalHouseholds = totalPopulation ÷ avgHouseholdSize
```

- **Source**: `censusData` table, seeded by `scripts/seed-census-data.ts`
- **Docs**: `docs/LOCATION_INTELLIGENCE_1000.md`, `docs/FOOTFALL_GEOIQ.md`
- Values align with Census 2011/2021 patterns, BBMP structure, and `india-benchmarks.ts`

Ward examples (from seed):
- Koramangala: 220,000 pop ÷ 3.0 hh size ≈ **73,333 households**
- Indiranagar: 185,000 ÷ 3.2 ≈ **57,812 households**
- 100ft Road Indiranagar: 95,000 ÷ 3.0 ≈ **31,666 households**

### 2. Fallback: catchment sharePct (buggy legacy)

When **no** Census ward is found, `mapIntelligenceToReportData` in `/api/location-reports` uses:

```
catchmentPop = catchment.reduce((s, c) => s + (c.sharePct || 0), 0) * 100
```

- `sharePct` = percentage of catchment share by pincode (sums to ~100)
- Multiplying by 100 yields ~**10,000** when sharePct sum ≈ 100
- **This is a weak heuristic** — sharePct represents relative catchment share, not population
- A value near 10,000 often indicates this fallback was used

### 3. Stored reports: `location_reports.report_data`

If a pre-generated report exists in `location_reports` with matching `location`, its `report_data.catchmentPopulation` is returned as-is. That value may have been computed by any of the above or from external enrichment.

---

## Summary

| Value shown       | Likely source                                      |
|-------------------|----------------------------------------------------|
| 10,000 households | Fallback formula (sharePct × 100) when no ward    |
| 50k–75k           | Census ward (e.g. Koramangala, Indiranagar)        |
| Other             | Stored `location_reports.report_data` or custom    |

To improve accuracy: ensure CensusData is seeded (`npm run db:seed-census`) and `findNearestCensusWard` returns a ward for Bangalore properties. Integrate GeoIQ for production-grade footfall and demographics.

---

## Footfall & related metrics vs enriched census

**Footfall** is **not** directly derived from census or enriched census data. It comes from:

- `india-benchmarks.ts` (category-specific daily baseline)
- Competitor count (Mappls/Google nearby) and area multiplier
- `AREA_FOOTFALL_MULTIPLIER` (zone-level adjustment)

Census-derived data affects:

- **Catchment households** via `findNearestCensusWard` → `totalHouseholds`
- **Demographic strength** in `marketPotentialScore` (income level, affluence)
- **Revenue projection** indirectly — demographics influence category fit, but revenue is `estimateMonthlyRevenue(footfall, captureRate, avgTicket)` from footfall + category parameters

**2026 enrichment** is now wired into `/api/location-intelligence`. When a Census ward is found, `project2026Demographics()` runs and:
- **populationLifestyle** uses 2026 projected `totalHouseholds` (from projected population ÷ household size)
- **projections2026** is included in the response: `totalHouseholds`, `affluenceIndicator`, `populationGrowth`, `incomeGrowth`, `projectionSource`
- Falls back to Census 2021 values if projection fails or AreaGrowthPatterns is missing

---

## Revenue potential

**Source**: `scores.revenueProjectionMonthly` from `estimateMonthlyRevenue(dailyFootfall, captureRate, avgTicket)` in `scoring.ts`. Area category modifiers adjust the base projection.

**When it appears**: Always when `/api/location-intelligence` runs (live or fallback). Stored reports in `location_reports` may lack scores; the `/api/location-reports` route now **enriches** such reports by calling location-intelligence and merging in `scores`, so revenue potential is shown whenever possible.
