# Location Intelligence 1000+ Variables System

## Overview

GeoIQ-level location intelligence with 1000+ data points per property:
- Google Maps/Places API
- MapMyIndia (Mappls) API
- Census 2021 data
- ML-based scoring

## Database Schema

New models in `prisma/schema.prisma`:
- **LocationIntelligence** – JSONB storage for propertyData, microLocation, mesoLocation, macroLocation, competition, digitalSignals, operations, performance, predictive, lokazenData
- **CensusData** – Ward-level demographics
- **MarketIntelligence** – Area × category benchmarks
- **CompetitorIntelligence** – Per-property competitor details

## Setup

### 1. Run migration

```bash
npx prisma migrate dev --name add-location-intelligence-1000
```

### 2. Create tables and seed census data

**First time (or if `census_data` table is missing):**

```bash
npm run db:push
```

This pushes the schema to your DB (loads `DATABASE_URL` from `.env.local`).

**Then seed census:**

```bash
npm run db:seed-census
```

**Or do both in one go:**

```bash
npm run db:setup-census
```

Seeds CensusData with ~25 Bangalore wards (Indiranagar, Koramangala, HSR, Jayanagar, BTM, JP Nagar, Whitefield, MG Road, Marathahalli, etc.) using proxy/estimated values aligned with india-benchmarks and FOOTFALL_GEOIQ. Ward lat/lng centroids enable `findNearestWard` for the Location Intelligence API and 2026 projections.

### 3. Environment variables

```env
GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
MAPPLS_REST_API_KEY=your_key  # for India POI
DATABASE_URL=postgresql://...
```

## API

- **GET** `/api/intelligence/[propertyId]` – Fetch stored intelligence
- **POST** `/api/intelligence/[propertyId]` – Trigger enrichment (runs in background)

## Usage

### Trigger enrichment

```ts
await fetch(`/api/intelligence/${propertyId}`, { method: 'POST' })
// Returns { message: 'Enrichment started', propertyId }
```

### Use dashboard component

```tsx
import LocationIntelligenceDashboard from '@/components/LocationIntelligenceDashboard'

<LocationIntelligenceDashboard propertyId={property.id} />
```

## Enrichment flow

1. Resolve coordinates (map_link or geocode)
2. Google Places: competitors, transport, footfall estimate
3. Census: demographics (when CensusData is seeded)
4. Scoring engine: revenue, competition, accessibility, demographic, risk, success probability
5. Persist to LocationIntelligence

## Data quality

`dataQuality` (0–100) indicates % of 1000 variables populated. Integrate GeoIQ for real footfall; Census 2021 for demographics.
